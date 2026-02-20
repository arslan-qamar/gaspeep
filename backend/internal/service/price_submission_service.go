package service

import (
	"gaspeep/backend/internal/repository"
)

// PriceSubmissionService defines business operations for price submissions.
type PriceSubmissionService interface {
	CreateSubmission(userID string, input CreateSubmissionRequest) (*repository.PriceSubmissionResult, error)
	GetMySubmissions(userID string, page, limit int) ([]repository.PriceSubmissionWithDetails, int, error)
	GetModerationQueue(status string, page, limit int) ([]repository.PriceSubmissionWithDetails, int, error)
	ModerateSubmission(id, status, notes string) (bool, error)
}

// CreateSubmissionRequest holds the request data for creating a submission.
type CreateSubmissionRequest struct {
	StationID         string
	FuelTypeID        string
	Price             float64
	SubmissionMethod  string
	PhotoURL          string
	VoiceRecordingURL string
	OCRData           string
}

type priceSubmissionService struct {
	submissionRepo repository.PriceSubmissionRepository
	fuelPriceRepo  repository.FuelPriceRepository
	alertRepo      repository.AlertRepository
}

func NewPriceSubmissionService(
	submissionRepo repository.PriceSubmissionRepository,
	fuelPriceRepo repository.FuelPriceRepository,
	alertRepo ...repository.AlertRepository,
) PriceSubmissionService {
	var resolvedAlertRepo repository.AlertRepository
	if len(alertRepo) > 0 {
		resolvedAlertRepo = alertRepo[0]
	}

	return &priceSubmissionService{
		submissionRepo: submissionRepo,
		fuelPriceRepo:  fuelPriceRepo,
		alertRepo:      resolvedAlertRepo,
	}
}

func (s *priceSubmissionService) CreateSubmission(userID string, input CreateSubmissionRequest) (*repository.PriceSubmissionResult, error) {
	// Validate that station exists
	exists, err := s.fuelPriceRepo.StationExists(input.StationID)
	if err != nil || !exists {
		return nil, ErrStationNotFound
	}

	// Validate that fuel type exists
	exists, err = s.fuelPriceRepo.FuelTypeExists(input.FuelTypeID)
	if err != nil || !exists {
		return nil, ErrFuelTypeNotFound
	}

	// Calculate confidence based on submission method
	confidence := calculateConfidence(input.SubmissionMethod)

	result, err := s.submissionRepo.Create(repository.CreateSubmissionInput{
		UserID:            userID,
		StationID:         input.StationID,
		FuelTypeID:        input.FuelTypeID,
		Price:             input.Price,
		SubmissionMethod:  input.SubmissionMethod,
		Confidence:        confidence,
		PhotoURL:          input.PhotoURL,
		VoiceRecordingURL: input.VoiceRecordingURL,
		OCRData:           input.OCRData,
	})
	if err != nil {
		return nil, err
	}

	// Auto-approve high-confidence submissions
	if confidence >= 0.5 {
		if err := s.submissionRepo.AutoApprove(result.ID); err != nil {
			return result, err
		}
		if err := s.fuelPriceRepo.UpsertFuelPrice(input.StationID, input.FuelTypeID, input.Price); err != nil {
			return result, err
		}
		if err := s.recordAlertTriggers(input.StationID, input.FuelTypeID, input.Price); err != nil {
			return result, err
		}
	}

	return result, nil
}

func (s *priceSubmissionService) GetMySubmissions(userID string, page, limit int) ([]repository.PriceSubmissionWithDetails, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	return s.submissionRepo.GetByUserID(userID, limit, offset)
}

func (s *priceSubmissionService) GetModerationQueue(status string, page, limit int) ([]repository.PriceSubmissionWithDetails, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	return s.submissionRepo.GetModerationQueue(status, limit, offset)
}

func (s *priceSubmissionService) ModerateSubmission(id, status, notes string) (bool, error) {
	// Get submission details for potential fuel price update
	details, err := s.submissionRepo.GetSubmissionDetails(id)
	if err != nil {
		return false, err
	}

	updated, err := s.submissionRepo.UpdateModerationStatus(id, status, notes)
	if err != nil {
		return false, err
	}
	if !updated {
		return false, nil
	}

	// If approved, update the fuel price
	if status == "approved" {
		if err := s.fuelPriceRepo.UpsertFuelPrice(details.StationID, details.FuelTypeID, details.Price); err != nil {
			return true, err
		}
		if err := s.recordAlertTriggers(details.StationID, details.FuelTypeID, details.Price); err != nil {
			return true, err
		}
	}

	return true, nil
}

func (s *priceSubmissionService) recordAlertTriggers(stationID, fuelTypeID string, price float64) error {
	if s.alertRepo == nil {
		return nil
	}

	_, err := s.alertRepo.RecordTriggersForPrice(stationID, fuelTypeID, price)
	return err
}

// calculateConfidence returns the verification confidence based on the submission method.
func calculateConfidence(method string) float64 {
	switch method {
	case "photo":
		return 0.8
	case "text":
		return 0.5
	case "voice":
		return 0.4
	default:
		return 0.3
	}
}
