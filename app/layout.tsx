import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./zale-brand.css";
import "./zale-logo-override.css";
import "./zee-ai.css";
import StorySentFeedback from "./story-sent-feedback";
import InstantDeleteFeedback from "./instant-delete-feedback";
import ZaleRebrand from "./zale-rebrand";
import FaithHeaderLink from "./faith-header-link";
import ZaleSocialEnhancements from "./zale-social-enhancements";
import ZalePushNotifications from "./zale-push-notifications";
import ZalePresenceStatus from "./zale-presence-status";
import ZeeAI from "./zee-ai";

export const metadata: Metadata = { title: "Zale", description: "Your people. Your space." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#24112f" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <FaithHeaderLink />
        <ZaleRebrand />
        <ZaleSocialEnhancements />
        <ZalePushNotifications />
        <ZalePresenceStatus />
        <ZeeAI />
        <StorySentFeedback />
        <InstantDeleteFeedback />
      </body>
    </html>
  );
}
