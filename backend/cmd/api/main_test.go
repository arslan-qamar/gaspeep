package main

import (
	"errors"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestStartServer_DefaultPortAndHTTP(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	origHTTP := runHTTPServer
	origTLS := runTLSServer
	t.Cleanup(func() {
		runHTTPServer = origHTTP
		runTLSServer = origTLS
	})

	httpCalled := false
	runHTTPServer = func(_ *gin.Engine, addr string) error {
		httpCalled = true
		if addr != ":8080" {
			t.Fatalf("expected default addr :8080, got %s", addr)
		}
		return nil
	}
	runTLSServer = func(_ *gin.Engine, _, _, _ string) error {
		t.Fatal("tls runner should not be called")
		return nil
	}

	getenv := func(key string) string {
		return ""
	}

	if err := startServer(router, getenv); err != nil {
		t.Fatalf("startServer returned error: %v", err)
	}
	if !httpCalled {
		t.Fatal("expected HTTP runner to be called")
	}
}

func TestStartServer_CustomPortHTTP(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	origHTTP := runHTTPServer
	origTLS := runTLSServer
	t.Cleanup(func() {
		runHTTPServer = origHTTP
		runTLSServer = origTLS
	})

	runHTTPServer = func(_ *gin.Engine, addr string) error {
		if addr != ":9090" {
			t.Fatalf("expected addr :9090, got %s", addr)
		}
		return nil
	}
	runTLSServer = func(_ *gin.Engine, _, _, _ string) error {
		t.Fatal("tls runner should not be called")
		return nil
	}

	getenv := func(key string) string {
		if key == "PORT" {
			return "9090"
		}
		return ""
	}

	if err := startServer(router, getenv); err != nil {
		t.Fatalf("startServer returned error: %v", err)
	}
}

func TestStartServer_TLSWhenCertAndKeyProvided(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	origHTTP := runHTTPServer
	origTLS := runTLSServer
	t.Cleanup(func() {
		runHTTPServer = origHTTP
		runTLSServer = origTLS
	})

	tlsCalled := false
	runHTTPServer = func(_ *gin.Engine, _ string) error {
		t.Fatal("http runner should not be called")
		return nil
	}
	runTLSServer = func(_ *gin.Engine, addr, certFile, keyFile string) error {
		tlsCalled = true
		if addr != ":8443" {
			t.Fatalf("expected addr :8443, got %s", addr)
		}
		if certFile != "/tmp/cert.pem" {
			t.Fatalf("unexpected cert file: %s", certFile)
		}
		if keyFile != "/tmp/key.pem" {
			t.Fatalf("unexpected key file: %s", keyFile)
		}
		return nil
	}

	getenv := func(key string) string {
		switch key {
		case "PORT":
			return "8443"
		case "TLS_CERT":
			return "/tmp/cert.pem"
		case "TLS_KEY":
			return "/tmp/key.pem"
		default:
			return ""
		}
	}

	if err := startServer(router, getenv); err != nil {
		t.Fatalf("startServer returned error: %v", err)
	}
	if !tlsCalled {
		t.Fatal("expected TLS runner to be called")
	}
}

func TestStartServer_HTTPErrorPropagates(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	origHTTP := runHTTPServer
	origTLS := runTLSServer
	t.Cleanup(func() {
		runHTTPServer = origHTTP
		runTLSServer = origTLS
	})

	expectedErr := errors.New("listen failed")
	runHTTPServer = func(_ *gin.Engine, _ string) error {
		return expectedErr
	}
	runTLSServer = func(_ *gin.Engine, _, _, _ string) error {
		t.Fatal("tls runner should not be called")
		return nil
	}

	if err := startServer(router, func(string) string { return "" }); !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}
}

func TestStartServer_TLSErrorPropagates(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	origHTTP := runHTTPServer
	origTLS := runTLSServer
	t.Cleanup(func() {
		runHTTPServer = origHTTP
		runTLSServer = origTLS
	})

	expectedErr := errors.New("tls failed")
	runHTTPServer = func(_ *gin.Engine, _ string) error {
		t.Fatal("http runner should not be called")
		return nil
	}
	runTLSServer = func(_ *gin.Engine, _, _, _ string) error {
		return expectedErr
	}

	getenv := func(key string) string {
		switch key {
		case "TLS_CERT":
			return "/tmp/cert.pem"
		case "TLS_KEY":
			return "/tmp/key.pem"
		default:
			return ""
		}
	}

	if err := startServer(router, getenv); !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}
}
