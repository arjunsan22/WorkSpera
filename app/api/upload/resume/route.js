import cloudinary from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file"); // using 'file' as generic key, or 'resume'

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto", // auto detects pdf/docs as 'raw' or 'image' if it's an image. Safe to use 'auto' or 'raw' for resumes. 'auto' is better if they upload an image resume.
                    // actually for PDF 'raw' or 'image' (if keeping format) is tricky. 'auto' is usually best.
                    // But strict 'raw' is safer for true documents.
                    // Let's use 'auto' to be flexible, or 'raw' if we strictly want validation.
                    // Let's stick to 'auto' but maybe restrict client side.
                    folder: "resumes",
                    access_mode: 'public',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({
            url: result.secure_url,
            originalFilename: file.name,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        );
    }
}
