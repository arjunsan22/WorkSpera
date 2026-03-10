// app/api/user/posts/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Post from "@/models/Post";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // Fetch user's saved posts for isSaved flag
    let savedPostIds = new Set();
    if (userId) {
      const currentUser = await User.findById(userId).select("savedPosts").lean();
      if (currentUser?.savedPosts) {
        savedPostIds = new Set(currentUser.savedPosts.map(id => String(id)));
      }
    }

    // Fetch posts with top-level user and comment users populated
    let posts = await Post.find({ visibility: "public" })
      .populate("user", "name username profileImage")
      .populate("comments.user", "name username profileImage")
      .sort({ createdAt: -1 })
      .lean({ defaults: true }); // ensures consistent object shape

    // Collect reply user IDs (as strings)
    const replyUserIds = new Set();
    posts.forEach(post => {
      post.comments?.forEach(comment => {
        comment.replies?.forEach(reply => {
          if (reply.user) {
            replyUserIds.add(String(reply.user)); // ✅ Safe conversion
          }
        });
      });
    });

    // Fetch reply users
    const replyUserMap = {};
    if (replyUserIds.size > 0) {
      const users = await User.find(
        { _id: { $in: Array.from(replyUserIds) } },
        "name username profileImage"
      ).lean();
      users.forEach(user => {
        replyUserMap[String(user._id)] = user; // ✅ key as string
      });
    }

    // Inject populated reply users
    const processedPosts = posts.map(post => {
      const updatedComments = post.comments?.map(comment => {
        const updatedReplies = comment.replies?.map(reply => ({
          ...reply,
          user: replyUserMap[String(reply.user)] || null,
        })) || [];
        return { ...comment, replies: updatedReplies };
      }) || [];

      // Normalize likes for comparison - now likes are objects with { user, reactionType }
      const likesArray = post.likes || [];
      const likeUserIds = likesArray.map(like => {
        // Handle both old format (plain ObjectId) and new format ({ user, reactionType })
        if (like.user) return String(like.user);
        return String(like);
      });

      // Find current user's reaction
      const userReaction = userId
        ? likesArray.find(like => {
          const likeUserId = like.user ? String(like.user) : String(like);
          return likeUserId === String(userId);
        })
        : null;

      // Build reaction summary (count per type)
      const reactionSummary = {};
      likesArray.forEach(like => {
        const type = like.reactionType || "like";
        reactionSummary[type] = (reactionSummary[type] || 0) + 1;
      });

      return {
        ...post,
        comments: updatedComments,
        likeCount: likesArray.length,
        commentCount: updatedComments.length,
        isLiked: userId ? likeUserIds.includes(String(userId)) : false,
        userReaction: userReaction?.reactionType || null,
        reactionSummary,
        isSaved: savedPostIds.has(String(post._id)),
      };
    });

    return NextResponse.json({ posts: processedPosts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { caption, images, userId, type } = body;

    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to create post for this user" },
        { status: 403 }
      );
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    const newPost = await Post.create({
      user: userId,
      caption: caption || "",
      image: images,
      type: type || 'feed',
      isServiceRequest: type === 'job', // Set based on type
    });

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
