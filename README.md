# 🇨🇴 Colombian Tax Optimizer (Monorepo)

A high-precision, enterprise-grade tax optimization platform for Colombian individual income tax.

## Project Structure

This project is organized as a monorepo:

- **[`apps/web`](./apps/web)**: Next.js 14 Web Application for the Tax Calculator & UI.
- **[`apps/analytics`](./apps/analytics)**: Python/Node data analysis scripts and tools.
- **[`docs`](./docs)**: Project documentation and architecture guides.

## Quick Start

### Web App

```bash
cd apps/web
npm install
npm run dev
```

### Analytics

```bash
cd apps/analytics
npm install
# Running analysis scripts
node analyze.js
```

## Documentation

- [Agent Rules & Architecture](./docs/agents.md)
- [Tax Engine Documentation](./apps/web/TAX_ENGINE_DOCUMENTATION.md)
- [Year Versioned Architecture](./docs/YEAR_VERSIONED_ARCHITECTURE.md)

## License

Private Project. All rights reserved.
