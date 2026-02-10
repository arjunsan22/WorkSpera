import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/connectDB";
import Story from "@/models/Story";

export async function POST(request, { params }) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId } = await request.json();
        const resolvedParams = await params;
        const { id: storyId } = resolvedParams;

        const story = await Story.findById(storyId);

        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        const alreadyLiked = story.likes.some(
            (id) => id.toString() === userId
        );

        if (alreadyLiked) {
            story.likes = story.likes.filter(
                (id) => id.toString() !== userId
            );
        } else {
            story.likes.push(userId);
        }

        await story.save();

        return NextResponse.json(
            {
                success: true,
                isLiked: !alreadyLiked,
                likeCount: story.likes.length,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error handling story like:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}


