import React from 'react';
import {
  FileCheck,
  Search,
  History,
  Shield,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Fingerprint,
  Cpu,
  Layers,
  Lock,
  Compass,
  FileSpreadsheet,
  ArrowRight,
  Database,
  Building,
  Sparkles,
} from 'lucide-react';

interface LandingHeroProps {
  onStartVerification: () => void;
  onExploreHowItWorks: () => void;
  onOpenArdhisasa: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartVerification,
  onExploreHowItWorks,
  onOpenArdhisasa,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-slate-800/80">
        {/* Background Visual: Kenyan Tea Hills / Highland Agricultural Landscape with deep navy overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-25 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=2000&q=80')`,
          }}
        />
        {/* Navy gradient scrim for contrast */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/85 via-slate-950/95 to-slate-950" />

        {/* Ambient subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Kenya Land Document Screening & Verification
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white font-['Space_Grotesk'] leading-[1.12]">
            Land ownership deserves <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
              more certainty.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Screen land documents, identify inconsistencies, and keep a traceable record of verification checks — all in one place.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartVerification}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 group transition-all hover:scale-[1.02]"
            >
              <FileCheck className="w-5 h-5 text-emerald-200" />
              <span>Verify a Document</span>
              <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onExploreHowItWorks}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-base border border-slate-700 transition-colors"
            >
              Explore How It Works
            </button>
          </div>

          {/* 3 Trust-oriented features */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3.5">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">1. AI-Assisted Document Screening</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Extracts actual parcel numbers, title folios, and owner names using OCR with transparent confidence scores.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3.5">
                <History className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">2. Traceable Verification History</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Every scan receives a unique SHA-256 fingerprint linked in a tamper-evident cryptographic audit chain.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3.5">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">3. A Path to Official Verification</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Clear distinction between document screening and statutory search requirements on Kenya’s Ardhisasa portal.
              </p>
            </div>
          </div>

          {/* Mandatory Legal Disclaimer Banner */}
          <div className="mt-8 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs leading-relaxed max-w-3xl mx-auto flex items-start gap-3 text-left">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Important Legal Notice: </span>
              TerraTrace is an independent land-document screening platform. It is not an official land registry and does not establish legal ownership by itself.
            </div>
          </div>
        </div>
      </section>

      {/* Three-Step Scan, Check, Review Explanation */}
      <section id="how-it-works" className="py-20 bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs uppercase tracking-widest font-bold text-emerald-400">
              Clear 3-Step Process
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white font-['Space_Grotesk']">
              Scan, Check, Review
            </p>
            <p className="mt-3 text-sm text-slate-400">
              TerraTrace processes only your real documents and genuinely available inputs. No fictional databases or fabricated results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-800 text-emerald-400">
                  STEP 01
                </span>
                <FileCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Scan Document</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Upload your title deed, certificate of title, allotment letter, or search report (PNG, JPG, or PDF). The platform calculates an original SHA-256 byte digest immediately.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                &bull; Zero fabrication of illegible text
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-800 text-amber-400">
                  STEP 02
                </span>
                <Search className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Check Consistency</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Review OCR-extracted fields against your user-supplied details or independent reference records. Identify parcel format deviations, missing folios, or owner name variances.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                &bull; Transparent user-confirmed corrections
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-800 text-teal-400">
                  STEP 03
                </span>
                <History className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Review & Audit Report</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Receive an explainable screening report with an unbroken SHA-256 audit chain reference, exportable PDF, and explicit guidance on official Ardhisasa search requirements.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                &bull; Tamper-evident cryptographic log
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-20 bg-slate-950 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs uppercase tracking-widest font-bold text-emerald-400">
              Core Capabilities
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white font-['Space_Grotesk']">
              Built on Real Integrity, Not Synthetic Claims
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
              <Cpu className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-base font-bold text-white">Genuine Optical OCR</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Extracts raw text directly from uploaded pixels using Tesseract and AI field parsing. Fields that cannot be read are never fabricated.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
              <Search className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-base font-bold text-white">Inconsistency Engine</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                9 deterministic rules check parcel reference syntax, missing proprietor details, approximate spelling variances, and duplicate records.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
              <Fingerprint className="w-8 h-8 text-teal-400 mb-4" />
              <h3 className="text-base font-bold text-white">SHA-256 Fingerprinting</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Computed from the original uploaded byte stream. Detects if an exact duplicate deed has already been uploaded by your organization.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
              <Layers className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-base font-bold text-white">Tamper-Evident Audit</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Every screening step is cryptographically hash-linked. An interactive inspector demonstrates that altering even a single byte breaks validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Illustrative Layout of How Verification Reports Work (NO FAKE RECORDS) */}
      <section className="py-20 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
                Transparent Screening Architecture
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white font-['Space_Grotesk'] leading-tight">
                Explainable findings, not black-box promises
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                TerraTrace will never label a title deed as “Genuine” or “Fraud Confirmed” based merely on an OCR scan, QR code, or blockchain hash. Instead, you receive an objective breakdown of:
              </p>

              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Field-by-Field Comparison: </strong>
                    Exact extracted text vs user-supplied comparison data with confidence scores.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Status Classification: </strong>
                    Clear indicators like <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">MATCHED_USER_SUPPLIED_DATA</code> or <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">REVIEW_REQUIRED</code>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Honest Registry Status: </strong>
                    Explicit disclosure when official land registry gateway is unconfigured or not connected.
                  </span>
                </li>
              </ul>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={onStartVerification}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  Start Screening Now
                </button>
                <button
                  onClick={onOpenArdhisasa}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                  Official Ardhisasa Guide
                </button>
              </div>
            </div>

            {/* Illustrative Schematic Mockup (Clearly labeled schema, zero fabricated property records) */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                    Sample Report Schema Layout
                  </span>
                  <h4 className="text-sm font-bold text-slate-200">Verification Report Structure</h4>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  AUDIT-TR-SAMPLE
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
                  <p className="text-[11px] text-slate-400 uppercase font-mono">Document SHA-256 Digest</p>
                  <p className="text-xs font-mono text-emerald-400 break-all mt-0.5">
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-mono">FIELD EXTRACTION</span>
                    <span className="text-slate-300 font-medium">Parcel Reference</span>
                    <span className="block text-[11px] text-emerald-400 font-mono">OCR Confidence 92%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-mono">COMPARISON SOURCE</span>
                    <span className="text-slate-300 font-medium">User-Supplied Input</span>
                    <span className="block text-[11px] text-slate-400">Reference Check</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-300">Status Classification</span>
                    <span className="text-emerald-400 font-mono text-[11px]">MATCHED_USER_SUPPLIED_DATA</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Confirms consistency between uploaded document and user-provided inputs. Official ownership requires Ministry of Lands search.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Cryptographic Audit Chain:</span>
                  <span className="text-emerald-400">7 Linked Events &bull; 0 Tamper Detected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Kenya Data Protection Compliance Section */}
      <section className="py-16 bg-slate-950 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">
              Security & Kenyan Data Protection Compliance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="font-semibold text-slate-100 text-sm mb-2">Kenya Data Protection Act 2019</h3>
              <p className="text-slate-400 leading-relaxed">
                National ID numbers and personal identifiers are collected only with lawful basis and explicit necessity. We never publish raw identity information on public blockchains.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="font-semibold text-slate-100 text-sm mb-2">Private Storage & Row Isolation</h3>
              <p className="text-slate-400 leading-relaxed">
                Uploaded documents reside in private vaults secured by PostgreSQL Row-Level Security (RLS). Cross-user document inspection is strictly prevented.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="font-semibold text-slate-100 text-sm mb-2">SHA-256 Byte Verification</h3>
              <p className="text-slate-400 leading-relaxed">
                Fingerprints are generated directly from original binary file bytes before any preview downsampling, ensuring exact provenance and tamper detection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-16 bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white font-['Space_Grotesk'] mb-2">
            Strategic Platform Roadmap
          </h2>
          <p className="text-xs text-slate-400 mb-8">
            Planned future extensions designed with modular interfaces.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-100 text-sm">Authorized Land Registry Gateway</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Future Integration
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Formal integration with the Ministry of Lands Ardhisasa gateway via authorized bilateral API agreements, enabling authorized conveyancing advocates to fetch live green cards.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-100 text-sm">Verified Property Marketplace</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Future Milestone
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Future proptech marketplace where listings feature transparent document screening badges, verified seller identity statuses, and county land-use planning overlays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 bg-slate-950 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white font-['Space_Grotesk'] text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="font-semibold text-slate-100 text-sm">
                Does TerraTrace prove that a land title deed is legally valid?
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                No. TerraTrace is an independent document screening tool. It extracts text, detects inconsistencies, checks formats, and logs cryptographic fingerprints. In Kenya, legal ownership is determined solely by the registered entries in the Ministry of Lands registry under the Land Registration Act 2012.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="font-semibold text-slate-100 text-sm">
                Why doesn't the platform show official registry results automatically?
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                In strict adherence to truth and accuracy, TerraTrace does not invent fake land registry data. Without an authorized government API agreement, claiming to have checked government registry records would be fraudulent. We guide users directly to the official Ardhisasa portal instead.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="font-semibold text-slate-100 text-sm">
                What does a document SHA-256 fingerprint do?
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                A SHA-256 fingerprint creates an unforgeable digital signature of the exact file you uploaded. If a single pixel or comma is altered, the fingerprint changes entirely. This helps prove that a specific document was examined at a specific point in time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-slate-950 border-t border-slate-850 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-300 font-['Space_Grotesk']">
                Terra<span className="text-emerald-400">Trace</span>
              </span>
              <span>&copy; {new Date().getFullYear()} TerraTrace Kenya. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-6">
              <button onClick={onOpenArdhisasa} className="hover:text-emerald-400 transition-colors">
                Official Ardhisasa Portal
              </button>
              <span className="hover:text-slate-300">Privacy Notice (KDPA 2019)</span>
              <span className="hover:text-slate-300">Terms of Use</span>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-slate-600 leading-relaxed text-center sm:text-left">
            Disclaimer: TerraTrace is an independent document screening service. It is not an official government entity or authorized land registry. Land buyers in Kenya should always carry out an official search on Ardhisasa and consult an advocate of the High Court of Kenya.
          </p>
        </div>
      </footer>
    </div>
  );
};
