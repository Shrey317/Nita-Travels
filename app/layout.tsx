import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nita Travels Fleet Management",
  description: "Fleet management system for Nita Travels — vehicles, transactions, mileage, and service tracking.",
  // Internal, authenticated tool handling fleet financial data — it should never be crawled or
  // show up in search results. (Belt-and-suspenders with the X-Robots-Tag header in
  // next.config.js, which also covers non-HTML responses like the CSV export.)
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
