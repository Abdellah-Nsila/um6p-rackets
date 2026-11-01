export const getPasswordResetTemplate = (resetLink: string): string => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
    
    <div style="display: inline-block; background-color: #FFF0E6; color: #D95326; padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; border: 1px solid #FAD6C4;">
      Action Required
    </div>
    
    <h2 style="margin: 0 0 8px 0; font-size: 26px; font-style: italic; font-weight: 900; color: #111827;">Reset Password</h2>
    
    <p style="margin: 0 0 32px 0; font-size: 14px; color: #6B7280; font-style: italic; line-height: 1.5;">
      You requested a password reset for your UM6P Racket dashboard. Click the button below to establish new credentials.
    </p>
    
    <a href="${resetLink}" style="display: block; padding: 14px 24px; background-color: #D95326; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 800; font-style: italic; font-size: 15px; text-align: center; margin-bottom: 32px;">
      Reset Password &rarr;
    </a>
    
    <hr style="border: none; border-top: 1px solid #eaeaea; margin-bottom: 24px;" />
    
    <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
      If you did not request this reset, please ignore this email. This secure link will automatically expire in 15 minutes.
    </p>
  </div>
`;