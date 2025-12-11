"use client";

import { useState, useEffect } from "react";
import LanguageSelector from "../../../components/LanguageSelector/LanguageSelector.jsx";
import { getTranslation, getCurrentLanguage, setLanguage } from "../../../lib/translations.js";
import styles from "./page.module.css";

export default function LanguageSettingsPage() {
  const lang = getCurrentLanguage();
  const [user, setUser] = useState(null);
  const [currentLang, setCurrentLang] = useState(lang);

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
        setCurrentLang(data.user?.language || lang);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const handleLanguageChange = async (language) => {
    setCurrentLang(language);
    setLanguage(language);

    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/settings/language", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language }),
      });
    } catch (error) {
      console.error("Error updating language:", error);
    }
  };

  return (
    <div className={styles.languageSettings}>
      <h2 className={styles.title}>{getTranslation(lang, "languageLocalization")}</h2>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{getTranslation(lang, "selectLanguage")}</h3>
        <LanguageSelector
          currentLanguage={currentLang}
          onLanguageChange={handleLanguageChange}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{getTranslation(lang, "rtlSupport")}</h3>
        <p className={styles.description}>
          {getTranslation(lang, "rtlDescription")}
        </p>
      </div>
    </div>
  );
}

