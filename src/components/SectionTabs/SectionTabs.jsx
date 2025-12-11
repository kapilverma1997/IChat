"use client";

import { useState } from "react";
import { getTranslation, getCurrentLanguage } from "../../lib/translations.js";
import styles from "./SectionTabs.module.css";

export default function SectionTabs({ tabs, activeTab, onTabChange, variant = "horizontal" }) {
  const lang = getCurrentLanguage();

  return (
    <div className={`${styles.tabs} ${styles[variant]}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
          onClick={() => onTabChange(tab.id)}
          aria-selected={activeTab === tab.id}
        >
          {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
          <span className={styles.tabLabel}>{tab.label}</span>
          {tab.badge && <span className={styles.badge}>{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}

