// /app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const API_BASE_URL = "https://dse-backend-uv5d.onrender.com";

// Enable debug logging in development
const debug = process.env.NODE_ENV === "development";
console.log("env node", process.env.GOOGLE_CLIENT_SECRET);
const handler = NextAuth({
  debug: debug, // Enable debug logging in development
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      httpOptions: {
        timeout: 10000,
      },
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      console.log("google token", account?.id_token, account?.access_token);
      // Initial sign in
      if (account && user) {
        try {
          // Send the Google token to your backend
          const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: account.id_token, // or access_token depending on your backend
            }),
          });

          const data = await response.json();

          if (response.ok) {
            // Store the backend token
            // token.backendToken = data.access_token;
            // token.user = data.user;
            console.log("Backend authentication successful:", data);
          } else {
            console.error("Backend authentication failed:", data);
            throw new Error(data.message || "Authentication failed");
          }
        } catch (error) {
          console.error("Error during authentication:", error);
          throw error;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.backendToken;
      session.user = token.user;
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  events: {
    async signIn(message) {
      console.log("Sign in successful", message);
    },
    async signOut() {
      console.log("User signed out");
    },
    async error(error) {
      console.error("Authentication error:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: (error as any).code,
        provider: (error as any).provider?.id,
      });
    },
  },
  logger: {
    error(code, metadata) {
      console.error("NextAuth error:", { code, metadata });
    },
    warn(code) {
      console.warn("NextAuth warning:", code);
    },
    debug(code, metadata) {
      if (debug) {
        console.debug("NextAuth debug:", { code, metadata });
      }
    },
  },
});

export { handler as GET, handler as POST };
