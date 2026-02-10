// app/api/user/chats/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import Message from "@/models/Message";
import mongoose from "mongoose"; // Import mongoose for ObjectId

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("API /api/user/chats: Unauthorized access attempt");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserIdString = session.user.id;

    // --- Convert string ID to ObjectId ---
    let currentUserIdObjectId;
    try {
      currentUserIdObjectId = new mongoose.Types.ObjectId(currentUserIdString);
    } catch (idError) {
      return Response.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const allMessagesForUser = await Message.find({
      $or: [
        { senderId: currentUserIdString }, // This might work due to Mongoose conversion
        { receiverId: currentUserIdString },
      ],
    }).lean();

    // --- Aggregation Pipeline ---
    // Stage 1: Match (using ObjectId)
    const matchStage = [
      {
        $match: {
          $or: [
            { senderId: currentUserIdObjectId }, // Match using ObjectId
            { receiverId: currentUserIdObjectId }, // Match using ObjectId
          ],
        },
      },
    ];
    const messagesAfterMatch = await Message.aggregate(matchStage);

    // Stage 2: Sort
    const sortStage = [
      ...matchStage,
      {
        $sort: { timestamp: -1 },
      },
    ];
    const messagesAfterSort = await Message.aggregate(sortStage);

    // Stage 3: Group (Final aggregation)
    const messages = await Message.aggregate([
      ...sortStage,
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", currentUserIdObjectId] }, // Use ObjectId here too
              "$receiverId", // If current user is sender, group by receiver
              "$senderId", // If current user is receiver, group by sender
            ],
          },
          lastMessage: { $first: "$$ROOT" },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$senderId", currentUserIdObjectId] }, // Use ObjectId for comparison
                    { $ne: ["$isRead", true] }, // Message is not read
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Fetch user details for each unique user ID found in the messages
    const chatData = await Promise.all(
      messages.map(async (msgGroup) => {
        const otherUserId = msgGroup._id;

        try {
          // Ensure otherUserId is treated as ObjectId if it came from the aggregation
          // The aggregation should return otherUserId as an ObjectId if $group worked correctly
          const otherUser = await User.findById(otherUserId)
            .select("name username profileImage isOnline lastSeen")
            .lean(); // Use lean()

          if (!otherUser) {
            console.error(
              "API /api/user/chats: User not found for ID (from aggregation):",
              otherUserId
            );
            return null; // Skip this chat if user is not found
          }

          return {
            _id: otherUserId.toString(), // Ensure _id is a string for frontend
            user: {
              _id: otherUser._id.toString(),
              name: otherUser.name,
              username: otherUser.username,
              profileImage: otherUser.profileImage,
              isOnline: otherUser.isOnline,
              lastSeen: otherUser.lastSeen,
            },
            lastMessage: msgGroup.lastMessage
              ? {
                content: msgGroup.lastMessage.content,
                timestamp: msgGroup.lastMessage.timestamp,
                isRead: msgGroup.lastMessage.isRead,
              }
              : null,
            unreadCount: msgGroup.unreadCount,
            messageCount: msgGroup.messageCount,
          };
        } catch (error) {
          console.error(
            "API /api/user/chats: Error fetching user details for ID:",
            otherUserId,
            error
          );
          return null; // Skip this chat if there's an error fetching user
        }
      })
    );

    // Filter out any null results
    const validChatData = chatData.filter((chat) => chat !== null);

    return Response.json({ chats: validChatData });
  } catch (error) {
    console.error("API /api/user/chats: Error fetching chats:", error);
    return Response.json(
      { error: "Internal server error", chats: [] },
      { status: 500 }
    );
  }
}
