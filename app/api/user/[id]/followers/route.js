// app/api/user/[id]/followers/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const paramsData = await params;
    const { id: userId } = paramsData;
    // Optional: Allow public access, or restrict
    const targetUser = await User.findById(userId).populate(
      "followers",
      "name username profileImage"
    );
    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // If user is logged in, enrich with "isFollowing" status
    let followersWithStatus = targetUser.followers;
    if (session?.user?.id) {
      const currentUserId = new mongoose.Types.ObjectId(session.user.id);
      const currentUser = await User.findById(currentUserId).select(
        "following"
      );

      followersWithStatus = targetUser.followers.map((follower) => {
        const isFollowing = currentUser?.following.some(
          (id) => id.toString() === follower._id.toString()
        );
        return { ...follower.toObject(), isFollowing };
      });
    }

    return Response.json({ followers: followersWithStatus });
  } catch (error) {
    console.error("Fetch followers error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
