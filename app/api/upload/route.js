// app/api/upload/route.js
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

// Force Node.js runtime (not Edge) — required for Buffer and streams
export const runtime = "nodejs";

// Allow up to 60 seconds for upload (Vercel free tier max is 60s)
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

    // Convert blob to buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "uploads",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload_stream error:", JSON.stringify(error));
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
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

