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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.image = token.image;
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
