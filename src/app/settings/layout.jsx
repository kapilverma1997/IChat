"use client";

import SettingsSidebar from "../../components/SettingsSidebar/SettingsSidebar.jsx";
import ProtectedLayout from "../../components/ProtectedLayout/ProtectedLayout.jsx";
import styles from "./layout.module.css";

export default function SettingsLayout({ children }) {
  return (
    <ProtectedLayout>
      <div className={styles.settingsLayout}>
        <SettingsSidebar />
        <main className={styles.settingsContent}>
          {children}
        </main>
      </div>
    </ProtectedLayout>
  );
}

