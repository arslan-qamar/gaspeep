package repository

import (
	"testing"

	"gaspeep/backend/internal/repository/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPgBrandRepository_GetAll(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	repo := NewPgBrandRepository(db)

	brands, err := repo.GetAll()

	require.NoError(t, err)
	require.NotEmpty(t, brands)
	assert.GreaterOrEqual(t, brands[0].DisplayOrder, 0)
	for _, brand := range brands {
		assert.NotEmpty(t, brand.ID)
		assert.NotEmpty(t, brand.Name)
		assert.NotEmpty(t, brand.DisplayName)
	}
}

func TestPgBrandRepository_GetByID(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	repo := NewPgBrandRepository(db)

	brands, err := repo.GetAll()
	require.NoError(t, err)
	require.NotEmpty(t, brands)

	brand, err := repo.GetByID(brands[0].ID)

	require.NoError(t, err)
	require.NotNil(t, brand)
	assert.Equal(t, brands[0].Name, brand.Name)
	assert.Equal(t, brands[0].DisplayName, brand.DisplayName)
}
