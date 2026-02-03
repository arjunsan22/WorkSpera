import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Story from "@/models/Story";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(req, { params }) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const story = await Story.findById(id);

        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        if (story.user.toString() !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await Story.findByIdAndDelete(id);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error deleting story:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
