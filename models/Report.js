import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["Post", "Comment", "Profile"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // We don't use strict ref here because it could be a User or Post model 
      // depending on targetType. For Comments, they might be nested in Posts, 
      // but their _id is unique.
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },
    details: {
      type: String,
      default: "", // Extra details like post text or comment text if needed for quick viewing
    }
  },
  {
    timestamps: true,
  }
);

const ReportModel = mongoose.models?.Report || mongoose.model("Report", ReportSchema);
export default ReportModel;
