// app/api/user/peoples/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch current user WITH their following list
    const currentUser = await User.findById(currentUserId).select("following");
    if (!currentUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all other users
    const otherUsers = await User.find({
      _id: { $ne: currentUserId },
    }).select("name username profileImage isOnline lastSeen");

    // Convert to plain objects and check if current user follows them
    const usersData = otherUsers.map((user) => {
      const isFollowing = currentUser.following.some(
        (id) => id.toString() === user._id.toString()
      );
      return {
        _id: user._id.toString(),
        name: user.name,
        username: user.username,
        profileImage: user.profileImage,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        isFollowing,
      };
    });

    return Response.json({ users: usersData });
  } catch (error) {
    console.error("API /api/user/peoples: Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
