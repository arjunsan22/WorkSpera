// app/api/user/follow/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/connectDB";
import User from "@/models/User";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Notification from "@/models/Notification";

export async function POST(request) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { targetUserId } = await request.json();

  if (!targetUserId) {
    return NextResponse.json(
      { message: "Target user ID is required" },
      { status: 400 }
    );
  }

  if (session.user.id === targetUserId) {
    return NextResponse.json(
      { message: "You cannot follow yourself" },
      { status: 400 }
    );
  }

  try {
    const currentUserId = new mongoose.Types.ObjectId(session.user.id);
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetId);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isAlreadyFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId
    );

    if (isAlreadyFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== session.user.id
      );
    } else {
      // Follow
      currentUser.following.push(targetId);
      targetUser.followers.push(currentUserId);
      // Create a notification for the target user
      // ✅ CREATE NOTIFICATION
      await Notification.create({
        recipient: targetId, // The person being followed
        sender: currentUserId, // The person who followed
        type: "follow",
      });
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    return NextResponse.json({
      message: isAlreadyFollowing ? "Unfollowed" : "Followed",
      action: isAlreadyFollowing ? "unfollow" : "follow",
    });
  } catch (error) {
    console.error("Follow API Error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
