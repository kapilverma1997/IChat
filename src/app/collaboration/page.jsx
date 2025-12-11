"use client";

import { useState } from "react";
import Link from "next/link";
import SectionTabs from "../../components/SectionTabs/SectionTabs.jsx";
import { getTranslation, getCurrentLanguage } from "../../lib/translations.js";
import styles from "./page.module.css";

export default function CollaborationCenterPage() {
  const lang = getCurrentLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    {
      id: "overview",
      label: getTranslation(lang, "overview"),
      icon: "📊",
    },
    {
      id: "todos",
      label: getTranslation(lang, "toDoLists"),
      icon: "✅",
    },
    {
      id: "notes",
      label: getTranslation(lang, "notes"),
      icon: "📝",
    },
    {
      id: "whiteboard",
      label: getTranslation(lang, "whiteboard"),
      icon: "🖼️",
    },
    {
      id: "documents",
      label: getTranslation(lang, "documents"),
      icon: "📄",
    },
    {
      id: "meetings",
      label: getTranslation(lang, "meetings"),
      icon: "📅",
    },
  ];

  const collaborationTools = [
    {
      title: getTranslation(lang, "sharedToDoLists"),
      description: getTranslation(lang, "createAndManage"),
      icon: "✅",
      href: "/collaboration/todos",
      color: "#4CAF50",
    },
    {
      title: getTranslation(lang, "sharedNotes"),
      description: getTranslation(lang, "collaborativeNote"),
      icon: "📝",
      href: "/collaboration/notes",
      color: "#2196F3",
    },
    {
      title: getTranslation(lang, "whiteboard"),
      description: getTranslation(lang, "realTimeCollaborative"),
      icon: "🖼️",
      href: "/collaboration/whiteboard",
      color: "#FF9800",
    },
    {
      title: getTranslation(lang, "documents"),
      description: getTranslation(lang, "multiUserText"),
      icon: "📄",
      href: "/collaboration/documents",
      color: "#9C27B0",
    },
    {
      title: getTranslation(lang, "meetings"),
      description: getTranslation(lang, "scheduleAndManage"),
      icon: "📅",
      href: "/collaboration/meetings",
      color: "#F44336",
    },
    {
      title: getTranslation(lang, "taskAssignments"),
      description: getTranslation(lang, "assignAndTrack"),
      icon: "📋",
      href: "/collaboration/tasks",
      color: "#00BCD4",
    },
  ];

  return (
    <div className={styles.collaborationCenter}>
      <div className={styles.header}>
        <h1 className={styles.title}>{getTranslation(lang, "collaborationCenter")}</h1>
        <p className={styles.subtitle}>
          {getTranslation(lang, "workTogetherSeamlessly")}
        </p>
      </div>

      <SectionTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={styles.toolsGrid}>
        {collaborationTools.map((tool) => (
          <Link key={tool.href} href={tool.href} className={styles.toolCard}>
            <div className={styles.toolIcon} style={{ backgroundColor: `${tool.color}20` }}>
              <span style={{ fontSize: "3rem" }}>{tool.icon}</span>
            </div>
            <div className={styles.toolContent}>
              <h3 className={styles.toolTitle}>{tool.title}</h3>
              <p className={styles.toolDescription}>{tool.description}</p>
            </div>
            <div className={styles.toolArrow}>→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

