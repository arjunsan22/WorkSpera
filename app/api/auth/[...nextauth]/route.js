// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import User from "../../../../models/User";
import connectDB from "../../../../lib/connectDB";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

if (!process.env.NEXTAUTH_SECRET) {
  console.error("❌ NEXTAUTH_SECRET is missing!");
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          await connectDB();

          if (!credentials?.email || !credentials?.password) {
            throw new Error("Missing email or password");
          }

          const user = await User.findOne({ email: credentials.email.toLowerCase() });

          if (!user) {
            throw new Error("No user found with that email");
          }

          if (!user.isVerified) {
            throw new Error("Your account is not verified yet");
          }

          if (user.isBlocked) {
            throw new Error("Your account has been blocked by an administrator. Please contact support.");
          }

          if (!user.password) {
            throw new Error("Please log in with Google");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Incorrect password");
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            username: user.username,
            image: user.profileImage,
            role: user.role || "user",
          };
        } catch (error) {
          console.error("Auth authorize error:", error.message);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "temp",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "temp",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create a new user for Google login if they don't exist
            const newUsername = user.email.split("@")[0] + Math.floor(Math.random() * 1000);
            const newUser = new User({
              name: user.name,
              email: user.email,
              username: newUsername,
              profileImage: user.image,
              isVerified: true,
              role: "user",
            });
            await newUser.save();
            user.id = newUser._id.toString();
            user.role = newUser.role;
            user.username = newUser.username;
            user.image = newUser.profileImage;
          } else {
            // Block check for existing users signing in via Google
            if (existingUser.isBlocked) {
              return false;
            }

            // Update profile image from Google if user still has default
            if (
              user.image &&
              (!existingUser.profileImage ||
                existingUser.profileImage === "/public/profile-default-image.png")
            ) {
              existingUser.profileImage = user.image;
              await existingUser.save();
            }

            // Attach existing user info to the session user object
            user.id = existingUser._id.toString();
            user.role = existingUser.role;
            user.username = existingUser.username;
            user.image = existingUser.profileImage;
          }
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.image = user.image;
        token.role = user.role;
      }

      // 🔄 If the role was changed in the database, we need to fetch it to keep the session updated
      if (!token.role || token.role === "user") {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id).select("role username profileImage");
          if (dbUser) {
            token.role = dbUser.role;
            token.username = dbUser.username;
            token.image = dbUser.profileImage;
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.image = token.image;
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
