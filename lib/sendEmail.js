import nodemailer from "nodemailer";

// Remove spaces from app password (Gmail app passwords are displayed with spaces)
const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, '');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: emailPass,
    },
});

export async function sendOTPEmail(email, otp, name) {
    const mailOptions = {
        from: `"WorkSpera" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your Email - WorkSpera",
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" style="max-width: 500px; background: rgba(255, 255, 255, 0.95); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); padding: 40px 30px; text-align: center;">
                      <div style="width: 70px; height: 70px; background: rgba(255, 255, 255, 0.2); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 32px;">🔐</span>
                      </div>
                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">Email Verification</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        Hi <strong style="color: #6366f1;">${name}</strong>,
                      </p>
                      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                        Thank you for registering with WorkSpera! Use the verification code below to complete your registration:
                      </p>
                      
                      <!-- OTP Box -->
                      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px dashed #6366f1; border-radius: 16px; padding: 30px; text-align: center; margin: 0 0 30px;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                        <div style="font-size: 42px; font-weight: 800; letter-spacing: 12px; background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${otp}</div>
                      </div>
                      
                      <!-- Timer Warning -->
                      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 16px 20px; margin: 0 0 30px; display: flex; align-items: center;">
                        <span style="font-size: 20px; margin-right: 12px;">⏱️</span>
                        <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
                          This code will expire in <strong>1 minute</strong>
                        </p>
                      </div>
                      
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
                        If you didn't request this verification, please ignore this email or contact our support team.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px;">
                        © ${new Date().getFullYear()} WorkSpera. All rights reserved.
                      </p>
                      <p style="color: #d1d5db; font-size: 11px; margin: 0;">
                        This is an automated message, please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error("Email send error:", error);
        return { success: false, error: error.message };
    }
}

export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
