// app/api/user/notifications/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Notification from "@/models/Notification";
import User from "@/models/User";
import connectDB from "@/lib/connectDB";
import mongoose from "mongoose";

export async function GET(request) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch notifications with sender details
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(20) // last 20
      .populate("sender", "name username profileImage");

    // Mark as read (optional: do this on click instead)
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    return Response.json({ notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
