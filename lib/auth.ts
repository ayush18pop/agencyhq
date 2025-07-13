    import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
  }
  
  interface User {
    role?: string
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role?: string
  }
}

export const authOptions: AuthOptions = {
  providers: [  
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "ayush@agencyhq" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("Attempting to authenticate user with credentials:", credentials)
        if(!credentials?.username || !credentials?.password) {
          throw new Error("Username and password are required");
        }
        
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.username },
              { email: credentials.username }
            ]
          },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            password: true
          }
        })
        
        if (!user) {
          return null
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password)
       
        if (!isValidPassword) {
          return null
        }
        console.log("User authenticated successfully:", user)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 24 * 60 * 60, // JWT expires every 24 hours
  },
  pages:{
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  }
}
