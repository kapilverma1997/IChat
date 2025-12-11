"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getTranslation, getCurrentLanguage } from "../../lib/translations.js";
import styles from "./SettingsSidebar.module.css";

export default function SettingsSidebar() {
  const pathname = usePathname();
  const lang = getCurrentLanguage();

  const settingsTabs = [
    {
      id: "profile",
      label: getTranslation(lang, "profileSettings"),
      href: "/settings/profile",
      icon: "👤",
    },
    {
      id: "privacy",
      label: getTranslation(lang, "privacySecurity"),
      href: "/settings/privacy",
      icon: "🔒",
    },
    {
      id: "notifications",
      label: getTranslation(lang, "notifications"),
      href: "/settings/notifications",
      icon: "🔔",
    },
    {
      id: "chat",
      label: getTranslation(lang, "chatPreferences"),
      href: "/settings/chat",
      icon: "💬",
    },
    {
      id: "themes",
      label: getTranslation(lang, "themesCustomization"),
      href: "/settings/themes",
      icon: "🎨",
    },
    {
      id: "emojis",
      label: getTranslation(lang, "emojiSettings"),
      href: "/settings/emojis",
      icon: "😀",
    },
    {
      id: "language",
      label: getTranslation(lang, "languageLocalization"),
      href: "/settings/language",
      icon: "🌍",
    },
    {
      id: "calendar",
      label: getTranslation(lang, "connectedCalendars"),
      href: "/settings/calendar",
      icon: "📅",
    },
    {
      id: "storage",
      label: getTranslation(lang, "cloudStorage"),
      href: "/settings/storage",
      icon: "☁️",
    },
    {
      id: "status",
      label: getTranslation(lang, "statusDuration"),
      href: "/settings/status",
      icon: "⏱️",
    },
  ];

  const getActiveTab = () => {
    const currentPath = pathname.split("/").pop() || "profile";
    return currentPath;
  };

  const activeTab = getActiveTab();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>{getTranslation(lang, "settings")}</h2>
      </div>
      <nav className={styles.nav}>
        {settingsTabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

