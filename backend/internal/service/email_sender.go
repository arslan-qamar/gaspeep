package service

import (
	"bytes"
	"fmt"
	"net/smtp"
	"os"
)

// smtpConfig holds SMTP connection settings read from environment variables.
type smtpConfig struct {
	Host string
	Port string
	User string
	Pass string
	From string
}

// loadSMTPConfig reads SMTP configuration from environment variables:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
func loadSMTPConfig() (smtpConfig, error) {
	cfg := smtpConfig{
		Host: os.Getenv("SMTP_HOST"),
		Port: os.Getenv("SMTP_PORT"),
		User: os.Getenv("SMTP_USER"),
		Pass: os.Getenv("SMTP_PASS"),
		From: os.Getenv("EMAIL_FROM"),
	}
	if cfg.Host == "" || cfg.User == "" || cfg.Pass == "" {
		return cfg, fmt.Errorf("SMTP not configured: SMTP_HOST/SMTP_USER/SMTP_PASS required")
	}
	if cfg.Port == "" {
		cfg.Port = "25"
	}
	if cfg.From == "" {
		cfg.From = cfg.User
	}
	return cfg, nil
}

// sendEmail sends an HTML email via SMTP. All public Send* functions delegate to this.
func sendEmail(toEmail, subject, htmlBody string) error {
	cfg, err := loadSMTPConfig()
	if err != nil {
		return err
	}

	var msg bytes.Buffer
	msg.WriteString(fmt.Sprintf("From: %s\r\n", cfg.From))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", toEmail))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/html; charset=\"utf-8\"\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	auth := smtp.PlainAuth("", cfg.User, cfg.Pass, cfg.Host)
	addr := fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)

	return smtp.SendMail(addr, auth, cfg.From, []string{toEmail}, msg.Bytes())
}
