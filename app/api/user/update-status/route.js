// app/api/user/update-status/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path to your auth options file
import User from "@/models/User"; // Adjust path to your User model
import mongoose from "mongoose"; // Import mongoose for ObjectId conversion

export async function PUT(request) {
  try {
    // Optional: Verify the requestor is authenticated (though client already has session)
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return Response.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    console.log(body, 'body..................');
    const { userId, isOnline } = body;
    console.log(userId, isOnline, 'userId,isOnline..................');
    if (!userId || typeof isOnline !== "boolean") {
      return Response.json(
        { error: "Invalid request body: userId and isOnline required." },
        { status: 400 }
      );
    }

    // Convert userId string to ObjectId if necessary
    let userIdObjectId;
    try {
      userIdObjectId = new mongoose.Types.ObjectId(userId);
    } catch (idError) {
      console.error(
        "API /api/user/update-status: Invalid user ID format received:",
        userId,
        idError
      );
      return Response.json({ error: "Invalid user ID" }, { status: 400 });
    }

    console.log(
      `API /api/user/update-status: Attempting to set isOnline=${isOnline} for user ${userIdObjectId}`
    );

    const updatedUser = await User.findByIdAndUpdate(
      userIdObjectId,
      { isOnline, lastSeen: new Date() }, // Update status and last seen time
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      console.error(
        `API /api/user/update-status: User not found with ID ${userIdObjectId}`
      );
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    console.log(
      `API /api/user/update-status: Successfully updated user ${userIdObjectId} isOnline to ${isOnline}.`
    );
    return Response.json({
      message: "Status updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("API /api/user/update-status: Error updating status:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
