import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "KALKULATE — Make it add up.",
  description:
    "A focused everyday calculator with keyboard controls and a clear view of your recent calculations.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
