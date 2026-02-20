package main

import (
	"log"
	"os"

	"gaspeep/backend/internal/db"
	"gaspeep/backend/internal/handler"
	"gaspeep/backend/internal/middleware"
	"gaspeep/backend/internal/repository"
	"gaspeep/backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	godotenv.Load()

	// Initialize database
	database, err := db.NewDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Verify connection
	if err := database.Ping(); err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	log.Println("✓ Database connected")

	// Run migrations
	migrationRunner := db.NewMigrationRunner(database)
	migrationsDir := "./internal/migrations"
	if err := migrationRunner.RunMigrations(migrationsDir); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("✓ Migrations completed")

	// --- Repositories ---
	userRepo := repository.NewPgUserRepository(database)
	passwordResetRepo := repository.NewPgPasswordResetRepository(database)
	stationRepo := repository.NewPgStationRepository(database)
	fuelTypeRepo := repository.NewPgFuelTypeRepository(database)
	fuelPriceRepo := repository.NewPgFuelPriceRepository(database)
	priceSubmissionRepo := repository.NewPgPriceSubmissionRepository(database)
	alertRepo := repository.NewPgAlertRepository(database)
	broadcastRepo := repository.NewPgBroadcastRepository(database)
	notificationRepo := repository.NewPgNotificationRepository(database)
	stationOwnerRepo := repository.NewPgStationOwnerRepository(database)

	// --- Services ---
	stationService := service.NewStationService(stationRepo)
	fuelTypeService := service.NewFuelTypeService(fuelTypeRepo)
	fuelPriceService := service.NewFuelPriceService(fuelPriceRepo)
	priceSubmissionService := service.NewPriceSubmissionService(priceSubmissionRepo, fuelPriceRepo, alertRepo)
	ocrService := service.NewGoogleVisionOCRServiceFromEnv()
	alertService := service.NewAlertService(alertRepo)
	broadcastService := service.NewBroadcastService(broadcastRepo, stationOwnerRepo)
	notificationService := service.NewNotificationService(notificationRepo)
	stationOwnerService := service.NewStationOwnerService(stationOwnerRepo)

	// --- Handlers ---
	authHandler := handler.NewAuthHandler(userRepo, passwordResetRepo)
	oauthHandler := handler.NewOAuthHandler(userRepo)
	userProfileHandler := handler.NewUserProfileHandler(userRepo, passwordResetRepo)
	stationHandler := handler.NewStationHandler(stationService)
	fuelTypeHandler := handler.NewFuelTypeHandler(fuelTypeService)
	fuelPriceHandler := handler.NewFuelPriceHandler(fuelPriceService)
	priceSubmissionHandler := handler.NewPriceSubmissionHandler(priceSubmissionService)
	priceSubmissionHandler.SetOCRService(ocrService)
	alertHandler := handler.NewAlertHandler(alertService)
	broadcastHandler := handler.NewBroadcastHandler(broadcastService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	stationOwnerHandler := handler.NewStationOwnerHandler(stationOwnerService)

	// Create Gin router
	router := gin.Default()

	// Middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.ErrorHandlingMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Auth routes
	auth := router.Group("/api/auth")
	{
		auth.POST("/signup", authHandler.SignUp)
		auth.POST("/signin", authHandler.SignIn)
		auth.POST("/logout", authHandler.Logout)
		// OAuth endpoints
		auth.GET("/oauth/google", oauthHandler.StartGoogle)
		auth.GET("/oauth/google/callback", oauthHandler.GoogleCallback)
		auth.GET("/check-email", authHandler.CheckEmailAvailability)
		auth.GET("/me", middleware.AuthMiddleware(), authHandler.GetCurrentUser)
		auth.POST("/password-reset", userProfileHandler.PasswordReset)
		auth.POST("/reset-password", authHandler.ResetPassword)
	}

	// Station routes
	stations := router.Group("/api/stations")
	{
		stations.GET("", stationHandler.GetStations)
		stations.GET("/:id", stationHandler.GetStation)
		stations.POST("", middleware.AuthMiddleware(), stationHandler.CreateStation)
		stations.PUT("/:id", middleware.AuthMiddleware(), stationHandler.UpdateStation)
		stations.DELETE("/:id", middleware.AuthMiddleware(), stationHandler.DeleteStation)
		stations.POST("/search-nearby", stationHandler.SearchStationsNearby)
		stations.GET("/search", stationHandler.SearchStations)
	}

	// Fuel type routes
	fuelTypes := router.Group("/api/fuel-types")
	{
		fuelTypes.GET("", fuelTypeHandler.GetFuelTypes)
		fuelTypes.GET("/:id", fuelTypeHandler.GetFuelType)
	}

	// Fuel price routes
	prices := router.Group("/api/fuel-prices")
	{
		prices.GET("", fuelPriceHandler.GetFuelPrices)
		prices.GET("/station/:id", fuelPriceHandler.GetStationPrices)
		prices.GET("/cheapest", fuelPriceHandler.GetCheapestPrices)
	}

	// Price submission routes
	priceSubmissions := router.Group("/api/price-submissions")
	priceSubmissions.Use(middleware.AuthMiddleware())
	{
		priceSubmissions.POST("", priceSubmissionHandler.CreatePriceSubmission)
		priceSubmissions.POST("/analyze-photo", priceSubmissionHandler.AnalyzePhoto)
		priceSubmissions.GET("/my-submissions", priceSubmissionHandler.GetMySubmissions)
		priceSubmissions.PUT("/:id/moderate", priceSubmissionHandler.ModerateSubmission)
	}

	router.GET("/api/moderation-queue", middleware.AuthMiddleware(), priceSubmissionHandler.GetModerationQueue)

	// Alert routes
	alerts := router.Group("/api/alerts")
	alerts.Use(middleware.AuthMiddleware())
	{
		alerts.POST("", alertHandler.CreateAlert)
		alerts.POST("/price-context", alertHandler.GetPriceContext)
		alerts.GET("", alertHandler.GetAlerts)
		alerts.GET("/:id/matching-stations", alertHandler.GetMatchingStations)
		alerts.PUT("/:id", alertHandler.UpdateAlert)
		alerts.DELETE("/:id", alertHandler.DeleteAlert)
	}

	// Notification routes
	notifications := router.Group("/api/notifications")
	notifications.Use(middleware.AuthMiddleware())
	{
		notifications.GET("", notificationHandler.GetNotifications)
	}

	// Station owner routes
	stationOwners := router.Group("/api/station-owners")
	stationOwners.Use(middleware.AuthMiddleware())
	{
		stationOwners.GET("/profile", stationOwnerHandler.GetProfile)
		stationOwners.PATCH("/profile", stationOwnerHandler.UpdateProfile)
		stationOwners.GET("/stats", stationOwnerHandler.GetStats)
		stationOwners.GET("/fuel-prices", stationOwnerHandler.GetFuelPrices)
		stationOwners.GET("/search-stations", stationOwnerHandler.SearchStations)
		stationOwners.POST("/verify", stationOwnerHandler.VerifyOwnership)
		stationOwners.POST("/claim-station", stationOwnerHandler.ClaimStation)
		stationOwners.GET("/stations", stationOwnerHandler.GetStations)
		stationOwners.GET("/stations/:id", stationOwnerHandler.GetStationDetails)
		stationOwners.PUT("/stations/:id", stationOwnerHandler.UpdateStation)
		stationOwners.POST("/stations/:id/photos", stationOwnerHandler.UploadPhotos)
		stationOwners.POST("/stations/:id/unclaim", stationOwnerHandler.UnclaimStation)
		stationOwners.POST("/stations/:id/reverify", stationOwnerHandler.ReVerifyStation)
	}

	// Broadcast routes
	broadcasts := router.Group("/api/broadcasts")
	broadcasts.Use(middleware.AuthMiddleware())
	{
		broadcasts.POST("", broadcastHandler.CreateBroadcast)
		broadcasts.GET("", broadcastHandler.GetBroadcasts)
		broadcasts.GET("/estimate-recipients", broadcastHandler.EstimateRecipients)
		broadcasts.POST("/draft", broadcastHandler.SaveDraft)
		broadcasts.GET("/:id", broadcastHandler.GetBroadcast)
		broadcasts.PUT("/:id", broadcastHandler.UpdateBroadcast)
		broadcasts.GET("/:id/engagement", broadcastHandler.GetBroadcastEngagement)
		broadcasts.POST("/:id/send", broadcastHandler.SendBroadcast)
		broadcasts.POST("/:id/schedule", broadcastHandler.ScheduleBroadcast)
		broadcasts.POST("/:id/cancel", broadcastHandler.CancelBroadcast)
		broadcasts.DELETE("/:id", broadcastHandler.DeleteBroadcast)
		broadcasts.POST("/:id/duplicate", broadcastHandler.DuplicateBroadcast)
	}

	// User profile routes
	users := router.Group("/api/users")
	users.Use(middleware.AuthMiddleware())
	{
		users.GET("/profile", userProfileHandler.GetProfile)
		users.PUT("/profile", userProfileHandler.UpdateProfile)
	}

	// Start server (support TLS when cert and key paths provided)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	tlsCert := os.Getenv("TLS_CERT")
	tlsKey := os.Getenv("TLS_KEY")
	if tlsCert != "" && tlsKey != "" {
		log.Printf("Starting TLS server on port %s", port)
		if err := router.RunTLS(":"+port, tlsCert, tlsKey); err != nil {
			log.Fatalf("Server failed to start (TLS): %v", err)
		}
	} else {
		log.Printf("Starting server on port %s", port)
		if err := router.Run(":" + port); err != nil {
			log.Fatalf("Server failed to start: %v", err)
		}
	}
}
