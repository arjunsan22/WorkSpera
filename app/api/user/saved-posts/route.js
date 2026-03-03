import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import Post from "@/models/Post";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Get user's saved post IDs
        const user = await User.findById(userId).select("savedPosts").lean();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.savedPosts || user.savedPosts.length === 0) {
            return NextResponse.json({ posts: [] }, { status: 200 });
        }

        // Fetch the saved posts with user info populated
        const posts = await Post.find({ _id: { $in: user.savedPosts } })
            .populate("user", "name username profileImage")
            .populate("comments.user", "name username profileImage")
            .sort({ createdAt: -1 })
            .lean();

        // Process posts similar to the main feeds API
        const processedPosts = posts.map((post) => {
            const likeIds = (post.likes || []).map((id) => String(id));
            return {
                ...post,
                likeCount: likeIds.length,
                commentCount: (post.comments || []).length,
                isLiked: likeIds.includes(String(userId)),
                isSaved: true,
            };
        });

        return NextResponse.json({ posts: processedPosts }, { status: 200 });
    } catch (error) {
        console.error("Error fetching saved posts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
