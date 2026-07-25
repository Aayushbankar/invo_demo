# InvoDemo - AI-Powered Invoice Generator

A production-ready full-stack web application that generates professional invoices using natural language or voice input, powered by OpenAI's structured outputs.

## Features

- **AI Invoice Generation** - Describe invoices in natural language; AI extracts structured data
- **Voice Input** - Use browser speech recognition to dictate invoice details
- **Invoice CRUD** - Create, edit, view, delete invoices with full form validation
- **Invoice Preview** - Professional printable invoice layout with QR codes
- **PDF Export** - Generate PDF invoices using react-pdf
- **Search & Filters** - Search by customer/invoice number, filter by status/date/amount
- **Export** - Export invoices as CSV or JSON
- **Analytics Dashboard** - Track AI usage, token consumption, and costs
- **Cost Calculator** - Estimate AI and infrastructure costs with amortization
- **Company Settings** - Configure company info, logo upload, AI model, currency
- **Dark/Light Mode** - Full theme support with next-themes
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Authentication** - Secure auth via Supabase Auth
- **Row-Level Security** - Database-level data isolation per user

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Forms | React Hook Form + Zod validation |
| State | TanStack Query (React Query v5) |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL 17 (self-hosted Supabase) |
| Auth | Supabase Auth (GoTrue) |
| Storage | Supabase Storage |
| AI | OpenAI Responses API (Structured Outputs) |
| PDF | @react-pdf/renderer |
| QR Code | qrcode.react + qrcode |
| Voice | Web Speech API |
| Charts | Recharts |
| Deploy | Docker + Docker Compose |

## Project Structure

```
invo_demo/
├── docker-compose.yml          # App + Supabase stack
├── Dockerfile                  # Multi-stage Next.js build
├── .env.example                # Environment variables template
├── supabase/
│   ├── docker/                 # Supabase Docker volumes
│   └── migrations/
│       ├── 001_initial_schema.sql   # Database schema
│       └── 002_seed_data.sql        # Demo data
└── src/
    ├── app/                    # Next.js App Router pages
    │   ├── (auth)/             # Login, Signup
    │   ├── (dashboard)/        # Dashboard, Invoices, Analytics, Costs, Settings
    │   └── api/                # REST API routes
    ├── components/             # React components
    │   ├── ui/                 # shadcn/ui components
    │   ├── layout/             # Sidebar, TopNav, ThemeToggle
    │   ├── dashboard/          # Stats, Charts, RecentInvoices
    │   ├── invoices/           # InvoiceForm, InvoiceList
    │   ├── ai/                 # AI Generator, Voice Input
    │   ├── pdf/                # PDF templates
    │   └── costs/              # Cost Calculator
    ├── lib/                    # Core utilities
    │   ├── supabase/           # Client, Server, Admin clients
    │   ├── openai.ts           # OpenAI client + pricing
    │   └── utils.ts            # Helpers
    ├── services/               # Business logic
    │   ├── invoice.service.ts  # Invoice CRUD
    │   ├── ai.service.ts       # OpenAI integration
    │   ├── analytics.service.ts
    │   └── cost.service.ts
    ├── schemas/                # Zod validation schemas
    └── types/                  # TypeScript interfaces
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- OpenAI API key

### 1. Clone and configure

```bash
git clone <repo-url> invo_demo
cd invo_demo
cp .env.example .env
```

Edit `.env` and set:
- `OPENAI_API_KEY` - Your OpenAI API key
- Supabase keys (generated during step 2)

### 2. Start Supabase (first time)

```bash
# Generate Supabase secrets
git clone --depth 1 https://github.com/supabase/supabase /tmp/supabase
cp -rf /tmp/supabase/docker/volumes supabase/docker/
cp /tmp/supabase/docker/.env.example supabase/docker/.env

# Start database first to run migrations
docker compose up db -d
sleep 10

# Run migrations
docker compose exec db psql -U postgres -f /docker-entrypoint-initdb.d/migrations/001_initial_schema.sql
```

### 3. Start the full stack

```bash
docker compose up -d
```

This starts:
- **App** at `http://localhost:3000`
- **Supabase Studio** at `http://localhost:3002`
- **PostgreSQL** at `localhost:5432`

### 4. Create your account

1. Open `http://localhost:3000`
2. Sign up with email/password
3. You'll be redirected to the dashboard

### 5. Initialize storage bucket

Open Supabase Studio (`http://localhost:3002`) and run in the SQL editor:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');
```

## Development (without Docker)

```bash
npm install
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | Yes |
| `OPENAI_API_KEY` | OpenAI API key (server only) | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-invoice` | Generate invoice from natural language |
| GET | `/api/invoices` | List invoices (search, filter, paginate) |
| POST | `/api/invoices` | Create new invoice |
| GET | `/api/invoices/[id]` | Get invoice details |
| PUT | `/api/invoices/[id]` | Update invoice |
| DELETE | `/api/invoices/[id]` | Delete invoice |
| GET | `/api/invoices/[id]/pdf` | Get invoice data for PDF export |
| GET | `/api/analytics` | AI usage analytics |
| GET | `/api/costs` | Cost calculator data |
| GET/PUT | `/api/settings` | User settings |
| POST | `/api/upload` | Upload file (logo) |

## Database Schema

- **users** - User profiles (extends auth.users)
- **invoices** - Invoice records
- **invoice_items** - Line items per invoice
- **ai_requests** - AI API call logs
- **settings** - User preferences
- **audit_logs** - Activity audit trail

See `supabase/migrations/001_initial_schema.sql` for full schema with RLS policies.

## Architecture Decisions

- **Lazy Supabase clients** - Created per-request, not at module level (prevents build-time env var issues)
- **OpenAI structured outputs** - Uses JSON schema for guaranteed valid invoice data extraction
- **Server-side AI key** - OpenAI API key never exposed to frontend
- **RLS policies** - Each user can only access their own data at the database level
- **Zod schemas** - Shared between form validation and API input validation
- **Standalone output** - Next.js standalone mode for optimized Docker builds

## License

MIT
