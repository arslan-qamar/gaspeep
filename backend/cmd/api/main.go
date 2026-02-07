package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gaspeep/backend/internal/db"
	"gaspeep/backend/internal/handler"
	"gaspeep/backend/internal/middleware"
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

	// Create Gin router
	router := gin.Default()

	// Middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.ErrorHandlingMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Initialize handlers with database
	authHandler := handler.NewAuthHandler(database)
	stationHandler := handler.NewStationHandler(database)
	fuelTypeHandler := handler.NewFuelTypeHandler(database)
	fuelPriceHandler := handler.NewFuelPriceHandler(database)

	// Auth routes
	auth := router.Group("/api/auth")
	{
		auth.POST("/signup", authHandler.SignUp)
		auth.POST("/signin", authHandler.SignIn)
		auth.GET("/me", middleware.AuthMiddleware(), authHandler.GetCurrentUser)
	}

	// Station routes
	stations := router.Group("/api/stations")
	{
		stations.GET("", stationHandler.GetStations)
		stations.GET("/:id", stationHandler.GetStation)
		stations.POST("", middleware.AuthMiddleware(), stationHandler.CreateStation)
		stations.PUT("/:id", middleware.AuthMiddleware(), stationHandler.UpdateStation)
		stations.DELETE("/:id", middleware.AuthMiddleware(), stationHandler.DeleteStation)
		stations.POST("/nearby", stationHandler.GetStationsNearby)
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

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
