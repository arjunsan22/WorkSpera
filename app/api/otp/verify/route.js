// app/api/otp/verify/route.js
import connectDB from "../../../../lib/connectDB";
import User from "../../../../models/User";

export async function POST(request) {
    try {
        await connectDB();

        const { email, otp } = await request.json();

        if (!email || !otp) {
            return new Response(
                JSON.stringify({ message: "Email and OTP are required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
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

        // Check if OTP is expired
        if (new Date() > new Date(user.otpExpiry)) {
            return new Response(
                JSON.stringify({
                    message: "OTP has expired. Please request a new one.",
                    expired: true,
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Verify OTP
        if (user.otp !== otp) {
            return new Response(
                JSON.stringify({ message: "Invalid OTP. Please try again." }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Update user as verified
        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        return new Response(
            JSON.stringify({
                message: "Email verified successfully!",
                verified: true,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("OTP Verify Error:", error);
        return new Response(JSON.stringify({ message: "Server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
