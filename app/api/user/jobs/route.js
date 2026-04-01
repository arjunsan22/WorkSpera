import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Post from "@/models/Post";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let postQuery = { visibility: "public", isServiceRequest: true };

    // AI Semantic Search Logic
    if (query) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
          Analyze this job search query: "${query}"
          Extract the core meaning, required skills, job roles, and synonyms.
          Return a JSON array of string keywords that would be highly relevant to search against a job / service request database.
          Make the array comprehensive enough to catch semantic variations (e.g. if query is "frontend fresher", include ["react", "javascript", "frontend", "fresher", "entry level", "junior", "ui", "web developer"]).
          Return ONLY valid JSON array and nothing else.
        `;

        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        const jsonMatch = textResponse.match(/\[.*\]/s);
        let keywords = [];
        if (jsonMatch) {
            keywords = JSON.parse(jsonMatch[0]);
        } else {
            keywords = JSON.parse(textResponse);
        }

        if (Array.isArray(keywords) && keywords.length > 0) {
            // Add a text search or a complex regex search
            const regexArr = keywords.map(kw => new RegExp(kw, 'i'));
            postQuery.$or = [
                { caption: { $in: regexArr } },
                { 'tags': { $in: regexArr } }
            ];
        }
      } catch (aiError) {
        console.error("AI Semantic search failed, falling back to basic search", aiError);
        const basicRegex = new RegExp(query, 'i');
        postQuery.$or = [
            { caption: basicRegex },
            { 'tags': basicRegex }
        ];
      }
    }

    // Fetch user's saved posts for isSaved flag
    let savedPostIds = new Set();
    if (userId) {
      const currentUser = await User.findById(userId).select("savedPosts").lean();
      if (currentUser?.savedPosts) {
        savedPostIds = new Set(currentUser.savedPosts.map(id => String(id)));
      }
    }

    // Fetch posts with top-level user and comment users populated
    let posts = await Post.find(postQuery)
      .populate("user", "name username profileImage")
      .populate("comments.user", "name username profileImage")
      .populate("likes.user", "name username profileImage")
      .sort({ createdAt: -1 })
      .lean({ defaults: true }); // ensures consistent object shape

    // Collect reply user IDs (as strings)
    const replyUserIds = new Set();
    posts.forEach(post => {
      post.comments?.forEach(comment => {
        comment.replies?.forEach(reply => {
          if (reply.user) {
            replyUserIds.add(String(reply.user));
          }
        });
      });
    });

    // Fetch reply users
    const replyUserMap = {};
    if (replyUserIds.size > 0) {
      const users = await User.find(
        { _id: { $in: Array.from(replyUserIds) } },
        "name username profileImage"
      ).lean();
      users.forEach(user => {
        replyUserMap[String(user._id)] = user;
      });
    }

    // Inject populated reply users
    const processedPosts = posts.map(post => {
      const updatedComments = post.comments?.map(comment => {
        const updatedReplies = comment.replies?.map(reply => ({
          ...reply,
          user: replyUserMap[String(reply.user)] || null,
        })) || [];
        return { ...comment, replies: updatedReplies };
      }) || [];

      // Normalize likes for comparison
      const likesArray = post.likes || [];
      const likeUserIds = likesArray.map(like => {
        if (like.user && typeof like.user === 'object' && like.user._id) return String(like.user._id);
        if (like.user) return String(like.user);
        return String(like);
      });

      // Find current user's reaction
      const userReaction = userId
        ? likesArray.find(like => {
          const likeUserId = (like.user && typeof like.user === 'object' && like.user._id) 
                              ? String(like.user._id) 
                              : (like.user ? String(like.user) : String(like));
          return likeUserId === String(userId);
        })
        : null;

      // Build reaction summary (count per type)
      const reactionSummary = {};
      likesArray.forEach(like => {
        const type = like.reactionType || "like";
        reactionSummary[type] = (reactionSummary[type] || 0) + 1;
      });

      // Build poll summary if post has a poll
      let pollSummary = null;
      if (post.poll && post.poll.options && post.poll.options.length > 0) {
        let totalVotes = 0;
        let userVotedOptionId = null;
        const optionsSummary = post.poll.options.map(option => {
          const voteCount = option.votes ? option.votes.length : 0;
          totalVotes += voteCount;
          
          if (userId && option.votes && option.votes.map(v => String(v)).includes(String(userId))) {
            userVotedOptionId = String(option._id);
          }
          
          return {
            _id: String(option._id),
            text: option.text,
            voteCount: voteCount
          };
        });
        
        optionsSummary.forEach(opt => {
          opt.percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
        });

        pollSummary = {
          question: post.poll.question,
          endDate: post.poll.endDate,
          options: optionsSummary,
          totalVotes,
          userVotedOptionId
        };
      }

      return {
        ...post,
        comments: updatedComments,
        likeCount: likesArray.length,
        commentCount: updatedComments.length,
        isLiked: userId ? likeUserIds.includes(String(userId)) : false,
        userReaction: userReaction?.reactionType || null,
        reactionSummary,
        isSaved: savedPostIds.has(String(post._id)),
        poll: pollSummary || undefined,
      };
    });

    return NextResponse.json({ posts: processedPosts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
