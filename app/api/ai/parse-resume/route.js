// app/api/ai/parse-resume/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PARSE_PROMPT = `You are a professional resume parser. Analyze the following resume content and extract structured information.

Return ONLY valid JSON (no markdown, no code fences, no explanation) with this exact structure:
{
  "skills": ["skill1", "skill2", ...],
  "bio": "A professional summary in 2-3 sentences based on the resume content",
  "profile": "A detailed professional summary/about section based on the resume",
  "education": [
    {
      "institution": "University/School name",
      "degree": "Degree name",
      "fieldOfStudy": "Field of study",
      "startDate": "YYYY-MM-DD or empty string if not found",
      "endDate": "YYYY-MM-DD or empty string if not found",
      "currentlyStudying": false,
      "description": "Any additional details"
    }
  ],
  "links": [
    {
      "label": "LinkedIn/GitHub/Portfolio/Website",
      "url": "https://..."
    }
  ]
}

Rules:
- Extract ALL skills mentioned (technical and soft skills)
- For education dates, use the format YYYY-MM-DD. If only year is given, use YYYY-01-01
- If currently studying, set currentlyStudying to true and endDate to empty string
- Extract any URLs found (LinkedIn, GitHub, Portfolio, personal websites)
- Bio should be concise (2-3 sentences), profile can be more detailed
- If a field cannot be determined, use empty string or empty array
- Return ONLY the JSON object, nothing else`;

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const { resumeUrl, fileData, mimeType: clientMimeType } = await request.json();

    if (!resumeUrl && !fileData) {
      return NextResponse.json(
        { error: "Resume URL or file data is required" },
        { status: 400 }
      );
    }

    let base64Resume;
    let mimeType;

    if (fileData) {
      // Client sent the file as base64 directly — no server-side fetch needed
      // Strip the data URI prefix if present (e.g. "data:application/pdf;base64,")
      base64Resume = fileData.includes(",") ? fileData.split(",")[1] : fileData;
      mimeType = clientMimeType || "application/pdf";
    } else {
      // Fallback: fetch from URL (may fail for Cloudinary raw assets due to CORS)
      const resumeResponse = await fetch(resumeUrl);
      if (!resumeResponse.ok) {
        return NextResponse.json(
          { error: "Failed to fetch resume file" },
          { status: 400 }
        );
      }
      const resumeBuffer = await resumeResponse.arrayBuffer();
      base64Resume = Buffer.from(resumeBuffer).toString("base64");
      const isPdf = resumeUrl.toLowerCase().includes(".pdf");
      mimeType = isPdf ? "application/pdf" : "application/pdf";
    }

    // Use Gemini with file upload
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Resume,
        },
      },
      { text: PARSE_PROMPT },
    ]);

    const response = await result.response;
    let text = response.text();

    // Clean up response - remove any markdown code fences if present
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: "AI returned invalid format. Please try again." },
        { status: 500 }
      );
    }

    // Validate and sanitize the parsed data
    const sanitizedData = {
      skills: Array.isArray(parsedData.skills)
        ? parsedData.skills.filter((s) => typeof s === "string" && s.trim())
        : [],
      bio: typeof parsedData.bio === "string" ? parsedData.bio : "",
      profile: typeof parsedData.profile === "string" ? parsedData.profile : "",
      education: Array.isArray(parsedData.education)
        ? parsedData.education.map((edu) => ({
            institution: edu.institution || "",
            degree: edu.degree || "",
            fieldOfStudy: edu.fieldOfStudy || "",
            startDate: edu.startDate || "",
            endDate: edu.endDate || "",
            currentlyStudying: edu.currentlyStudying || false,
            description: edu.description || "",
          }))
        : [],
      links: Array.isArray(parsedData.links)
        ? parsedData.links.filter((l) => l.label && l.url)
        : [],
    };

    return NextResponse.json({ data: sanitizedData });
  } catch (error) {
    console.error("Resume parse error:", error);

    const errorMsg = error?.message || "";
    if (
      errorMsg.includes("429") ||
      errorMsg.includes("Too Many Requests") ||
      errorMsg.includes("quota")
    ) {
      return NextResponse.json(
        { error: "🚦 AI is busy right now. Please wait a moment and try again!" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to parse resume. Please try again." },
      { status: 500 }
    );
  }
}
