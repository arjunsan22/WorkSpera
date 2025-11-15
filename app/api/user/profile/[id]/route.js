// app/api/user/profile/[id]/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import User from "@/models/User";
import Post from "@/models/Post";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = await params; // Use await for params in Next.js 15
    console.log("userId,", userId);
    if (!session || session.user.id !== userId) {
      // Allow fetching own profile data, or make it public if needed
      // For now, restrict to own profile
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId).select("-password"); // Exclude password
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean(); // Sort by newest first, use lean()

    return Response.json({ user: user.toObject(), posts });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update profile data (PUT)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = await params; // Use await for params in Next.js 15

    if (!session || session.user.id !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, bio, profileImage } = body;

    // Basic validation
    if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return Response.json(
        { error: "Invalid username format" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, username, bio, profileImage },
      { new: true, runValidators: true } // Return updated doc and run schema validators
    ).select("-password"); // Exclude password from response

    if (!updatedUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ user: updatedUser.toObject() });
  } catch (error) {
    console.error("Error updating profile:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
