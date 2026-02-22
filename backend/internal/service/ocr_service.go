package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var (
	// ErrOCRUnavailable indicates OCR is not configured or reachable.
	ErrOCRUnavailable = errors.New("ocr service unavailable")
	// ErrOCRNoTextDetected indicates the image was processed but no usable text was found.
	ErrOCRNoTextDetected = errors.New("no text detected")
)

type OCRPriceEntry struct {
	FuelType string  `json:"fuelType"`
	Price    float64 `json:"price"`
}

type OCRResult struct {
	Entries []OCRPriceEntry `json:"entries"`
	OCRData string          `json:"ocrData,omitempty"`
}

type OCRService interface {
	AnalyzeFuelPrices(ctx context.Context, image []byte, mimeType string) (*OCRResult, error)
}

type googleVisionOCRService struct {
	apiKey     string
	httpClient *http.Client
}

func NewGoogleVisionOCRServiceFromEnv() OCRService {
	apiKey := strings.TrimSpace(os.Getenv("GOOGLE_VISION_API_KEY"))
	return &googleVisionOCRService{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 20 * time.Second,
		},
	}
}

func (s *googleVisionOCRService) AnalyzeFuelPrices(ctx context.Context, image []byte, _ string) (*OCRResult, error) {
	if s.apiKey == "" {
		fmt.Println("[OCR] GOOGLE_VISION_API_KEY is not set")
		return nil, fmt.Errorf("%w: GOOGLE_VISION_API_KEY is not set", ErrOCRUnavailable)
	}
	if len(image) == 0 {
		fmt.Println("[OCR] Provided image is empty")
		return nil, errors.New("image is empty")
	}

	payload := map[string]any{
		"requests": []map[string]any{
			{
				"image": map[string]string{
					"content": base64.StdEncoding.EncodeToString(image),
				},
				"features": []map[string]any{
					{
						"type":       "TEXT_DETECTION",
						"maxResults": 50,
					},
				},
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		fmt.Printf("[OCR] Failed to marshal payload: %v\n", err)
		return nil, err
	}

	url := "https://vision.googleapis.com/v1/images:annotate?key=" + s.apiKey
	fmt.Println("[OCR] Sending request to Google Vision API")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		fmt.Printf("[OCR] Failed to create HTTP request: %v\n", err)
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		fmt.Printf("[OCR] HTTP request failed: %v\n", err)
		return nil, fmt.Errorf("%w: %v", ErrOCRUnavailable, err)
	}
	defer resp.Body.Close()

	var parsed struct {
		Responses []struct {
			FullTextAnnotation struct {
				Text string `json:"text"`
			} `json:"fullTextAnnotation"`
			TextAnnotations []struct {
				Description string `json:"description"`
			} `json:"textAnnotations"`
			Error *struct {
				Message string `json:"message"`
			} `json:"error"`
		} `json:"responses"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		fmt.Printf("[OCR] Failed to decode response: %v\n", err)
		return nil, err
	}
	if resp.StatusCode >= 400 {
		fmt.Printf("[OCR] Vision API returned status %d\n", resp.StatusCode)
		return nil, fmt.Errorf("%w: vision api status %d", ErrOCRUnavailable, resp.StatusCode)
	}
	if len(parsed.Responses) == 0 {
		fmt.Println("[OCR] No responses in Vision API result")
		return nil, ErrOCRNoTextDetected
	}
	if parsed.Responses[0].Error != nil {
		fmt.Printf("[OCR] Vision API error: %s\n", parsed.Responses[0].Error.Message)
		return nil, fmt.Errorf("%w: %s", ErrOCRUnavailable, parsed.Responses[0].Error.Message)
	}

	text := strings.TrimSpace(parsed.Responses[0].FullTextAnnotation.Text)
	if text == "" && len(parsed.Responses[0].TextAnnotations) > 0 {
		text = strings.TrimSpace(parsed.Responses[0].TextAnnotations[0].Description)
	}
	fmt.Printf("[OCR] Extracted text: %q\n", text)
	if text == "" {
		fmt.Println("[OCR] No text detected in OCR result")
		return nil, ErrOCRNoTextDetected
	}

	entries := extractFuelEntries(text)
	fmt.Printf("[OCR] Extracted %d fuel entries\n", len(entries))
	if len(entries) == 0 {
		fmt.Println("[OCR] No fuel price entries found in OCR text")
		return nil, ErrOCRNoTextDetected
	}

	return &OCRResult{
		Entries: entries,
		OCRData: text,
	}, nil
}

var (
	priceTokenRegex = regexp.MustCompile(`\b\d{1,4}(?:\.\d{1,3})?\b`)
	spaceRegex      = regexp.MustCompile(`\s+`)
)

func extractFuelEntries(text string) []OCRPriceEntry {
	lines := strings.Split(strings.ToUpper(text), "\n")
	entries := make([]OCRPriceEntry, 0, len(lines))
	seen := map[string]struct{}{}
	pendingFuel := ""
	pendingFuelIndex := -1

	for idx, raw := range lines {
		line := strings.TrimSpace(raw)
		if line == "" {
			continue
		}

		fuelLabel := detectFuelLabel(lines, idx)
		priceMatches := priceTokenRegex.FindAllString(line, -1)

		parsedPrices := make([]struct {
			raw   string
			price float64
		}, 0, len(priceMatches))
		for _, rawPrice := range priceMatches {
			price, ok := parseFuelPriceToken(rawPrice)
			if !ok {
				continue
			}
			parsedPrices = append(parsedPrices, struct {
				raw   string
				price float64
			}{raw: rawPrice, price: price})
		}

		if fuelLabel != "" && len(parsedPrices) > 0 {
			for _, candidate := range parsedPrices {
				key := fuelLabel + "|" + fmt.Sprintf("%.1f", candidate.price)
				if _, ok := seen[key]; ok {
					continue
				}
				seen[key] = struct{}{}
				entries = append(entries, OCRPriceEntry{FuelType: fuelLabel, Price: candidate.price})
			}
			pendingFuel = ""
			pendingFuelIndex = -1
			continue
		}

		if fuelLabel != "" {
			pendingFuel = fuelLabel
			pendingFuelIndex = idx
			continue
		}

		if pendingFuel != "" && len(parsedPrices) > 0 && idx-pendingFuelIndex <= 3 {
			candidate := parsedPrices[0]
			key := pendingFuel + "|" + fmt.Sprintf("%.1f", candidate.price)
			if _, ok := seen[key]; !ok {
				seen[key] = struct{}{}
				entries = append(entries, OCRPriceEntry{FuelType: pendingFuel, Price: candidate.price})
			}
			pendingFuel = ""
			pendingFuelIndex = -1
		}
	}

	return entries
}

func detectFuelLabel(lines []string, idx int) string {
	line := lines[idx]
	normalized := spaceRegex.ReplaceAllString(strings.ToUpper(line), " ")

	switch {
	case strings.Contains(normalized, "E10"):
		return "E10"
	case strings.Contains(normalized, "PREMIUM DIESEL") || (strings.Contains(normalized, "PREMIUM") && strings.Contains(normalized, "DIESEL")):
		return "Premium Diesel"
	case strings.Contains(normalized, "DIESEL"):
		return "Diesel"
	case strings.Contains(normalized, "98"):
		return "Premium 98"
	case strings.Contains(normalized, "95"):
		return "Premium 95"
	case strings.Contains(normalized, "PREMIUM") || strings.Contains(normalized, "VORTEX"):
		if strings.Contains(normalized, "98") {
			return "Premium 98"
		}
		if strings.Contains(normalized, "95") {
			return "Premium 95"
		}
		if len(priceTokenRegex.FindAllString(normalized, -1)) > 0 {
			return "Premium 95"
		}
		if adjacentHas(lines, idx, "98") {
			return "Premium 98"
		}
		return "Premium 95"
	case strings.Contains(normalized, "91") || strings.Contains(normalized, "UNLEADED") || strings.Contains(normalized, "REGULAR"):
		return "Unleaded 91"
	case normalized == "ULP":
		return "Unleaded 91"
	default:
		return ""
	}
}

func adjacentHas(lines []string, idx int, token string) bool {
	if idx > 0 && strings.Contains(lines[idx-1], token) {
		return true
	}
	return idx+1 < len(lines) && strings.Contains(lines[idx+1], token)
}

func parseFuelPriceToken(raw string) (float64, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return 0, false
	}

	// "4.39", "3.95"
	if strings.Contains(raw, ".") {
		value, err := strconv.ParseFloat(raw, 64)
		if err != nil {
			return 0, false
		}
		// Common OCR output for cents/L: "158.9" means 158.9 cents/L.
		if value >= 20 {
			cents := roundToSingleDecimal(value)
			if !isReasonableFuelPriceCents(cents) {
				return 0, false
			}
			return cents, true
		}
		cents := roundToSingleDecimal(value * 100)
		if !isReasonableFuelPriceCents(cents) {
			return 0, false
		}
		return cents, true
	}

	// Ignore very short integers like "94" from noise such as "E10 94".
	if len(raw) < 3 {
		return 0, false
	}

	value, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return 0, false
	}

	var cents float64
	// Common OCR output: "1499" => 149.9c, "159" => 159c.
	if len(raw) == 4 {
		cents = roundToSingleDecimal(value / 10)
	} else {
		cents = roundToSingleDecimal(value)
	}
	if !isReasonableFuelPriceCents(cents) {
		return 0, false
	}
	return cents, true
}

func isReasonableFuelPriceCents(price float64) bool {
	return price >= 50 && price <= 999.9
}

func roundToSingleDecimal(value float64) float64 {
	return math.Round(value*10) / 10
}
