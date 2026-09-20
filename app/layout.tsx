import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PaddingWrapper from "./PaddingWrapper";
import { Toaster } from "react-hot-toast";
import type { ReactNode } from "react";

export const metadata = {
  title: "Adidaya Studio",
  description: "Architecture • Design • Development",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" />
        <link rel="icon" href="/favicon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-adidaya-bg text-adidaya-text font-sans min-h-screen flex flex-col justify-between">
        <Navbar />
        
        {/* WRAPPER to decide padding */}
        <PaddingWrapper>
          {children}
        </PaddingWrapper>

        <Footer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#181818",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "16px",
              fontSize: "13px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
            },
          }}
        />
      </body>
    </html>
  );
}
