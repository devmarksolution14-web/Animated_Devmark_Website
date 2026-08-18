import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlobalScene from "@/components/layout/GlobalScene";
import SmoothScroll from "@/components/layout/SmoothScroll";
import SmoothCursor from "@/components/ui/SmoothCursor";
import { SITE } from "@/constants/site";

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <GlobalScene />
        <SmoothScroll />
        <SmoothCursor />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
