# LinkEnhancer: Full-Stack URL Shortener with Analytics

LinkEnhancer is a performance-focused URL Shortener application built with React, Node.js/Express, and MongoDB. It features instant redirects, non-blocking click-telemetry analytics (capture browser, device, and IP metrics), user authentication, and a dashboard workspace.

---

## 🛠️ Tech Stack
* **Frontend**: React (Vite SPA), Axios, React Router v6, custom CSS variables.
* **Backend**: Node.js, Express, Mongoose (MongoDB ODM), JWT (authentication), bcryptjs (password security).
* **Database**: MongoDB.

---

## 📂 Project Structure
```
Katamaran TECH/
├── backend/                 # Express REST API & redirection wildcard engine
│   ├── src/
│   │   ├── config/          # DB connector & env parser
│   │   ├── controllers/     # Route logic request controllers
│   │   ├── middlewares/     # JWT Auth, rate limiters, error captures
│   │   ├── models/          # User, Url, and Analytics schemas
│   │   ├── routes/          # Routers
│   │   ├── utils/           # User-agent parse, code builders
│   │   └── validators/      # Payload validators
│   ├── server.js            # Start script
│   └── package.json
│
├── frontend/                # Vite React dashboard client
│   ├── src/
│   │   ├── components/      # UI templates (Layout wrapper)
│   │   ├── contexts/        # AuthContext globally shared authentication
│   │   ├── pages/           # Login, Signup, Dashboard, Analytics views
│   │   ├── services/        # Axios API instances with interceptors
│   │   ├── index.css        # Premium style theme sheet
│   │   ├── App.jsx          # Route handlers
│   │   └── main.jsx         # DOM entry renderer
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)
* [MongoDB](https://www.mongodb.com/try/download/community) running locally (port `27017`) or a MongoDB Atlas connection string.

---

### Step 1: Configure & Start Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up your environment variables. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and verify settings:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/url-shortener
   JWT_SECRET=supersecretjwtkeychangeinproduction
   JWT_EXPIRE=24h
   NODE_ENV=development
   ```
   *Note: If port `5000` is already in use by another process, change `PORT` to another port (e.g., `5001`).*

4. Run in development mode:
   ```bash
   npm run dev
   ```
   *The API will start running at `http://localhost:5000`.*

---

### Step 2: Start Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend dashboard client will boot on `http://localhost:3000`.*

---

## 🔒 Security Practices Implemented
1. **Blowfish-Crypt (bcrypt) Hashing**: Raw user passwords are automatically hashed with a work factor of 10 prior to writing to the database.
2. **HTTP-Bearer Authorization Shielding**: Endpoints tracking statistics and link actions are blocked unless verified with a JWT signature.
3. **Cascading DB Cleanups**: Deleting a shortcode deletes all corresponding analytical click history logs to avoid database bloat.
4. **Non-blocking Redirection**: Client browser redirections are triggered instantly, while click-statistics are aggregated asynchronously in background tasks.
