package repository

import (
	"database/sql"
	"fmt"

	"gaspeep/backend/internal/models"
)

// PgBrandRepository is the PostgreSQL implementation of BrandRepository.
type PgBrandRepository struct {
	db *sql.DB
}

func NewPgBrandRepository(db *sql.DB) *PgBrandRepository {
	return &PgBrandRepository{db: db}
}

func (r *PgBrandRepository) GetAll() ([]models.Brand, error) {
	query := `
		SELECT id, name, display_name, display_order
		FROM brands
		ORDER BY display_order`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query brands: %w", err)
	}
	defer rows.Close()

	var brands []models.Brand
	for rows.Next() {
		var brand models.Brand
		if err := rows.Scan(&brand.ID, &brand.Name, &brand.DisplayName, &brand.DisplayOrder); err != nil {
			return nil, fmt.Errorf("failed to scan brand: %w", err)
		}
		brands = append(brands, brand)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating brand rows: %w", err)
	}

	return brands, nil
}

func (r *PgBrandRepository) GetByID(id string) (*models.Brand, error) {
	var brand models.Brand
	query := `
		SELECT id, name, display_name, display_order
		FROM brands
		WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&brand.ID, &brand.Name, &brand.DisplayName, &brand.DisplayOrder,
	)
	if err != nil {
		return nil, err
	}

	return &brand, nil
}

var _ BrandRepository = (*PgBrandRepository)(nil)
