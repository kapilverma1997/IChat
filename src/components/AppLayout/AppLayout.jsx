"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "../AppSidebar/AppSidebar.jsx";
import styles from "./AppLayout.module.css";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  // Don't show sidebar on auth pages or landing page
  const hideSidebar = pathname.startsWith("/auth") || pathname === "/";

  return (
    <div className={styles.appContainer}>
      <AppSidebar />
      <main className={`${styles.mainContent} ${hideSidebar ? styles.fullWidth : ""}`}>
        {children}
      </main>
    </div>
  );
}

