import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";

export const metadata: Metadata = {
  title: "Spiritual AI Guide",
  description: "Your personal AI spiritual guide powered by RAG and curated wisdom",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
        {children}
        </main>
      </body>
    </html>
  );
}
