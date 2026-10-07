import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nita Travels",
  description: "Fleet management system for Nita Travels — vehicles, transactions, mileage, and service tracking.",
  icons: {
    icon: "/favicon.svg",
  },
  // Internal, authenticated tool handling fleet financial data — it should never be crawled or
  // show up in search results. (Belt-and-suspenders with the X-Robots-Tag header in
  // next.config.js, which also covers non-HTML responses like the CSV export.)
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-[#050A14] text-[#F8FAFC]">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
