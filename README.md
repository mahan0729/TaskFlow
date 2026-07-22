# TaskFlow

A full-stack SaaS task management application built to demonstrate production-grade software engineering across the entire stack — from database design and REST API development to React UI, cloud deployment, and third-party integrations.

**Live demo:** https://taskflow-web.azurewebsites.net

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | .NET 10 Web API, EF Core 10, BCrypt, JWT Bearer |
| Database | Azure SQL (SQL Server), EF Core Migrations |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v3 |
| Auth | JWT access tokens + refresh tokens, email verification (6-digit codes) |
| Payments | Stripe Checkout, webhooks, subscription management |
| Email | SendGrid transactional email |
| Hosting | Azure App Services (Linux) — separate API and Web instances |
| CI/CD | Azure DevOps Pipelines (build → deploy on push to main) |
| Desktop | Electron 42 wrapper (Windows & Mac) |

---

## Features

### Core Workflow
- **8-stage Kanban board** — Backlog → Grooming → Ready → Dev → QA → Demo → UAT → Production
- Horizontally scrollable board with color-coded columns per stage
- Task creation with title, description, priority (Low / Medium / High), status, due date, and project assignment
- Task self-assignment — take or release ownership of any task

### Authentication & Accounts
- Email/password registration with SendGrid email verification (6-digit code)
- Forgot password / reset password via emailed code
- JWT access tokens with refresh token rotation
- Profile page — update name, change password

### Projects
- Unlimited projects (Free plan), each with a name, description, and color swatch
- Per-project task count displayed on project cards

### Billing
- Free plan (10-task limit) and Pro plan ($9/mo, unlimited tasks)
- Stripe Checkout integration — secure hosted payment flow
- Stripe webhook handler for subscription lifecycle events
- Manual plan override available to admins

### Admin Panel
- Platform stats — total users, free/pro split, projects, tasks
- Create, edit, and delete user accounts
- Toggle Admin role and manually set plan per user
- Stripe Subscription ID visible per user (tooltip)

### UX Details
- Portal-based tooltip system (top / bottom / left / right with arrow)
- Password visibility toggle on all password fields
- Contextual tooltips throughout — actions, priority badges, plan badges, stat cards
- Copyright footer, responsive layout, dark sidebar with plan badge

---

## Architecture

```
TaskFlow/
├── TaskFlow.API/          # .NET 10 Web API
│   ├── Controllers/       # Auth, Tasks, Projects, Billing, Admin
│   ├── Models/            # Request/response records
│   └── Services/          # AuthService, StripeService, SendGridEmailService, TokenService
├── TaskFlow.Data/         # EF Core DbContext, Entities, Migrations
│   ├── Entities/          # User, Project, TaskItem, RefreshToken
│   └── Migrations/        # Full migration history with backfill SQL
├── TaskFlow.Web/          # React 19 + TypeScript frontend
│   └── src/
│       ├── components/    # Layout, ProtectedRoute, Tooltip, PasswordInput
│       ├── context/       # AuthContext (global auth state)
│       ├── pages/         # Dashboard, Tasks, Projects, Billing, Profile, Admin, Help, Auth flows
│       ├── services/      # Axios-based API service layer
│       └── types/         # Shared TypeScript interfaces
└── TaskFlow.Electron/     # Electron desktop wrapper
```

---

## Local Development

### Prerequisites
- .NET 10 SDK
- Node.js 22 LTS
- SQL Server (local) or Azure SQL
- SendGrid account (for email)
- Stripe account (for billing)

### API Setup
```bash
cd TaskFlow.API
# Create appsettings.Development.json with your local connection string,
# JWT secret, Stripe keys, and SendGrid API key (see appsettings.json for structure)
dotnet run
```

### Frontend Setup
```bash
cd TaskFlow.Web
npm install
npm run dev
```

The React app runs on `http://localhost:5173` and proxies API calls to `http://localhost:5028`.

### Database
EF Core migrations run automatically on API startup via `dbContext.Database.Migrate()`.

---

## CI/CD

Every push to `main` triggers an Azure DevOps pipeline that:
1. Builds the .NET 10 API and publishes a release artifact
2. Runs `npm run build` on the React frontend
3. Deploys the API to `taskflow-api.azurewebsites.net`
4. Wraps the React dist in a minimal Express static server and deploys to `taskflow-web.azurewebsites.net`
5. Applies EF Core migrations automatically on API cold start

Secrets (connection string, JWT secret, Stripe keys, SendGrid API key) are stored as encrypted Azure DevOps pipeline variables and injected as App Service environment variables at deploy time.

---

## About

Built by **Matt Mahan** — Software Architect with 15+ years of experience in .NET, React, and Azure.

- LinkedIn: https://www.linkedin.com/in/mattmahan
- Email: mahanster@gmail.com
