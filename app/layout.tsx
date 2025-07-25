import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SidebarLayout } from "@/components/sidebar-layout";
import { SessionWrapper } from "@/components/session-wrapper";
import Providers from "./providers/Providers";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "agencyHQ",
  description: "Complete agency management system",
};

export default async function RootLayout({
  children,}: Readonly<{
  children: React.ReactNode;
}>

) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
        <SessionWrapper session={session}>
          {session ? (
            <SidebarLayout>{children}</SidebarLayout>
          ) : (
            children
          )}
        </SessionWrapper>
        </Providers>
      </body>
    </html>
  );
}
