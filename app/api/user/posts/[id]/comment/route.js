// app/api/user/posts/[id]/comment/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Post from "@/models/Post";
import User from "@/models/User";
import mongoose from "mongoose";
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIX: Destructure both 'userId' and 'text' from the request body
    const { userId, text } = await request.json();
    const resolvedParams = await params;
    const { id: postId } = resolvedParams;

    // ✅ Optional: Validate the required fields
    if (!userId || !text) {
      return Response.json(
        { error: "userId and text are required" },
        { status: 400 }
      );
    }

    const post = await Post.findById(postId);
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // ✅ Now 'text' is available and defined
    const newComment = {
      user: userId,
      text: text, // <-- Now this works
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
