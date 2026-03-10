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

        // Clean the filename (remove extension and replace spaces) to avoid issues with Cloudinary public_id
        const sanitizedFilename = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "raw",
                    folder: "resumes",
                    // Adding the extension here forces Cloudinary to recognize the raw document as a PDF in its URL
                    public_id: `${sanitizedFilename}.pdf`,
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
