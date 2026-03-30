import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/connectDB";
import ReportModel from "@/models/Report";
import UserModel from "@/models/User";
import PostModel from "@/models/Post";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Populate reporter details
    const reports = await ReportModel.find()
      .populate("reporterId", "name username email profileImage")
      .sort({ createdAt: -1 })
      .lean();

    // Since targetId is generic (could be user, post, comment), we need to manually fetch target details or keep them as references
    for (const report of reports) {
      if (report.targetType === "Profile") {
        const user = await UserModel.findById(report.targetId).select(
          "name username profileImage email"
        );
        report.targetDetails = user || { name: "User Not Found" };
      } else if (report.targetType === "Post") {
        const post = await PostModel.findById(report.targetId)
          .populate("user", "name username profileImage")
          .select("caption image user");
        report.targetDetails = post || { caption: "Post Not Found or Deleted" };
      } else if (report.targetType === "Comment") {
        // Comment is nested inside Post
        const post = await PostModel.findOne({ "comments._id": report.targetId })
          .populate("user", "name username profileImage")
          .select("caption image user comments");

        let commentText = "Comment Not Found or Deleted";
        let commentUser = null;
        if (post) {
          const comment = post.comments.find(c => c._id.toString() === report.targetId.toString());
          if (comment) {
            commentText = comment.text;
            // If we also want the user of the comment, we'd need to populate that, but let's just stick to the text
            const cmntUser = await UserModel.findById(comment.user).select("name username profileImage");
            commentUser = cmntUser;
          }
        }
        report.targetDetails = { post, commentText, commentUser };
      }
    }

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
