# TerraTrace Kenya — Land Document Screening & Verification Platform

> **Tagline:** “Know the land. Verify the records. Move with confidence.”

TerraTrace is a Kenya-focused land-document screening and verification platform designed to help landowners, prospective buyers, legal practitioners, SACCOs, and financial institutions examine land documents, extract information using Optical Character Recognition (OCR), compare document fields against information supplied by the user or an authorized registry provider, identify inconsistencies, and maintain a tamper-evident audit history.

---

## ⚖️ Core Product Rule: Zero Fictional Data Guarantee

1. **No Fictional Records:** TerraTrace never creates synthetic parcel numbers, title folios, registered owners, or fabricated registry responses.
2. **Empty Initial State:** Accounts start in an empty state until real documents are uploaded.
3. **Genuine OCR:** Text is extracted from actual uploaded image bytes via Tesseract and optional Gemini 3.8 Flash parsing. Fields that cannot be read remain unextracted; they are **never** hallucinated.
4. **Honest Official Registry Status:** Until an authorized bilateral integration agreement is reached with the Ministry of Lands, official registry status returns `NOT_CONNECTED`. Users are guided to the official [Ardhisasa Portal](https://ardhisasa.lands.go.ke/).
5. **No False Claims:** TerraTrace does not display “Genuine Title” or “Verified Owner”. It provides objective screening against supplied comparison records.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** React 19 SPA, Tailwind CSS v4, Lucide Icons, jsPDF.
- **Backend:** Node.js Express server running on port 3000 (`server.ts`).
- **Database & RLS:** Relational PostgreSQL schema with Row-Level Security policies (`database/migrations.sql`) isolating user records.
- **OCR Engine:** Tesseract OCR v5 engine + optional Gemini 3.8 Flash intelligent field extractor (strictly governed to prevent hallucination).
- **Integrity & Chaining:** SHA-256 binary digest computation of original uploaded files + recursive hash-linked audit chain.
- **Official Registry Provider:** `KenyaArdhisasaRegistryProvider` adhering to zero-fake-data rules.

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- Node.js 20+
- npm 10+

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
# GEMINI_API_KEY: Optional. Used for AI-enhanced OCR parsing on uploaded files.
GEMINI_API_KEY="YOUR_KEY_HERE"

# PORT: Defaults to 3000
PORT=3000
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser to `http://localhost:3000`.

---

## 🧪 Running Automated Acceptance Tests

To run the automated acceptance test suite in terminal:
```bash
npx tsx tests/acceptance.test.ts
```
Or open the application in your browser and click **Acceptance Tests** in the navigation header to run all 13 interactive test suites live!

---

## 🛡️ Security & Privacy Checklist (Kenya Data Protection Act 2019)

- [x] **Private Storage Vault:** Uploaded documents are saved under randomized identifiers and restricted via user-level authorization.
- [x] **No Public Blockchain ID Exposure:** Personal identifiers and title contents are never stored on public blockchains.
- [x] **SHA-256 Digest on Raw Bytes:** Hashes are computed from original binary streams before any thumbnail downsampling.
- [x] **Session Derived Authorization:** Owner user ID is always determined from the server-side session token, never trusted from client request bodies.
- [x] **Tamper Detection:** Modifying any historical audit event automatically breaks subsequent recursive SHA-256 hash validation.
- [x] **Lawful Basis Notice:** Explicit consent collected for land document screening.

---

## 🏛️ Operational vs Awaiting Authorization Features

| Feature | Status | Details |
|---|---|---|
| **Document Upload & Storage** | **Operational** | PNG, JPG, PDF up to 15MB with SHA-256 computation |
| **Optical Character Recognition (OCR)** | **Operational** | Tesseract OCR + Gemini 3.8 Flash parsing |
| **Field Review & User Correction** | **Operational** | Distinguishes OCR extracted from user-confirmed values |
| **9-Rule Verification Engine** | **Operational** | Formats, missing fields, duplicates, and discrepancies |
| **Tamper-Evident Audit Chain** | **Operational** | Recursive SHA-256 chaining with live tamper testing |
| **PDF Report Download** | **Operational** | Generates formal screening certificate |
| **Official Ardhisasa Gateway** | **Awaiting Authorization** | Returns honest `NOT_CONNECTED` + guides to official portal |
| **Automated ID Verification Provider** | **Awaiting Provider** | Returns `NOT_STARTED` notice until authorized provider API configured |
| **Public Blockchain Anchoring** | **Modular Interface** | Ready for EVM/L2 anchor when transaction signer provisioned |

---

## 📜 Disclaimer
TerraTrace is an independent land-document screening platform. It is not an official land registry and cannot confer or confirm legal ownership under the Land Registration Act 2012 of Kenya. Always conduct an official search on [Ardhisasa](https://ardhisasa.lands.go.ke/) and consult an advocate of the High Court of Kenya.
