// app/api/user/posts/[id]/reply/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Post from "@/models/Post";

export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId, text, parentCommentId } = await request.json();
        const { id: postId } = await params; // ✅ no need for `await params`

        if (!userId || !text || !parentCommentId) {
            return Response.json(
                { error: "userId, text, and parentCommentId are required" },
                { status: 400 }
            );
        }

        const post = await Post.findById(postId);
        if (!post) {
            return Response.json({ error: "Post not found" }, { status: 404 });
        }

        const comment = post.comments.id(parentCommentId);
        if (!comment) {
            return Response.json({ error: "Comment not found" }, { status: 404 });
        }

        // ✅ Ensure replies array exists
        if (!Array.isArray(comment.replies)) {
            comment.replies = [];
        }

        const newReply = {
            user: userId,
            text,
            createdAt: new Date(),
        };

        comment.replies.push(newReply);
        await post.save();

        // Re-fetch with population
        const updatedPost = await Post.findById(postId)
            .populate("user", "name username profileImage")
            .populate("comments.user", "name username profileImage")
            .populate({
                path: "comments.replies",
                populate: { path: "user", select: "name username profileImage" }
            })
            .lean();




        const currentUserId = session?.user?.id;
        const likeIds = (updatedPost.likes || []).map((id) => id.toString());

        const processedPost = {
            ...updatedPost,
            likeCount: likeIds.length,
            commentCount: updatedPost.comments.length,
            isLiked: currentUserId ? likeIds.includes(currentUserId) : false,
        };

        return Response.json({ success: true, post: processedPost }, { status: 200 });
    } catch (error) {
        console.error("Error adding reply:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}