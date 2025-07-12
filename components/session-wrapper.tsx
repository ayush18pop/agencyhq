"use client"

import { SessionProvider } from "next-auth/react"
import { Session } from "next-auth"

interface SessionWrapperProps {
  children: React.ReactNode
  session?: Session | null
}

export function SessionWrapper({ children, session }: SessionWrapperProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}
