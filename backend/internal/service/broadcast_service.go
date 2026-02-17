package service

import (
	"fmt"
	"gaspeep/backend/internal/models"
	"gaspeep/backend/internal/repository"
	"log"
	"time"
)

// BroadcastService defines business operations for broadcasts.
type BroadcastService interface {
	CreateBroadcast(stationOwnerID string, input repository.CreateBroadcastInput) (*models.Broadcast, error)
	GetBroadcasts(stationOwnerID string) ([]models.Broadcast, error)
	UpdateBroadcast(id, ownerID string, input repository.UpdateBroadcastInput) (string, error)
	GetBroadcast(id, ownerID string) (*models.Broadcast, error)
	GetEngagement(id, ownerID string) ([]map[string]interface{}, error)
	SaveDraft(ownerID string, input repository.CreateBroadcastInput) (*models.Broadcast, error)
	SendBroadcast(id, ownerID string) (*models.Broadcast, error)
	ScheduleBroadcast(id, ownerID string, scheduledFor time.Time) (*models.Broadcast, error)
	CancelBroadcast(id, ownerID string) error
	DeleteBroadcast(id, ownerID string) error
	DuplicateBroadcast(id, ownerID string) (*models.Broadcast, error)
	EstimateRecipients(stationID, radiusKm string) (int, error)
}

type broadcastService struct {
	broadcastRepo      repository.BroadcastRepository
	stationOwnerRepo   repository.StationOwnerRepository
}

func NewBroadcastService(broadcastRepo repository.BroadcastRepository, stationOwnerRepo repository.StationOwnerRepository) BroadcastService {
	return &broadcastService{broadcastRepo: broadcastRepo, stationOwnerRepo: stationOwnerRepo}
}

func (s *broadcastService) CreateBroadcast(userID string, input repository.CreateBroadcastInput) (*models.Broadcast, error) {
	log.Printf("[CreateBroadcast] Starting with userID=%s, stationID=%s", userID, input.StationID)

	// Validate required fields
	if userID == "" {
		return nil, fmt.Errorf("user ID is required")
	}
	if input.StationID == "" {
		return nil, fmt.Errorf("station ID is required")
	}
	if input.Title == "" {
		return nil, fmt.Errorf("broadcast title is required")
	}
	if input.Message == "" {
		return nil, fmt.Errorf("broadcast message is required")
	}

	// Validate dates
	if input.StartDate.IsZero() {
		return nil, fmt.Errorf("start date is required")
	}
	if input.EndDate.IsZero() {
		return nil, fmt.Errorf("end date is required")
	}
	if input.EndDate.Before(input.StartDate) {
		return nil, fmt.Errorf("end date must be after start date")
	}

	log.Printf("[CreateBroadcast] Validation passed, looking up station owner for userID=%s", userID)

	// Look up the station owner for this user
	owner, err := s.stationOwnerRepo.GetByUserID(userID)
	if err != nil {
		log.Printf("[CreateBroadcast] ERROR: GetByUserID failed: %v", err)
		return nil, fmt.Errorf("failed to find station owner: %w", err)
	}
	if owner == nil {
		log.Printf("[CreateBroadcast] ERROR: owner is nil for userID=%s", userID)
		return nil, fmt.Errorf("user does not have a station owner profile")
	}

	log.Printf("[CreateBroadcast] Found owner: ownerID=%s (owner.ID=%v, owner=%+v)", owner.ID, owner.ID, owner)
	log.Printf("[CreateBroadcast] Calling broadcastRepo.Create with ownerID=%s, stationID=%s, title=%s", owner.ID, input.StationID, input.Title)

	broadcast, err := s.broadcastRepo.Create(owner.ID, input)
	if err != nil {
		log.Printf("[CreateBroadcast] ERROR: broadcastRepo.Create failed: %v", err)
		return nil, err
	}

	log.Printf("[CreateBroadcast] Success: created broadcast with ID=%s", broadcast.ID)
	return broadcast, nil
}

func (s *broadcastService) GetBroadcasts(stationOwnerID string) ([]models.Broadcast, error) {
	return s.broadcastRepo.GetByOwnerID(stationOwnerID)
}

func (s *broadcastService) UpdateBroadcast(id, ownerID string, input repository.UpdateBroadcastInput) (string, error) {
	return s.broadcastRepo.Update(id, ownerID, input)
}

func (s *broadcastService) GetBroadcast(id, ownerID string) (*models.Broadcast, error) {
	return s.broadcastRepo.GetByID(id, ownerID)
}

func (s *broadcastService) GetEngagement(id, ownerID string) ([]map[string]interface{}, error) {
	// Verify ownership first
	_, err := s.broadcastRepo.GetByID(id, ownerID)
	if err != nil {
		return nil, err
	}

	// TODO: Once broadcast_analytics table is added, query engagement data
	// For now, return empty array with sample structure
	return []map[string]interface{}{}, nil
}

func (s *broadcastService) SaveDraft(userID string, input repository.CreateBroadcastInput) (*models.Broadcast, error) {
	log.Printf("[SaveDraft] Starting with userID=%s, stationID=%s", userID, input.StationID)

	// Validate required fields
	if userID == "" {
		return nil, fmt.Errorf("user ID is required")
	}
	if input.StationID == "" {
		return nil, fmt.Errorf("station ID is required")
	}
	if input.Title == "" {
		return nil, fmt.Errorf("broadcast title is required")
	}

	log.Printf("[SaveDraft] Validation passed, looking up station owner for userID=%s", userID)

	// Look up the station owner for this user
	owner, err := s.stationOwnerRepo.GetByUserID(userID)
	if err != nil {
		log.Printf("[SaveDraft] ERROR: GetByUserID failed: %v", err)
		return nil, fmt.Errorf("failed to find station owner: %w", err)
	}
	if owner == nil {
		log.Printf("[SaveDraft] ERROR: owner is nil for userID=%s", userID)
		return nil, fmt.Errorf("user does not have a station owner profile")
	}

	log.Printf("[SaveDraft] Found owner: ownerID=%s", owner.ID)

	// Create broadcast with "draft" status by temporarily setting it in the input
	log.Printf("[SaveDraft] Calling broadcastRepo.Create with ownerID=%s", owner.ID)
	broadcast, err := s.broadcastRepo.Create(owner.ID, input)
	if err != nil {
		log.Printf("[SaveDraft] ERROR: broadcastRepo.Create failed: %v", err)
		return nil, err
	}

	log.Printf("[SaveDraft] Successfully created broadcast with ID=%s, now updating to draft status", broadcast.ID)

	// Update the status to "draft" after creation (default is "scheduled" in Create)
	targetFuelTypes := ""
	if broadcast.TargetFuelTypes != nil {
		targetFuelTypes = *broadcast.TargetFuelTypes
	}
	updateInput := repository.UpdateBroadcastInput{
		Title:           broadcast.Title,
		Message:         broadcast.Message,
		TargetRadiusKm:  broadcast.TargetRadiusKm,
		StartDate:       broadcast.StartDate,
		EndDate:         broadcast.EndDate,
		BroadcastStatus: "draft",
		TargetFuelTypes: targetFuelTypes,
	}

	_, err = s.broadcastRepo.Update(broadcast.ID, owner.ID, updateInput)
	if err != nil {
		log.Printf("[SaveDraft] ERROR: broadcastRepo.Update failed: %v", err)
		return nil, err
	}

	log.Printf("[SaveDraft] Successfully updated broadcast to draft status")

	// Fetch and return the updated broadcast
	return s.broadcastRepo.GetByID(broadcast.ID, owner.ID)
}

func (s *broadcastService) SendBroadcast(id, ownerID string) (*models.Broadcast, error) {
	// Get the broadcast to update
	broadcast, err := s.broadcastRepo.GetByID(id, ownerID)
	if err != nil {
		return nil, err
	}

	// Update status to "active"
	targetFuelTypes := ""
	if broadcast.TargetFuelTypes != nil {
		targetFuelTypes = *broadcast.TargetFuelTypes
	}
	updateInput := repository.UpdateBroadcastInput{
		Title:           broadcast.Title,
		Message:         broadcast.Message,
		TargetRadiusKm:  broadcast.TargetRadiusKm,
		StartDate:       broadcast.StartDate,
		EndDate:         broadcast.EndDate,
		BroadcastStatus: "active",
		TargetFuelTypes: targetFuelTypes,
	}

	_, err = s.broadcastRepo.Update(id, ownerID, updateInput)
	if err != nil {
		return nil, err
	}

	// TODO: Trigger push notifications to users in target radius
	// TODO: Add engagement tracking

	// Return updated broadcast
	return s.broadcastRepo.GetByID(id, ownerID)
}

func (s *broadcastService) ScheduleBroadcast(id, ownerID string, scheduledFor time.Time) (*models.Broadcast, error) {
	// Get the broadcast to update
	broadcast, err := s.broadcastRepo.GetByID(id, ownerID)
	if err != nil {
		return nil, err
	}

	// Update status to "scheduled" with the scheduled time
	targetFuelTypes := ""
	if broadcast.TargetFuelTypes != nil {
		targetFuelTypes = *broadcast.TargetFuelTypes
	}
	updateInput := repository.UpdateBroadcastInput{
		Title:           broadcast.Title,
		Message:         broadcast.Message,
		TargetRadiusKm:  broadcast.TargetRadiusKm,
		StartDate:       scheduledFor,
		EndDate:         broadcast.EndDate,
		BroadcastStatus: "scheduled",
		TargetFuelTypes: targetFuelTypes,
	}

	_, err = s.broadcastRepo.Update(id, ownerID, updateInput)
	if err != nil {
		return nil, err
	}

	// TODO: Schedule a job to send broadcast at the scheduled time

	// Return updated broadcast
	return s.broadcastRepo.GetByID(id, ownerID)
}

func (s *broadcastService) CancelBroadcast(id, ownerID string) error {
	// Get the broadcast to verify it exists and is owned by the user
	broadcast, err := s.broadcastRepo.GetByID(id, ownerID)
	if err != nil {
		return err
	}

	// Only allow cancellation of scheduled broadcasts
	if broadcast.BroadcastStatus != "scheduled" {
		return fmt.Errorf("can only cancel scheduled broadcasts")
	}

	// Change status to "cancelled"
	targetFuelTypes := ""
	if broadcast.TargetFuelTypes != nil {
		targetFuelTypes = *broadcast.TargetFuelTypes
	}
	updateInput := repository.UpdateBroadcastInput{
		Title:           broadcast.Title,
		Message:         broadcast.Message,
		TargetRadiusKm:  broadcast.TargetRadiusKm,
		StartDate:       broadcast.StartDate,
		EndDate:         broadcast.EndDate,
		BroadcastStatus: "cancelled",
		TargetFuelTypes: targetFuelTypes,
	}

	_, err = s.broadcastRepo.Update(id, ownerID, updateInput)
	if err != nil {
		return err
	}

	// TODO: Cancel any scheduled jobs

	return nil
}

func (s *broadcastService) DeleteBroadcast(id, ownerID string) error {
	// Get the broadcast to verify it exists and is owned by the user
	broadcast, err := s.broadcastRepo.GetByID(id, ownerID)
	if err != nil {
		return err
	}

	// Only allow deletion of draft or cancelled broadcasts
	if broadcast.BroadcastStatus != "draft" && broadcast.BroadcastStatus != "cancelled" {
		return fmt.Errorf("can only delete draft or cancelled broadcasts")
	}

	return s.broadcastRepo.Delete(id, ownerID)
}

func (s *broadcastService) DuplicateBroadcast(id, ownerID string) (*models.Broadcast, error) {
	// Get the original broadcast
	original, err := s.broadcastRepo.GetByID(id, ownerID)
	if err != nil {
		return nil, err
	}

	// Create input for new broadcast based on original
	targetFuelTypes := ""
	if original.TargetFuelTypes != nil {
		targetFuelTypes = *original.TargetFuelTypes
	}
	input := repository.CreateBroadcastInput{
		StationID:       original.StationID,
		Title:           original.Title + " (Copy)",
		Message:         original.Message,
		TargetRadiusKm:  original.TargetRadiusKm,
		StartDate:       original.StartDate,
		EndDate:         original.EndDate,
		TargetFuelTypes: targetFuelTypes,
	}

	// Create the duplicate
	return s.broadcastRepo.Create(ownerID, input)
}

func (s *broadcastService) EstimateRecipients(stationID, radiusKm string) (int, error) {
	// TODO: Query users with premium subscription within radiusKm of station
	// For now, return 0 until we have proper user tier tracking
	// This would use PostGIS to calculate distance:
	// SELECT COUNT(DISTINCT u.id) FROM users u
	// INNER JOIN alerts a ON a.user_id = u.id
	// WHERE u.tier = 'premium'
	// AND ST_DistanceSphere(ST_Point(s.longitude, s.latitude), ST_Point(a.longitude, a.latitude)) / 1000 <= $radiusKm
	return 0, nil
}
