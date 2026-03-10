// app/api/admin/users/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import connectDB from "@/lib/connectDB";
import { NextResponse } from "next/server";

// GET - Fetch all users for admin dashboard
export async function GET(request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const users = await User.find({})
            .select("name email username profileImage role isBlocked isVerified isOnline lastSeen createdAt followers following")
            .sort({ createdAt: -1 })
            .lean();

        // Add counts
        const usersWithStats = users.map(user => ({
            ...user,
            _id: user._id.toString(),
            followersCount: user.followers?.length || 0,
            followingCount: user.following?.length || 0,
        }));

        return NextResponse.json({ users: usersWithStats }, { status: 200 });
    } catch (error) {
        console.error("Error fetching admin users:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT - Block/Unblock a user
export async function PUT(request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { userId, action } = await request.json();

        if (!userId || !action) {
            return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
        }

        // Prevent admin from blocking themselves
        if (userId === session.user.id) {
            return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (action === "block") {
            user.isBlocked = true;
        } else if (action === "unblock") {
            user.isBlocked = false;
        } else if (action === "make-admin") {
            user.role = "admin";
        } else if (action === "remove-admin") {
            user.role = "user";
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        await user.save();

        return NextResponse.json({
            success: true,
            message: `User ${action}ed successfully`,
            user: {
                _id: user._id.toString(),
                isBlocked: user.isBlocked,
                role: user.role,
            },
        }, { status: 200 });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
