# DataRola

An AI-powered data-analyst agent that connects to your spreadsheets, databases, and BI tools — then lets you ask questions in plain English and get instant charts and tables back.

Explore the docs » · View Demo · Report Bug · Request Feature

## Table of Contents

- [About The Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## About The Project

DataRola eliminates the friction between your data and the people who need to understand it. Connect Google Sheets, Airtable, PostgreSQL, MySQL, Redshift, Snowflake, or BigQuery in one click — then ask natural-language questions and get back accurate numbers, visualizations, and anomaly alerts. No SQL knowledge required.

### Why DataRola?

- **Zero setup.** Paste a link or pick from your account — the connector handles the rest.
- **Natural language queries.** "What's our MRR trend over the last 6 months?" → chart in seconds.
- **Multi-source analysis.** Combine data from Google Sheets, Airtable, and Postgres in a single query.
- **Anomaly detection.** Automatic outlier alerts so you catch problems before they escalate.

This project is a working prototype (pre-alpha). Features and architecture are subject to change.

(back to top)

---

## Built With

![Next.js](https://img.shields.io/badge/Next.js-000?logo=next.js&logoColor=fff&style=flat-square)
![React](https://img.shields.io/badge/React-20232A?&logo=react&logoColor=61DAFB&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?&logo=typescript&logoColor=white&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?&logo=tailwind-css&logoColor=white&style=flat-square)

- **[Next.js 15](https://nextjs.org/)** — full-stack React framework with App Router
- **[Firebase / Firestore](https://firebase.google.com/)** — authentication & real-time database
- **[Recharts](https://recharts.org/)** — composable charting library
- **[Stripe](https://stripe.com/)** — payments and subscription management
- **[Anthropic Claude API](https://www.anthropic.com/) / [Ollama](https://ollama.com/)** — AI query generation

(back to top)

---

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- A Google Cloud project with Sheets/Drive APIs enabled (for the Google Sheets connector)
- Firebase project with Firestore and Authentication enabled
- Stripe account (for billing; optional for local dev)

```bash
# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
# Firebase (required)
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY=<service-account-private-key>

# Google OAuth (required for Sheets connector)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Stripe (optional — stub billing works without it)
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>

# AI / Query Engine (one required)
ANTHROPIC_API_KEY=<your-anthropic-api-key>
OLLAMA_BASE_URL=http://localhost:11434   # optional, defaults to localhost

# Cron security
CRON_SECRET=<a-strong-random-secret>

# App URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Important:** Never commit `.env.local` or any file containing real credentials. A Google OAuth client secret JSON file (`client_secret_*.json`) is also checked in for convenience — rotate it and remove before sharing publicly.

### Running Locally

```bash
# Development server
npm run dev
# Opens http://localhost:3000

# Production build
npm run build
npm start
```

### Project Structure

```
src/
  app/               # Next.js App Router pages & API routes
    (auth)/          # Auth gateways: sign-in, sign-up, onboarding
    (billing)/       # Billing/subscription UI
    api/             # REST API endpoints (OAuth callbacks, cron, webhooks)
  components/        # Reusable React components
  lib/               # Core logic: connectors, query engine, analytics
public/              # Static assets (favicon, images)
```

(back to top)

---

## Usage

1. **Sign in** with Google on the sign-up page.
2. **Complete onboarding** — enter your display name and connect at least one data source.
3. **Ask a question** in the chat input — DataRola translates it to SQL (or its internal query language) and runs it against your connected sources.
4. **View results** as tables or charts, depending on the query type.
5. **Set up anomaly alerts** in Settings to receive notifications when your data deviates from normal patterns.

### Connecting a Data Source

DataRola supports:

| Connector     | Status        |
|---------------|---------------|
| Google Sheets | Active        |
| Airtable      | Active (OAuth)|
| CSV / XLSX    | Upload        |
| PostgreSQL    | Coming Soon   |
| MySQL         | Coming Soon   |
| Redshift      | Coming Soon   |
| Snowflake     | Coming Soon   |
| BigQuery      | Active        |

(back to top)

---

## Roadmap

- [x] Google Sheets & Airtable OAuth connectors
- [x] CSV/XLSX upload
- [x] Natural language → query translation (Claude API / Ollama)
- [x] Chart and table visualizations
- [ ] PostgreSQL, MySQL, Redshift connector parity
- [ ] Real anomaly detection with email notifications
- [ ] Scheduled reports (daily/weekly PDF/email)
- [ ] Team collaboration & sharing
- [ ] Full test suite

See the open [issues](#) for a full list of proposed features and known issues.

(back to top)

---

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

(back to top)

---

## License

Distributed under the Unlicense License. See `LICENSE.txt` for more information.

(back to top)

---

## Contact

Project Link: [github.com/ThinkerDesigns/datarola](#)

(back to top)
