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
			id, user_id, fuel_type_id, price_threshold, latitude, longitude, radius_km, alert_name, is_active, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
		RETURNING id, user_id, fuel_type_id, price_threshold, latitude, longitude, radius_km, alert_name, is_active, created_at, last_triggered_at, trigger_count`

	var alert models.Alert
	err := r.db.QueryRow(
		query,
		id, userID, input.FuelTypeID, input.PriceThreshold, input.Latitude, input.Longitude, input.RadiusKm, input.AlertName,
	).Scan(
		&alert.ID, &alert.UserID, &alert.FuelTypeID, &alert.PriceThreshold,
		&alert.Latitude, &alert.Longitude, &alert.RadiusKm, &alert.AlertName,
		&alert.IsActive, &alert.CreatedAt, &alert.LastTriggeredAt, &alert.TriggerCount,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create alert: %w", err)
	}

	return &alert, nil
}

func (r *PgAlertRepository) GetByUserID(userID string) ([]models.Alert, error) {
	query := `
		SELECT id, user_id, fuel_type_id, price_threshold, latitude, longitude, radius_km, alert_name, is_active, created_at, last_triggered_at, trigger_count
		FROM alerts WHERE user_id = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query alerts: %w", err)
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var a models.Alert
		if err := rows.Scan(
			&a.ID, &a.UserID, &a.FuelTypeID, &a.PriceThreshold,
			&a.Latitude, &a.Longitude, &a.RadiusKm, &a.AlertName,
			&a.IsActive, &a.CreatedAt, &a.LastTriggeredAt, &a.TriggerCount,
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
		UPDATE alerts SET price_threshold = COALESCE($1, price_threshold), radius_km = COALESCE($2, radius_km), alert_name = COALESCE($3, alert_name), is_active = COALESCE($4, is_active), updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING id`

	var updatedID string
	err := r.db.QueryRow(query, input.PriceThreshold, input.RadiusKm, input.AlertName, input.IsActive, id, userID).Scan(&updatedID)
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

var _ AlertRepository = (*PgAlertRepository)(nil)
