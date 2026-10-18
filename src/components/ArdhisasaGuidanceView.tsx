import React from 'react';
import {
  Compass,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  FileSearch,
  CheckCircle2,
  Lock,
  Building,
} from 'lucide-react';

interface ArdhisasaGuidanceViewProps {
  onBackToDashboard: () => void;
  onStartVerification: () => void;
}

export const ArdhisasaGuidanceView: React.FC<ArdhisasaGuidanceViewProps> = ({
  onBackToDashboard,
  onStartVerification,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/20">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Official Kenyan Land Information System
          </div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white">
            Ministry of Lands — Ardhisasa Verification Guide
          </h1>
          <p className="text-xs text-slate-400">
            How to verify land ownership officially through Kenya's National Land Information Management System (NLIMS).
          </p>
        </div>

        <a
          href="https://ardhisasa.lands.go.ke/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-950/40 flex items-center gap-2 self-start sm:self-center transition-all hover:scale-[1.02]"
        >
          <span>Open Ardhisasa Portal</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Critical Legal Distinction Banner */}
      <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-2 leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Statutory Due Diligence Notice</span>
        </div>
        <p>
          Under the Land Registration Act 2012 and the Constitution of Kenya, an official search certificate issued by the Registrar of Lands is the sole authoritative proof of the entries in the land register.
        </p>
        <p className="text-slate-300">
          TerraTrace provides pre-screening, optical OCR inconsistency detection, and cryptographic provenance. It does not replace an official registry search or formal legal conveyancing.
        </p>
      </div>

      {/* Step-by-Step Official Search Guide */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <h2 className="text-lg font-bold font-['Space_Grotesk'] text-white flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-emerald-400" />
          Official Steps to Conduct an Ardhisasa Search
        </h2>

        <div className="space-y-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs font-mono">
              1
            </span>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-sm">Register / Sign In on Ardhisasa</h3>
              <p className="text-slate-400 leading-relaxed">
                Log into{' '}
                <a
                  href="https://ardhisasa.lands.go.ke/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline"
                >
                  https://ardhisasa.lands.go.ke/
                </a>{' '}
                using your Kenya National ID and registered phone number. Biometric and OTP verification is required.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs font-mono">
              2
            </span>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-sm">Navigate to Land Registration Services</h3>
              <p className="text-slate-400 leading-relaxed">
                Select <strong>Search Services</strong> under the Land Administration &amp; Registration menu. Enter the exact Parcel Reference Number extracted from your title document (e.g. Nairobi/Block 105/12 or LR 209/1234).
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs font-mono">
              3
            </span>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-sm">Pay Statutory Search Fee via eCitizen</h3>
              <p className="text-slate-400 leading-relaxed">
                Pay the official government search fee (typically KES 500) through eCitizen M-Pesa or card gateway.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs font-mono">
              4
            </span>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-sm">Download Official Certificate of Search</h3>
              <p className="text-slate-400 leading-relaxed">
                The Land Registrar issues a digital Search Certificate displaying the current registered proprietor, encumbrances (e.g. bank charges or caveats), acreage, and tenure. You can then upload this certificate back into TerraTrace for ongoing audit provenance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Roadmap Documentation */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
        <h2 className="text-base font-bold font-['Space_Grotesk'] text-white flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-400" />
          Technical Requirements for Future Government Registry Integration
        </h2>
        <p className="text-slate-400 leading-relaxed">
          In compliance with ethical standards and government regulations, TerraTrace will never scrape restricted systems or bypass official authentication. Direct live lookup will be activated once the following prerequisites are established:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-slate-200 block mb-1">1. Bilateral Government MOU</span>
            <span className="text-slate-400">
              Authorized data sharing agreement with the Ministry of Lands and Physical Planning.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-slate-200 block mb-1">2. Mutual TLS &amp; OAuth 2.0 Credentials</span>
            <span className="text-slate-400">
              Secured API gateway access keys provisioned by the Government of Kenya IT infrastructure.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-slate-200 block mb-1">3. Licensed Conveyancer Role-Based Access</span>
            <span className="text-slate-400">
              Verification queries conducted under the professional mandate of an advocate of the High Court of Kenya.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-slate-200 block mb-1">4. Privacy Impact Assessment (PIA)</span>
            <span className="text-slate-400">
              Full registration and review with the Office of the Data Protection Commissioner (ODPC) of Kenya.
            </span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 text-xs text-slate-400 hover:text-white"
        >
          Return to Dashboard
        </button>

        <button
          onClick={onStartVerification}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-2"
        >
          <span>Screen a New Land Document</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
