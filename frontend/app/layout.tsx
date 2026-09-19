import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Quiz Royale",
    template: "%s | Quiz Royale",
  },
  description:
    "Quiz Royale — entre na batalha, responda perguntas e seja o último jogador de pé.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#080812] text-white">
        {children}

         <Toaster
          position="top-right"
          richColors
          theme="dark"
          closeButton
        />
      </body>
    </html>
  );
}