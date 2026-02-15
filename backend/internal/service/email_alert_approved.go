package service

import (
	"fmt"
	"html/template"
	"os"
)

// SendAlertApproved notifies a user that their price alert has been approved and is now active.
func SendAlertApproved(toEmail, alertName string) error {
	body := fmt.Sprintf(
		`<p style="color:#475569;font-size:16px;line-height:1.6;">Your price alert <strong>%s</strong> has been approved and is now active.</p>`+
			`<p style="color:#475569;font-size:16px;line-height:1.6;">We'll notify you when fuel prices in your selected area drop below your threshold.</p>`,
		template.HTMLEscapeString(alertName),
	)
	html, err := renderEmailHTML(EmailData{
		Heading: "Alert Approved",
		Body:    template.HTML(body),
		CTAText: "View My Alerts",
		CTAURL:  os.Getenv("APP_BASE_URL") + "/alerts",
	})
	if err != nil {
		return err
	}
	return sendEmail(toEmail, "Your Gas Peep alert is now active", html)
}
