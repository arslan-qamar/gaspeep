package service

import "html/template"

// SendPasswordReset sends a branded HTML password reset email.
func SendPasswordReset(toEmail, resetURL string) error {
	html, err := renderEmailHTML(EmailData{
		Heading: "Reset Your Password",
		Body: template.HTML(`<p style="color:#475569;font-size:16px;line-height:1.6;">You requested a password reset for your Gas Peep account. Click the button below to choose a new password.</p>` +
			`<p style="color:#475569;font-size:14px;line-height:1.6;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>`),
		CTAText: "Reset Password",
		CTAURL:  resetURL,
	})
	if err != nil {
		return err
	}
	return sendEmail(toEmail, "Reset your Gas Peep password", html)
}
