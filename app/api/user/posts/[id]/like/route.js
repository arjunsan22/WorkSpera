// app/api/user/posts/[id]/like/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Post from "@/models/Post";
import Notification from "@/models/Notification";
import connectDB from "@/lib/connectDB";

export async function POST(request, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, reactionType = "like" } = await request.json();
    const resolvedParams = await params;
    const { id: postId } = resolvedParams;
    const post = await Post.findById(postId);
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user already reacted
    const existingReactionIndex = post.likes.findIndex(
      (like) => like.user && like.user.toString() === userId
    );

    if (existingReactionIndex !== -1) {
      // User already reacted
      if (post.likes[existingReactionIndex].reactionType === reactionType) {
        // Same reaction = toggle off (unlike)
        post.likes.splice(existingReactionIndex, 1);
      } else {
        // Different reaction = update reaction type
        post.likes[existingReactionIndex].reactionType = reactionType;
      }
    } else {
      // New reaction
      post.likes.push({ user: userId, reactionType });
      
      // Create notification
      if (post.user.toString() !== userId) {
        await Notification.create({
          recipient: post.user,
          sender: userId,
          type: 'like',
          post: postId,
        });
      }
    }

    await post.save();

    const populatedPost = await Post.findById(postId).populate("likes.user", "name username profileImage").lean();

    return Response.json({
      success: true,
      likes: populatedPost.likes,
      likeCount: populatedPost.likes.length,
    }, { status: 200 });
  } catch (error) {
    console.error("Error handling like:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
