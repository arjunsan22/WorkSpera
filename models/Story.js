import mongoose from "mongoose";

const StorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            default: "",
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        createdAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            default: function () {
                return new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours from now
            },
        },
        viewers: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                viewedAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// TTL Index to automatically delete documents after expiresAt
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const StoryModel =
    mongoose.models?.Story || mongoose.model("Story", StorySchema);

export default StoryModel;
