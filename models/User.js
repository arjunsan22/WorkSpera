import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    bio: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "/public/profile-default-image.png",
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ✅ Additional fields (WhatsApp-style)
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Resume fields
    resume: {
      type: String, // Cloudinary URL
      default: "",
    },
    resumeName: {
      type: String, // Original filename
      default: "",
    },
    // OTP verification fields
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Professional Profile Fields
    skills: {
      type: [String],
      default: [],
    },


    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startDate: Date,
        endDate: Date,
        currentlyStudying: Boolean,
        description: String,
      },
    ],

    links: [
      {
        label: String,
        url: String,
      },
    ],


    profile: {
      type: String,
      default: "",
    },

  },

  {
    timestamps: true, // ✅ Automatically adds createdAt & updatedAt
  }
);

const UserModel = mongoose.models?.User || mongoose.model("User", UserSchema);
export default UserModel;
