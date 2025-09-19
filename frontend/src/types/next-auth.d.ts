import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id: string
      email: string
      name: string
      image?: string
      isWriter: boolean
      coinBalance: number
      themePreference: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    accessToken?: string
    isWriter: boolean
    coinBalance: number
    themePreference: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    isWriter?: boolean
    coinBalance?: number
    themePreference?: string
  }
}