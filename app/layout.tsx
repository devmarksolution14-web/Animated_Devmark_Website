import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlobalScene from "@/components/layout/GlobalScene";
import Preloader from "@/components/layout/Preloader";
import SmoothScroll from "@/components/layout/SmoothScroll";
import SmoothCursor from "@/components/ui/SmoothCursor";
import { SITE } from "@/constants/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "DevMark IT Studio | Digital Growth Studio",
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
        {/* A refresh always starts at the top (Home): stop the browser restoring the
            old scroll position, and drop a leftover #section from an earlier nav click.
            Only on reload, so a shared link like /#contact still opens at Contact. */}
        <Script id="scroll-to-top-on-reload" strategy="beforeInteractive">
          {`(function(){try{if("scrollRestoration" in history)history.scrollRestoration="manual";var n=performance.getEntriesByType("navigation")[0];if(n&&n.type==="reload"){if(location.hash)history.replaceState(history.state,"",location.pathname+location.search);window.scrollTo(0,0);}}catch(e){}})();`}
        </Script>
        <Preloader />
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
