# boomerang. 
campus lost & found

A members-only lost & found portal for **@sst.scaler.com** students and staff.
Report lost or found items with photos, browse and search, get "potential match" suggestions,
and chat privately in real time to get things back to their owners.

**Stack:** React 19 + Vite + Tailwind CSS 4 + Motion + React Three Fiber · Node/Express 5 · MongoDB Atlas (Mongoose) · Socket.IO · Cloudinary · Nodemailer (SMTP)

---

## 1. What's in the box

| Feature | Where |
| --- | --- |
| Register / login / logout, JWT auth, bcrypt hashing | `server/controllers/auth.controller.js` |
| College-domain allowlist **enforced on the server** | `COLLEGE_EMAIL_DOMAINS` + `utils/validation.js` |
| Email verification + password reset (hashed, expiring, single-use tokens) | `auth.controller.js`, `services/email.js` |
| Lost & found reports: create / edit / delete / resolve, owner-only | `items.controller.js` |
| Search, category / location / date filters, sort, pagination | `GET /api/items` |
| Photo upload (camera or gallery), type sniffing, 5 MB limit, Cloudinary | `uploads.controller.js`, `components/ImageUploader.jsx` |
| Real-time private chat, persisted in MongoDB, unread counts, typing, online status | `conversations.controller.js`, `sockets/index.js` |
| Potential matches (category + keywords + place + date), never auto-claimed | `services/matching.js` |
| In-app notifications (messages, contact, matches, resolved) | `notifications.controller.js` |
| Profiles (public view shows only email *domain*) | `users.controller.js` |
| Optional sound (off by default), reduced-motion support, 3D hero with CSS fallback | `context/PrefsContext.jsx`, `components/Hero3D.jsx` |

```
Kalu/
├── server/            Express API + Socket.IO
│   ├── config/        env + database connection
│   ├── controllers/   request handlers
│   ├── middleware/    auth, errors, rate limits, uploads
│   ├── models/        User, Item, Conversation, Message, Notification
│   ├── routes/        URL → controller mapping
│   ├── services/      email, image storage, matching, notifications
│   ├── sockets/       real-time chat server
│   └── utils/
└── client/            React app (Vite)
    └── src/ components · context · hooks · layouts · pages · services · utils
```

---

## 2. Run it locally

You need **Node.js 20+** (you have 24 ✔). Ports used: **API 5050**, **website 5180** (5173 is left free for your other project).

```powershell
cd C:\Users\User\OneDrive\Desktop\Kalu
npm run install:all      # installs root, server and client packages (only needed once)
npm run dev              # starts API + website together
```

Then open **http://localhost:5180**.

Successful output looks like:

```
[api] ✔ MongoDB connected (database: lostfound)
[api] ✔ API ready on http://localhost:5050  (health: /api/health)
[web]   ➜  Local:   http://localhost:5180/
```

If the API prints **"Server configuration problems"**, it lists exactly which value in `server/.env` is missing.
Stop everything with `Ctrl + C`.

### Sample data

```powershell
npm run seed         # adds 6 demo students, 14 items (with pictures), chats and a resolved case
npm run seed:clear   # removes ONLY the demo data; real accounts are never touched
```

Demo logins: `demo.aarav@sst.scaler.com`, `demo.diya@…`, `demo.kabir@…`, `demo.meera@…`, `demo.rohan@…`, `demo.sana@…`, all with password `demo1234`.

### Email verification (currently OFF)

`REQUIRE_EMAIL_VERIFICATION=false` (the default) lets anyone with an allowed college email domain sign up and use the portal immediately, because college OAuth sign-in is planned.
The domain allowlist is still enforced by the server, and an existing account can never be taken over by signing up again with the same email.
Set it to `true` in `server/.env` to bring back emailed verification links.

### Sign in with Google (OAuth)

`@sst.scaler.com` runs on Google Workspace, so students can use **Continue with Google**.

- Set `GOOGLE_CLIENT_ID` in `server/.env`. The website reads it from the API, so `client/.env` doesn't need it. It's a public ID; **no client secret is used or stored**.
- The server verifies every Google token with Google (signature, expiry, audience) and only accepts emails that Google has verified, on an allowed domain, and belonging to that Google Workspace (`hd` claim). Personal Gmail accounts are rejected.
- The first Google sign-in creates the account (name and photo from Google). If a password account with the same email exists, it's linked instead of duplicated.
- `GOOGLE_ONLY=true` turns off email/password sign-up and sign-in (keep it `false` while you use the demo accounts).
- In Google Cloud → Credentials → your OAuth client, **Authorized JavaScript origins** must list every site URL: `http://localhost:5180` and, after deploying, your Vercel URL. Without it the Google popup shows an "origin_mismatch" error.

### Schools

Allowed domains live in `COLLEGE_EMAIL_DOMAINS` (comma-separated), e.g. `sst.scaler.com`. The school shown on profiles (e.g. SST) is taken from the first part of the email domain.

### Dev modes (clearly labelled, never active in production)

| If this is empty in `server/.env`… | …then in development | In production (`NODE_ENV=production`) |
| --- | --- | --- |
| `SMTP_*` / `EMAIL_FROM` | Emails (password reset, and verification if turned on) are **printed in the API terminal** | Password reset is unavailable; links are never shown in the browser. With verification on, the server **refuses to start** |
| `CLOUDINARY_*` | Photos saved to `server/uploads/` | Server **refuses to start** |

---

## 3. Environment variables

`server/.env` was created for you with a random `JWT_SECRET` and `COLLEGE_EMAIL_DOMAINS=sst.scaler.com`.
**Never paste these values into chat or commit them**: `.env` is in `.gitignore`.

| Variable | Secret? | What it is |
| --- | --- | --- |
| `MONGODB_URI` | 🔒 yes | Atlas connection string (section 4) |
| `JWT_SECRET` | 🔒 yes | Signs login tokens. Already generated |
| `CLIENT_URL` | no | Frontend URL(s) allowed by CORS + used in email links |
| `COLLEGE_EMAIL_DOMAINS` | no | `sst.scaler.com` (comma-separate to add more) |
| `CLOUDINARY_CLOUD_NAME` | no | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | 🔒 yes | From Cloudinary dashboard |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | 🔒 `SMTP_PASS` | Email provider SMTP credentials |

**Frontend** (`client/.env`) has only one *public* value, `VITE_API_URL`, which is needed **only in production**.
Anything starting with `VITE_` is baked into the JavaScript that every visitor downloads. That's why no secret ever goes there.

**If a secret is ever committed or leaked:** rotate it immediately. Generate a new `JWT_SECRET` (logs everyone out),
change the Atlas database user's password, regenerate the Cloudinary API secret, and revoke the SMTP key. Deleting the commit is not enough: assume it was copied.

---

## 4. MongoDB Atlas (required)

1. Go to **https://www.mongodb.com/cloud/atlas/register** and sign up (Google sign-in is fine).
2. **Create a deployment** → choose the **Free (M0)** tier → pick a region close to you (e.g. Mumbai) → *Create*.
3. **Database user**: Atlas asks you to create one. Username e.g. `boomerang_app`, click **Autogenerate secure password**, copy it somewhere safe *on your computer*.
   Under *Database User Privileges* choose **Read and write to any database** (or, stricter: *Specific privileges* → `readWrite` on database `lostfound`).
4. **Network Access** → *Add IP Address* → **Add Current IP Address**. (Don't use `0.0.0.0/0` for local work. See section 7 for hosting.)
5. **Connect** → *Drivers* → copy the string. It looks like
   `mongodb+srv://boomerang_app:<db_password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Edit it: replace `<db_password>` with your password, and add the database name **`lostfound`** after `.net/`:
   `mongodb+srv://boomerang_app:YOURPASSWORD@cluster0.xxxxx.mongodb.net/lostfound?retryWrites=true&w=majority`
   (If your password contains `@ : / ? #`, regenerate one without symbols, or URL-encode it.)
7. Open `server/.env` in VS Code and paste it after `MONGODB_URI=`. Save.
8. Test: `npm run dev`. You should see `✔ MongoDB connected (database: lostfound)`. Open http://localhost:5050/api/health → `"database":"connected"`.
9. Verify data is really saved: register an account, then in Atlas → **Browse Collections** → `lostfound` → `users`. Your user is there (password stored only as a bcrypt hash).

Common errors: *authentication failed* → wrong user/password · *timed out* → your IP isn't in Network Access (it changes on new Wi-Fi) · *querySrv ENOTFOUND* → re-copy the string.

---

## 5. Cloudinary (required for production, recommended now)

1. Sign up at **https://cloudinary.com/users/register_free**.
2. On the **Dashboard** (or *Settings → API Keys*), find **Cloud name**, **API Key**, **API Secret**.
3. Put them in `server/.env`: `CLOUDINARY_CLOUD_NAME=`, `CLOUDINARY_API_KEY=`, `CLOUDINARY_API_SECRET=`. Restart `npm run dev`.
   The startup warning about local images disappears, and `/api/health` shows `"storage":"cloudinary"`.
4. Test: report a found item with a photo. In Cloudinary → **Media Library** you'll see it in the `campus-lost-found` folder.
   Refresh the app and open it on your phone: the photo still loads, because it's served from Cloudinary.

Uploads always go **through our server** (`POST /api/uploads`), so the API secret never reaches the browser.
The browser also shrinks photos and strips EXIF data (including GPS location) before upload.

---

## 6. Email: Brevo SMTP (required for production)

Any SMTP provider works. **Brevo** has a free daily allowance and no domain needed to start (check their pricing page for current limits).

1. Sign up at **https://www.brevo.com**.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: use an email you own (e.g. your Gmail) and click the confirmation link Brevo sends.
3. **SMTP & API → SMTP tab → Generate a new SMTP key**. Copy it.
4. In `server/.env`:
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=   (the "Login" shown on Brevo's SMTP page)
   SMTP_PASS=   (the SMTP key)
   EMAIL_FROM=boomerang <the-sender-you-verified@example.com>
   ```
5. Restart. The "Email: DEV MODE" warning disappears. Register with a real `@sst.scaler.com` address and the email arrives (check spam the first time).

> College mail servers sometimes filter mail from new senders. If emails don't arrive, check spam/quarantine, or ask IT to allowlist the sender.

### What email verification does and doesn't prove
It proves the person can read a `@sst.scaler.com` inbox. It does **not** prove they are a *current* student or employee
(e.g. alumni accounts that remain active). For stronger assurance, an admin-approval step or college SSO (Google Workspace / Microsoft Entra) could be added later.

---

## 7. Deploy (Render API + Vercel frontend)

Push to GitHub first (`.env` files are ignored, so double-check with `git status` that no `.env` appears).

### Backend → Render (https://render.com)
1. **New → Web Service** → connect the GitHub repo.
2. **Root Directory:** `server` · **Build Command:** `npm install` · **Start Command:** `npm start` · Instance: Free.
3. **Environment** tab: add every variable from your `server/.env`, plus `NODE_ENV=production`. Leave `PORT` out (Render sets it).
   Set `CLIENT_URL` to your Vercel URL (step below), e.g. `https://boomerang-xyz.vercel.app`.
4. **Atlas network access for Render:** Render's free instances don't have a fixed IP. Check your service's **Connect → Outbound** panel for its outbound IP ranges and add those in Atlas.
   If none are listed for your plan, the fallback is `0.0.0.0/0`. Only do that with a long random DB password and a user limited to `readWrite` on `lostfound`.
5. Deploy, then open `https://YOUR-API.onrender.com/api/health`. It should show `"database":"connected"`.
   Free Render services sleep when idle; the first request after a nap can take ~30–60 s. Open the health URL a minute before your demo.

### Frontend → Vercel (https://vercel.com)
1. **Add New → Project** → import the repo.
2. **Root Directory:** `client` · Framework: **Vite** (build `npm run build`, output `dist`, auto-detected).
3. **Environment Variables:** `VITE_API_URL=https://YOUR-API.onrender.com` (no trailing slash).
4. Deploy. Copy the Vercel URL back into Render's `CLIENT_URL` and redeploy Render (CORS + email links depend on it).
5. Test on the live URL: register → email → verify → post item with photo → chat from a second browser/phone.

`client/vercel.json` makes page refreshes on routes like `/items/123` work.

**Deployment errors:** CORS error in browser console → `CLIENT_URL` doesn't exactly match the Vercel URL. "Can't reach the server" → wrong `VITE_API_URL` or Render asleep/crashed (check Render logs). Server exits on boot → its log lists the missing variables.

---

## 8. Test checklist (use two accounts in two browsers, e.g. Chrome + Edge or Chrome + incognito)

- [ ] Register with a non-college email → rejected with a clear message
- [ ] Register with `@sst.scaler.com` → "check your inbox" → verify link → dashboard
- [ ] Visiting `/messages` while signed out redirects to sign-in
- [ ] Report a **lost** item (no photo) and a **found** item (photo required)
- [ ] Gallery upload on laptop; **Take photo** on a phone (opens the camera on most phones; some browsers show the file picker instead, which still works)
- [ ] Search + category/location/date filters on Lost and Found pages
- [ ] Found report shows **Potential matches** for a similar lost report
- [ ] User B → item → "contact owner" → message arrives instantly for user A, with typing indicator + unread badge
- [ ] Log out and back in → the conversation is still there
- [ ] User B can't edit/delete A's report (no buttons; API returns 403)
- [ ] Mark resolved → shows "Reunited", appears under Recently reunited, B gets a notification
- [ ] Refresh any page → data persists. Try a phone-width window.

---

## 9. API reference (all under `/api`)

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/auth/config` | — |
| POST | `/auth/register`, `/auth/login`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password` | — (rate-limited) |
| GET | `/auth/me` · POST `/auth/resend-verification` | signed in |
| GET | `/items?type&q&category&location&from&to&status&sort&page&limit` | verified |
| GET | `/items/stats`, `/items/mine`, `/items/:id`, `/items/:id/matches` | verified |
| POST / PATCH / DELETE | `/items`, `/items/:id`, `/items/:id/status` | verified, owner for changes |
| POST | `/uploads` (multipart field `image`) | verified |
| GET / POST | `/conversations`, `/conversations/:id`, `/conversations/:id/messages`, `/conversations/:id/read` | participants only |
| GET / PATCH / POST | `/notifications`, `/notifications/counts`, `/notifications/:id/read`, `/notifications/read-all` | verified |
| GET / PATCH | `/users/:id`, `/users/me`, `/users/me/password` | verified |

Socket.IO: connect with `auth: { token }`. Server → client: `message:new`, `notification:new`, `conversation:read`, `typing`, `presence:list`, `presence:update`. Client → server: `typing` (membership checked).
