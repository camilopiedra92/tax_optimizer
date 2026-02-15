# 🇨🇴 Colombian Tax Optimizer

A high-precision, enterprise-grade tax optimization platform for Colombian individual income tax (Declaración de Renta Personas Naturales - Formulario 210).

This application combines rigorous implementation of the Colombian Tax Statute (Estatuto Tributario) with advanced AI agents to automate data extraction, calculation, and tax planning.

## 🚀 Key Features

### 🏛️ Robust Tax Engine (`/lib/tax-engine`)

- **Full Compliance**: Implements Estatuto Tributario (Libro I) and recent reforms (Ley 2277/2022, Decreto 2229/2023).
- **Calculators**: General Schedule, Pensions, Dividends, Capital Gains, Wealth Tax.
- **Optimizations**: Smart ICA deduction/discount analysis, Dividend tax credit locking.

### 🤖 AI Engine (`/lib/ai-engine`)

- **Document Intelligence**: Extract data from tax documents using Google Gemini models.
- **Agentic Workflow**: Specialized agents (`TaxExpert`, `Extractor`) handle complex user queries.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Directory)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI**: [Google GenAI SDK](https://github.com/google/google-api-nodejs-client)

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

## 📂 Project Structure

```
├── app/                  # Next.js App Router pages
├── components/           # React UI components
├── lib/
│   ├── tax-engine/       # Core tax logic
│   └── ai-engine/        # AI Agents
├── data/                 # [SECURE] Personal tax documents (gitignored)
├── docs/                 # Documentation
└── public/               # Static assets
```

## 📄 License

Private Project. All rights reserved.
