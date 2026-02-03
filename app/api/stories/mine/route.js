import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Story from "@/models/Story";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentTime = new Date();

        const stories = await Story.find({
            user: session.user.id,
            expiresAt: { $gt: currentTime },
        }).sort({ createdAt: -1 });

        return NextResponse.json({ stories }, { status: 200 });
    } catch (error) {
        console.error("Error fetching my stories:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
