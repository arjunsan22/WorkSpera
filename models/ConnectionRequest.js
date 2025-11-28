// models/ConnectionRequest.js
import mongoose from "mongoose";

const ConnectionRequestSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  requester: {
    // The user who clicked “Connect”
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  postOwner: {
    // The user who created the post
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate requests from same user on same post
ConnectionRequestSchema.index({ post: 1, requester: 1 }, { unique: true });

const ConnectionRequest =
  mongoose.models.ConnectionRequest ||
  mongoose.model("ConnectionRequest", ConnectionRequestSchema);

export default ConnectionRequest;