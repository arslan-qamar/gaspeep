package repository

import (
	"testing"

	"gaspeep/backend/internal/repository/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPgFuelTypeRepository_GetAll(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	repo := NewPgFuelTypeRepository(db)

	fuelTypes, err := repo.GetAll()

	require.NoError(t, err)
	require.NotEmpty(t, fuelTypes)
	assert.GreaterOrEqual(t, fuelTypes[0].DisplayOrder, 0)
	for _, ft := range fuelTypes {
		assert.NotEmpty(t, ft.ID)
		assert.NotEmpty(t, ft.Name)
		assert.NotEmpty(t, ft.DisplayName)
	}
}

func TestPgFuelTypeRepository_GetByID(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	repo := NewPgFuelTypeRepository(db)

	ft, err := repo.GetByID("550e8400-e29b-41d4-a716-446655440001")

	require.NoError(t, err)
	require.NotNil(t, ft)
	assert.Equal(t, "E10", ft.Name)
	assert.Equal(t, "E10", ft.DisplayName)
}

func TestPgFuelTypeRepository_GetByID_NotFound(t *testing.T) {
	db := testhelpers.SetupTestDBWithCleanup(t)
	repo := NewPgFuelTypeRepository(db)

	ft, err := repo.GetByID("00000000-0000-0000-0000-000000000000")

	require.Error(t, err)
	assert.Nil(t, ft)
}
