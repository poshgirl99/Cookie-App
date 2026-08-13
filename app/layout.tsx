import type { Metadata, Viewport } from "next";
import "./globals.css";
import StorySentFeedback from "./story-sent-feedback";

export const metadata: Metadata = {
  title: "Cookie",
  description: "Chat, share and leave a trail of good moments.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fff6dc",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <StorySentFeedback />
      </body>
    </html>
  );
}
