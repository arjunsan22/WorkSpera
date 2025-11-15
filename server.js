// server.js (in your project root)
require("dotenv").config({ path: "./.env.local" });

const { createServer } = require("http");
const { Server } = require("socket.io");
const { parse } = require("url");
const next = require("next");
const mongoose = require("mongoose");

// --- CORRECTED IMPORTS ---
// Use dynamic import or require with .js extension and ensure default export is handled
let User, Message;

async function loadModels() {
  try {
    // Using dynamic import for ES modules or CommonJS with default export
    const UserModelModule = await import("./models/User.js"); // Ensure .js extension
    User = UserModelModule.default || UserModelModule; // Handle both ES module and CommonJS styles

    const MessageModelModule = await import("./models/Message.js"); // Ensure .js extension
    Message = MessageModelModule.default || MessageModelModule; // Handle both ES module and CommonJS styles

    console.log("Models loaded successfully in server.js");
  } catch (error) {
    console.error("Error loading models in server.js:", error);
    process.exit(1);
  }
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function startServer() {
  try {
    await loadModels(); // Load models before connecting to DB and preparing app

    console.log("Connecting to MongoDB...");
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined.");
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");

    await app.prepare();

    const httpServer = createServer(async (req, res) => {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
      path: "/api/socket",
      cors: {
        origin:
          process.env.NEXT_PUBLIC_BASE_URL || `http://${hostname}:${port}`,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    io.on("connection", (socket) => {
      console.log("Socket.IO: New client connected with ID:", socket.id);

      socket.on("join-room", async (userId) => {
        if (userId) {
          socket.join(userId);
          console.log(`Socket.IO: Client ${socket.id} joined room ${userId}`);

          try {
            // Update user's online status - NOW USING THE CORRECT MODEL
            await User.findByIdAndUpdate(
              userId,
              { isOnline: true, lastSeen: new Date() },
              { new: true } // Return the updated document
            );
            console.log(`Socket.IO: Updated user ${userId} to online.`);
          } catch (error) {
            console.error(
              `Socket.IO: Error updating user ${userId} online status:`,
              error
            );
          }
        } else {
          console.log("Socket.IO: join-room called without userId");
        }
      });

      socket.on("send-message", async (data) => {
        const { senderId, receiverId, content, timestamp } = data;
        console.log("Socket.IO: Received send-message:", data);

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
            console.log(
              `Socket.IO: Sent message to receiver room ${receiverId}`
            );
          } else {
            console.log("Socket.IO: send-message called without receiverId");
          }

          if (senderId) {
            io.to(senderId).emit("message-sent", {
              status: "delivered",
              messageId: savedMessage._id,
            });
          }
        } catch (error) {
          console.error("Socket.IO: Error processing send-message:", error);
          socket.emit("message-error", { error: "Failed to process message" });
        }
      });

      socket.on("disconnect", async (reason) => {
        console.log(
          "Socket.IO: Client disconnected:",
          socket.id,
          "Reason:",
          reason
        );

        const userId = Array.from(socket.rooms)[1];

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
          try {
            // Update user's offline status - NOW USING THE CORRECT MODEL
            await User.findByIdAndUpdate(
              userId,
              { isOnline: false, lastSeen: new Date() },
              { new: true } // Return the updated document
            );
            console.log(`Socket.IO: Updated user ${userId} to offline.`);
          } catch (error) {
            console.error(
              `Socket.IO: Error updating user ${userId} offline status:`,
              error
            );
          }
        } else {
          console.log(
            "Socket.IO: Could not determine user ID for disconnecting socket."
          );
        }
      });

      socket.on("connect_error", (err) => {
        console.error("Socket.IO: Connect Error for client:", socket.id, err);
      });
    });

    httpServer.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
