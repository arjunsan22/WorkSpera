// app/api/test-db/route.js
import connectDB from "../../../lib/connectDB";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await connectDB();
        const count = await User.countDocuments();
        return new Response(JSON.stringify({
            status: "success",
            message: "Connected to MongoDB",
            userCount: count
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            status: "error",
            message: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
