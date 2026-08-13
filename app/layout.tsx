import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./zale-brand.css";
import "./zale-logo-override.css";
import StorySentFeedback from "./story-sent-feedback";
import InstantDeleteFeedback from "./instant-delete-feedback";
import ZaleRebrand from "./zale-rebrand";
import ChatThemeControl from "./chat-theme-control";
import NewChatProminence from "./new-chat-prominence";

export const metadata: Metadata = {
  title: "Zale",
  description: "Your people. Your space.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#24112f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ZaleRebrand />
        <ChatThemeControl />
        <NewChatProminence />
        <StorySentFeedback />
        <InstantDeleteFeedback />
      </body>
    </html>
  );
}
