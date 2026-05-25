import { betterAuth } from 'better-auth'
import Database from 'bun:sqlite'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: new Database('./sqlite.db'),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
})
