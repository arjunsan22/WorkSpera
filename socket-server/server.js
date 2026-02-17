// socket-server/server.js
// Standalone Socket.IO server for deployment on Render/Railway
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
// Fallback: also load parent .env.local for local development
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

// ─── Inline Model Definitions ──────────────────────────────────
// These are duplicated here so the socket server is fully self-contained
// and can be deployed independently without needing the Next.js project files.

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        password: { type: String },
        bio: { type: String, default: "" },
        profileImage: { type: String, default: "/public/profile-default-image.png" },
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: null },
        blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        resume: { type: String, default: "" },
        resumeName: { type: String, default: "" },
        otp: { type: String, default: null },
        otpExpiry: { type: Date, default: null },
        isVerified: { type: Boolean, default: false },
        skills: { type: [String], default: [] },
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
        links: [{ label: String, url: String }],
        profile: { type: String, default: "" },
    },
    { timestamps: true }
);

const MessageSchema = new mongoose.Schema(
    {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const User = mongoose.models?.User || mongoose.model("User", UserSchema);
const Message = mongoose.models?.Message || mongoose.model("Message", MessageSchema);

// ─── Config ────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

// Allowed origins for CORS — add your Vercel deployment URL here
const ALLOWED_ORIGINS = [
    process.env.NEXT_PUBLIC_BASE_URL,
    "http://localhost:3000",
    "http://localhost:4000",
].filter(Boolean);

// Also allow any .vercel.app domain
function isOriginAllowed(origin) {
    if (!origin) return true;
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    if (origin.endsWith(".vercel.app")) return true;
    return false;
}

// ─── Start Server ──────────────────────────────────────────────
async function startServer() {
    try {
        // Connect to MongoDB
        console.log("🔄 Connecting to MongoDB...");
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI environment variable is not defined.");
        }
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB connected successfully");

        // Create HTTP + Socket.IO server
        const httpServer = createServer((req, res) => {
            // Set CORS headers for HTTP requests
            const origin = req.headers.origin;
            if (isOriginAllowed(origin)) {
                res.setHeader("Access-Control-Allow-Origin", origin || "*");
                res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                res.setHeader("Access-Control-Allow-Headers", "Content-Type");
                res.setHeader("Access-Control-Allow-Credentials", "true");
            }

            if (req.method === "OPTIONS") {
                res.writeHead(204);
                res.end();
                return;
            }

            // Health check endpoint
            if (req.url === "/" || req.url === "/health") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                    JSON.stringify({
                        status: "ok",
                        timestamp: new Date().toISOString(),
                        connections: io.engine?.clientsCount || 0,
                    })
                );
                return;
            }
            res.writeHead(404);
            res.end();
        });

        const io = new Server(httpServer, {
            cors: {
                origin: function (origin, callback) {
                    if (isOriginAllowed(origin)) {
                        callback(null, true);
                    } else {
                        console.warn(`⚠️ Blocked request from origin: ${origin}`);
                        callback(new Error("Not allowed by CORS"));
                    }
                },
                methods: ["GET", "POST"],
                credentials: true,
            },
            transports: ["websocket", "polling"],
        });

        // ─── Socket.IO Event Handlers ──────────────────────────────
        io.on("connection", (socket) => {
            console.log("🔌 New client connected:", socket.id);

            // ── Video Call Events ──────────────────────────────────────
            socket.on("call-user", (data) => {
                const { to, offer } = data;
                console.log(`📞 Call from ${socket.id} to user ${to}`);
                io.to(to).emit("incoming-call", { from: socket.id, offer });
            });

            socket.on("answer-call", (data) => {
                const { to, answer } = data;
                io.to(to).emit("call-accepted", { answer });
            });

            socket.on("ice-candidate", (data) => {
                const { to, candidate } = data;
                io.to(to).emit("ice-candidate", { candidate });
            });

            socket.on("hang-up", (data) => {
                const { to } = data;
                io.to(to).emit("call-ended");
            });

            // ── Room / Online Status ───────────────────────────────────
            socket.on("join-room", async (userId) => {
                if (userId) {
                    socket.join(userId);
                    console.log(`🏠 Client ${socket.id} joined room ${userId}`);

                    try {
                        await User.findByIdAndUpdate(
                            userId,
                            { isOnline: true, lastSeen: new Date() },
                            { new: true }
                        );
                        console.log(`🟢 User ${userId} is online`);
                    } catch (error) {
                        console.error(`❌ Error updating online status for ${userId}:`, error);
                    }
                }
            });

            // ── Messaging ─────────────────────────────────────────────
            socket.on("send-message", async (data) => {
                const { senderId, receiverId, content, timestamp } = data;
                console.log("💬 Received message:", { senderId, receiverId });

                try {
                    const newMessage = new Message({
                        senderId,
                        receiverId,
                        content,
                        timestamp: timestamp || new Date(),
                    });
                    await newMessage.save();
                    const savedMessage = newMessage.toObject();

                    if (receiverId) {
                        io.to(receiverId).emit("receive-message", savedMessage);
                        console.log(`📤 Message sent to ${receiverId}`);
                    }

                    if (senderId) {
                        io.to(senderId).emit("message-sent", {
                            status: "delivered",
                            messageId: savedMessage._id,
                        });
                    }
                } catch (error) {
                    console.error("❌ Error processing message:", error);
                    socket.emit("message-error", { error: "Failed to process message" });
                }
            });

            // ── Disconnect ────────────────────────────────────────────
            socket.on("disconnect", async (reason) => {
                console.log("🔌 Client disconnected:", socket.id, "Reason:", reason);

                const userId = Array.from(socket.rooms)[1];

                if (userId && mongoose.Types.ObjectId.isValid(userId)) {
                    try {
                        await User.findByIdAndUpdate(
                            userId,
                            { isOnline: false, lastSeen: new Date() },
                            { new: true }
                        );
                        console.log(`🔴 User ${userId} is offline`);
                    } catch (error) {
                        console.error(`❌ Error updating offline status for ${userId}:`, error);
                    }
                }
            });

            socket.on("connect_error", (err) => {
                console.error("❌ Socket connect error:", socket.id, err);
            });
        });

        // ─── Listen ────────────────────────────────────────────────
        httpServer.listen(PORT, "0.0.0.0", () => {
            console.log(`\n🚀 Socket.IO server running on port ${PORT}`);
            console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
            console.log(`   Health check: http://localhost:${PORT}/health\n`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

startServer();
