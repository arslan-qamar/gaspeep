package handler

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type ServiceNSWSyncHandler struct {
	syncService *service.ServiceNSWSyncService
}

func NewServiceNSWSyncHandler(syncService *service.ServiceNSWSyncService) *ServiceNSWSyncHandler {
	return &ServiceNSWSyncHandler{syncService: syncService}
}

type TriggerServiceNSWSyncRequest struct {
	Mode string `json:"mode" binding:"required"`
}

func (h *ServiceNSWSyncHandler) TriggerSync(c *gin.Context) {
	var req TriggerServiceNSWSyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mode := strings.ToLower(strings.TrimSpace(req.Mode))
	if mode != "full" && mode != "incremental" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mode must be one of: full, incremental"})
		return
	}

	startedAt := time.Now()
	var err error
	switch mode {
	case "full":
		err = h.syncService.TriggerFullSync(c.Request.Context())
	case "incremental":
		err = h.syncService.TriggerIncrementalSync(c.Request.Context())
	}
	if err != nil {
		if errors.Is(err, service.ErrServiceNSWSyncDisabled) || errors.Is(err, service.ErrServiceNSWSyncNotConfigured) {
			c.JSON(http.StatusFailedDependency, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "sync failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "service NSW sync completed",
		"mode":       mode,
		"durationMs": time.Since(startedAt).Milliseconds(),
	})
}
