"use client";

import { useState, useEffect } from "react";
import ThemeSwitcher from "../../../components/ThemeSwitcher/ThemeSwitcher.jsx";
import BackgroundPicker from "../../../components/BackgroundPicker/BackgroundPicker.jsx";
import { getTranslation, getCurrentLanguage } from "../../../lib/translations.js";
import styles from "./page.module.css";

export default function ThemesSettingsPage() {
  const lang = getCurrentLanguage();
  const [user, setUser] = useState(null);
  const [currentTheme, setCurrentTheme] = useState("light");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setCurrentTheme(data.user?.theme || "light");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  return (
    <div className={styles.themesSettings}>
      <h2 className={styles.title}>{getTranslation(lang, "themesCustomization")}</h2>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{getTranslation(lang, "chooseTheme")}</h3>
        <ThemeSwitcher
          currentTheme={currentTheme}
          onThemeChange={(theme) => {
            setCurrentTheme(theme);
            fetchUser();
          }}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{getTranslation(lang, "chatBackground")}</h3>
        <BackgroundPicker
          currentBackground=""
          onBackgroundChange={(url) => {
            // Background updated
          }}
        />
      </div>
    </div>
  );
}

