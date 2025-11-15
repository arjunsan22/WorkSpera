// app/api/user/posts/[id]/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Post from "@/models/Post";
import mongoose from "mongoose";

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: postId } = await params; // Use await for params in Next.js 15
    console.log("postId,", postId);
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
    post.caption = caption;
    post.image = images; // Assuming 'images' is an array of URLs
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
