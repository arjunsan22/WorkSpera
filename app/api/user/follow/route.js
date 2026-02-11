// app/api/user/follow/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/connectDB";
import User from "@/models/User";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Notification from "@/models/Notification";

export async function POST(request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await request.json();

    if (!targetUserId || !mongoose.isValidObjectId(targetUserId)) {
      return NextResponse.json(
        { message: "Invalid target user ID" },
        { status: 400 }
      );
    }

    if (session.user.id === targetUserId) {
      return NextResponse.json(
        { message: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    const currentUserId = new mongoose.Types.ObjectId(session.user.id);
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    // Fetch both users
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetId)
    ]);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Initialize arrays if they don't exist
    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    // Check if already following
    const isAlreadyFollowing = currentUser.following.some(
      (id) => id && id.toString() === targetUserId
    );

    let action;

    if (isAlreadyFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id && id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id && id.toString() !== session.user.id
      );
      action = "unfollow";
    } else {
      // Follow
      // Check if not already in array (double safety)
      if (!currentUser.following.some(id => id.toString() === targetUserId)) {
        currentUser.following.push(targetId);
      }
      if (!targetUser.followers.some(id => id.toString() === session.user.id)) {
        targetUser.followers.push(currentUserId);
      }
      action = "follow";

      // Create notification safely
      try {
        await Notification.create({
          recipient: targetId,
          sender: currentUserId,
          type: "follow",
        });
      } catch (notifyError) {
        console.error("Failed to create notification:", notifyError);
        // Continue execution, don't fail the request
      }
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    return NextResponse.json({
      message: action === "follow" ? "Followed" : "Unfollowed",
      action,
    });
  } catch (error) {
    console.error("Follow API Critical Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
