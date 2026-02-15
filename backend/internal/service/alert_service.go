package service

import (
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
)

// AlertService defines business operations for alerts.
type AlertService interface {
	CreateAlert(userID string, input repository.CreateAlertInput) (*models.Alert, error)
	GetAlerts(userID string) ([]models.Alert, error)
	UpdateAlert(id, userID string, input repository.UpdateAlertInput) (string, error)
	DeleteAlert(id, userID string) (bool, error)
}

type alertService struct {
	alertRepo repository.AlertRepository
}

func NewAlertService(alertRepo repository.AlertRepository) AlertService {
	return &alertService{alertRepo: alertRepo}
}

func (s *alertService) CreateAlert(userID string, input repository.CreateAlertInput) (*models.Alert, error) {
	return s.alertRepo.Create(userID, input)
}

func (s *alertService) GetAlerts(userID string) ([]models.Alert, error) {
	return s.alertRepo.GetByUserID(userID)
}

func (s *alertService) UpdateAlert(id, userID string, input repository.UpdateAlertInput) (string, error) {
	return s.alertRepo.Update(id, userID, input)
}

func (s *alertService) DeleteAlert(id, userID string) (bool, error) {
	return s.alertRepo.Delete(id, userID)
}
