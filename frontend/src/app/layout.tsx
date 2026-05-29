import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Web3Provider } from "@/context/Web3Context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERC20 Token Lab | Web3 DApp",
  description:
    "A professional platform to manage and interact with ERC20 tokens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 selection:bg-blue-500/30">
        <Web3Provider>
          <Navbar />
          <main className="flex-grow pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
          <footer className="border-t border-white/5 py-8 text-center text-neutral-500 text-sm space-y-1">
            <p>&copy; 2026 ERC20 Token Lab. Todos os direitos reservados.</p>
            <p>
              Created by{" "}
              <a
                href="https://linikers-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                linikerS
              </a>
            </p>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
