// app/api/user/chats/[id]/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import Message from "@/models/Message";

export async function GET(request, { params }) {
  try {
    // Fix: Use await to unwrap params
    const { id: otherUserId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Get messages between current user and other user
    const messages = await Message.find({
      $or: [
        { senderId: session.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: session.user.id },
      ],
    }).sort({ timestamp: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: session.user.id,
        isRead: false,
      },
      { isRead: true }
    );

    return Response.json({
      chat: {
        user: {
          _id: otherUser._id,
          name: otherUser.name,
          username: otherUser.username,
          profileImage: otherUser.profileImage,
          isOnline: otherUser.isOnline,
          lastSeen: otherUser.lastSeen,
        },
        messages: messages,
      },
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
