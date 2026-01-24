import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProvider } from "./context/AppContext";
import { SolanaWalletProvider } from './providers/WalletProvider';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xandria - Xandeum Network Analytics & Visualizer",
  description: "Xandeum Network pNodes Analytics & Visualizer.",
  viewport: "width=device-width, initial-scale=1",
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider>
          <SolanaWalletProvider>
            {children}
          </SolanaWalletProvider>
        </AppProvider>
      </body>
    </html>
  );
}