# acore-qr

Professional QR code generation platform built as a TypeScript monorepo.

The repository contains:

- `apps/web`: React + Vite web application.
- `apps/api`: Express API for validation, rendering, files, dynamic QR codes, authentication, analytics, and administration.
- `packages/qr-core`: shared QR domain and rendering engine.
- `packages/contracts`: shared API schemas and error contracts.
- `packages/config`: validated environment configuration.
- `docs`: product, architecture, security, API, testing, deployment, and phase documentation.

## Requirements

- Node.js `>=20.19.0`
- npm
- PostgreSQL when dynamic QR codes, authentication, or analytics are enabled

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

The web app runs at `http://localhost:5173` and the API at `http://localhost:4000`.

## Quality checks

Run the complete local verification suite before opening a pull request:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

## Project principles

- The server is the canonical source for downloadable QR output.
- Static QR codes contain payloads directly; dynamic QR codes contain controlled redirect URLs.
- Uploaded files are represented by secure links, never embedded as binary QR payloads.
- User-uploaded scripts and executables are rejected by policy.
- Security-sensitive behavior must be documented before implementation.
- Every phase must meet its acceptance criteria and quality gates.

## Documentation

Start with [`docs/README.md`](docs/README.md) for the architecture and phase plan. The detailed technical documentation is currently being migrated to English while preserving the existing contracts and decisions.

## License

Private project. Distribution and licensing are governed by the project owner.
