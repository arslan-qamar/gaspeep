package repository

import (
	"database/sql"
	"fmt"
	"time"

	"gaspeep/backend/internal/models"

	"github.com/google/uuid"
)

// PgStationOwnerRepository is the PostgreSQL implementation of StationOwnerRepository.
type PgStationOwnerRepository struct {
	db *sql.DB
}

func NewPgStationOwnerRepository(db *sql.DB) *PgStationOwnerRepository {
	return &PgStationOwnerRepository{db: db}
}

func (r *PgStationOwnerRepository) CreateVerificationRequest(userID string, input CreateOwnerVerificationInput) (*models.StationOwner, error) {
	id := uuid.New().String()
	query := `
		INSERT INTO station_owners (
			id, user_id, business_name, verification_status, verification_documents, contact_info, created_at
		) VALUES ($1, $2, $3, 'pending', $4, $5, NOW())
		RETURNING id, user_id, business_name, verification_status, verification_documents, contact_info, created_at, verified_at`

	var owner models.StationOwner
	var verDocs string
	var verifiedAt *time.Time

	err := r.db.QueryRow(query, id, userID, input.BusinessName, input.VerificationDocuments, input.ContactInfo).Scan(
		&owner.ID, &owner.UserID, &owner.BusinessName, &owner.VerificationStatus, &verDocs, &owner.ContactInfo, &owner.CreatedAt, &verifiedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create verification request: %w", err)
	}

	owner.VerificationDocuments = []string{verDocs}
	owner.VerifiedAt = verifiedAt

	return &owner, nil
}

func (r *PgStationOwnerRepository) GetStationsByOwnerUserID(userID string) ([]map[string]interface{}, error) {
	query := `
		SELECT s.id, s.name, s.brand, s.address, s.latitude, s.longitude, s.operating_hours, s.amenities, s.last_verified_at
		FROM stations s
		INNER JOIN station_owners so ON so.id = s.owner_id
		WHERE so.user_id = $1`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query owner stations: %w", err)
	}
	defer rows.Close()

	var stations []map[string]interface{}
	for rows.Next() {
		var (
			id, name, brand, address, operatingHours string
			latitude, longitude                      float64
			amenities                                string
			lastVerifiedAt                           time.Time
		)

		if err := rows.Scan(&id, &name, &brand, &address, &latitude, &longitude, &operatingHours, &amenities, &lastVerifiedAt); err != nil {
			return nil, fmt.Errorf("failed to scan station: %w", err)
		}

		station := map[string]interface{}{
			"id":             id,
			"name":           name,
			"brand":          brand,
			"address":        address,
			"latitude":       latitude,
			"longitude":      longitude,
			"operatingHours": operatingHours,
			"amenities":      amenities,
			"lastVerifiedAt": lastVerifiedAt,
		}
		stations = append(stations, station)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating station rows: %w", err)
	}

	return stations, nil
}

var _ StationOwnerRepository = (*PgStationOwnerRepository)(nil)
