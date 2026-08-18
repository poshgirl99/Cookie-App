import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./zee-ai.css";
import StorySentFeedback from "./story-sent-feedback";
import InstantDeleteFeedback from "./instant-delete-feedback";
import FaithHeaderLink from "./faith-header-link";
import ZaleSocialEnhancements from "./zale-social-enhancements";
import ZalePushNotifications from "./zale-push-notifications";
import ZalePresenceStatus from "./zale-presence-status";
import ZeeAI from "./zee-ai";
import ZeeChatList from "./zee-chat-list";
import CookieAliasSync from "./cookie-alias-sync";
import CookieAliasCloudSync from "./cookie-alias-cloud-sync";
import ChatCorePolish from "./chat-core-polish";
import CookieNotificationCenter from "./cookie-notification-center";
import CookieHeaderActions from "./cookie-header-actions";
import CookieMorePanel from "./cookie-more-panel";
import CookieChatOpener from "./cookie-chat-opener";
import CookieSettingsPanel from "./cookie-settings-panel";
import CookieMorePanelMotion from "./cookie-more-panel-motion";
import CookieGlobalMotion from "./cookie-global-motion";
import CookieOnboardingTutorial from "./cookie-onboarding-tutorial";
import CookieTutorialReplayLink from "./cookie-tutorial-replay-link";

export const metadata: Metadata = { title: "Cookie", description: "Follow the crumb trail." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f4dfbd" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <FaithHeaderLink />
        <ZaleSocialEnhancements />
        <CookieAliasSync />
        <CookieAliasCloudSync />
        <ZalePushNotifications />
        <CookieNotificationCenter />
        <CookieHeaderActions />
        <CookieMorePanel />
        <CookieMorePanelMotion />
        <CookieGlobalMotion />
        <CookieChatOpener />
        <CookieSettingsPanel />
        <CookieOnboardingTutorial />
        <CookieTutorialReplayLink />
        <ZalePresenceStatus />
        <ZeeAI />
        <ZeeChatList />
        <ChatCorePolish />
        <StorySentFeedback />
        <InstantDeleteFeedback />
      </body>
    </html>
  );
}
