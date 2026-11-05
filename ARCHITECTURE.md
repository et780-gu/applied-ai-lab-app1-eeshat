# Architecture Overview

## What the App Does

Sales Regional Intelligence is an executive decision-support platform designed to transform raw transaction datasets into clear quarterly performance insights across commercial territories. By ingesting sales orders through an intuitive CSV interface, the platform aggregates financial results into regional matrices, displays multi-quarter revenue trends through comparative visual charts and detailed pivot tables, and utilizes server-side generative artificial intelligence (via Google Gemini) to deliver a concise, mathematically verified three-sentence briefing identifying which region experienced the largest revenue shift between Q2 and Q3, why that shift occurred (isolating unit volumes, product mix, sales channels, and promotional discounting), and how that change contextualizes within the company's overall performance.

## System File Inventory

| File | Description |
| :--- | :--- |
| `.env.example` | Defines the template for environment variables required by the server, including server port and Gemini API credentials. |
| `.gitignore` | Identifies local build directories, temporary cache files, and private credentials that should not be tracked in version control. |
| `index.html` | Serves as the web application's HTML entry point, defining browser metadata, page titles, and the client DOM mounting container. |
| `metadata.json` | Stores project identity metadata, feature capabilities, and security permission settings used by the AI Studio hosting platform. |
| `package.json` | Specifies project dependencies, runtime libraries, and operational commands for testing, building, and serving the application. |
| `public/assets/aistudio/image_4b4d5c81.png` | Stores static image assets and branding graphics delivered directly to client browsers. |
| `server.ts` | Hosts the Node.js Express backend that coordinates the `/api/analyze-q2-q3` AI analytics endpoint, validates mathematical fallbacks, and serves the web application. |
| `src/App.tsx` | Orchestrates the top-level executive dashboard layout, bringing together key financial metrics, CSV upload capabilities, AI summaries, charts, and tabular reports. |
| `src/components/AISummaryCard.tsx` | Renders the three-sentence executive AI briefing card with interactive number highlights, metric verification audits, and clipboard copying features. |
| `src/components/CsvUploader.tsx` | Provides the drag-and-drop file upload interface that allows users to import custom sales transaction spreadsheets or reset back to baseline sample data. |
| `src/components/RevenueChart.tsx` | Visualizes quarterly sales performance across all geographic operating regions using interactive, color-coded comparative bar charts. |
| `src/components/RevenueTable.tsx` | Presents a comprehensive financial pivot grid displaying quarterly sales totals by region alongside an interactive raw order log with search and sorting features. |
| `src/index.css` | Imports and configures the Tailwind CSS design framework that governs the visual appearance and responsive typography of the dashboard. |
| `src/main.tsx` | Initializes the client-side React 19 application and mounts it into the browser document object model. |
| `src/types/sales.ts` | Declares TypeScript data contracts and types for sales transactions, regional quarters, product/channel metrics, and executive analysis objects. |
| `src/utils/csvParser.ts` | Ingests raw CSV text, cleans headers and numbers, and validates column formats to transform uploaded files into structured order records. |
| `src/utils/salesCalculator.ts` | Calculates financial metrics, regional quarter pivot matrices, Q2-to-Q3 percentage and dollar shifts, product drivers, and discount averages. |
| `src/utils/sampleData.ts` | Supplies built-in sample sales order data covering multiple quarters and regions so users can immediately explore all system analytics without uploading files. |
| `tsconfig.json` | Configures TypeScript compiler settings, target standards, module resolution, and path aliases for the codebase. |
| `vite.config.ts` | Configures Vite frontend build tooling, Tailwind integration, module aliasing, and development server middleware integration. |
