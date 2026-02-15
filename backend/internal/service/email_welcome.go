package service

import (
	"fmt"
	"html/template"
	"os"
)

// SendWelcome sends a welcome email after a new user signs up.
func SendWelcome(toEmail, displayName string) error {
	body := fmt.Sprintf(
		`<p style="color:#475569;font-size:16px;line-height:1.6;">Hi %s,</p>`+
			`<p style="color:#475569;font-size:16px;line-height:1.6;">Welcome to Gas Peep! You're now part of a community helping everyone find the best fuel prices.</p>`+
			`<p style="color:#475569;font-size:16px;line-height:1.6;">Start by searching for stations near you and submitting prices you see at the pump.</p>`,
		template.HTMLEscapeString(displayName),
	)
	html, err := renderEmailHTML(EmailData{
		Heading: "Welcome to Gas Peep!",
		Body:    template.HTML(body),
		CTAText: "Get Started",
		CTAURL:  os.Getenv("APP_BASE_URL"),
	})
	if err != nil {
		return err
	}
	return sendEmail(toEmail, "Welcome to Gas Peep!", html)
}
