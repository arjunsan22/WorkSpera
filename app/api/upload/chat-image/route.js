// app/api/upload/chat-image/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import cloudinary from "@/lib/cloudinary";

// Force Node.js runtime (not Edge) — required for Buffer
export const runtime = "nodejs";

// Allow up to 60 seconds for upload
export const maxDuration = 60;

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (image.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Convert blob to buffer, then to base64 data URI
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = `data:${image.type || "image/png"};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Data, {
      resource_type: "image",
      folder: "chat-images",
      transformation: [
        { quality: "auto", fetch_format: "auto" },
        { width: 1200, crop: "limit" },
      ],
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Chat image upload error:", error?.message || error);
    return NextResponse.json(
      { error: "Upload failed", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
