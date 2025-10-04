import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        console.log("API URL:", apiUrl)
        console.log("Attempting login for:", credentials.email)

        try {
          const loginUrl = `${apiUrl}/api/v1/auth/login`
          console.log("Login URL:", loginUrl)
          
          const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          console.log("Login response status:", response.status)

          if (!response.ok) {
            const errorText = await response.text()
            console.error("Login failed:", response.status, errorText)
            return null
          }

          const data = await response.json()
          console.log("Login successful, got token")
          
          // Get user info with the token
          const userResponse = await fetch(`${apiUrl}/api/v1/auth/me`, {
            headers: {
              "Authorization": `Bearer ${data.access_token}`,
            },
          })

          console.log("User info response status:", userResponse.status)

          if (!userResponse.ok) {
            const errorText = await userResponse.text()
            console.error("Failed to get user info:", userResponse.status, errorText)
            return null
          }

          const user = await userResponse.json()
          console.log("Got user info:", user.email, user.username)

          return {
            id: user.id,
            email: user.email,
            name: user.username,
            image: user.profile_picture_url,
            accessToken: data.access_token,
            isWriter: user.is_writer,
            coinBalance: user.coin_balance,
            themePreference: user.theme_preference,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.isWriter = user.isWriter
        token.coinBalance = user.coinBalance
        token.themePreference = user.themePreference
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.id = token.sub as string  // This was missing!
      session.user.isWriter = token.isWriter as boolean
      session.user.coinBalance = token.coinBalance as number
      session.user.themePreference = token.themePreference as string
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
}