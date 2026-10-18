import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Download,
  Copy,
  ExternalLink,
  ArrowLeft,
  Fingerprint,
  Layers,
  Lock,
  Cpu,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Flame,
  Check,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { AuditEvent, LandDocument, VerificationRun } from '../types/index.js';
import { api } from '../services/api.js';

interface VerificationReportViewProps {
  runId: string;
  onBack: () => void;
  onOpenArdhisasa: () => void;
}

export const VerificationReportView: React.FC<VerificationReportViewProps> = ({
  runId,
  onBack,
  onOpenArdhisasa,
}) => {
  const [run, setRun] = useState<VerificationRun | null>(null);
  const [document, setDocument] = useState<LandDocument | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSha, setCopiedSha] = useState(false);

  // Audit integrity state
  const [chainValidation, setChainValidation] = useState<{
    isValid: boolean;
    tamperedIndex?: number;
    reason?: string;
  } | null>(null);
  const [tamperingSimulated, setTamperingSimulated] = useState(false);
  const [verifyingAudit, setVerifyingAudit] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.getVerification(runId);
      setRun(res.verificationRun);
      if (res.document) setDocument(res.document);

      const auditRes = await api.getAuditEvents(runId);
      setAuditEvents(auditRes.events || []);

      const verifyRes = await api.verifyAuditChain(runId);
      setChainValidation(verifyRes.chainValidation);
    } catch (err) {
      console.error('Error loading verification report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [runId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  // Run Tamper Simulation to demonstrate cryptographic integrity check
  const handleTamperTest = async () => {
    try {
      setVerifyingAudit(true);
      const res = await api.tamperTestAuditChain(runId, 1);
      setTamperingSimulated(true);
      setChainValidation(res.chainValidation);

      // Reload audit events to show the modified data
      const auditRes = await api.getAuditEvents(runId);
      setAuditEvents(auditRes.events || []);
    } catch (err: any) {
      alert(err.message || 'Tamper simulation failed.');
    } finally {
      setVerifyingAudit(false);
    }
  };

  // Generate formal PDF verification summary
  const downloadPdfReport = () => {
    if (!run) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Branding
    doc.setFillColor(11, 21, 40); // Deep Navy
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TerraTrace Kenya - Document Screening Report', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('Independent Land-Document Screening Platform', 14, 26);

    // Metadata section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Report Reference: ${run.auditRunReference}`, 14, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated Date: ${new Date(run.createdAt).toUTCString()}`, 14, 52);
    doc.text(`Status Classification: ${run.status}`, 14, 59);
    doc.text(`Comparison Source: ${run.referenceSourceType}`, 14, 66);

    // SHA-256 Digest
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    doc.text(`SHA-256 Digest: ${run.documentSha256}`, 14, 74);

    // Extracted Fields Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Document Fields & Comparison', 14, 88);

    let y = 96;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Field', 14, y);
    doc.text('Extracted Value', 65, y);
    doc.text('Reference Value', 130, y);

    y += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    const rows = [
      {
        field: 'Parcel Reference',
        extracted: run.extractedFields.parcelNumber?.value || 'Not extracted',
        ref: run.referenceRecord?.parcelNumber || 'None provided',
      },
      {
        field: 'Title Deed Number',
        extracted: run.extractedFields.titleNumber?.value || 'Not extracted',
        ref: run.referenceRecord?.titleNumber || 'None provided',
      },
      {
        field: 'Registered Owner',
        extracted: run.extractedFields.registeredOwner?.value || 'Not extracted',
        ref: run.referenceRecord?.registeredOwner || 'None provided',
      },
      {
        field: 'County / Locality',
        extracted: run.extractedFields.countyOrLocality?.value || 'Not extracted',
        ref: run.referenceRecord?.countyOrLocality || 'None provided',
      },
      {
        field: 'Land Area',
        extracted: run.extractedFields.landArea?.value || 'Not extracted',
        ref: run.referenceRecord?.landArea || 'None provided',
      },
    ];

    doc.setFont('helvetica', 'normal');
    for (const r of rows) {
      doc.text(r.field, 14, y);
      doc.text(r.extracted.substring(0, 30), 65, y);
      doc.text(r.ref.substring(0, 30), 130, y);
      y += 7;
    }

    // Findings
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. Screening Findings & Discrepancies', 14, y);
    y += 8;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    for (const f of run.findings) {
      doc.setFont('helvetica', 'bold');
      doc.text(`[${f.severity}] ${f.title}`, 14, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.text(f.description, 14, y, { maxWidth: pageWidth - 28 });
      y += 8;
    }

    // Mandatory Disclaimer
    y = 260;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'LEGAL DISCLAIMER: TerraTrace is an independent document screening platform. It is not an official land registry and cannot confirm legal ownership. For official ownership status, access the Ministry of Lands Ardhisasa portal at https://ardhisasa.lands.go.ke/.',
      14,
      y,
      { maxWidth: pageWidth - 28 }
    );

    doc.save(`TerraTrace_Report_${run.auditRunReference}.pdf`);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 text-slate-100">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Loading screening report & cryptographic audit trail...</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="py-20 text-center space-y-4 text-slate-100">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold">Screening Report Not Found</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const getStatusBadgeLarge = (status: string) => {
    switch (status) {
      case 'MATCHED_USER_SUPPLIED_DATA':
        return (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            MATCHED USER-SUPPLIED DATA
          </div>
        );
      case 'REVIEW_REQUIRED':
        return (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            REVIEW REQUIRED (DISCREPANCIES FOUND)
          </div>
        );
      case 'INSUFFICIENT_INFORMATION':
        return (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Clock className="w-4 h-4 text-amber-400" />
            INSUFFICIENT DOCUMENT INFORMATION
          </div>
        );
      case 'OFFICIAL_VERIFICATION_REQUIRED':
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <Lock className="w-4 h-4 text-slate-400" />
            OFFICIAL SEARCH REQUIRED
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 text-slate-100">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadPdfReport}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download PDF Report</span>
          </button>
          <button
            onClick={onOpenArdhisasa}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ardhisasa Portal Search</span>
          </button>
        </div>
      </div>

      {/* Main Report Summary Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400">
                {run.auditRunReference}
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-xs text-slate-400">
                {new Date(run.createdAt).toLocaleString()}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white mt-1">
              Document Screening & Verification Report
            </h1>
          </div>

          <div>{getStatusBadgeLarge(run.status)}</div>
        </div>

        {/* Status Explanation */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-slate-200 mb-0.5">Classification Assessment:</p>
          <p>{run.statusExplanation}</p>
        </div>

        {/* SHA-256 Digest Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
              Original Document SHA-256 Fingerprint
            </span>
            <p className="text-xs font-mono text-emerald-400 break-all select-all">
              {run.documentSha256}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(run.documentSha256)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 self-start sm:self-center transition-colors"
          >
            {copiedSha ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Digest</span>
              </>
            )}
          </button>
        </div>

        {/* Official Registry Status: Strictly NOT CONNECTED */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Official Registry Status: NOT CONNECTED</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            No official registry search was performed against the Ministry of Lands or Ardhisasa system. TerraTrace will not invent or substitute synthetic registry records. To verify authentic ownership, carry out an official search at{' '}
            <a
              href="https://ardhisasa.lands.go.ke/"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 underline hover:text-amber-300"
            >
              https://ardhisasa.lands.go.ke/
            </a>
            .
          </p>
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">
            Extracted Fields vs Comparison Reference
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Source: {run.referenceSourceType}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              <tr>
                <th className="px-5 py-3">Field</th>
                <th className="px-5 py-3">Extracted from Document (OCR)</th>
                <th className="px-5 py-3">Supplied Reference Value</th>
                <th className="px-5 py-3 text-right">Confidence / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {/* Parcel Number */}
              <tr className="hover:bg-slate-900/50">
                <td className="px-5 py-3.5 font-medium text-slate-200">Parcel Reference</td>
                <td className="px-5 py-3.5 font-mono text-emerald-300">
                  {run.extractedFields.parcelNumber?.value || (
                    <span className="text-slate-500 italic">Unread by OCR</span>
                  )}
                  {run.extractedFields.parcelNumber?.isUserCorrected && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300 border border-slate-700">
                      User Confirmed
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-300 font-mono">
                  {run.referenceRecord?.parcelNumber || (
                    <span className="text-slate-500 italic">None provided</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-400">
                  {run.extractedFields.parcelNumber?.confidence
                    ? `${Math.round(run.extractedFields.parcelNumber.confidence * 100)}%`
                    : '-'}
                </td>
              </tr>

              {/* Title Number */}
              <tr className="hover:bg-slate-900/50">
                <td className="px-5 py-3.5 font-medium text-slate-200">Title Deed Folio</td>
                <td className="px-5 py-3.5 font-mono text-emerald-300">
                  {run.extractedFields.titleNumber?.value || (
                    <span className="text-slate-500 italic">Unread by OCR</span>
                  )}
                  {run.extractedFields.titleNumber?.isUserCorrected && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300 border border-slate-700">
                      User Confirmed
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-300 font-mono">
                  {run.referenceRecord?.titleNumber || (
                    <span className="text-slate-500 italic">None provided</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-400">
                  {run.extractedFields.titleNumber?.confidence
                    ? `${Math.round(run.extractedFields.titleNumber.confidence * 100)}%`
                    : '-'}
                </td>
              </tr>

              {/* Registered Owner */}
              <tr className="hover:bg-slate-900/50">
                <td className="px-5 py-3.5 font-medium text-slate-200">Registered Proprietor</td>
                <td className="px-5 py-3.5 font-medium text-slate-100">
                  {run.extractedFields.registeredOwner?.value || (
                    <span className="text-slate-500 italic">Unread by OCR</span>
                  )}
                  {run.extractedFields.registeredOwner?.isUserCorrected && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300 border border-slate-700">
                      User Confirmed
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-300">
                  {run.referenceRecord?.registeredOwner || (
                    <span className="text-slate-500 italic">None provided</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-400">
                  {run.extractedFields.registeredOwner?.confidence
                    ? `${Math.round(run.extractedFields.registeredOwner.confidence * 100)}%`
                    : '-'}
                </td>
              </tr>

              {/* County / Locality */}
              <tr className="hover:bg-slate-900/50">
                <td className="px-5 py-3.5 font-medium text-slate-200">County / Locality</td>
                <td className="px-5 py-3.5 text-slate-300">
                  {run.extractedFields.countyOrLocality?.value || (
                    <span className="text-slate-500 italic">Unread by OCR</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-300">
                  {run.referenceRecord?.countyOrLocality || (
                    <span className="text-slate-500 italic">None provided</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-400">
                  {run.extractedFields.countyOrLocality?.confidence
                    ? `${Math.round(run.extractedFields.countyOrLocality.confidence * 100)}%`
                    : '-'}
                </td>
              </tr>

              {/* Land Area */}
              <tr className="hover:bg-slate-900/50">
                <td className="px-5 py-3.5 font-medium text-slate-200">Approximate Area</td>
                <td className="px-5 py-3.5 text-slate-300">
                  {run.extractedFields.landArea?.value || (
                    <span className="text-slate-500 italic">Unread by OCR</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-300">
                  {run.referenceRecord?.landArea || (
                    <span className="text-slate-500 italic">None provided</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-400">
                  {run.extractedFields.landArea?.confidence
                    ? `${Math.round(run.extractedFields.landArea.confidence * 100)}%`
                    : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Findings Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">
          Rule Evaluation & Findings ({run.findings.length})
        </h3>

        <div className="space-y-3">
          {run.findings.map((f, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border text-xs ${
                f.severity === 'MATCH'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : f.severity === 'CRITICAL'
                  ? 'border-rose-500/40 bg-rose-500/10'
                  : f.severity === 'WARNING'
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    f.severity === 'MATCH'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : f.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300'
                      : f.severity === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {f.severity}
                </span>
                <span className="font-bold text-slate-100">{f.title}</span>
              </div>
              <p className="text-slate-300 mt-1">{f.description}</p>
              {f.recommendation && (
                <p className="mt-2 text-slate-400 italic">
                  &bull; Action: {f.recommendation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tamper-Evident Hash-Linked Audit Trail Explorer */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">
                Cryptographic Audit Chain Explorer
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Each screening event is cryptographically hash-linked to the preceding block.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadReport}
              disabled={verifyingAudit}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifyingAudit ? 'animate-spin' : ''}`} />
              <span>Verify Chain</span>
            </button>
            <button
              onClick={handleTamperTest}
              disabled={tamperingSimulated}
              className="px-3.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold border border-rose-500/40 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Tampering Test</span>
            </button>
          </div>
        </div>

        {/* Chain Validation Status Banner */}
        {chainValidation && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
              chainValidation.isValid
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}
          >
            {chainValidation.isValid ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-300">
                    Audit Chain Cryptographically Intact (Valid SHA-256 Linkage)
                  </p>
                  <p className="text-emerald-400/80 mt-0.5 text-[11px]">
                    All {auditEvents.length} events conform strictly to recursive SHA-256 hash chaining. Zero modifications detected.
                  </p>
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-300">
                    Tamper Detected! Cryptographic Audit Chain Broken
                  </p>
                  <p className="text-rose-200/90 mt-0.5 text-[11px]">
                    {chainValidation.reason || 'An unauthorized event modification was detected by SHA-256 validation.'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Audit Events List */}
        <div className="space-y-3">
          {auditEvents.map((ev, index) => (
            <div
              key={ev.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-500">#{index + 1}</span>
                  <span className="font-bold text-slate-100">{ev.eventType}</span>
                  {ev.details?.tampered_marker && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                      TAMPERED BLOCK
                    </span>
                  )}
                </div>
                <span className="text-slate-500 font-mono">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px] pt-1">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block">Previous Hash:</span>
                  <span className="text-slate-400 break-all">{ev.previousHash}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400 block">Event Hash:</span>
                  <span className="text-emerald-300 break-all">{ev.eventHash}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Blockchain Status Notice */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300">Blockchain Anchoring Status: </span>
            Blockchain anchoring is not connected. Your document fingerprint and audit history are maintained within the configured application database.
          </div>
        </div>
      </div>
    </div>
  );
};
