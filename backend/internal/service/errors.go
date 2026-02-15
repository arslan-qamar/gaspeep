package service

import "errors"

var (
	ErrStationNotFound  = errors.New("station not found")
	ErrFuelTypeNotFound = errors.New("fuel type not found")
)
