package service

import "html/template"

// SendPasswordChanged sends a confirmation that the user's password was changed.
func SendPasswordChanged(toEmail string) error {
	html, err := renderEmailHTML(EmailData{
		Heading: "Password Changed",
		Body: template.HTML(`<p style="color:#475569;font-size:16px;line-height:1.6;">Your Gas Peep password was successfully changed.</p>` +
			`<p style="color:#475569;font-size:16px;line-height:1.6;">If you did not make this change, please reset your password immediately or contact support.</p>`),
	})
	if err != nil {
		return err
	}
	return sendEmail(toEmail, "Your Gas Peep password was changed", html)
}
