# 🌐 LinkEnhancer: Production Deployment Guide

Follow this guide to host and deploy the **LinkEnhancer** project online for free. The architecture uses:
1. **Database**: [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) (Free Shared Cluster)
2. **Backend REST API**: [Render](https://render.com) (Free Web Service)
3. **Frontend Client UI**: [Vercel](https://vercel.com) (Free Hobby Plan)

---

## 💾 Step 1: Create a MongoDB Database on MongoDB Atlas

Since a local MongoDB database won't be accessible by your hosted backend, you must create a free hosted database instance:

1. **Sign Up**: Register a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. **Create Database**: Click **Create** and select the **M0 (Free)** shared cluster tier. Choose a cloud provider (e.g., AWS) and region nearest to you.
3. **Set Security Credentials**:
   - Create a database user with a secure password (make sure to write it down).
   - In **IP Access List**, click **Add IP Address** and choose **Allow Access from Anywhere** (`0.0.0.0/0`) so your hosted backend container can connect.
4. **Get Connection String**:
   - Go to your Cluster dashboard, click **Connect** -> **Drivers**.
   - Copy the connection URI string. It will look like:
     `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<password>` with your database user's password.

---

## 🖥️ Step 2: Deploy the Backend API to Render

[Render](https://render.com) is a free cloud platform perfect for hosting Node.js servers.

1. **Push Code to GitHub**: Create a repository on your GitHub account and push the latest version of this workspace.
2. **Sign In to Render**: Log in to [Render](https://dashboard.render.com) using your GitHub account.
3. **Create New Web Service**:
   - Click **New +** -> **Web Service**.
   - Select your repository from the Git list.
4. **Configure Settings**:
   - **Name**: `link-enhancer-api`
   - **Root Directory**: `backend` (⚠️ Important: set this to the `backend` folder)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. **Set Environment Variables**:
   Click **Advanced** -> **Add Environment Variable** and add the following:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: *[Your MongoDB Atlas Connection String from Step 1]*
   - `JWT_SECRET`: *[Create a random long secure string]*
   - `JWT_EXPIRE`: `24h`
   - `GEMINI_API_KEY`: *[Your Google Gemini API Key]*
   - `CORS_ORIGIN`: `https://your-frontend-app.vercel.app` *(You can update this after Vercel deployment)*
6. **Deploy**: Click **Create Web Service**. Wait for the logs to say `Server running...`.
7. **Copy API URL**: Copy the Render URL (e.g., `https://link-enhancer-api.onrender.com`).

---

## 🎨 Step 3: Deploy the Frontend UI to Vercel

[Vercel](https://vercel.com) provides instant hosting for React/Vite applications.

1. **Sign In to Vercel**: Log in to [Vercel Dashboard](https://vercel.com/dashboard) with GitHub.
2. **Add New Project**:
   - Click **Add New** -> **Project**.
   - Import your GitHub repository.
3. **Configure Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (⚠️ Important: set this to the `frontend` folder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Set Environment Variables**:
   Expand the Environment Variables section and add:
   - `VITE_API_URL`: *[Your Backend API Render URL from Step 2, ending in `/api/v1`]*
     *Example*: `https://link-enhancer-api.onrender.com/api/v1`
5. **Deploy**: Click **Deploy**. Vercel will build and assign you a free production URL (e.g., `https://link-enhancer-ui.vercel.app`).

---

## 🔗 Step 4: Link CORS Configuration (Final Touch)

To prevent CORS security blocks when your frontend communicates with the backend, update the backend configuration:

1. Go back to your Render Dashboard for `link-enhancer-api`.
2. Navigate to **Environment**.
3. Update `CORS_ORIGIN` to match your new Vercel frontend URL:
   - *Example*: `CORS_ORIGIN` = `https://link-enhancer-ui.vercel.app`
4. Save changes. Render will automatically redeploy the backend with the new allowed origin.

---

🎉 **Congratulations! Your AI-powered URL shortener and analytics suite is now live, secure, and ready to share!**
