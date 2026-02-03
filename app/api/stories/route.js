import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";

import Story from "@/models/Story";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { image, text } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "Image is required" }, { status: 400 });
        }

        const newStory = await Story.create({
            user: session.user.id,
            image,
            text,
        });

        return NextResponse.json({ success: true, story: newStory }, { status: 201 });
    } catch (error) {
        console.error("Error creating story:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current user's following list
        const currentUser = await User.findById(session.user.id);
        const followingIds = currentUser.following.map(id => id.toString());

        // Include self in the story feed? standard behavior is usually yes or separate "Your Story"
        // Let's include self + following
        const userIdsToFetch = [...followingIds, session.user.id];

        // Find valid stories (not expired). 
        // Note: Mongo TTL deletes them, but it runs every 60s. We can also filter query.
        const currentTime = new Date();

        const stories = await Story.find({
            user: { $in: userIdsToFetch },
            expiresAt: { $gt: currentTime },
        })
            .populate("user", "name username profileImage")
            .sort({ createdAt: -1 });

        // Group stories by user
        const groupedStories = stories.reduce((acc, story) => {
            const userId = story.user._id.toString();
            if (!acc[userId]) {
                acc[userId] = {
                    user: story.user,
                    stories: [],
                };
            }
            acc[userId].stories.push(story);
            return acc;
        }, {});

        // Convert to array
        const feed = Object.values(groupedStories);

        return NextResponse.json({ stories: feed }, { status: 200 });
    } catch (error) {
        console.error("Error fetching stories:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
