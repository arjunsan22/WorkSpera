// app/api/upload/resume/route.js
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

// Force Node.js runtime (not Edge) — required for Buffer
export const runtime = "nodejs";

// Allow up to 60 seconds for upload
export const maxDuration = 60;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  try {
    // Check Cloudinary env vars
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("❌ Missing Cloudinary env vars on server!");
      return NextResponse.json(
        { error: "Server misconfigured", message: "Cloudinary credentials missing" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const resume = formData.get("resume");

    if (!resume) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(resume.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, DOC, and DOCX files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (resume.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Convert to buffer then base64
    const bytes = await resume.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = `data:${resume.type};base64,${buffer.toString("base64")}`;

    // Extract file extension from original filename
    const fileExtension = resume.name.split('.').pop()?.toLowerCase() || 'pdf';

    // Upload to Cloudinary with resource_type: "raw" for documents
    // Include extension in public_id so the URL ends with .pdf/.doc/.docx
    const result = await cloudinary.uploader.upload(base64Data, {
      resource_type: "raw",
      folder: "resumes",
      public_id: `resume_${Date.now()}.${fileExtension}`,
    });

    return NextResponse.json({
      url: result.secure_url,
      originalName: resume.name,
    });
  } catch (error) {
    console.error("Resume upload error:", error?.message || error);
    return NextResponse.json(
      { error: "Resume upload failed", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
