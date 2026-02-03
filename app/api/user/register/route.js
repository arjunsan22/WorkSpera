// app/api/user/register/route.js
import connectDB from "../../../../lib/connectDB";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import { generateOTP, sendOTPEmail } from "../../../../lib/sendEmail";

export async function POST(request) {
  try {
    await connectDB();

    const { name, email, username, password } = await request.json();

    // Check if verified user exists with same email or username
    const existingVerifiedUser = await User.findOne({
      $or: [{ email }, { username }],
      isVerified: true,
    });

    if (existingVerifiedUser) {
      return new Response(JSON.stringify({ message: "User already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if username is taken by another email (even if unverified)
    const existingUsername = await User.findOne({
      username,
      email: { $ne: email },
    });

    if (existingUsername) {
      return new Response(
        JSON.stringify({ message: "Username already taken" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 60 * 1000); // 1 minute expiry

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if unverified user exists with same email
    let user = await User.findOne({ email, isVerified: false });

    if (user) {
      // Update existing unverified user
      user.name = name;
      user.username = username;
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      // Create new user
      user = new User({
        name,
        email,
        username,
        password: hashedPassword,
        otp,
        otpExpiry,
        isVerified: false,
      });
      await user.save();
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name);

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
        message: "OTP sent to your email",
        email: email,
        requiresVerification: true,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Register Error:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
