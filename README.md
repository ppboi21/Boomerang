# 🪃 Boomerang — Campus Lost & Found Portal

> **A members-only lost & found platform built specifically for the Scaler School of Technology community.**  
> Report lost or found items with photos, discover smart "potential match" suggestions, and chat privately in real time to reunite owners with their belongings.

---

## 🔗 Quick Links

- 🌐 **Live Website:** [https://boomerang-sst.vercel.app](https://boomerang-sst.vercel.app)  
- 🌐 **Alternative URL:** [https://boomerang-portal.vercel.app](https://boomerang-portal.vercel.app)  
- ⚙️ **Backend API (Health):** [https://boomerang-api-oqbm.onrender.com/api/health](https://boomerang-api-oqbm.onrender.com/api/health)  
- 🎥 **Demo Video (Google Drive):** [Watch Video Demonstration](https://drive.google.com/drive/folders/12JOPt04UyM7BOP13PVS8BrGJVq6MoLlH?usp=drive_link)  

---

## 🚀 Key Highlights & Features

| Feature | Description | Implementation |
| :--- | :--- | :--- |
| 🛡️ **Campus-Only Auth** | Strict domain restriction (**`@sst.scaler.com`** & **`@scaler.com`**) enforced on the server. Non-college emails are rejected. | `server/middleware/security.js` |
| 🔑 **Google Workspace OAuth** | One-tap "Continue with Google" sign-in, verifying institutional Google identity without storing passwords. | `server/controllers/google.controller.js` |
| 📸 **Cloudinary Image Pipeline** | Photos uploaded from camera or gallery are compressed, stripped of sensitive EXIF/GPS metadata, and stored on Cloudinary CDN. | `server/services/storage.js` |
| ⚡ **Smart Matching Engine** | Automatically computes potential matches between lost and found listings using category, keywords, date, and campus location. | `server/services/matching.js` |
| 💬 **Real-time Private Chat** | Socket.IO messaging with typing indicators, online/offline presence, read receipts, and MongoDB message persistence. | `server/sockets/index.js` |
| 🔔 **Notification Center** | In-app alerts for direct messages, match suggestions, and item reunions. | `server/controllers/notifications.controller.js` |
| 🎨 **Modern Kinetic UI** | Built with React 19, Tailwind CSS 4, Motion animations, and interactive 3D hero canvas with reduced-motion support. | `client/src/` |

---

## 🛠️ Architecture & Tech Stack

```
┌─────────────────────────────────┐               ┌─────────────────────────────────┐
│        Vercel (Frontend)        │               │         Render (Backend)        │
│    React 19 + Vite + Tailwind   │ ── HTTPS/WSS ─►   Express 5 + Socket.IO Server  │
│  Motion + React Three Fiber 3D  │               │      Node.js 20+ Runtime        │
└─────────────────────────────────┘               └────────────────┬────────────────┘
                                                                   │
                                           ┌───────────────────────┼───────────────────────┐
                                           ▼                       ▼                       ▼
                                  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
                                  │  MongoDB Atlas  │     │   Cloudinary    │     │  Google OAuth   │
                                  │ Database Cluster│     │  CDN Media Lib  │     │ Identity Verify │
                                  └─────────────────┘     └─────────────────┘     └─────────────────┘
```

- **Frontend:** React 19, Vite, Tailwind CSS 4, Motion, Lucide Icons, Sonner toasts.
- **Backend:** Node.js, Express 5, Socket.IO, Mongoose, Multer, Zod, Helmet.
- **Database:** MongoDB Atlas M0 Cluster.
- **Cloud Storage:** Cloudinary CDN.
- **Hosting:** Vercel (Client) + Render (API).

---

## 📂 Project Structure

```
Boomerang/
├── client/                     # Frontend Single Page Application (React + Vite)
│   ├── public/                 # Static assets, SVG icons, favicons
│   ├── src/
│   │   ├── components/         # Reusable UI widgets, ImageUploader, ChatDrawer
│   │   ├── context/            # AuthContext, PrefsContext, SocketContext
│   │   ├── hooks/              # Custom hooks for sockets, media queries
│   │   ├── pages/              # Item listings, Dashboard, Chat, AuthPage
│   │   ├── services/           # API wrapper, socket client
│   │   └── utils/              # Formatting, validation helpers
│   └── vercel.json             # SPA rewrite routing
│
├── server/                     # Backend API & Real-time Server
│   ├── config/                 # DB connection and env validation
│   ├── controllers/            # Request handlers (auth, items, chats, uploads)
│   ├── middleware/             # JWT auth, rate limits, image upload sniffing
│   ├── models/                 # Mongoose schemas (User, Item, Conversation, Message)
│   ├── routes/                 # API endpoint routing
│   ├── services/               # Cloudinary storage, matching algorithm
│   └── sockets/                # Socket.IO room & event managers
│
└── render.yaml                 # Infrastructure-as-code blueprint for Render
```

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js 20+**
- **MongoDB Atlas** database URI
- **Cloudinary** account credentials

### 1. Clone the repository
```bash
git clone https://github.com/ppboi21/Boomerang..git
cd Boomerang
```

### 2. Install dependencies
```bash
npm run install:all
```
*(Installs dependencies across the root, client, and server folders in one go).*

### 3. Configure Environment Variables

Create `server/.env`:
```env
PORT=5050
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5180
COLLEGE_EMAIL_DOMAINS=sst.scaler.com,scaler.com

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=campus-lost-found

# Google OAuth Client ID (public)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_ONLY=false
```

### 4. Seed sample data (Optional)
```bash
npm run seed          # Seeds 6 demo students, 14 mock lost & found items, and chats
npm run seed:clear    # Clears only seed data without touching real user accounts
```
*Demo credentials: `demo.aarav@sst.scaler.com` with password `demo1234`.*

### 5. Start development servers
```bash
npm run dev
```
- **Web App:** [http://localhost:5180](http://localhost:5180)
- **API Server:** [http://localhost:5050](http://localhost:5050)

---

## 🚢 Production Deployment

The project is pre-configured for automated continuous deployment:

### Backend (Render)
- Configured via `render.yaml`.
- Web service runs `npm start` in the `server` root directory.
- `CLIENT_URL` CORS header allows requests from Vercel domain origins.

### Frontend (Vercel)
- Root directory set to `client`.
- Environment variable `VITE_API_URL` points to the live Render endpoint.
- Handled with client-side SPA route rewrites in `vercel.json`.

---

## 🧪 Testing Checklist

- [x] Register with a non-college email ➔ rejected with informative error.
- [x] Sign up with `@sst.scaler.com` or `@scaler.com` ➔ account created.
- [x] "Continue with Google" ➔ instant single-sign-on verification.
- [x] Report Lost item (details, location, category).
- [x] Report Found item with photo ➔ uploaded to Cloudinary CDN.
- [x] Smart matching triggers when items share categories and keywords.
- [x] Real-time chat between users with typing indicators and unread count badges.
- [x] Mark item resolved ➔ marked "Reunited" and displays on community counter.

---

## 📄 License & Credits

Built with ❤️ for **Scaler School of Technology** students and staff.
