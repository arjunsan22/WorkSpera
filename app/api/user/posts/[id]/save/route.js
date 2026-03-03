import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import Post from "@/models/Post";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: postId } = await params;
        const userId = session.user.id;

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const savedIndex = user.savedPosts.findIndex(
            (id) => id.toString() === postId
        );

        let isSaved;
        if (savedIndex > -1) {
            // Already saved — unsave it
            user.savedPosts.splice(savedIndex, 1);
            isSaved = false;
        } else {
            // Not saved — save it
            user.savedPosts.push(postId);
            isSaved = true;
        }

        await user.save();

        return NextResponse.json(
            { isSaved, message: isSaved ? "Post saved" : "Post unsaved" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error saving post:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
