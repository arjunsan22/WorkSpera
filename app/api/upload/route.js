// app/api/upload/route.js
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

// Force Node.js runtime (not Edge) — required for Buffer
export const runtime = "nodejs";

// Allow up to 60 seconds for upload (Vercel free tier max)
export const maxDuration = 60;

export async function POST(request) {
  try {
    // Check Cloudinary env vars exist on the server
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
    const image = formData.get("image");

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert blob to buffer, then to base64 data URI
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = `data:${image.type || "image/png"};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary using base64 (reliable on Vercel serverless — no streaming)
    const result = await cloudinary.uploader.upload(base64Data, {
      resource_type: "auto",
      folder: "uploads",
    });

    // Return the Cloudinary URL
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Upload route error:", error?.message || error);
    return NextResponse.json(
      { error: "Upload failed", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
