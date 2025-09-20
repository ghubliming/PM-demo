import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PM Demo - Prediction Markets",
  description: "A Web3 blockchain prediction market platform demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
