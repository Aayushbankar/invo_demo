# How to Test InvoDemo via Docker

## Prerequisites

- Docker & Docker Compose installed
- An OpenAI API key

## Step 1: Clone & Enter

```bash
git clone <repo-url> invo_demo
cd invo_demo
```

## Step 2: Run the setup script

Pass your OpenAI API key as the only parameter:

```bash
chmod +x run.sh
./run.sh sk-your-openai-api-key-here
```

That's it. The script will:
- Generate all Supabase secrets automatically
- Configure environment variables
- Start all Docker services (PostgreSQL, Auth, Storage, Studio, API Gateway, Next.js app)
- Wait for the database to be healthy
- Run the database migration (creates all tables, RLS policies, triggers)
- Create the storage bucket for company logos

## Step 3: Open the app

- **App**: http://localhost:3000
- **Supabase Studio** (optional): http://localhost:3002 (username: `supabase`, password: `password`)

## Step 4: Create an account

1. Go to http://localhost:3000
2. Click **Sign up**
3. Enter name, email, password
4. You'll be redirected to the dashboard

## Step 5: Test the features

### AI Invoice Generation
1. Click **AI Generator** in the sidebar (or go to `/invoices/new`)
2. Type or paste: `Generate an invoice for Ruturaj Rathod. Items: Bicycle 500, Helmet 200. Tax 18%. Payment due in 15 days.`
3. Click **Generate Invoice**
4. Review the auto-filled form, edit if needed, click **Save Invoice**

### Voice Input
1. On the AI Generator page, click the microphone icon
2. Speak your invoice description
3. The text will appear in the prompt box
4. Click **Generate Invoice**

### Manual Invoice Creation
1. Go to **Invoices** and click **New Invoice**
2. Skip the AI prompt, scroll down to the form
3. Fill in customer details, add line items, set tax/discount
4. Click **Save Invoice**

### Invoice List and Search
1. Go to **Invoices** in the sidebar
2. Use the search bar to find by customer name or invoice number
3. Use the status filter dropdown (Pending, Paid, Overdue, etc.)

### Invoice Preview and QR Code
1. Click any invoice in the list
2. See the professional invoice layout with QR code
3. Click **Print** to print or save as PDF

### Export
1. On the Invoices list page, click **CSV** or **JSON** to export all invoices

### Analytics
1. Go to **Analytics** in the sidebar
2. After generating a few AI invoices, see token usage charts and cost tracking

### Cost Calculator
1. Go to **Cost Calculator**
2. Adjust server cost, AI requests, users, etc.
3. Click **Calculate Costs** to see estimated monthly costs

### Settings
1. Go to **Settings**
2. Update company name, logo, default currency, tax rate
3. Upload a company logo
4. Set your UPI VPA for payment QR codes
5. Choose the AI model (GPT-4o, GPT-4o Mini, GPT-4 Turbo)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 already in use | `docker compose down` then change port in docker-compose.yml |
| Database connection error | Wait 30s for DB to fully start, or run `docker compose restart db` |
| AI generation fails | Check your OpenAI key has credits. Check `OPENAI_API_KEY` in `.env` |
| Logo upload fails | Run the storage bucket SQL from Step 2 manually in Supabase Studio |
| Build errors | Run `docker compose build --no-cache app` |

## Stopping

```bash
docker compose down          # Stop containers (keep data)
docker compose down -v       # Stop containers AND delete all data
```

## Rebuilding after code changes

```bash
docker compose build app && docker compose up -d app
```
