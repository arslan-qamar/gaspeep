package repository

import (
	"database/sql"
	"fmt"
	"strconv"

	"github.com/google/uuid"
)

// PgFuelPriceRepository is the PostgreSQL implementation of FuelPriceRepository.
type PgFuelPriceRepository struct {
	db *sql.DB
}

func NewPgFuelPriceRepository(db *sql.DB) *PgFuelPriceRepository {
	return &PgFuelPriceRepository{db: db}
}

func (r *PgFuelPriceRepository) GetFuelPrices(filters FuelPriceFilters) ([]FuelPriceResult, error) {
	var args []interface{}
	argIndex := 1
	hasGeo := filters.Lat != 0 || filters.Lon != 0

	query := `
		SELECT fp.id, fp.station_id, fp.fuel_type_id, fp.price, fp.currency, fp.unit,
			fp.last_updated_at, fp.verification_status, fp.confirmation_count,
			s.latitude, s.longitude`

	if hasGeo {
		query += `,
			ST_Distance(
				s.location::geography,
				ST_SetSRID(ST_MakePoint($` + strconv.Itoa(argIndex) + `, $` + strconv.Itoa(argIndex+1) + `), 4326)::geography
			) / 1000 as distance_km`
		args = append(args, filters.Lon, filters.Lat)
		argIndex += 2
	}

	query += `
		FROM fuel_prices fp
		INNER JOIN (
			SELECT id,
				ST_Y(location::geometry) as latitude,
				ST_X(location::geometry) as longitude,
				location
			FROM stations
		) s ON fp.station_id = s.id
		WHERE 1=1`

	if filters.StationID != "" {
		query += ` AND fp.station_id = $` + strconv.Itoa(argIndex)
		args = append(args, filters.StationID)
		argIndex++
	}

	if filters.FuelTypeID != "" {
		query += ` AND fp.fuel_type_id = $` + strconv.Itoa(argIndex)
		args = append(args, filters.FuelTypeID)
		argIndex++
	}

	if filters.MinPrice != "" {
		query += ` AND fp.price >= $` + strconv.Itoa(argIndex)
		args = append(args, filters.MinPrice)
		argIndex++
	}

	if filters.MaxPrice != "" {
		query += ` AND fp.price <= $` + strconv.Itoa(argIndex)
		args = append(args, filters.MaxPrice)
		argIndex++
	}

	if hasGeo && filters.RadiusKm > 0 {
		query += `
			AND ST_DWithin(
				s.location::geography,
				ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
				$` + strconv.Itoa(argIndex) + `
			)`
		args = append(args, filters.RadiusKm*1000)
		argIndex++
	}

	query += ` AND fp.verification_status IN ('verified', 'unverified')`

	if hasGeo {
		query += ` ORDER BY distance_km`
	} else {
		query += ` ORDER BY fp.last_updated_at DESC`
	}

	query += ` LIMIT 500`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query fuel prices: %w", err)
	}
	defer rows.Close()

	var prices []FuelPriceResult
	for rows.Next() {
		var fp FuelPriceResult
		var stationLat, stationLon float64
		var distanceKm *float64

		scanArgs := []interface{}{
			&fp.ID, &fp.StationID, &fp.FuelTypeID, &fp.Price, &fp.Currency, &fp.Unit,
			&fp.LastUpdatedAt, &fp.VerificationStatus, &fp.ConfirmationCount,
			&stationLat, &stationLon,
		}

		if hasGeo {
			scanArgs = append(scanArgs, &distanceKm)
		}

		if err := rows.Scan(scanArgs...); err != nil {
			return nil, fmt.Errorf("failed to scan fuel price: %w", err)
		}

		if distanceKm != nil {
			fp.DistanceKm = distanceKm
		}

		prices = append(prices, fp)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating fuel price rows: %w", err)
	}

	return prices, nil
}

func (r *PgFuelPriceRepository) GetStationPrices(stationID string) ([]StationPriceResult, error) {
	query := `
		SELECT fp.id, fp.station_id, fp.fuel_type_id, fp.price, fp.currency, fp.unit,
			fp.last_updated_at, fp.verification_status, fp.confirmation_count,
			ft.name, ft.display_name, ft.color_code
		FROM fuel_prices fp
		INNER JOIN fuel_types ft ON fp.fuel_type_id = ft.id
		WHERE fp.station_id = $1
			AND fp.verification_status IN ('verified', 'unverified')
		ORDER BY ft.display_order`

	rows, err := r.db.Query(query, stationID)
	if err != nil {
		return nil, fmt.Errorf("failed to query station prices: %w", err)
	}
	defer rows.Close()

	var prices []StationPriceResult
	for rows.Next() {
		var sp StationPriceResult
		if err := rows.Scan(
			&sp.ID, &sp.StationID, &sp.FuelTypeID, &sp.Price, &sp.Currency, &sp.Unit,
			&sp.LastUpdatedAt, &sp.VerificationStatus, &sp.ConfirmationCount,
			&sp.FuelTypeName, &sp.FuelTypeDisplayName, &sp.FuelTypeColorCode,
		); err != nil {
			return nil, fmt.Errorf("failed to scan station price: %w", err)
		}
		prices = append(prices, sp)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating station price rows: %w", err)
	}

	return prices, nil
}

func (r *PgFuelPriceRepository) GetCheapestPrices(lat, lon, radiusKm float64) ([]CheapestPriceResult, error) {
	query := `
		WITH nearby_prices AS (
			SELECT fp.id, fp.station_id, fp.fuel_type_id, fp.price, fp.currency, fp.unit,
				fp.last_updated_at, fp.verification_status, fp.confirmation_count,
				s.name as station_name, s.brand as station_brand,
				ST_Y(s.location::geometry) as latitude,
				ST_X(s.location::geometry) as longitude,
				ST_Distance(
					s.location::geography,
					ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
				) / 1000 as distance_km,
				ft.display_name as fuel_type_name
			FROM fuel_prices fp
			INNER JOIN stations s ON fp.station_id = s.id
			INNER JOIN fuel_types ft ON fp.fuel_type_id = ft.id
			WHERE ST_DWithin(
				s.location::geography,
				ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
				$3
			)
			AND fp.verification_status = 'verified'
		),
		ranked_prices AS (
			SELECT *,
				ROW_NUMBER() OVER (PARTITION BY fuel_type_id ORDER BY price ASC, distance_km ASC) as rank
			FROM nearby_prices
		)
		SELECT id, station_id, fuel_type_id, price, currency, unit,
			last_updated_at, verification_status, confirmation_count,
			station_name, station_brand, latitude, longitude, distance_km, fuel_type_name
		FROM ranked_prices
		WHERE rank = 1
		ORDER BY fuel_type_id`

	rows, err := r.db.Query(query, lon, lat, radiusKm*1000)
	if err != nil {
		return nil, fmt.Errorf("failed to query cheapest prices: %w", err)
	}
	defer rows.Close()

	var prices []CheapestPriceResult
	for rows.Next() {
		var cp CheapestPriceResult
		var lastUpdatedAt sql.NullTime

		if err := rows.Scan(
			&cp.ID, &cp.StationID, &cp.FuelTypeID, &cp.Price, &cp.Currency, &cp.Unit,
			&lastUpdatedAt, &cp.VerificationStatus, &cp.ConfirmationCount,
			&cp.StationName, &cp.StationBrand, &cp.Latitude, &cp.Longitude, &cp.DistanceKm, &cp.FuelTypeName,
		); err != nil {
			return nil, fmt.Errorf("failed to scan cheapest price: %w", err)
		}

		if lastUpdatedAt.Valid {
			cp.LastUpdatedAt = &lastUpdatedAt.Time
		}

		prices = append(prices, cp)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating cheapest price rows: %w", err)
	}

	return prices, nil
}

func (r *PgFuelPriceRepository) UpsertFuelPrice(stationID, fuelTypeID string, price float64) error {
	_, err := r.db.Exec(`
		INSERT INTO fuel_prices (id, station_id, fuel_type_id, price, currency, unit, last_updated_at, verification_status, confirmation_count)
		VALUES ($1, $2, $3, $4, 'AUD', 'litre', NOW(), 'verified', 1)
		ON CONFLICT (station_id, fuel_type_id)
		DO UPDATE SET price = $4, last_updated_at = NOW(),
			verification_status = 'verified',
			confirmation_count = fuel_prices.confirmation_count + 1,
			updated_at = NOW()
	`, uuid.New().String(), stationID, fuelTypeID, price)

	if err != nil {
		return fmt.Errorf("failed to upsert fuel price: %w", err)
	}
	return nil
}

func (r *PgFuelPriceRepository) StationExists(stationID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow("SELECT EXISTS(SELECT 1 FROM stations WHERE id = $1)", stationID).Scan(&exists)
	return exists, err
}

func (r *PgFuelPriceRepository) FuelTypeExists(fuelTypeID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow("SELECT EXISTS(SELECT 1 FROM fuel_types WHERE id = $1)", fuelTypeID).Scan(&exists)
	return exists, err
}

// PgPriceSubmissionRepository is the PostgreSQL implementation of PriceSubmissionRepository.
type PgPriceSubmissionRepository struct {
	db *sql.DB
}

func NewPgPriceSubmissionRepository(db *sql.DB) *PgPriceSubmissionRepository {
	return &PgPriceSubmissionRepository{db: db}
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func (r *PgPriceSubmissionRepository) Create(input CreateSubmissionInput) (*PriceSubmissionResult, error) {
	id := uuid.New().String()

	query := `
		INSERT INTO price_submissions (
			id, user_id, station_id, fuel_type_id, price,
			submission_method, submitted_at, moderation_status,
			verification_confidence, photo_url, voice_recording_url, ocr_data
		) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'pending', $7, $8, $9, $10)
		RETURNING id, user_id, station_id, fuel_type_id, price,
			submission_method, submitted_at, moderation_status,
			verification_confidence, photo_url, voice_recording_url, ocr_data`

	var result PriceSubmissionResult
	err := r.db.QueryRow(
		query,
		id, input.UserID, input.StationID, input.FuelTypeID, input.Price,
		input.SubmissionMethod, input.Confidence,
		nilIfEmpty(input.PhotoURL), nilIfEmpty(input.VoiceRecordingURL), nilIfEmpty(input.OCRData),
	).Scan(
		&result.ID, &result.UserID, &result.StationID, &result.FuelTypeID,
		&result.Price, &result.SubmissionMethod, &result.SubmittedAt,
		&result.ModerationStatus, &result.VerificationConfidence,
		&result.PhotoURL, &result.VoiceRecordingURL, &result.OCRData,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create price submission: %w", err)
	}

	return &result, nil
}

func (r *PgPriceSubmissionRepository) GetByUserID(userID string, limit, offset int) ([]PriceSubmissionWithDetails, int, error) {
	query := `
		SELECT ps.id, ps.user_id, ps.station_id, ps.fuel_type_id, ps.price,
			ps.submission_method, ps.submitted_at, ps.moderation_status,
			ps.verification_confidence, ps.photo_url, ps.voice_recording_url, ps.ocr_data,
			ps.moderator_notes,
			s.name as station_name, s.brand as station_brand,
			ft.display_name as fuel_type_name
		FROM price_submissions ps
		INNER JOIN stations s ON ps.station_id = s.id
		INNER JOIN fuel_types ft ON ps.fuel_type_id = ft.id
		WHERE ps.user_id = $1
		ORDER BY ps.submitted_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query submissions: %w", err)
	}
	defer rows.Close()

	var submissions []PriceSubmissionWithDetails
	for rows.Next() {
		var s PriceSubmissionWithDetails
		var photoURL, voiceURL, ocrData, moderatorNotes sql.NullString

		if err := rows.Scan(
			&s.ID, &s.UserID, &s.StationID, &s.FuelTypeID, &s.Price,
			&s.SubmissionMethod, &s.SubmittedAt, &s.ModerationStatus,
			&s.VerificationConfidence, &photoURL, &voiceURL, &ocrData,
			&moderatorNotes,
			&s.StationName, &s.StationBrand, &s.FuelTypeName,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan submission: %w", err)
		}

		if photoURL.Valid {
			s.PhotoURL = &photoURL.String
		}
		if voiceURL.Valid {
			s.VoiceRecordingURL = &voiceURL.String
		}
		if ocrData.Valid {
			s.OCRData = &ocrData.String
		}
		if moderatorNotes.Valid {
			s.ModeratorNotes = &moderatorNotes.String
		}

		submissions = append(submissions, s)
	}

	var total int
	r.db.QueryRow("SELECT COUNT(*) FROM price_submissions WHERE user_id = $1", userID).Scan(&total)

	return submissions, total, nil
}

func (r *PgPriceSubmissionRepository) GetModerationQueue(status string, limit, offset int) ([]PriceSubmissionWithDetails, int, error) {
	query := `
		SELECT ps.id, ps.user_id, ps.station_id, ps.fuel_type_id, ps.price,
			ps.submission_method, ps.submitted_at, ps.moderation_status,
			ps.verification_confidence, ps.photo_url, ps.voice_recording_url, ps.ocr_data,
			ps.moderator_notes,
			s.name as station_name, s.brand as station_brand,
			ft.display_name as fuel_type_name,
			u.display_name as user_display_name
		FROM price_submissions ps
		INNER JOIN stations s ON ps.station_id = s.id
		INNER JOIN fuel_types ft ON ps.fuel_type_id = ft.id
		INNER JOIN users u ON ps.user_id = u.id
		WHERE ps.moderation_status = $1
		ORDER BY ps.submitted_at ASC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.Query(query, status, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query moderation queue: %w", err)
	}
	defer rows.Close()

	var submissions []PriceSubmissionWithDetails
	for rows.Next() {
		var s PriceSubmissionWithDetails
		var photoURL, voiceURL, ocrData, moderatorNotes sql.NullString

		if err := rows.Scan(
			&s.ID, &s.UserID, &s.StationID, &s.FuelTypeID, &s.Price,
			&s.SubmissionMethod, &s.SubmittedAt, &s.ModerationStatus,
			&s.VerificationConfidence, &photoURL, &voiceURL, &ocrData,
			&moderatorNotes,
			&s.StationName, &s.StationBrand, &s.FuelTypeName, &s.UserDisplayName,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan submission: %w", err)
		}

		if photoURL.Valid {
			s.PhotoURL = &photoURL.String
		}
		if voiceURL.Valid {
			s.VoiceRecordingURL = &voiceURL.String
		}
		if ocrData.Valid {
			s.OCRData = &ocrData.String
		}
		if moderatorNotes.Valid {
			s.ModeratorNotes = &moderatorNotes.String
		}

		submissions = append(submissions, s)
	}

	var total int
	r.db.QueryRow("SELECT COUNT(*) FROM price_submissions WHERE moderation_status = $1", status).Scan(&total)

	return submissions, total, nil
}

func (r *PgPriceSubmissionRepository) GetSubmissionDetails(id string) (*SubmissionDetails, error) {
	var details SubmissionDetails
	err := r.db.QueryRow(
		"SELECT station_id, fuel_type_id, price FROM price_submissions WHERE id = $1",
		id,
	).Scan(&details.StationID, &details.FuelTypeID, &details.Price)
	if err != nil {
		return nil, err
	}
	return &details, nil
}

func (r *PgPriceSubmissionRepository) UpdateModerationStatus(id, status, notes string) (bool, error) {
	result, err := r.db.Exec(
		`UPDATE price_submissions
		 SET moderation_status = $1, moderator_notes = $2, updated_at = NOW()
		 WHERE id = $3`,
		status, notes, id,
	)
	if err != nil {
		return false, fmt.Errorf("failed to update submission: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	return rowsAffected > 0, nil
}

func (r *PgPriceSubmissionRepository) AutoApprove(id string) error {
	_, err := r.db.Exec(
		"UPDATE price_submissions SET moderation_status = 'approved', updated_at = NOW() WHERE id = $1",
		id,
	)
	if err != nil {
		return fmt.Errorf("failed to auto-approve submission: %w", err)
	}
	return nil
}

// Compile-time interface checks.
var (
	_ FuelPriceRepository       = (*PgFuelPriceRepository)(nil)
	_ PriceSubmissionRepository = (*PgPriceSubmissionRepository)(nil)
)
