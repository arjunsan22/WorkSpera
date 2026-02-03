// app/api/otp/resend/route.js
import connectDB from "../../../../lib/connectDB";
import User from "../../../../models/User";
import { generateOTP, sendOTPEmail } from "../../../../lib/sendEmail";

export async function POST(request) {
    try {
        await connectDB();

        const { email } = await request.json();

        if (!email) {
            return new Response(JSON.stringify({ message: "Email is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return new Response(JSON.stringify({ message: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (user.isVerified) {
            return new Response(
                JSON.stringify({ message: "User already verified" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 60 * 1000); // 1 minute expiry

        // Update user with new OTP
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        const emailResult = await sendOTPEmail(email, otp, user.name);

        if (!emailResult.success) {
            return new Response(
                JSON.stringify({
                    message: "Failed to send verification email. Please try again.",
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        return new Response(
            JSON.stringify({
                message: "New OTP sent to your email",
                success: true,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Resend OTP Error:", error);
        return new Response(JSON.stringify({ message: "Server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
