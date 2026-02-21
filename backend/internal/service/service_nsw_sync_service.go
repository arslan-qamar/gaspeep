package service

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"math"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

const (
	serviceNSWSyncKey               = "service_nsw_v2"
	serviceNSWSystemUserEmail       = "service-nsw-sync@gaspeep.local"
	serviceNSWSystemUserDisplayName = "Service NSW Sync"
	serviceNSWSystemUserPassword    = "service_nsw_sync_disabled_login"
)

type ServiceNSWSyncService struct {
	db *sql.DB

	client *serviceNSWClient

	enabled             bool
	states              string
	incrementalInterval time.Duration
	fullSyncInterval    time.Duration
	requestTimeout      time.Duration
	runMu               sync.Mutex
}

var (
	ErrServiceNSWSyncDisabled      = errors.New("service NSW sync is disabled")
	ErrServiceNSWSyncNotConfigured = errors.New("service NSW sync is not configured")
)

func NewServiceNSWSyncService(db *sql.DB) *ServiceNSWSyncService {
	enabled := strings.EqualFold(strings.TrimSpace(os.Getenv("SERVICE_NSW_SYNC_ENABLED")), "true")
	baseURL := strings.TrimSpace(os.Getenv("SERVICE_NSW_BASE_URL"))
	if baseURL == "" {
		baseURL = "https://api.onegov.nsw.gov.au"
	}

	states := strings.TrimSpace(os.Getenv("SERVICE_NSW_SYNC_STATES"))
	if states == "" {
		states = "NSW|TAS"
	}

	incrementalMinutes := parseEnvInt("SERVICE_NSW_INCREMENTAL_INTERVAL_MINUTES", 60)
	if incrementalMinutes < 5 {
		incrementalMinutes = 5
	}

	fullSyncHours := parseEnvInt("SERVICE_NSW_FULL_SYNC_INTERVAL_HOURS", 24)
	if fullSyncHours < 1 {
		fullSyncHours = 24
	}

	requestTimeoutSeconds := parseEnvInt("SERVICE_NSW_REQUEST_TIMEOUT_SECONDS", 30)
	if requestTimeoutSeconds < 5 {
		requestTimeoutSeconds = 30
	}

	apiKey := strings.TrimSpace(os.Getenv("SERVICE_NSW_API_KEY"))
	apiSecret := strings.TrimSpace(os.Getenv("SERVICE_NSW_API_SECRET"))

	var client *serviceNSWClient
	if apiKey != "" && apiSecret != "" {
		client = newServiceNSWClient(baseURL, apiKey, apiSecret, states, time.Duration(requestTimeoutSeconds)*time.Second)
	}

	return &ServiceNSWSyncService{
		db:                  db,
		client:              client,
		enabled:             enabled,
		states:              states,
		incrementalInterval: time.Duration(incrementalMinutes) * time.Minute,
		fullSyncInterval:    time.Duration(fullSyncHours) * time.Hour,
		requestTimeout:      time.Duration(requestTimeoutSeconds) * time.Second,
	}
}

func (s *ServiceNSWSyncService) Start(ctx context.Context) {
	if !s.enabled {
		log.Printf("Service NSW sync disabled (set SERVICE_NSW_SYNC_ENABLED=true to enable)")
		return
	}
	if s.client == nil {
		log.Printf("Service NSW sync disabled: missing SERVICE_NSW_API_KEY or SERVICE_NSW_API_SECRET")
		return
	}

	log.Printf("Service NSW sync enabled (states=%s incremental=%s full=%s)", s.states, s.incrementalInterval, s.fullSyncInterval)

	go func() {
		if err := s.ensureSystemUser(ctx); err != nil {
			log.Printf("Service NSW sync failed to ensure system user: %v", err)
			return
		}

		if err := s.runReferenceSync(ctx); err != nil {
			log.Printf("Service NSW reference sync failed: %v", err)
		}
		if err := s.runFullSync(ctx); err != nil {
			log.Printf("Service NSW full sync failed: %v", err)
		}

		incrementalTicker := time.NewTicker(s.incrementalInterval)
		defer incrementalTicker.Stop()

		fullTicker := time.NewTicker(s.fullSyncInterval)
		defer fullTicker.Stop()

		referenceTicker := time.NewTicker(24 * time.Hour)
		defer referenceTicker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-incrementalTicker.C:
				if err := s.runIncrementalSync(ctx); err != nil {
					log.Printf("Service NSW incremental sync failed: %v", err)
				}
			case <-fullTicker.C:
				if err := s.runFullSync(ctx); err != nil {
					log.Printf("Service NSW full sync failed: %v", err)
				}
			case <-referenceTicker.C:
				if err := s.runReferenceSync(ctx); err != nil {
					log.Printf("Service NSW reference sync failed: %v", err)
				}
			}
		}
	}()
}

func (s *ServiceNSWSyncService) TriggerFullSync(ctx context.Context) error {
	if err := s.ensureManualSyncReady(); err != nil {
		return err
	}

	s.runMu.Lock()
	defer s.runMu.Unlock()

	if err := s.ensureSystemUser(ctx); err != nil {
		return err
	}
	if err := s.runReferenceSync(ctx); err != nil {
		return err
	}
	return s.runFullSync(ctx)
}

func (s *ServiceNSWSyncService) TriggerIncrementalSync(ctx context.Context) error {
	if err := s.ensureManualSyncReady(); err != nil {
		return err
	}

	s.runMu.Lock()
	defer s.runMu.Unlock()

	if err := s.ensureSystemUser(ctx); err != nil {
		return err
	}
	return s.runIncrementalSync(ctx)
}

func (s *ServiceNSWSyncService) ensureManualSyncReady() error {
	if !s.enabled {
		return ErrServiceNSWSyncDisabled
	}
	if s.client == nil {
		return ErrServiceNSWSyncNotConfigured
	}
	return nil
}

func (s *ServiceNSWSyncService) runReferenceSync(parent context.Context) error {
	ctx, cancel := context.WithTimeout(parent, s.requestTimeout)
	defer cancel()

	lastRef, err := s.getLastReferenceSync(ctx)
	if err != nil {
		return err
	}

	resp, err := s.client.getReferenceDataV2(ctx, lastRef)
	if err != nil {
		if errors.Is(err, errServiceNSWNotModified) {
			if stateErr := s.updateReferenceSyncState(ctx, "ok", nil); stateErr != nil {
				return stateErr
			}
			log.Printf("Service NSW reference sync: no changes")
			return nil
		}
		_ = s.updateSyncError(ctx, err)
		return err
	}

	fuelMappings, err := s.getFuelTypeMappings(ctx)
	if err != nil {
		return err
	}

	inserted := 0
	for _, ft := range resp.FuelTypes.Items {
		code := strings.ToUpper(strings.TrimSpace(ft.Code))
		if code == "" {
			continue
		}
		if _, exists := fuelMappings[code]; exists {
			continue
		}
		internalID, ok := s.defaultFuelTypeIDForCode(code)
		if !ok {
			continue
		}
		if err := s.insertFuelTypeMapping(ctx, code, internalID); err != nil {
			return err
		}
		inserted++
	}

	if err := s.updateReferenceSyncState(ctx, "ok", nil); err != nil {
		return err
	}
	log.Printf("Service NSW reference sync complete: fuel_type_mappings_added=%d", inserted)
	return nil
}

func (s *ServiceNSWSyncService) runFullSync(parent context.Context) error {
	ctx, cancel := context.WithTimeout(parent, s.requestTimeout)
	defer cancel()

	resp, err := s.client.getAllCurrentPricesV2(ctx)
	log.Printf("Response is nil: %t, error: %v", resp == nil, err)
	if err != nil {
		log.Printf("Service NSW full sync error: getAllCurrentPricesV2 failed: %v", err)
		_ = s.updateSyncError(ctx, err)
		return err
	}

	summary, err := s.persistPrices(ctx, resp)
	if err != nil {
		log.Printf("Service NSW full sync error: persistPrices failed: %v", err)
		_ = s.updateSyncError(ctx, err)
		return err
	}

	if err := s.updateFullSyncState(ctx, "ok", nil); err != nil {
		log.Printf("Service NSW full sync error: updateFullSyncState failed: %v", err)
		return err
	}
	log.Printf("Service NSW full sync complete: stations_upserted=%d prices_upserted=%d submissions_inserted=%d skipped_unmapped=%d",
		summary.stationsUpserted, summary.fuelPricesUpserted, summary.submissionsInserted, summary.unmappedFuelTypesSkipped)
	return nil
}

func (s *ServiceNSWSyncService) runIncrementalSync(parent context.Context) error {
	ctx, cancel := context.WithTimeout(parent, s.requestTimeout)
	defer cancel()

	resp, err := s.client.getNewCurrentPricesV2(ctx)
	if err != nil {
		log.Printf("Service NSW incremental sync error: getNewCurrentPricesV2 failed: %v", err)
		_ = s.updateSyncError(ctx, err)
		return err
	}

	summary, err := s.persistPrices(ctx, resp)
	if err != nil {
		log.Printf("Service NSW incremental sync error: persistPrices failed: %v", err)
		_ = s.updateSyncError(ctx, err)
		return err
	}

	if err := s.updateIncrementalSyncState(ctx, "ok", nil); err != nil {
		log.Printf("Service NSW incremental sync error: updateIncrementalSyncState failed: %v", err)
		return err
	}
	log.Printf("Service NSW incremental sync complete: stations_upserted=%d prices_upserted=%d submissions_inserted=%d skipped_unmapped=%d",
		summary.stationsUpserted, summary.fuelPricesUpserted, summary.submissionsInserted, summary.unmappedFuelTypesSkipped)
	return nil
}

type persistSummary struct {
	stationsUpserted         int
	fuelPricesUpserted       int
	submissionsInserted      int
	unmappedFuelTypesSkipped int
}

func (s *ServiceNSWSyncService) persistPrices(ctx context.Context, resp *serviceNSWCurrentPricesResponse) (*persistSummary, error) {
	if resp == nil {
		log.Printf("persistPrices: response is nil")
		return &persistSummary{}, nil
	}

	systemUserID, err := s.getSystemUserID(ctx)
	if err != nil {
		log.Printf("persistPrices: getSystemUserID failed: %v", err)
		return nil, err
	}

	fuelMappings, err := s.getFuelTypeMappings(ctx)
	if err != nil {
		log.Printf("persistPrices: getFuelTypeMappings failed: %v", err)
		return nil, err
	}

	stationIDByKey := make(map[string]string, len(resp.Stations))
	summary := &persistSummary{}

	for _, st := range resp.Stations {
		key := stationSyncKey(st.State, string(st.Code))
		if key == "" {
			log.Printf("persistPrices: stationSyncKey empty for state=%s code=%s", st.State, st.Code)
			continue
		}
		stationID, err := s.upsertStation(ctx, st)
		if err != nil {
			log.Printf("persistPrices: upsertStation failed for key=%s: %v", key, err)
			return nil, err
		}
		stationIDByKey[key] = stationID
		summary.stationsUpserted++
	}

	for _, p := range resp.Prices {
		code := strings.ToUpper(strings.TrimSpace(p.FuelType))
		fuelTypeID, ok := fuelMappings[code]
		if !ok {
			log.Printf("persistPrices: unmapped fuel type code=%s", code)
			summary.unmappedFuelTypesSkipped++
			continue
		}
		if fuelTypeID == "" {
			log.Printf("persistPrices: empty fuelTypeID for code=%s", code)
			summary.unmappedFuelTypesSkipped++
			continue
		}

		stationCode := string(p.StationCode)
		key := stationSyncKey(p.State, stationCode)
		if key == "" {
			log.Printf("persistPrices: stationSyncKey empty for state=%s stationCode=%s", p.State, stationCode)
			continue
		}

		stationID, ok := stationIDByKey[key]
		if !ok {
			if strings.TrimSpace(p.State) == "" {
				for existingKey, existingID := range stationIDByKey {
					if strings.HasSuffix(existingKey, ":"+strings.TrimSpace(stationCode)) {
						stationID = existingID
						ok = true
						break
					}
				}
			}
		}
		if !ok {
			stationID, err = s.getStationIDByExternalCode(ctx, p.State, stationCode)
			if err != nil {
				log.Printf("persistPrices: getStationIDByExternalCode failed for state=%s stationCode=%s: %v", p.State, stationCode, err)
				return nil, err
			}
			if stationID == "" {
				log.Printf("persistPrices: stationID not found for state=%s stationCode=%s", p.State, stationCode)
				continue
			}
			stationIDByKey[key] = stationID
		}

		price := normalizeServiceNSWPrice(float64(p.Price))
		lastUpdated, err := parseServiceNSWLastUpdated(p.LastUpdated)
		if err != nil {
			log.Printf("persistPrices: parseServiceNSWLastUpdated failed for value=%s: %v", p.LastUpdated, err)
			lastUpdated = time.Now().UTC()
		}

		if err := s.upsertFuelPrice(ctx, stationID, fuelTypeID, price, lastUpdated); err != nil {
			log.Printf("persistPrices: upsertFuelPrice failed for stationID=%s fuelTypeID=%s price=%.3f: %v", stationID, fuelTypeID, price, err)
			return nil, err
		}
		summary.fuelPricesUpserted++

		inserted, err := s.insertSubmissionIfNew(ctx, systemUserID, stationID, fuelTypeID, price, lastUpdated, p.State, stationCode, code)
		if err != nil {
			log.Printf("persistPrices: insertSubmissionIfNew failed for stationID=%s fuelTypeID=%s price=%.3f: %v", stationID, fuelTypeID, price, err)
			return nil, err
		}
		if inserted {
			summary.submissionsInserted++
		}
	}

	log.Printf("persistPrices: summary stations_upserted=%d prices_upserted=%d submissions_inserted=%d skipped_unmapped=%d",
		summary.stationsUpserted, summary.fuelPricesUpserted, summary.submissionsInserted, summary.unmappedFuelTypesSkipped)

	return summary, nil
}

func (s *ServiceNSWSyncService) ensureSystemUser(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO users (id, email, password_hash, display_name, tier, email_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'free', true, NOW(), NOW())
		ON CONFLICT (email)
		DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = NOW()
	`, uuid.NewString(), serviceNSWSystemUserEmail, serviceNSWSystemUserPassword, serviceNSWSystemUserDisplayName)
	return err
}

func (s *ServiceNSWSyncService) getSystemUserID(ctx context.Context) (string, error) {
	var id string
	err := s.db.QueryRowContext(ctx, `SELECT id FROM users WHERE email = $1`, serviceNSWSystemUserEmail).Scan(&id)
	return id, err
}

func (s *ServiceNSWSyncService) getFuelTypeMappings(ctx context.Context) (map[string]string, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT external_code, fuel_type_id FROM service_nsw_fuel_type_mappings`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make(map[string]string)
	for rows.Next() {
		var externalCode, fuelTypeID string
		if err := rows.Scan(&externalCode, &fuelTypeID); err != nil {
			return nil, err
		}
		out[strings.ToUpper(strings.TrimSpace(externalCode))] = fuelTypeID
	}
	return out, rows.Err()
}

func (s *ServiceNSWSyncService) insertFuelTypeMapping(ctx context.Context, externalCode, fuelTypeID string) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO service_nsw_fuel_type_mappings (external_code, fuel_type_id, created_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (external_code) DO NOTHING
	`, externalCode, fuelTypeID)
	return err
}

func (s *ServiceNSWSyncService) upsertStation(ctx context.Context, st serviceNSWStation) (string, error) {
	state := strings.ToUpper(strings.TrimSpace(st.State))
	code := strings.TrimSpace(string(st.Code))
	if code == "" {
		return "", nil
	}

	name := strings.TrimSpace(st.Name)
	if name == "" {
		name = "Unknown Station"
	}

	lat := float64(st.Location.Latitude)
	lon := float64(st.Location.Longitude)

	var stationID string
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO stations (
			id, name, brand, address, location, latitude, longitude,
			operating_hours, amenities, last_verified_at,
			service_nsw_station_code, service_nsw_station_id, service_nsw_state,
			created_at, updated_at
		)
		VALUES (
			$1, $2, $3, $4,
			ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,
			$6, $5,
			'', '[]'::jsonb, NOW(),
			$7, $8, $9,
			NOW(), NOW()
		)
		ON CONFLICT (service_nsw_state, service_nsw_station_code)
		WHERE service_nsw_station_code IS NOT NULL AND service_nsw_station_code <> ''
		DO UPDATE SET
			name = EXCLUDED.name,
			brand = EXCLUDED.brand,
			address = EXCLUDED.address,
			location = EXCLUDED.location,
			latitude = EXCLUDED.latitude,
			longitude = EXCLUDED.longitude,
			service_nsw_station_id = EXCLUDED.service_nsw_station_id,
			last_verified_at = NOW(),
			updated_at = NOW()
		RETURNING id
	`, uuid.NewString(), name, strings.TrimSpace(st.Brand), strings.TrimSpace(st.Address), lon, lat, code, strings.TrimSpace(string(st.StationID)), state).Scan(&stationID)
	if err != nil {
		return "", err
	}
	return stationID, nil
}

func (s *ServiceNSWSyncService) getStationIDByExternalCode(ctx context.Context, state, code string) (string, error) {
	normalizedState := strings.ToUpper(strings.TrimSpace(state))
	normalizedCode := strings.TrimSpace(code)
	if normalizedCode == "" {
		return "", nil
	}

	var id string
	var err error
	if normalizedState == "" {
		err = s.db.QueryRowContext(ctx, `
			SELECT id
			FROM stations
			WHERE service_nsw_station_code = $1
			ORDER BY updated_at DESC
			LIMIT 1
		`, normalizedCode).Scan(&id)
	} else {
		err = s.db.QueryRowContext(ctx, `
			SELECT id
			FROM stations
			WHERE service_nsw_state = $1 AND service_nsw_station_code = $2
		`, normalizedState, normalizedCode).Scan(&id)
	}
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", nil
		}
		return "", err
	}
	return id, nil
}

func (s *ServiceNSWSyncService) upsertFuelPrice(ctx context.Context, stationID, fuelTypeID string, price float64, lastUpdated time.Time) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO fuel_prices (id, station_id, fuel_type_id, price, currency, unit, last_updated_at, verification_status, confirmation_count, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'AUD', 'litre', $5, 'verified', 1, NOW(), NOW())
		ON CONFLICT (station_id, fuel_type_id)
		DO UPDATE SET
			price = EXCLUDED.price,
			currency = EXCLUDED.currency,
			unit = EXCLUDED.unit,
			last_updated_at = EXCLUDED.last_updated_at,
			verification_status = 'verified',
			confirmation_count = fuel_prices.confirmation_count + 1,
			updated_at = NOW()
	`, uuid.NewString(), stationID, fuelTypeID, price, lastUpdated.UTC())
	return err
}

func (s *ServiceNSWSyncService) insertSubmissionIfNew(
	ctx context.Context,
	userID, stationID, fuelTypeID string,
	price float64,
	submittedAt time.Time,
	state, stationCode, fuelCode string,
) (bool, error) {
	hashInput := fmt.Sprintf("%s|%s|%s|%s|%.3f|%s", strings.ToUpper(strings.TrimSpace(state)), strings.TrimSpace(stationCode), strings.TrimSpace(fuelCode), fuelTypeID, price, submittedAt.UTC().Format(time.RFC3339))
	sum := sha256.Sum256([]byte(hashInput))
	sourceHash := hex.EncodeToString(sum[:])

	result, err := s.db.ExecContext(ctx, `
		INSERT INTO price_submissions (
			id, user_id, station_id, fuel_type_id, price,
			submission_method, submitted_at, moderation_status,
			verification_confidence, ocr_data, source_hash,
			created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, 'service_nsw_sync', $6, 'approved', 1.0, NULL, $7, NOW(), NOW())
		ON CONFLICT (source_hash) WHERE source_hash IS NOT NULL DO NOTHING
		`, uuid.NewString(), userID, stationID, fuelTypeID, price, submittedAt.UTC(), sourceHash)
	if err != nil {
		return false, err
	}
	affected, _ := result.RowsAffected()
	return affected > 0, nil
}

func (s *ServiceNSWSyncService) getLastReferenceSync(ctx context.Context) (time.Time, error) {
	var ts sql.NullTime
	err := s.db.QueryRowContext(ctx, `
		SELECT last_reference_sync_at
		FROM service_nsw_sync_state
		WHERE sync_key = $1
	`, serviceNSWSyncKey).Scan(&ts)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC), nil
		}
		return time.Time{}, err
	}
	if !ts.Valid {
		return time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC), nil
	}
	return ts.Time.UTC(), nil
}

func (s *ServiceNSWSyncService) updateReferenceSyncState(ctx context.Context, status string, syncErr error) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO service_nsw_sync_state (
			sync_key, last_success_at, last_reference_sync_at, last_error, updated_at
		)
		VALUES ($1, NOW(), NOW(), $2, NOW())
		ON CONFLICT (sync_key)
		DO UPDATE SET
			last_success_at = NOW(),
			last_reference_sync_at = NOW(),
			last_error = $2,
			updated_at = NOW()
	`, serviceNSWSyncKey, nullableError(status, syncErr))
	return err
}

func (s *ServiceNSWSyncService) updateFullSyncState(ctx context.Context, status string, syncErr error) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO service_nsw_sync_state (
			sync_key, last_success_at, last_full_sync_at, last_error, updated_at
		)
		VALUES ($1, NOW(), NOW(), $2, NOW())
		ON CONFLICT (sync_key)
		DO UPDATE SET
			last_success_at = NOW(),
			last_full_sync_at = NOW(),
			last_error = $2,
			updated_at = NOW()
	`, serviceNSWSyncKey, nullableError(status, syncErr))
	return err
}

func (s *ServiceNSWSyncService) updateIncrementalSyncState(ctx context.Context, status string, syncErr error) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO service_nsw_sync_state (
			sync_key, last_success_at, last_incremental_sync_at, last_error, updated_at
		)
		VALUES ($1, NOW(), NOW(), $2, NOW())
		ON CONFLICT (sync_key)
		DO UPDATE SET
			last_success_at = NOW(),
			last_incremental_sync_at = NOW(),
			last_error = $2,
			updated_at = NOW()
	`, serviceNSWSyncKey, nullableError(status, syncErr))
	return err
}

func (s *ServiceNSWSyncService) updateSyncError(ctx context.Context, syncErr error) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO service_nsw_sync_state (sync_key, last_error, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (sync_key)
		DO UPDATE SET
			last_error = EXCLUDED.last_error,
			updated_at = NOW()
	`, serviceNSWSyncKey, nullableError("error", syncErr))
	return err
}

func nullableError(status string, err error) *string {
	if status == "ok" || err == nil {
		return nil
	}
	msg := err.Error()
	return &msg
}

func parseServiceNSWLastUpdated(value string) (time.Time, error) {
	v := strings.TrimSpace(value)
	if v == "" {
		return time.Time{}, errors.New("empty lastupdated")
	}
	layouts := []string{
		"02/01/2006 15:04:05",
		"02/01/2006 03:04:05 PM",
		time.RFC3339,
	}
	for _, layout := range layouts {
		if t, err := time.ParseInLocation(layout, v, time.UTC); err == nil {
			return t.UTC(), nil
		}
	}
	return time.Time{}, fmt.Errorf("unsupported lastupdated timestamp: %s", value)
}

func stationSyncKey(state, code string) string {
	state = strings.ToUpper(strings.TrimSpace(state))
	code = strings.TrimSpace(code)
	if code == "" {
		return ""
	}
	return state + ":" + code
}

func normalizeServiceNSWPrice(cents float64) float64 {
	// Service NSW price feed is in cents; store internal prices in dollars.
	return math.Round((cents/100.0)*1000) / 1000
}

func parseEnvInt(name string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func (s *ServiceNSWSyncService) defaultFuelTypeIDForCode(code string) (string, bool) {
	mapping := map[string]string{
		"E10":    "550e8400-e29b-41d4-a716-446655440001",
		"U91":    "550e8400-e29b-41d4-a716-446655440002",
		"DL":     "550e8400-e29b-41d4-a716-446655440003",
		"PDL":    "550e8400-e29b-41d4-a716-446655440004",
		"P95":    "550e8400-e29b-41d4-a716-446655440005",
		"P98":    "550e8400-e29b-41d4-a716-446655440006",
		"LPG":    "550e8400-e29b-41d4-a716-446655440007",
		"ADBLUE": "550e8400-e29b-41d4-a716-446655440009",
		"E85":    "550e8400-e29b-41d4-a716-446655440010",
		"B20":    "550e8400-e29b-41d4-a716-446655440011",
		"EV":     "550e8400-e29b-41d4-a716-446655440012",
	}
	id, ok := mapping[strings.ToUpper(strings.TrimSpace(code))]
	return id, ok
}
