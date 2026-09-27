# Raven Fork – Custom Changes Replay Guide

> Purpose: fresh `frappe/raven` fork ko sync karne ke baad inhi changes ko kisi bhi AI code editor (Cursor / Copilot / OpenCode / Codex) se dobara lagwana.
> Source of truth: `TanotiCoder/raven` ke `origin/develop` par verify kiye gaye commits (Feb–Mar 2026).
> Is file ko naye repo me copy karke AI ko do + bolo "is doc ke hisab se changes re-apply karo".

---

## 1. Commit audit – kya rakhe, kya chhode

User ne ye 14 hashes diye the (1 duplicate):

| Hash (short) | Message | Verdict |
|---|---|---|
| `1d9b27c0` Resolve depedency | `package.json: apps/*` hataya, `pyproject.toml: pydantic~=2.10.2, PyJWT~=2.8.0` add, `yarn.lock` regen | **SKIP – obsolete.** Naye upstream me dependency already fix hai. Sirf `pydantic/PyJWT` missing ho to hi add karo, `yarn.lock` haath se mat chhedo. |
| `e112043a` add apps | `package.json workspaces += apps/*`, `raven/raven/workspace/raven/raven.json` me roles `[Admin, Administrator, Manager]` | **SKIP – reverted.** `9cd4fc2e` ne isko undo kar diya. Dobara mat lagao. |
| `9cd4fc2e` revert code | Upar wale ko revert | **SKIP – sirf history.** Net effect zero. |
| `ebcd8931` diverting root | `raven/hooks.py: #home_page="login"` → `home_page="app"` | **KEEP – Feature A ka part.** Niche Section-2 me final form me lagao. |
| `e2b0024f` remove apps | `package.json` se `apps/*` hataya + `role_home_page` add (System Manager→app/admin-desk, Agent→app/agent-desk, Admin→app/admin-desk) | **KEEP – aadha.** `package.json` wala hissa SKIP (already reverted state), sirf `role_home_page` block KEEP karo. |
| `091e73de` Merge upstream into develop | Sirf `pyproject.toml` conflict resolve | **SKIP.** Fresh sync me merge ki zarurat nahi. |
| `9eb3a4f4` increase volume | `sounds[raven_notification].volume 0.2 → 1.0` | **KEEP – squashed.** Final `hooks.py` me ek baar me lagao (Sec-2.5). |
| `1faf116f` Change mp3 + volume 2x | `src: raven_notification.mp3 → raven_notification_1.mp3`, nayi binary file (18KB wali) | **KEEP – par file version dhyan se.** Final MP3 `b1eec85d` wali 68KB version honi chahiye, ye 18KB wali overwrite mat hone dena. |
| `e1e80ffb` Merge upstream | `PushNotifications.tsx + utils.py` | **SKIP.** |
| `b1eec85d` notification permission + sound; remove redirects | `useUnreadMessageCount.ts` me permission + sound + Browser Notification, `hooks.py` se `website_redirects` hataya, MP3 18KB→68KB | **KEEP – logic rakho, redirect hatana mat rakho.** Redirect to `2ed9e9c8` me wapas aa gaya tha. Final me redirect **hona chahiye**. |
| `2ed9e9c8` volume control + search button | `MessageSearch.tsx` window.find, `ChannelHeaderMenu.tsx` search button bahar, `Preferences.tsx` Slider, `preferences.ts` Atom, `hooks.py` me redirect wapas | **KEEP – full.** |
| `5e45ada6` refactor unread handling | `getChannelData()/isUserChannelMember()`, timestamp dedup, localStorage volume | **KEEP – core logic.** |
| `c44efd15` default volume 35 | Hook me default `50 → 35` | **KEEP.** |
| `2a037f92` comment out login routes | `App.tsx` me 4 routes comment | **KEEP – Feature B.** |
| **Missing in user list but chain me tha** `e48a790b` + `3288371a` | Pehle login routes comment + basic sound + redirect add, phir routes uncomment (temp debug) | **SKIP individually.** Inka net effect upar wale KEEP commits me already covered hai. `3288371a` ka uncomment **mat lagana** – final state commented hai. |

**Net: sirf 5 features re-apply karne hai (Section-2). Baaki 9 commits history/revert/merge hai.**

---

## 2. Final state – 5 features (AI isi ko lagaye)

### Feature A – Raven direct login routes band, Frappe login single entry

**File 1 (OLD path): `frontend/src/App.tsx` | (NEW upstream path): `apps/web/src/App.tsx`**
AI pehle `apps/web/src/App.tsx` dhoondhe, na mile to `frontend/src/App.tsx`.
Router me ye 4 lines comment honi chahiye:

```tsx
{/* <Route path='/login' lazy={() => import('@/pages/auth/Login')} />
<Route path='/login-with-email' lazy={() => import('@/pages/auth/LoginWithEmail')} />
<Route path='/signup' lazy={() => import('@/pages/auth/SignUp')} />
<Route path='/forgot-password' lazy={() => import('@/pages/auth/ForgotPassword')} /> */}
```

Effect: `/login`, `/signup` UI dead, sirf `ProtectedRoute` → Frappe session login chalega.

**File 2: `raven/hooks.py`**
```python
sounds = [
    {
        "name": "raven_notification",
        "src": "/assets/raven/sounds/raven_notification_1.mp3",
        "volume": 1.0,
    },
]

home_page = "app"

role_home_page = {
    "System Manager": "app/admin-desk",
    "Agent": "app/agent-desk",
    "Admin": "app/admin-desk",
}

# file ke end me:
website_redirects = [
    {"source": "/raven/login", "target": "/"},
]
```
Effect: `/` → `app`, role-wise desk redirect, `/raven/login` → `/`.

### Feature B – New-message notification (sound + Browser Notification + dedup)

**File (OLD): `frontend/src/hooks/useUnreadMessageCount.ts` | (NEW): pehle `apps/web/src/stores/unread/store.ts` aur `apps/web/src/hooks/` check karo, jo file `raven:unread_channel_count_updated` event sunti hai wahi target hai.**
Naya upstream refactor hua hai (`frontend/` → `apps/web/`, unread logic → `stores/unread/`), isliye blind path mat use karo – event-name se file dhoondho.

Lagana hai:

1. Helper (channel + DM dono me member check):
```ts
const getChannelData = (channelID: string) => {
  const channel = channels.find(c => c.name === channelID && c.member_id)
  if (channel) return channel
  const dmChannel = dm_channels.find(c => c.name === channelID && c.member_id)
  if (dmChannel) return dmChannel
  return null
}
```

2. Mount par permission:
```tsx
useEffect(() => {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission()
  }
}, [])
```

3. Listener ke start me guard (non-member + purana event ignore):
```ts
const channelData = getChannelData(event.channel_id)
if (!channelData) return
const eventTimestamp = new Date(event.last_message_timestamp).getTime()
const currentTimestamp = channelData.last_message_timestamp ? new Date(channelData.last_message_timestamp).getTime() : 0
if (eventTimestamp <= currentTimestamp) return
```

4. Sound + Browser Notification (sirf `event.sent_by !== currentUser` branch me):
```ts
try {
  const rawVolume = localStorage.getItem('raven-notification-volume')
  let volume = 35 // Default
  if (rawVolume) {
    try { volume = parseInt(JSON.parse(rawVolume), 10) } catch (e) { volume = 35 }
  }
  if (volume > 0) {
    const audio = new Audio('/assets/raven/sounds/raven_notification_1.mp3')
    audio.volume = volume / 100
    audio.play().catch(e => console.warn('Audio play failed:', e))
  }
} catch (e) { console.warn('Audio play failed:', e) }

if (document.hidden && "Notification" in window && Notification.permission === "granted") {
  new Notification("New message", {
    body: `${event.sent_by} sent a message`,
    icon: '/assets/raven/images/raven-logo.png'
  })
}
```

> NOTE: beech ke commits me `audio.volume = 0.65` / `0.4` hardcoded tha – wo **mat lagana**. Sirf upar wala localStorage version lagao.

### Feature C – Notification volume slider (Settings → Preferences)

**File (OLD): `frontend/src/utils/preferences.ts` | (NEW): `apps/web/src/utils/preferences.ts`**
```ts
export const NotificationVolumeAtom = atomWithStorage<number>("raven-notification-volume", 50)
```
> Inconsistency note: atom default `50` hai jabki hook default `35` hai. Fresh apply me dono `35` kar dena better hai, warna pehli baar slider 50 dikhayega par sound 35 par bajega.

**File (OLD): `frontend/src/pages/settings/Preferences.tsx` | (NEW): `apps/web/src/components/features/settings/panels/Preferences.tsx` (fallback: `Preferences.tsx` naam se dhoondho)**
```tsx
import { NotificationVolumeAtom } from "@/utils/preferences"
import { Slider } from "@radix-ui/themes"

const [notificationVolume, setNotificationVolume] = useAtom(NotificationVolumeAtom)
const handleVolumeChange = (value: number[]) => {
  setNotificationVolume(value[0])
  const audio = new Audio('/assets/raven/sounds/raven_notification_1.mp3')
  audio.volume = value[0] / 100
  audio.play().catch(e => console.warn('Audio preview failed:', e))
}
// JSX me QuickEmojis block ke baad:
<Stack className="max-w-[480px]">
  <Label htmlFor='NotificationVolume'>Notification Volume ({notificationVolume}%)</Label>
  <Box pt="2" pb="2">
    <Slider value={[notificationVolume]} onValueChange={(val) => setNotificationVolume(val[0])} onValueCommit={handleVolumeChange} max={100} step={1} />
  </Box>
  <HelperText>Adjust the volume of the notification sound when new messages arrive.</HelperText>
</Stack>
```

### Feature D – Channel header search button + auto-highlight

**File: `ChannelHeaderMenu.tsx` (path badal sakta hai – `channel-header/` ya `features/...` me dhoondho)**
- `DropdownMenu.Item` wala Search hatakar header me direct button:
```tsx
<IconButton color='gray' onClick={onGlobalSearchModalOpen} className='bg-transparent text-gray-12 hover:bg-gray-3' title="Search channel messages">
  <BiSearch size={20} />
</IconButton>
```

**File: `MessageSearch.tsx` / `GlobalSearch/*` (naam badal sakta hai)**
`handleNavigateToChannel(...)` ke baad add:
```ts
if (debouncedText) {
  setTimeout(() => {
    // @ts-ignore
    if (typeof window.find === 'function') {
      // @ts-ignore
      window.find(debouncedText, false, false, true, false, false, false);
    }
  }, 800)
}
```

### Feature E – Sound file

* `raven/public/sounds/raven_notification_1.mp3` – **68KB wali final version** (`b1eec85d` ke baad wali, hash `eba60090`) preserve karo. Purani 18KB wali (`1faf116f`) se overwrite mat karo. Fresh fork me file nahi hogi to purane fork se copy karo, git me binary commit karo.

---

## 3. AI ko dene wala prompt (copy-paste)

```
Mere paas frappe/raven ka fresh fork/sync hai (upstream develop).
RAVEN_CUSTOM_CHANGES_REPLAY.md Section-2 ke 5 features re-apply karo:

1. App router me login/signup/forgot routes comment + hooks.py me home_page/role_home_page/website_redirects.
2. Unread-message listener me getChannelData guard + timestamp dedup + localStorage volume (default 35) sound + document.hidden par Browser Notification. Hardcoded 0.65/0.4 volume mat lagana.
3. preferences.ts me NotificationVolumeAtom + Preferences panel me Slider with preview.
4. Channel header me direct Search IconButton + MessageSearch me window.find highlight.
5. sounds hook src raven_notification_1.mp3 volume 1.0 (mp3 file already hai to chhedo mat).

Dhyan:
- Repo refactor hua hai: frontend/src/* ab apps/web/src/* me hai, unread logic stores/unread/* me ho sakti hai. Event name 'raven:unread_channel_count_updated' se target file dhoondho, blind old path mat use karo.
- Reverted commits (add apps / raven.json roles / package.json apps/*) dobara mat lagana.
- Har file edit ke baad `yarn build` / `tsc --noEmit` (web) aur `python -m py_compile raven/hooks.py` se verify karo.
```

## 4. Verify checklist (AI se karwao)

- [ ] `/login` kholo → Raven login UI nahi, Frappe login/redirect.
- [ ] `/raven/login` → `/` redirect.
- [ ] Dusre user se message → sound + (hidden tab par) OS notification. Khud ka message → silent + unread 0.
- [ ] Purana event replay / non-member channel → no sound.
- [ ] Settings → Preferences me Slider, change par preview sound, reload par persist, `0` par mute.
- [ ] Header me Search icon, result click par message highlight.
- [ ] `bench --site <site> migrate` + `bench build --app raven` clean.
