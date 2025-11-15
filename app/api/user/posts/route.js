// app/api/user/posts/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Post from "@/models/Post";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    // Optional: Check if user is authenticated for additional user-specific data
    let userId = null;
    if (session) {
      userId = session.user.id;
    }

    // Fetch posts with populated user data, sorted by creation date (newest first)
    const posts = await Post.find({ visibility: "public" })
      .populate({
        path: "user",
        select: "name username profileImage",
      })
      .populate({
        path: "comments.user",
        select: "name username profileImage",
      })
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    // Add like and comment counts for easier frontend access
    const postsWithCounts = posts.map((post) => ({
      ...post,
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      isLiked: userId ? post.likes.includes(userId) : false, // Check if current user liked the post
    }));

    return NextResponse.json({ posts: postsWithCounts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Now parsing JSON since frontend sends JSON
    const body = await request.json();
    const { caption, images, userId } = body;

    // Validate user id matches session user
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to create post for this user" },
        { status: 403 }
      );
    }

    // Check user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate images
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    const newPost = await Post.create({
      user: userId,
      caption: caption || "",
      image: images, // This should now be an array of URLs
    });

    // Load final version with populated user
    const finalPost = await Post.findById(newPost._id).populate(
      "user",
      "name username profileImage"
    );

    return NextResponse.json({ post: finalPost }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
