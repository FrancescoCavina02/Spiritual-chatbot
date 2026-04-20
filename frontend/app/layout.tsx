import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spiritual AI Guide — RAG-Powered Knowledge Chatbot",
  description:
    "An AI chatbot that semantically searches 1,649 personal notes on spirituality, psychology, and philosophy using RAG (Retrieval-Augmented Generation) and GPT-4, delivering grounded, cited responses.",
  keywords: [
    "spiritual AI",
    "RAG chatbot",
    "retrieval augmented generation",
    "mindfulness AI",
    "ChromaDB",
    "GPT-4",
    "knowledge base chatbot",
  ],
  authors: [{ name: "Francesco Cavina", url: "https://github.com/FrancescoCavina02" }],
  openGraph: {
    title: "Spiritual AI Guide — RAG-Powered Knowledge Chatbot",
    description:
      "AI chatbot powered by RAG + GPT-4, searching 1,649 personal notes on spirituality, psychology, and philosophy.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased bg-gradient-to-br from-stone-50 via-teal-50/30 to-amber-50/20 min-h-screen flex flex-col`}
      >
        <Navigation />
        <main className="container mx-auto px-4 py-8 flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-stone-200 bg-white/60 backdrop-blur-sm mt-12">
          <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
            <p>
              Built by{" "}
              <a
                href="https://github.com/FrancescoCavina02"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-800 font-medium transition-colors"
              >
                Francesco Cavina
              </a>{" "}
              · Powered by RAG + GPT-4 Turbo + ChromaDB
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/FrancescoCavina02/Spiritual-chatbot"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-stone-800 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
              <span>·</span>
              <a
                href="/about"
                className="hover:text-stone-800 transition-colors"
              >
                About this project
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
