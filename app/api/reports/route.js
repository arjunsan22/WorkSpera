import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/connectDB";
import ReportModel from "@/models/Report";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetType, targetId, reason, details } = await req.json();

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const newReport = new ReportModel({
      reporterId: session.user.id,
      targetType,
      targetId,
      reason,
      details,
    });

    await newReport.save();

    return NextResponse.json(
      { message: "Report submitted successfully", report: newReport },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
