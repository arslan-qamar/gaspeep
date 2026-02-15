package service

import (
	"bytes"
	"fmt"
	"html/template"
	"time"
)

// EmailData holds the data for rendering the base email template.
type EmailData struct {
	Heading    string        // Email heading, e.g. "Reset Your Password"
	Body       template.HTML // Pre-rendered inner HTML content
	CTAText    string        // Button label — empty string means no button
	CTAURL     string        // Button link URL
	FooterText string        // Override footer text; empty uses default
	Year       int           // Current year for copyright line
}

const baseEmailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{{.Heading}}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Full-width wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <!-- 600px centered container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#2563EB;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Gas Peep</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);font-weight:400;">Community-Driven Fuel Price Monitoring</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <h2 style="margin:0 0 20px;font-size:22px;font-weight:600;color:#1e293b;">{{.Heading}}</h2>
              <div style="margin:0 0 24px;">
                {{.Body}}
              </div>
              {{if .CTAText}}
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
                <tr>
                  <td align="center" style="border-radius:6px;background-color:#2563EB;">
                    <a href="{{.CTAURL}}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;background-color:#2563EB;">{{.CTAText}}</a>
                  </td>
                </tr>
              </table>
              {{end}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.5;">{{.FooterText}}</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">&copy; {{.Year}} Gas Peep. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

var parsedBaseTemplate = template.Must(template.New("email").Parse(baseEmailTemplate))

// renderEmailHTML renders the base email template with the given data.
func renderEmailHTML(data EmailData) (string, error) {
	if data.Year == 0 {
		data.Year = time.Now().Year()
	}
	if data.FooterText == "" {
		data.FooterText = "This email was sent by Gas Peep. If you didn't expect this email, you can safely ignore it."
	}
	var buf bytes.Buffer
	if err := parsedBaseTemplate.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to render email template: %w", err)
	}
	return buf.String(), nil
}
