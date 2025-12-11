"use client";

import { useState, useEffect } from "react";
import SectionTabs from "../../components/SectionTabs/SectionTabs.jsx";
import UserStatsCard from "../../components/UserStatsCard/UserStatsCard.jsx";
import { getTranslation, getCurrentLanguage } from "../../lib/translations.js";
import styles from "./page.module.css";

export default function AnalyticsPage() {
  const lang = getCurrentLanguage();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("user");
  const [period, setPeriod] = useState("daily");

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
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const tabs = [
    {
      id: "user",
      label: getTranslation(lang, "userStats"),
      icon: "👤",
    },
    {
      id: "group",
      label: getTranslation(lang, "groupStats"),
      icon: "👥",
    },
    {
      id: "workspace",
      label: getTranslation(lang, "workspaceAnalytics"),
      icon: "🏢",
    },
    {
      id: "files",
      label: getTranslation(lang, "fileUsage"),
      icon: "📁",
    },
    {
      id: "export",
      label: getTranslation(lang, "exportAnalytics"),
      icon: "📊",
    },
    {
      id: "heatmap",
      label: getTranslation(lang, "heatmap"),
      icon: "🔥",
    },
  ];

  return (
    <div className={styles.analyticsPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>{getTranslation(lang, "analytics")}</h1>
        <div className={styles.periodSelector}>
          <button
            className={period === "daily" ? styles.active : ""}
            onClick={() => setPeriod("daily")}
          >
            {getTranslation(lang, "daily")}
          </button>
          <button
            className={period === "weekly" ? styles.active : ""}
            onClick={() => setPeriod("weekly")}
          >
            {getTranslation(lang, "weekly")}
          </button>
          <button
            className={period === "monthly" ? styles.active : ""}
            onClick={() => setPeriod("monthly")}
          >
            {getTranslation(lang, "monthly")}
          </button>
        </div>
      </div>

      <SectionTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={styles.content}>
        {activeTab === "user" && user && (
          <UserStatsCard userId={user._id} period={period} />
        )}
        {activeTab === "group" && (
          <div className={styles.placeholder}>
            <p>{getTranslation(lang, "groupStatsComingSoon")}</p>
          </div>
        )}
        {activeTab === "workspace" && (
          <div className={styles.placeholder}>
            <p>{getTranslation(lang, "workspaceAnalyticsComingSoon")}</p>
          </div>
        )}
        {activeTab === "files" && (
          <div className={styles.placeholder}>
            <p>{getTranslation(lang, "fileUsageComingSoon")}</p>
          </div>
        )}
        {activeTab === "export" && (
          <div className={styles.placeholder}>
            <p>{getTranslation(lang, "exportAnalyticsComingSoon")}</p>
          </div>
        )}
        {activeTab === "heatmap" && (
          <div className={styles.placeholder}>
            <p>{getTranslation(lang, "heatmapComingSoon")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

