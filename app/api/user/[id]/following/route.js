// app/api/user/[id]/following/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const paramsData = await params;
    const { id: userId } = paramsData;
    const targetUser = await User.findById(userId).populate(
      "following",
      "name username profileImage"
    );
    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    let followingWithStatus = targetUser.following;
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const currentUserId = new mongoose.Types.ObjectId(session.user.id);
      const currentUser = await User.findById(currentUserId).select(
        "following"
      );

      followingWithStatus = targetUser.following.map((following) => {
        const isFollowing = currentUser?.following.some(
          (id) => id.toString() === following._id.toString()
        );
        return { ...following.toObject(), isFollowing };
      });
    }

    return Response.json({ following: followingWithStatus });
  } catch (error) {
    console.error("Fetch following error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
