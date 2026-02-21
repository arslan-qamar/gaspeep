package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

const (
	serviceNSWTimestampLayout = "02/01/2006 03:04:05 PM"
)

var errServiceNSWNotModified = errors.New("service nsw: not modified")

type serviceNSWAccessTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   string `json:"expires_in"`
}

type serviceNSWReferenceFuelType struct {
	Code  string `json:"code"`
	Name  string `json:"name"`
	State string `json:"state"`
}

type serviceNSWReferenceResponse struct {
	FuelTypes struct {
		Items []serviceNSWReferenceFuelType `json:"items"`
	} `json:"fueltypes"`
}

type serviceNSWLocation struct {
	Latitude  jsonFlexibleFloat `json:"latitude"`
	Longitude jsonFlexibleFloat `json:"longitude"`
}

type serviceNSWStation struct {
	BrandID   jsonFlexibleString `json:"brandid"`
	StationID jsonFlexibleString `json:"stationid"`
	Code      jsonFlexibleString `json:"code"`
	Brand     string             `json:"brand"`
	Name      string             `json:"name"`
	Address   string             `json:"address"`
	Location  serviceNSWLocation `json:"location"`
	State     string             `json:"state"`
}

type serviceNSWPrice struct {
	StationCode jsonFlexibleString `json:"stationcode"`
	FuelType    string             `json:"fueltype"`
	Price       jsonFlexibleFloat  `json:"price"`
	LastUpdated string             `json:"lastupdated"`
	State       string             `json:"state"`
}

type serviceNSWCurrentPricesResponse struct {
	Stations []serviceNSWStation `json:"stations"`
	Prices   []serviceNSWPrice   `json:"prices"`
}

type serviceNSWClient struct {
	baseURL   string
	apiKey    string
	apiSecret string
	states    string
	http      *http.Client

	mu          sync.Mutex
	accessToken string
	tokenExpiry time.Time
}

func newServiceNSWClient(baseURL, apiKey, apiSecret, states string, timeout time.Duration) *serviceNSWClient {
	return &serviceNSWClient{
		baseURL:   strings.TrimRight(baseURL, "/"),
		apiKey:    apiKey,
		apiSecret: apiSecret,
		states:    states,
		http: &http.Client{
			Timeout: timeout,
		},
	}
}

func (c *serviceNSWClient) getReferenceDataV2(ctx context.Context, ifModifiedSince time.Time) (*serviceNSWReferenceResponse, error) {
	req, err := c.newAuthorizedRequest(ctx, http.MethodGet, "/FuelCheckRefData/v2/fuel/lovs", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("if-modified-since", toServiceNSWTimestamp(ifModifiedSince))

	q := req.URL.Query()
	if c.states != "" {
		q.Set("states", c.states)
	}
	req.URL.RawQuery = q.Encode()

	var out serviceNSWReferenceResponse
	if err := c.executeJSON(req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *serviceNSWClient) getAllCurrentPricesV2(ctx context.Context) (*serviceNSWCurrentPricesResponse, error) {
	req, err := c.newAuthorizedRequest(ctx, http.MethodGet, "/FuelPriceCheck/v2/fuel/prices", nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	if c.states != "" {
		q.Set("states", c.states)
	}
	req.URL.RawQuery = q.Encode()

	var out serviceNSWCurrentPricesResponse
	if err := c.executeJSON(req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *serviceNSWClient) getNewCurrentPricesV2(ctx context.Context) (*serviceNSWCurrentPricesResponse, error) {
	req, err := c.newAuthorizedRequest(ctx, http.MethodGet, "/FuelPriceCheck/v2/fuel/prices/new", nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	if c.states != "" {
		q.Set("states", c.states)
	}
	req.URL.RawQuery = q.Encode()

	var out serviceNSWCurrentPricesResponse
	if err := c.executeJSON(req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *serviceNSWClient) newAuthorizedRequest(ctx context.Context, method, path string, body io.Reader) (*http.Request, error) {
	token, err := c.getAccessToken(ctx)
	if err != nil {
		return nil, err
	}

	u, err := url.Parse(c.baseURL + path)
	if err != nil {
		return nil, fmt.Errorf("invalid service NSW URL: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, method, u.String(), body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json; charset=utf-8")
	req.Header.Set("apikey", c.apiKey)
	req.Header.Set("transactionid", uuid.NewString())
	req.Header.Set("requesttimestamp", toServiceNSWTimestamp(time.Now().UTC()))

	return req, nil
}

func (c *serviceNSWClient) executeJSON(req *http.Request, out interface{}) error {
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotModified {
		return errServiceNSWNotModified
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return fmt.Errorf("service NSW request failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
		return fmt.Errorf("failed to decode service NSW response: %w", err)
	}
	return nil
}

func (c *serviceNSWClient) getAccessToken(ctx context.Context) (string, error) {
	c.mu.Lock()
	if c.accessToken != "" && time.Now().Before(c.tokenExpiry.Add(-30*time.Second)) {
		token := c.accessToken
		c.mu.Unlock()
		return token, nil
	}
	c.mu.Unlock()

	u, err := url.Parse(c.baseURL + "/oauth/client_credential/accesstoken")
	if err != nil {
		return "", fmt.Errorf("invalid service NSW token URL: %w", err)
	}

	q := u.Query()
	q.Set("grant_type", "client_credentials")
	u.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return "", err
	}

	authValue := base64.StdEncoding.EncodeToString([]byte(c.apiKey + ":" + c.apiSecret))
	req.Header.Set("Authorization", "Basic "+authValue)

	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return "", fmt.Errorf("service NSW token request failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var tokenResp serviceNSWAccessTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", fmt.Errorf("failed to decode service NSW token response: %w", err)
	}
	if tokenResp.AccessToken == "" {
		return "", fmt.Errorf("service NSW token response missing access_token")
	}

	expirySeconds, err := time.ParseDuration(strings.TrimSpace(tokenResp.ExpiresIn) + "s")
	if err != nil || expirySeconds <= 0 {
		expirySeconds = 10 * time.Minute
	}

	c.mu.Lock()
	c.accessToken = tokenResp.AccessToken
	c.tokenExpiry = time.Now().Add(expirySeconds)
	token := c.accessToken
	c.mu.Unlock()

	return token, nil
}

func toServiceNSWTimestamp(t time.Time) string {
	return t.UTC().Format(serviceNSWTimestampLayout)
}

type jsonFlexibleFloat float64

func (f *jsonFlexibleFloat) UnmarshalJSON(data []byte) error {
	var n float64
	if err := json.Unmarshal(data, &n); err == nil {
		*f = jsonFlexibleFloat(n)
		return nil
	}

	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	parsed, err := parseFlexibleFloat(s)
	if err != nil {
		return err
	}
	*f = jsonFlexibleFloat(parsed)
	return nil
}

func parseFlexibleFloat(v string) (float64, error) {
	trimmed := strings.TrimSpace(v)
	if trimmed == "" {
		return 0, nil
	}
	return strconv.ParseFloat(trimmed, 64)
}

type jsonFlexibleString string

func (s *jsonFlexibleString) UnmarshalJSON(data []byte) error {
	var str string
	if err := json.Unmarshal(data, &str); err == nil {
		*s = jsonFlexibleString(strings.TrimSpace(str))
		return nil
	}

	var num json.Number
	if err := json.Unmarshal(data, &num); err == nil {
		*s = jsonFlexibleString(num.String())
		return nil
	}

	var f float64
	if err := json.Unmarshal(data, &f); err == nil {
		*s = jsonFlexibleString(strconv.FormatFloat(f, 'f', -1, 64))
		return nil
	}

	return fmt.Errorf("unsupported JSON type for flexible string: %s", strings.TrimSpace(string(data)))
}
