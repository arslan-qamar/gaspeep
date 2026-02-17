package repository

import (
	"database/sql"
	"fmt"

	"gaspeep/backend/internal/models"

	"github.com/google/uuid"
)

// PgBroadcastRepository is the PostgreSQL implementation of BroadcastRepository.
type PgBroadcastRepository struct {
	db *sql.DB
}

func NewPgBroadcastRepository(db *sql.DB) *PgBroadcastRepository {
	return &PgBroadcastRepository{db: db}
}

func (r *PgBroadcastRepository) Create(stationOwnerID string, input CreateBroadcastInput) (*models.Broadcast, error) {
	id := uuid.New().String()
	query := `
		INSERT INTO broadcasts (
			id, station_owner_id, station_id, title, message, target_radius_km, start_date, end_date, broadcast_status, target_fuel_types, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', $9, NOW())
		RETURNING id, station_owner_id, station_id, title, message, target_radius_km, start_date, end_date, broadcast_status, target_fuel_types, created_at, views, clicks`

	var b models.Broadcast
	err := r.db.QueryRow(query, id, stationOwnerID, input.StationID, input.Title, input.Message, input.TargetRadiusKm, input.StartDate, input.EndDate, input.TargetFuelTypes).Scan(
		&b.ID, &b.StationOwnerID, &b.StationID, &b.Title, &b.Message, &b.TargetRadiusKm, &b.StartDate, &b.EndDate, &b.BroadcastStatus, &b.TargetFuelTypes, &b.CreatedAt, &b.Views, &b.Clicks,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create broadcast: %w", err)
	}

	return &b, nil
}

func (r *PgBroadcastRepository) GetByOwnerID(stationOwnerID string) ([]models.Broadcast, error) {
	query := `
		SELECT id, station_owner_id, station_id, title, message, target_radius_km, start_date, end_date, broadcast_status, target_fuel_types, created_at, views, clicks
		FROM broadcasts WHERE station_owner_id = $1 ORDER BY created_at DESC LIMIT 100`

	rows, err := r.db.Query(query, stationOwnerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query broadcasts: %w", err)
	}
	defer rows.Close()

	var broadcasts []models.Broadcast
	for rows.Next() {
		var b models.Broadcast
		if err := rows.Scan(&b.ID, &b.StationOwnerID, &b.StationID, &b.Title, &b.Message, &b.TargetRadiusKm, &b.StartDate, &b.EndDate, &b.BroadcastStatus, &b.TargetFuelTypes, &b.CreatedAt, &b.Views, &b.Clicks); err != nil {
			return nil, fmt.Errorf("failed to scan broadcast: %w", err)
		}
		broadcasts = append(broadcasts, b)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating broadcast rows: %w", err)
	}

	return broadcasts, nil
}

func (r *PgBroadcastRepository) Update(id, ownerID string, input UpdateBroadcastInput) (string, error) {
	query := `
		UPDATE broadcasts SET title = COALESCE($1, title), message = COALESCE($2, message), target_radius_km = COALESCE($3, target_radius_km), start_date = COALESCE($4, start_date), end_date = COALESCE($5, end_date), broadcast_status = COALESCE($6, broadcast_status), target_fuel_types = COALESCE($7, target_fuel_types), updated_at = NOW() WHERE id = $8 AND station_owner_id = $9 RETURNING id`

	var updatedID string
	err := r.db.QueryRow(query, input.Title, input.Message, input.TargetRadiusKm, input.StartDate, input.EndDate, input.BroadcastStatus, input.TargetFuelTypes, id, ownerID).Scan(&updatedID)
	if err != nil {
		return "", err
	}
	return updatedID, nil
}

func (r *PgBroadcastRepository) GetByID(id, ownerID string) (*models.Broadcast, error) {
	query := `
		SELECT id, station_owner_id, station_id, title, message, target_radius_km, start_date, end_date, broadcast_status, target_fuel_types, created_at, views, clicks
		FROM broadcasts WHERE id = $1 AND station_owner_id = $2`

	var b models.Broadcast
	err := r.db.QueryRow(query, id, ownerID).Scan(
		&b.ID, &b.StationOwnerID, &b.StationID, &b.Title, &b.Message, &b.TargetRadiusKm, &b.StartDate, &b.EndDate, &b.BroadcastStatus, &b.TargetFuelTypes, &b.CreatedAt, &b.Views, &b.Clicks,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("broadcast not found")
		}
		return nil, fmt.Errorf("failed to query broadcast: %w", err)
	}

	return &b, nil
}

func (r *PgBroadcastRepository) Delete(id, ownerID string) error {
	query := `DELETE FROM broadcasts WHERE id = $1 AND station_owner_id = $2`
	result, err := r.db.Exec(query, id, ownerID)
	if err != nil {
		return fmt.Errorf("failed to delete broadcast: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("broadcast not found or not owned by user")
	}

	return nil
}

var _ BroadcastRepository = (*PgBroadcastRepository)(nil)
