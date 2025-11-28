//api/user/posts/[id]/connect
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/connectDB";
import Post from "@/models/Post";
import User from "@/models/User";
import ConnectionRequest from "@/models/ConnectionRequest";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function POST(req, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const commingparams = await params;
  const { id } = commingparams;
  const userId = new mongoose.Types.ObjectId(session.user.id);

  try {
    const post = await Post.findById(id).populate("user");
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Prevent connecting to your own post
    if (post.user._id.toString() === userId.toString()) {
      return Response.json(
        { error: "You can't connect to your own post" },
        { status: 400 }
      );
    }

    // Only allow on service requests
    if (!post.isServiceRequest) {
      return Response.json(
        { error: "This post doesn't accept connections" },
        { status: 400 }
      );
    }

    // Check if already requested
    const existing = await ConnectionRequest.findOne({
      post: id,
      requester: userId,
    });
    if (existing) {
      return Response.json(
        { error: "You've already sent a connection request" },
        { status: 400 }
      );
    }

    // Create connection request
    const request = await ConnectionRequest.create({
      post: id,
      requester: userId,
      postOwner: post.user._id,
      status: "pending",
    });

    // Create notification for post owner
    await Notification.create({
      recipient: post.user._id,
      sender: userId,
      type: "connection_request",
      read: false,
    });

    // Optional: Emit Socket.IO event (if you want real-time toast)
    // You can trigger a real-time notification here via Socket.IO

    return Response.json({ success: true, requestId: request._id });
  } catch (error) {
    console.error("Connection request error:", error);
    return Response.json({ error: "Failed to send request" }, { status: 500 });
  }
}
