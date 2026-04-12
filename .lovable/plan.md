

## Plan: Admin-Configurable Content, Chat Badges & Push Notification Prep

### Goal
1. Make more frontend content admin-editable (avoid App Store re-reviews)
2. Add unread message badge on chat icons
3. Prepare for push notifications

---

### Part 1: More Admin-Configurable Content

Add new keys to the `app_settings` table that the admin can edit, so these don't require app updates:

- **Hero section text** (title, subtitle in EN/AR)
- **Contact info** (phone, email, social links)
- **Announcement banner** (optional text shown at top of dashboard)
- **Feature toggles** (enable/disable carpool, packages, etc.)

**Files to change:**
- `src/pages/AdminPanel.tsx` — Add a "Content" or "Customization" section with fields for each setting
- `src/hooks/useAppSettings.ts` — New hook to fetch all `app_settings` in one call and cache them
- Landing page components (`HeroSection`, `Footer`, etc.) — Use dynamic values instead of hardcoded text

---

### Part 2: Unread Message Badge on Chat Icons

Show a red dot/count on the chat (MessageCircle) button when there are unread messages for a booking.

**Approach:**
- Add an `is_read` boolean column to `ride_messages` table (default `false`)
- When the chat is opened, mark messages as read
- Query unread count per booking to show badge

**Files to change:**
- **Migration** — Add `is_read` column to `ride_messages`
- `src/components/RideChat.tsx` — On open, mark incoming messages as read
- `src/pages/ActiveRide.tsx` — Fetch unread counts, show red dot on MessageCircle button
- `src/pages/MyBookings.tsx` — Same badge logic for passenger side
- `src/pages/DriverDashboard.tsx` — Same badge logic for driver side

---

### Part 3: Push Notifications (Prep)

True push notifications (when app is closed) require:
- **Firebase Cloud Messaging (FCM)** for Android
- **Apple Push Notification Service (APNs)** for iOS
- A Supabase Edge Function to send pushes when a new message is inserted

This is a larger setup. For now, we can:
1. Add a `device_tokens` table to store user push tokens
2. Add the Capacitor Push Notifications plugin registration code
3. Create an edge function that sends push via FCM when a ride_message is inserted

**Note:** Full push notification setup requires Firebase project credentials (FCM server key) and APNs certificate. I'll scaffold the code and tell you what credentials to add.

---

### Summary of Changes

| Area | What | Effort |
|------|------|--------|
| Admin content | Add editable hero text, contact info, announcements, feature toggles | Medium |
| Chat badge | Add `is_read` column, show unread dot on chat icons | Small |
| Push notifications | Scaffold device token storage + edge function | Medium |

**Database changes:** 2 migrations (add `is_read` to ride_messages, create `device_tokens` table)
**New files:** `useAppSettings.ts` hook, `push-notification` edge function
**Modified files:** AdminPanel, ActiveRide, MyBookings, DriverDashboard, RideChat, landing components

