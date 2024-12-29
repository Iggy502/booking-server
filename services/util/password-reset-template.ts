export const getResetPasswordTemplateWithTokenValue = (token: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #f5f7f6;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin: 0 auto; padding: 0; background-color: #f5f7f6;">
        <tr>
            <td style="padding: 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <!-- Header with Logo Space -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center;">
                            <img src="https://www.experiencefreedom.co.uk/media/2401/camping-sunrise.jpg" alt="Campspot" style="max-width: 200px; height: auto; border-radius: 8px;">
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <h1 style="color: #2C5530; font-size: 24px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                                Reset Your Password
                            </h1>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                                Hello,
                            </p>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                                We received a request to reset your password for your Campspot account. To proceed with resetting your password, please click the button below:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                                <tr>
                                    <td style="border-radius: 8px; background-color: #2C5530;">
                                        <a href="${process.env.CLIENT_URL}/${process.env.CLIENT_CONFIRM_RESET_PASSWORD_ENDPOINT}/${token}"
                                           style="display: inline-block; padding: 16px 36px; font-family: Georgia, serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #2C5530; font-weight: bold;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin: 0 0 10px 0;">
                                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                            </p>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin: 0 0 10px 0;">
                                For security reasons, this password reset link will expire in 24 hours.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; line-height: 20px; margin: 0;">
                                Need help? Contact our support team at <a href="mailto:support@campspot.com" style="color: #2C5530; text-decoration: none;">support@campspot.com</a>
                            </p>
                            
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                <p style="color: #718096; font-size: 12px; line-height: 16px; margin: 0;">
                                    &copy; ${new Date().getFullYear()} Campspot. All rights reserved.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
}