# 🇨🇴 Colombian Tax Optimizer

A high-precision, enterprise-grade tax engine and optimization platform for Colombian individual income tax (Declaración de Renta Personas Naturales - Formulario 210).

This application combines rigorous implementation of the Colombian Tax Statute (Estatuto Tributario) with advanced AI agents to automate data extraction, calculation, and tax planning.

## 🚀 Key Features

### 🏛️ Robust Tax Engine (`/lib/tax-engine`)

- **Full Compliance**: Implements Estatuto Tributario (Libro I) and recent reforms:
  - **Ley 2277/2022**: Dividend consolidation, new limits (1340 UVT), wealth tax (Impuesto al Patrimonio).
  - **Ley 2380/2024**: Food donation discounts.
  - **Decreto 2229/2023**: 2024-2025 tax calendar.
- **Calculators**:
  - Cédula General (Laboral, Capital, No Laboral).
  - Cédula de Pensiones.
  - Cédula de Dividendos (Sub-cédula 1 & 2 logic).
  - Ganancia Ocasional.
  - Patrimonio Líquido.
- **"God Level" Optimizations**:
  - **Smart ICA**: Automatically simulates whether to treat ICA payments as a Cost (deduction) or a Tax Base Discount (50% credit) to maximize savings.
  - **Dividend Lock**: Prevents dividend tax discounts from creating artificial balances in favor.

### 🤖 AI Engine (`/lib/ai-engine`)

- **Document Intelligence**: Extract data from tax documents (Form 220, Bank Certificates, etc.) using Google Gemini models.
- **Agentic Workflow**: Specialized agents (`TaxExpert`, `Extractor`, `Orchestrator`) handle complex user queries and document processing.

### 🛡️ Audit-Ready

- **Strict Typing**: Comprehensive TypeScript definitions for all tax entities (`TaxPayer`, `TaxResult`).
- **Traceability**: Detailed breakdown of every calculation step (gross income, deductions, exemptions, limits).
- **Compliance Verified**: Tested against critical audit scenarios to ensure 100% accuracy.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Directory)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI**: [Google GenAI SDK](https://github.com/google/google-api-nodejs-client)
- **Testing**: [Vitest](https://vitest.dev/)
- **Validation**: [Zod](https://zod.dev/)

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/camilopiedra92/tax_optimizer.git
   cd tax_optimizer
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your API keys:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key
   ```

### Running the App

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🧪 Testing

This project maintains a high standard of code quality with rigorous testing.

Run all tests:

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

## 📂 Project Structure

```
├── lib/
│   ├── tax-engine/       # Core tax logic, rules, and calculators
│   │   ├── calculators/  # Specific schedule logic (General, Dividends, etc.)
│   │   ├── rules.ts      # Tax constants (UVT, limits, tables)
│   │   └── types.ts      # TypeScript interfaces
│   ├── ai-engine/        # AI Agents and LLM integration
│   │   ├── agents/       # Specialist agents implementation
│   │   └── client.ts     # GenAI client wrapper
│   └── utils/            # Helper functions
├── app/                  # Next.js App Router pages
├── test/                 # Vitest unit and integration tests
└── public/               # Static assets
```

## 📄 License

Private Project. All rights reserved.
