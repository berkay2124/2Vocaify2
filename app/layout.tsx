import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Vocaify - Search 1000 CVs in Seconds",
  description: "AI-powered CV database search engine for HR professionals. Upload your CV database and find the perfect candidate with natural language search.",
  keywords: ["CV search", "resume database", "HR tool", "AI search", "recruitment"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
