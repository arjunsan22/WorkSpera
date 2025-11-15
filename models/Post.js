import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const PostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Who created the post
    },

    caption: {
      type: String,
      default: "",
    },

    image: {
      type: [String], // e.g. "/uploads/post123.png"
      required: false,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [CommentSchema], // Embedded comment documents

    shares: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    tags: [
      {
        type: String, // "#coding", "#kerala"
      },
    ],

    visibility: {
      type: String,
      enum: ["public", "private", "followers"],
      default: "public",
    },
  },

  {
    timestamps: true, // createdAt, updatedAt
  }
);

const PostModel = mongoose.models?.Post || mongoose.model("Post", PostSchema);

export default PostModel;
