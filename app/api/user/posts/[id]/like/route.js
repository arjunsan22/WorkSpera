// app/api/user/posts/[id]/like/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Post from "@/models/Post";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();
    const resolvedParams = await params; // ✅ Await params
    const { id: postId } = resolvedParams; // ✅ Use the awaited params
    const post = await Post.findById(postId);
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const userLiked = post.likes.includes(userId);
    if (userLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error handling like:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
