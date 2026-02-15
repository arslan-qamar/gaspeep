package repository

import (
	"database/sql"
	"fmt"

	"gaspeep/backend/internal/models"
)

// PgFuelTypeRepository is the PostgreSQL implementation of FuelTypeRepository.
type PgFuelTypeRepository struct {
	db *sql.DB
}

func NewPgFuelTypeRepository(db *sql.DB) *PgFuelTypeRepository {
	return &PgFuelTypeRepository{db: db}
}

func (r *PgFuelTypeRepository) GetAll() ([]models.FuelType, error) {
	query := `
		SELECT id, name, display_name, description, color_code, display_order
		FROM fuel_types
		ORDER BY display_order`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query fuel types: %w", err)
	}
	defer rows.Close()

	var fuelTypes []models.FuelType
	for rows.Next() {
		var ft models.FuelType
		if err := rows.Scan(&ft.ID, &ft.Name, &ft.DisplayName, &ft.Description, &ft.ColorCode, &ft.DisplayOrder); err != nil {
			return nil, fmt.Errorf("failed to scan fuel type: %w", err)
		}
		fuelTypes = append(fuelTypes, ft)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating fuel type rows: %w", err)
	}

	return fuelTypes, nil
}

func (r *PgFuelTypeRepository) GetByID(id string) (*models.FuelType, error) {
	var ft models.FuelType
	query := `
		SELECT id, name, display_name, description, color_code, display_order
		FROM fuel_types
		WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&ft.ID, &ft.Name, &ft.DisplayName, &ft.Description, &ft.ColorCode, &ft.DisplayOrder,
	)
	if err != nil {
		return nil, err
	}

	return &ft, nil
}

var _ FuelTypeRepository = (*PgFuelTypeRepository)(nil)
