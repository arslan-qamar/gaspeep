package service

import (
	"fmt"
	"html/template"
	"os"
)

// SendPriceAlert notifies a user that a fuel price has dropped below their alert threshold.
func SendPriceAlert(toEmail, alertName, stationName, fuelType string, price float64, currency string) error {
	body := fmt.Sprintf(
		`<p style="color:#475569;font-size:16px;line-height:1.6;">Great news! A fuel price matching your alert <strong>%s</strong> was reported:</p>`+
			`<table style="margin:16px 0;border-collapse:collapse;">`+
			`<tr><td style="padding:8px 16px;color:#64748b;font-size:14px;">Station</td><td style="padding:8px 16px;color:#1e293b;font-size:14px;font-weight:600;">%s</td></tr>`+
			`<tr><td style="padding:8px 16px;color:#64748b;font-size:14px;">Fuel Type</td><td style="padding:8px 16px;color:#1e293b;font-size:14px;font-weight:600;">%s</td></tr>`+
			`<tr><td style="padding:8px 16px;color:#64748b;font-size:14px;">Price</td><td style="padding:8px 16px;color:#16a34a;font-size:18px;font-weight:700;">%s%.2f</td></tr>`+
			`</table>`,
		template.HTMLEscapeString(alertName),
		template.HTMLEscapeString(stationName),
		template.HTMLEscapeString(fuelType),
		template.HTMLEscapeString(currency),
		price,
	)
	html, err := renderEmailHTML(EmailData{
		Heading: "Price Alert Triggered",
		Body:    template.HTML(body),
		CTAText: "View Station",
		CTAURL:  os.Getenv("APP_BASE_URL") + "/stations",
	})
	if err != nil {
		return err
	}
	return sendEmail(toEmail, fmt.Sprintf("Gas Peep: %s price alert", alertName), html)
}
