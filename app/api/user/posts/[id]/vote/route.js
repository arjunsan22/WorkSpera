import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Post from "@/models/Post";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    const { optionId } = await request.json();
    const userId = session.user.id;

    if (!optionId) {
      return NextResponse.json({ error: "Option ID is required" }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.poll || !post.poll.options) {
      return NextResponse.json({ error: "Post does not contain a poll" }, { status: 400 });
    }

    // Check if user has already voted
    let userHasVoted = false;
    post.poll.options.forEach((opt) => {
      if (opt.votes && opt.votes.some((v) => String(v) === String(userId))) {
        userHasVoted = true;
      }
    });

    if (userHasVoted) {
      return NextResponse.json({ error: "You have already voted on this poll" }, { status: 400 });
    }

    // Add user's vote
    const option = post.poll.options.id(optionId);
    if (!option) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    if (!option.votes) option.votes = [];
    option.votes.push(userId);
    await post.save();

    // Recalculate poll summary
    let totalVotes = 0;
    const optionsSummary = post.poll.options.map((opt) => {
      const voteCount = opt.votes ? opt.votes.length : 0;
      totalVotes += voteCount;
      return {
        _id: String(opt._id),
        text: opt.text,
        voteCount: voteCount,
      };
    });

    optionsSummary.forEach((opt) => {
      opt.percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
    });

    const pollSummary = {
      question: post.poll.question,
      endDate: post.poll.endDate,
      options: optionsSummary,
      totalVotes,
      userVotedOptionId: optionId,
    };

    return NextResponse.json({ poll: pollSummary }, { status: 200 });
  } catch (error) {
    console.error("Error voting on poll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
