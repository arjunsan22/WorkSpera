// app/api/user/peoples/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import mongoose from "mongoose";
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("API /api/user/peoples: Unauthorized access attempt");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Convert session user ID string to ObjectId for the query
    let currentUserIdObjectId;
    try {
      currentUserIdObjectId = new mongoose.Types.ObjectId(session.user.id);
    } catch (idError) {
      console.error(
        "API /api/user/peoples: Invalid user ID format received from session:",
        session.user.id,
        idError
      );
      return Response.json({ error: "Invalid user ID" }, { status: 400 });
    }

    console.log(
      "API /api/user/peoples: Fetching users excluding ID:",
      currentUserIdObjectId
    );

    // Get all users except current user, including online status
    const users = await User.find({
      _id: { $ne: currentUserIdObjectId }, // Exclude current user
    }).select("name username profileImage isOnline lastSeen");

    // Convert Mongoose documents to plain objects with string IDs
    const usersData = users.map((user) => ({
      _id: user._id.toString(), // Ensure _id is a string for frontend
      name: user.name,
      username: user.username,
      profileImage: user.profileImage,
      isOnline: user.isOnline, // Include the latest online status
      lastSeen: user.lastSeen,
    }));

    console.log("API /api/user/peoples: Sending users data:", usersData);
    return Response.json({ users: usersData });
  } catch (error) {
    console.error("API /api/user/peoples: Error fetching users:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
