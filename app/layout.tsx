import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./birthday.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "A Little Birthday World, Just for You",
    description: "A blossom-filled birthday wish made for someone truly special.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "Happy Birthday, Beautiful.",
      description: "A little world of blossoms, wishes, and surprises—made just for you.",
      type: "website",
      images: [{ url: `${origin}/blossom-hero.jpg`, width: 1800, height: 1200, alt: "Happy Birthday, Beautiful among cherry blossoms" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Happy Birthday, Beautiful.",
      description: "A little world of blossoms, wishes, and surprises—made just for you.",
      images: [`${origin}/blossom-hero.jpg`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
