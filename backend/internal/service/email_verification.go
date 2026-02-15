package service

import "html/template"

// SendEmailVerification sends a verification link to confirm the user's email address.
func SendEmailVerification(toEmail, verificationURL string) error {
	html, err := renderEmailHTML(EmailData{
		Heading: "Verify Your Email",
		Body: template.HTML(`<p style="color:#475569;font-size:16px;line-height:1.6;">Please verify your email address by clicking the button below. This helps us keep your account secure.</p>` +
			`<p style="color:#475569;font-size:14px;line-height:1.6;">If you did not create a Gas Peep account, you can ignore this email.</p>`),
		CTAText: "Verify Email",
		CTAURL:  verificationURL,
	})
	if err != nil {
		return err
	}
	return sendEmail(toEmail, "Verify your Gas Peep email address", html)
}
