# Quick Navigation Integration Guide

## 🚀 Fast Integration (15 minutes)

### 1. Update Existing Pages to Use New Layouts

All pages in `(dashboard)` folder automatically use the new layout. No changes needed!

### 2. Move Admin Pages to `(admin)` Folder

**Current**: `src/app/admin/*`
**New**: `src/app/(admin)/admin/*` OR keep current structure

**Option A**: Keep current structure, update admin pages to use AdminLayout component directly:

```jsx
// In each admin page
import AdminLayout from "../../../components/AdminLayout/AdminLayout.jsx";

export default function AdminPage() {
  return (
    <AdminLayout>
      {/* Your page content */}
    </AdminLayout>
  );
}
```

**Option B**: Move admin pages to `(admin)` folder (recommended)

### 3. Update Chat Header to Include Navigation

**File**: `src/components/ChatHeader/ChatHeader.jsx`

Add collaboration buttons:

```jsx
import PinnedMessagesPanel from "../PinnedMessagesPanel/PinnedMessagesPanel.jsx";
import { useState } from "react";

// Add state
const [showPinned, setShowPinned] = useState(false);
const [showCollaboration, setShowCollaboration] = useState(false);

// Add buttons in header
<div className={styles.headerActions}>
  <button onClick={() => setShowPinned(!showPinned)}>
    📌 Pinned
  </button>
  <button onClick={() => router.push("/collaboration/todos")}>
    ✅ Tasks
  </button>
  <button onClick={() => router.push("/collaboration/notes")}>
    📝 Notes
  </button>
  <button onClick={() => router.push("/files/media")}>
    📁 Media
  </button>
</div>

{showPinned && (
  <PinnedMessagesPanel
    chatId={chatId}
    groupId={groupId}
    onMessageClick={handleMessageClick}
  />
)}
```

### 4. Update Profile Page to Use Settings Layout

**File**: `src/app/profile/page.jsx`

Redirect to settings or wrap in SettingsLayout:

```jsx
// Option 1: Redirect
useEffect(() => {
  router.push("/settings/profile");
}, []);

// Option 2: Use SettingsLayout
import SettingsLayout from "../settings/layout.jsx";
```

### 5. Test Navigation

1. Login → Should see MainNavbar
2. Click "Chats" → Should see DashboardSidebar
3. Click "Admin Panel" (if admin) → Should see AdminSidebar
4. Click "Settings" → Should see SettingsSidebar
5. Change language → All labels should update
6. Change theme → Navigation should update

## ✅ That's It!

The navigation system is now fully integrated. All pages automatically get:
- MainNavbar at the top
- Appropriate sidebar
- Breadcrumbs
- Responsive design
- Theme support
- RTL support

## 🐛 Troubleshooting

**Sidebar not showing?**
- Check if page is in `(dashboard)` folder
- Check if pathname starts with `/admin` (hides dashboard sidebar)

**Admin sidebar not showing?**
- Verify user role is "admin" or "owner"
- Check admin layout is being used

**Translations not working?**
- Check `localStorage.getItem("language")`
- Verify translations.js has the key
- Check browser console for errors

**RTL not working?**
- Verify language is Arabic/Hebrew/Urdu
- Check `dir` attribute on html element
- Verify CSS has RTL styles

---

**Status**: Navigation system ready. Follow integration steps above.

