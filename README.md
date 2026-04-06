# 🚀 WorkSpera

<p align="center">
  A modern professional networking platform combining  
  <b>LinkedIn-style career growth</b> with <b>Instagram-like social interaction</b>.
</p>

---

## 🌐 Live Demo
🔗 http://workspera.vercel.app

---

## 🧠 Overview

**WorkSpera** is a full-stack MERN-based platform designed to connect professionals, enable collaboration, and enhance career opportunities through real-time communication and AI-powered features.

---

## ✨ Features

### 🔐 Authentication & Security
- OTP-based email verification (Nodemailer + Gmail SMTP)
- Secure authentication using NextAuth (JWT + Google OAuth)
- Protected routes with middleware
- Blocked user restriction system

---

### 👤 Profile & Portfolio
- Profile image & cover photo (Cloudinary)
- Bio, skills, and professional summary
- Educational timeline
- Resume upload (PDF/DOC)
- 🤖 AI Resume Parsing (Google Gemini)
- Social links integration

---

### 📰 Posts & Feed
- Create, edit, and delete posts
- Multi-image upload support
- Save/bookmark posts
- Visibility control (Public / Private / Followers)
- Hashtags for discoverability

---

### 📊 Poll System
- Create polls within posts
- Real-time vote updates
- One vote per user

---

### ❤️ Interactions
- Multiple reactions (Like, Love, Celebrate, etc.)
- Animated reaction picker
- Nested comments & replies
- Instagram-style "View replies"

---

### 🔔 Notifications
- Real-time notifications (polling)
- Types: follow, like, comment, message, job alerts

---

### 💬 Messaging & Video Calls
- Real-time chat using Socket.IO
- Typing indicators & read receipts
- Image sharing in chat
- 📞 WebRTC video calling (STUN + TURN servers)

---

### 🤖 AI Integration
- AI Chatbot (Google Gemini)
- AI Job Search (semantic search)
- AI Resume Parsing

---

### 📸 Stories
- 24-hour story system
- Story likes & viewer tracking

---

### 🛡️ Admin Dashboard
- User management (block/unblock)
- Role control (admin/user)
- Report moderation system
- Platform analytics

---

## ⚙️ Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | MongoDB, Mongoose |
| Auth | NextAuth (JWT + OAuth) |
| Real-time | Socket.IO |
| Video | WebRTC |
| AI | Google Gemini |
| Storage | Cloudinary |
| Email | Nodemailer |

---

## 🚀 Deployment

- Frontend & API: **Vercel**
- Socket Server: **Render / Railway**
- Media Storage: **Cloudinary**

---

## 📁 Project Structure (Optional but powerful)

```bash
/client       → Frontend (Next.js)
/server       → API & backend logic
/socket       → Socket.IO server
/models       → Mongoose models
/components   → UI components
