# Next.js Installment Payment System (Neon PostgreSQL + Vercel + Google Auth)

A full-stack Web Application built with **Next.js 14**, **Prisma ORM**, **Neon PostgreSQL**, **NextAuth Google OAuth**, and **Tailwind CSS**.

## Features

1. **Google OAuth with Security Guardrail:**
   - When a user logs in with Google for the first time, a database record is automatically created in Neon PostgreSQL with `isActive: false`.
   - The user **cannot access** the dashboard until an admin manually sets `isActive = true` in PostgreSQL.

2. **Categorized Installment Financing ("Installment pay for what?"):**
   - Built-in support for **Phone**, **Laptop**, **Computer**, **Motorbike**, and custom categories.

3. **Dual Table Calculation Engine (Matching Excel Model):**
   - **Internal Accounting Table:** Full schedule displaying Principal Paid, 3% Monthly Interest Profit, Total Cost, and Ending Balance.
   - **Customer Payment Table:** Simplified view containing **ONLY Month, Starting Balance, and Total Monthly Payment**.

4. **Multi-Format Export:**
   - One-click export to **Excel (.XLSX)** containing both tabs.
   - One-click export to **PDF Customer Receipt** formatted for direct printing or quotation.

---

## Local Setup Instructions (VS Code)

### 1. Extract & Open Project

Extract `installment-management-system.zip` and open the folder in **VS Code**.

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a file named `.env` in the root folder and paste your credentials (see `.env.example`):

```env
DATABASE_URL="postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_key"
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### 4. Push Prisma Schema to Neon Database

```bash
npx prisma db push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Activating a User in Neon PostgreSQL

When a new user attempts to log in with Google, they will see an **"Account Pending Activation"** alert.

To activate the user:

1. Open your **Neon Console** (or connect via Navicat / DBeaver / psql).
2. Run the SQL command:

```sql
UPDATE "User" SET "isActive" = true WHERE email = 'user_email@gmail.com';
```

3. The user can now log in immediately.

---

## Deployment to Vercel

1. Push your repository to **GitHub**.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. In **Environment Variables**, add:
   - `DATABASE_URL` (From Neon)
   - `NEXTAUTH_URL` (`https://your-app-name.vercel.app`)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
5. Click **Deploy**.
