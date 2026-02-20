package repository

import (
	"database/sql"
	"fmt"

	"gaspeep/backend/internal/models"

	"github.com/google/uuid"
)

// PgAlertRepository is the PostgreSQL implementation of AlertRepository.
type PgAlertRepository struct {
	db *sql.DB
}

func NewPgAlertRepository(db *sql.DB) *PgAlertRepository {
	return &PgAlertRepository{db: db}
}

func (r *PgAlertRepository) Create(userID string, input CreateAlertInput) (*models.Alert, error) {
	id := uuid.New().String()
	query := `
		INSERT INTO alerts (
			id, user_id, fuel_type_id, price_threshold, latitude, longitude, radius_km, alert_name, notify_via_push, notify_via_email, is_active, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW())
		RETURNING id, user_id, fuel_type_id, price_threshold, latitude, longitude, radius_km, alert_name, notify_via_push, notify_via_email, is_active, created_at, last_triggered_at, trigger_count`

	var alert models.Alert
	err := r.db.QueryRow(
		query,
		id, userID, input.FuelTypeID, input.PriceThreshold, input.Latitude, input.Longitude, input.RadiusKm, input.AlertName, input.NotifyViaPush, input.NotifyViaEmail,
	).Scan(
		&alert.ID, &alert.UserID, &alert.FuelTypeID, &alert.PriceThreshold,
		&alert.Latitude, &alert.Longitude, &alert.RadiusKm, &alert.AlertName,
		&alert.NotifyViaPush, &alert.NotifyViaEmail, &alert.IsActive, &alert.CreatedAt, &alert.LastTriggeredAt, &alert.TriggerCount,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create alert: %w", err)
	}

	return &alert, nil
}

func (r *PgAlertRepository) GetByUserID(userID string) ([]models.Alert, error) {
	query := `
		SELECT id, user_id, fuel_type_id, price_threshold, latitude, longitude, radius_km, alert_name, notify_via_push, notify_via_email, is_active, created_at, last_triggered_at, trigger_count
		FROM alerts WHERE user_id = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query alerts: %w", err)
	}
	defer rows.Close()

	alerts := make([]models.Alert, 0)
	for rows.Next() {
		var a models.Alert
		if err := rows.Scan(
			&a.ID, &a.UserID, &a.FuelTypeID, &a.PriceThreshold,
			&a.Latitude, &a.Longitude, &a.RadiusKm, &a.AlertName,
			&a.NotifyViaPush, &a.NotifyViaEmail, &a.IsActive, &a.CreatedAt, &a.LastTriggeredAt, &a.TriggerCount,
		); err != nil {
			return nil, fmt.Errorf("failed to scan alert: %w", err)
		}
		alerts = append(alerts, a)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating alert rows: %w", err)
	}

	return alerts, nil
}

func (r *PgAlertRepository) Update(id, userID string, input UpdateAlertInput) (string, error) {
	query := `
		UPDATE alerts SET price_threshold = COALESCE($1, price_threshold), radius_km = COALESCE($2, radius_km), alert_name = COALESCE($3, alert_name), notify_via_push = COALESCE($4, notify_via_push), notify_via_email = COALESCE($5, notify_via_email), is_active = COALESCE($6, is_active), updated_at = NOW() WHERE id = $7 AND user_id = $8 RETURNING id`

	var updatedID string
	err := r.db.QueryRow(query, input.PriceThreshold, input.RadiusKm, input.AlertName, input.NotifyViaPush, input.NotifyViaEmail, input.IsActive, id, userID).Scan(&updatedID)
	if err != nil {
		return "", err
	}
	return updatedID, nil
}

func (r *PgAlertRepository) Delete(id, userID string) (bool, error) {
	result, err := r.db.Exec("DELETE FROM alerts WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		return false, fmt.Errorf("failed to delete alert: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	return rowsAffected > 0, nil
}

func (r *PgAlertRepository) GetPriceContext(input PriceContextInput) (*PriceContextResult, error) {
	query := `
		WITH nearby AS (
			SELECT
				s.id::text AS station_id,
				s.name AS station_name,
				fp.price,
				fp.currency,
				fp.unit,
				ST_Distance(
					s.location::geography,
					ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
				) / 1000 AS distance_km
			FROM fuel_prices fp
			INNER JOIN stations s ON s.id = fp.station_id
			WHERE fp.fuel_type_id = $1
				AND fp.verification_status IN ('verified', 'unverified')
				AND ST_DWithin(
					s.location::geography,
					ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
					$4
				)
		)
		SELECT
			ft.id::text AS fuel_type_id,
			ft.display_name AS fuel_type_name,
			COALESCE(AVG(n.price), 0) AS average_price,
			COALESCE(MIN(n.price), 0) AS lowest_price,
			COALESCE((SELECT station_name FROM nearby ORDER BY price ASC, distance_km ASC LIMIT 1), '') AS lowest_station_name,
			COALESCE((SELECT station_id FROM nearby ORDER BY price ASC, distance_km ASC LIMIT 1), '') AS lowest_station_id,
			COALESCE((SELECT currency FROM nearby ORDER BY price ASC, distance_km ASC LIMIT 1), 'AUD') AS currency,
			COALESCE((SELECT unit FROM nearby ORDER BY price ASC, distance_km ASC LIMIT 1), 'L') AS unit,
			COUNT(n.station_id)::int AS station_count
		FROM fuel_types ft
		LEFT JOIN nearby n ON true
		WHERE ft.id = $1
		GROUP BY ft.id, ft.display_name`

	var result PriceContextResult
	err := r.db.QueryRow(query, input.FuelTypeID, input.Longitude, input.Latitude, input.RadiusKm*1000).Scan(
		&result.FuelTypeID,
		&result.FuelTypeName,
		&result.AveragePrice,
		&result.LowestPrice,
		&result.LowestPriceStationName,
		&result.LowestPriceStationID,
		&result.Currency,
		&result.Unit,
		&result.StationCount,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get price context: %w", err)
	}

	return &result, nil
}

func (r *PgAlertRepository) GetMatchingStations(alertID, userID string) ([]MatchingStationResult, error) {
	var fuelTypeID string
	var priceThreshold float64
	var latitude, longitude float64
	var radiusKm int

	err := r.db.QueryRow(
		`SELECT fuel_type_id, price_threshold, latitude, longitude, radius_km
		 FROM alerts
		 WHERE id = $1 AND user_id = $2`,
		alertID,
		userID,
	).Scan(&fuelTypeID, &priceThreshold, &latitude, &longitude, &radiusKm)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("failed to load alert for matching stations: %w", err)
	}

	rows, err := r.db.Query(
		`
		SELECT
			s.id::text AS station_id,
			s.name AS station_name,
			s.address AS station_address,
			fp.price,
			fp.currency,
			fp.unit,
			ST_Distance(
				s.location::geography,
				ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
			) / 1000 AS distance_km,
			fp.last_updated_at
		FROM fuel_prices fp
		INNER JOIN stations s ON s.id = fp.station_id
		WHERE fp.fuel_type_id = $3
			AND fp.verification_status IN ('verified', 'unverified')
			AND fp.price <= $4
			AND ST_DWithin(
				s.location::geography,
				ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
				$5
			)
		ORDER BY distance_km ASC, fp.price ASC
		LIMIT 100
		`,
		longitude,
		latitude,
		fuelTypeID,
		priceThreshold,
		radiusKm*1000,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query matching stations: %w", err)
	}
	defer rows.Close()

	stations := make([]MatchingStationResult, 0)
	for rows.Next() {
		var station MatchingStationResult
		if err := rows.Scan(
			&station.StationID,
			&station.StationName,
			&station.StationAddress,
			&station.Price,
			&station.Currency,
			&station.Unit,
			&station.Distance,
			&station.LastUpdated,
		); err != nil {
			return nil, fmt.Errorf("failed to scan matching station: %w", err)
		}
		stations = append(stations, station)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating matching stations: %w", err)
	}

	return stations, nil
}

var _ AlertRepository = (*PgAlertRepository)(nil)
