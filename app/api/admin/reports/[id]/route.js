import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/connectDB";
import ReportModel from "@/models/Report";
import PostModel from "@/models/Post";
import UserModel from "@/models/User";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reportId = params.id;
    const { action } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const report = await ReportModel.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (action === "dismiss") {
      report.status = "dismissed";
      await report.save();
      return NextResponse.json({ message: "Report dismissed", report });
    } else if (action === "resolve_delete_post" && report.targetType === "Post") {
      const post = await PostModel.findByIdAndDelete(report.targetId);
      report.status = "resolved";
      await report.save();
      return NextResponse.json({ message: "Post deleted and report resolved", report });
    } else if (action === "resolve_block_user" && report.targetType === "Profile") {
      const user = await UserModel.findById(report.targetId);
      if (user) {
        user.isBlocked = true;
        await user.save();
      }
      report.status = "resolved";
      await report.save();
      return NextResponse.json({ message: "User blocked and report resolved", report });
    } else if (action === "resolve_delete_comment" && report.targetType === "Comment") {
       const post = await PostModel.findOne({ "comments._id": report.targetId });
       if (post) {
         post.comments = post.comments.filter(c => c._id.toString() !== report.targetId.toString());
         await post.save();
       }
       report.status = "resolved";
       await report.save();
       return NextResponse.json({ message: "Comment deleted and report resolved", report });
    } 

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
