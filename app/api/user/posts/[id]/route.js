// app/api/user/posts/[id]/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Post from "@/models/Post";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: postId } = await params;

    const post = await Post.findById(postId)
      .populate("user", "name username profileImage")
      .populate("comments.user", "name username profileImage")
      .populate({
        path: "comments.replies.user",
        select: "name username profileImage",
      })
      .lean();

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Add counts and liked status
    // Note: Manual population of replies not strictly needed if schema is correct and deep populate works.
    // If deep populate fails, we can fall back to manual.

    // Normalize likes
    const userId = session?.user?.id;
    const likeIds = (post.likes || []).map((id) => id.toString());

    const processedPost = {
      ...post,
      likeCount: likeIds.length,
      commentCount: post.comments.length,
      isLiked: userId ? likeIds.includes(userId) : false,
    };

    return Response.json({ post: processedPost });
  } catch (error) {
    console.error("Error fetching post:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: postId } = await params;

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { caption, images } = body;

    const post = await Post.findById(postId);
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if the session user is the owner of the post
    if (post.user.toString() !== session.user.id) {
      return Response.json(
        { error: "Unauthorized to update this post" },
        { status: 403 }
      );
    }

    // Update the post
    if (caption !== undefined) post.caption = caption;
    if (images !== undefined && Array.isArray(images)) post.image = images;

    await post.save();

    // Populate the user field for the response
    const populatedPost = await Post.findById(postId).populate(
      "user",
      "name username profileImage"
    );

    return Response.json({ post: populatedPost.toObject() });
  } catch (error) {
    console.error("Error updating post:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: postId } = await params; // Use await for params in Next.js 15

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if the session user is the owner of the post
    if (post.user.toString() !== session.user.id) {
      return Response.json(
        { error: "Unauthorized to delete this post" },
        { status: 403 }
      );
    }

    await Post.findByIdAndDelete(postId);

    return Response.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
