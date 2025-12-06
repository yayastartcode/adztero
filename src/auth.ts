import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { adminConfig } from "@/config/admin";

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const username = credentials.username as string;
                const password = credentials.password as string;

                console.log("🔐 Login attempt:", {
                    username,
                    adminUsername: adminConfig.username,
                    hasHash: !!adminConfig.passwordHash,
                    hashPrefix: adminConfig.passwordHash?.substring(0, 10),
                    hashLength: adminConfig.passwordHash?.length
                });

                if (!adminConfig.passwordHash) {
                    console.error("❌ Password hash not configured");
                    return null;
                }

                // Check username
                if (username !== adminConfig.username) {
                    console.log("❌ Username mismatch");
                    return null;
                }

                // Verify password
                const isValid = await bcrypt.compare(password, adminConfig.passwordHash);

                console.log("🔑 Password validation:", { isValid });

                if (!isValid) {
                    console.log("❌ Invalid password");
                    return null;
                }

                console.log("✅ Login successful");
                return {
                    id: "admin",
                    name: adminConfig.username,
                    email: `${adminConfig.username}@localhost`,
                };
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/");
            const isOnLogin = nextUrl.pathname.startsWith("/login");

            if (isOnDashboard && !isOnLogin) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && isOnLogin) {
                return Response.redirect(new URL("/", nextUrl));
            }
            return true;
        },
    },
});
