# Automated Monitoring & Alert System

A robust, full-stack event monitoring, compliance verification, and instant notification platform built with React, TypeScript, Express, and PostgreSQL.

Designed as a modular, production-ready blueprint, this system automates scheduled queries against official sources or third-party portals, detects new records or infractions, computes applicable prompt-payment discounts, and dispatches real-time alerts via messaging providers (such as WhatsApp Business Cloud API).

---

## Key Architecture & Capabilities

- **Dual-Storage Engine Architecture**:
  - **Managed PostgreSQL**: Native transactional pool (`pg`) with ACID compliance, relational integrity (`FOREIGN KEY`, `UNIQUE`, `ON DELETE RESTRICT`), and Row-Level Security (RLS).
  - **In-Memory Volatile Store**: Seamless fallback store for offline testing, CI/CD pipelines, and isolated local development without requiring an active database instance.
- **Fail-Fast Safety Mandate**:
  - If a production database connection string (`DATABASE_URL`) is configured but unreachable, the application **strictly blocks silent fallbacks to memory**, preventing data fragmentation and protecting state consistency.
- **Deterministic Deduplication Engine**:
  - Two-stage verification preventing duplicate alerts:
    1. Unique compound constraint: `(vehiculo_id, fuente_identificador, identificador_externo)`
    2. Material fact hash: SHA-256 fingerprint of `(vehiculo_id, fecha_infraccion, concepto)`
- **Institutional & Trust-Oriented UI**:
  - Built with **React 18**, **Tailwind CSS**, and **Plus Jakarta Sans**.
  - Immediate compliance assessment: instant status display ("Clean record" vs. "Pending record detected") with itemized discounts and statutory deadlines.
  - Operator administration console with tabular audits, manual review logging, and automated WhatsApp alert dispatching.
- **Auditing & Traceability**:
  - Immutable audit trail recording every state change, transaction rollback, and notification attempt.

---

## Adaptable Use Cases

While initially configured for vehicle citation monitoring and prompt-payment discount alerts under user mandate, this architecture readily adapts to:

1. **Regulatory & Tax Compliance Monitoring**: Tracking tax filings, municipal permits, and governmental gazette notifications.
2. **Utility & Service Billing Alerts**: Monitoring commercial utilities, property taxes, or recurring subscription invoices with early-payment incentives.
3. **Court Docket & Legal Gazette Watchers**: Automated legal search and notification when specific case numbers or party names appear in court publications.
4. **Logistics & Fleet Fleet Management**: Periodic status verification of vehicle registrations, emission verification tests, and municipal road permits.

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- (Optional for production) **PostgreSQL** instance (Neon, Supabase, AWS RDS, Cloud SQL, or local Docker)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/automated-monitoring-alert-system.git
   cd automated-monitoring-alert-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example configuration file:
   ```bash
   cp .env.example .env
   ```

   Configure your variables in `.env`:
   ```env
   # PostgreSQL Connection (leave blank for in-memory volatile demo mode)
   DATABASE_URL=postgres://user:password@host:5432/dbname?sslmode=require

   # Administrative Access Key (Required for /api/admin endpoints)
   ADMIN_SECRET_KEY=your_secure_admin_key_here

   # WhatsApp Business Cloud API (Optional for live alert dispatch)
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
   ```

4. **Run Database Migrations (if using PostgreSQL):**
   ```bash
   npm run migrate
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## Testing & Verification

The project includes an end-to-end test suite testing both the in-memory store and real PostgreSQL instances:

```bash
npm test
```

### Test Scope:
- In-memory repository operations (CRUD, referential integrity, deduplication).
- Real PostgreSQL integration (foreign key constraints, rollback on error, unique constraints).
- Row-Level Security (RLS) enforcement on all core tables.

---

## Security & Privacy

- **Row-Level Security (RLS)**: Enforced across all core tables to prevent unauthorized client-side access.
- **Zero Hardcoded Secrets**: All authentication keys, connection strings, and tokens are read strictly from runtime environment variables.
- **Explicit Mandate & Privacy Notice**: Integrated onboarding compliant with privacy regulations, obtaining explicit user authorization before periodic monitoring.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
