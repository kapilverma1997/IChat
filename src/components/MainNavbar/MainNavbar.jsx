"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getTranslation, getCurrentLanguage } from "../../lib/translations.js";
import styles from "./MainNavbar.module.css";

export default function MainNavbar({ user, isAdmin }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const lang = getCurrentLanguage();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      localStorage.clear();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.clear();
      router.push("/auth/login");
    }
  };

  const mainMenuItems = [
    {
      label: getTranslation(lang, "home"),
      href: "/dashboard",
      icon: "🏠",
      exact: true,
    },
    {
      label: getTranslation(lang, "chats"),
      href: "/dashboard",
      icon: "💬",
    },
    {
      label: getTranslation(lang, "groups"),
      href: "/groups",
      icon: "👥",
    },
    {
      label: getTranslation(lang, "collaboration"),
      href: "/collaboration",
      icon: "🤝",
      dropdown: [
        { label: getTranslation(lang, "toDoLists"), href: "/collaboration/todos" },
        { label: getTranslation(lang, "notes"), href: "/collaboration/notes" },
        { label: getTranslation(lang, "whiteboard"), href: "/collaboration/whiteboard" },
        { label: getTranslation(lang, "documents"), href: "/collaboration/documents" },
        { label: getTranslation(lang, "meetings"), href: "/collaboration/meetings" },
      ],
    },
    {
      label: getTranslation(lang, "calendar"),
      href: "/calendar",
      icon: "📅",
    },
    {
      label: getTranslation(lang, "files"),
      href: "/files",
      icon: "📁",
    },
    {
      label: getTranslation(lang, "analytics"),
      href: "/analytics",
      icon: "📊",
    },
  ];

  const userMenuItems = [
    {
      label: getTranslation(lang, "profile"),
      href: "/profile",
      icon: "👤",
    },
    {
      label: getTranslation(lang, "settings"),
      href: "/settings",
      icon: "⚙️",
    },
  ];

  if (isAdmin) {
    userMenuItems.push({
      label: getTranslation(lang, "adminPanel"),
      href: "/admin/dashboard",
      icon: "🛡️",
    });
  }

  const isActive = (href, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/dashboard" className={styles.logo}>
          <span className={styles.logoIcon}>💬</span>
          <span className={styles.logoText}>iChat</span>
        </Link>

        <div className={`${styles.menu} ${isMenuOpen ? styles.menuOpen : ""}`}>
          {mainMenuItems.map((item) => (
            <div
              key={item.href}
              className={styles.menuItemWrapper}
              onMouseEnter={() => item.dropdown && setShowDropdown(item.href)}
              onMouseLeave={() => setShowDropdown(null)}
            >
              <Link
                href={item.href}
                className={`${styles.menuItem} ${isActive(item.href, item.exact) ? styles.active : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {item.dropdown && <span className={styles.dropdownArrow}>▼</span>}
              </Link>

              {item.dropdown && showDropdown === item.href && (
                <div className={styles.dropdown}>
                  {item.dropdown.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={styles.dropdownItem}
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowDropdown(null);
                      }}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.userSection}>
          <div
            className={styles.userMenu}
            onMouseEnter={() => setShowDropdown("user")}
            onMouseLeave={() => setShowDropdown(null)}
          >
            <div className={styles.userAvatar}>
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} />
              ) : (
                <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              )}
            </div>
            <span className={styles.userName}>{user?.name || "User"}</span>
            <span className={styles.dropdownArrow}>▼</span>

            {showDropdown === "user" && (
              <div className={styles.dropdown}>
                {userMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={styles.dropdownItem}
                    onClick={() => setShowDropdown(null)}
                  >
                    <span className={styles.dropdownIcon}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                <div className={styles.divider}></div>
                <button
                  className={styles.dropdownItem}
                  onClick={handleLogout}
                >
                  <span className={styles.dropdownIcon}>🚪</span>
                  {getTranslation(lang, "logout")}
                </button>
              </div>
            )}
          </div>

          <button
            className={styles.mobileMenuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={styles.hamburger}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

