import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Building2,
  User,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Trash2,
  RefreshCw,
  PlusCircle,
  Eye,
  Lock,
} from 'lucide-react';
import { UserProfile, VerificationRun, LandDocument } from '../types/index.js';
import { api } from '../services/api.js';

interface DashboardViewProps {
  user: UserProfile;
  onStartVerification: () => void;
  onViewReport: (runId: string) => void;
  onOpenArdhisasa: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onStartVerification,
  onViewReport,
  onOpenArdhisasa,
}) => {
  const [runs, setRuns] = useState<VerificationRun[]>([]);
  const [documents, setDocuments] = useState<LandDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [identityStatus, setIdentityStatus] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, dRes, idRes] = await Promise.all([
        api.getVerifications(),
        api.getDocuments(),
        api.getIdentityStatus(),
      ]);
      setRuns(vRes.verificationRuns || []);
      setDocuments(dRes.documents || []);
      setIdentityStatus(idRes);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to permanently delete this document and its associated screening report?')) {
      return;
    }
    setDeletingId(docId);
    try {
      await api.deleteDocument(docId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  // Status counters from real database records
  const totalRuns = runs.length;
  const matchedRuns = runs.filter((r) => r.status === 'MATCHED_USER_SUPPLIED_DATA').length;
  const reviewRequiredRuns = runs.filter((r) => r.status === 'REVIEW_REQUIRED').length;
  const pendingOfficialRuns = runs.filter((r) => r.status === 'OFFICIAL_VERIFICATION_REQUIRED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MATCHED_USER_SUPPLIED_DATA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Matched User Reference
          </span>
        );
      case 'REVIEW_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Review Required
          </span>
        );
      case 'INSUFFICIENT_INFORMATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Insufficient Fields
          </span>
        );
      case 'OFFICIAL_VERIFICATION_REQUIRED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Official Search Needed
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Top Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              User Dashboard
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-xs text-slate-400">
              {user.accountType === 'COMPANY' ? 'Organization Account' : 'Individual Account'}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">
            Welcome, {user.displayName}
          </h2>
          <p className="text-xs text-slate-400">
            Manage your screened documents, examine audit chains, and monitor screening runs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh records"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onStartVerification}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-all flex items-center gap-2 hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start New Verification</span>
          </button>
        </div>
      </div>

      {/* Identity Verification Status Banner (Strictly Honest) */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Account Identity Status:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {user.identityVerificationStatus}
              </span>
            </div>
            <p className="text-slate-400 mt-0.5">
              {identityStatus?.message ||
                'Identity verification is not currently connected. Your identity has not been independently verified by TerraTrace.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenArdhisasa}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 shrink-0 transition-colors flex items-center gap-1.5"
        >
          <span>Ardhisasa Portal Guide</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Metrics Counters (Real DB Records only) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Screenings</span>
          <span className="text-3xl font-extrabold text-white font-mono">{totalRuns}</span>
          <span className="text-[10px] text-slate-500 block mt-1">Real records performed</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-medium text-emerald-400 block mb-1">Matched Inputs</span>
          <span className="text-3xl font-extrabold text-emerald-400 font-mono">{matchedRuns}</span>
          <span className="text-[10px] text-slate-500 block mt-1">Passed comparison rules</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-medium text-rose-400 block mb-1">Review Required</span>
          <span className="text-3xl font-extrabold text-rose-400 font-mono">{reviewRequiredRuns}</span>
          <span className="text-[10px] text-slate-500 block mt-1">Discrepancies flagged</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-medium text-amber-400 block mb-1">Official Search Advised</span>
          <span className="text-3xl font-extrabold text-amber-400 font-mono">{pendingOfficialRuns}</span>
          <span className="text-[10px] text-slate-500 block mt-1">Awaiting registry search</span>
        </div>
      </div>

      {/* Recent Verification Reports Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-['Space_Grotesk'] text-white">
            Verification Runs & Audit Records
          </h3>
          <span className="text-xs text-slate-400">
            {runs.length} {runs.length === 1 ? 'report' : 'reports'} saved
          </span>
        </div>

        {runs.length === 0 ? (
          /* Empty State Requirement from Prompt:
             "You have no verification reports yet. Upload a land document to begin screening."
             "Do not display prefilled verification counts, invented activity, fabricated fraud statistics..." */
          <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-emerald-400 flex items-center justify-center mx-auto border border-slate-700/60">
              <FileCheck2 className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-base font-semibold text-slate-200">
                You have no verification reports yet. Upload a land document to begin screening.
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                TerraTrace will extract fields via OCR, compute a permanent SHA-256 fingerprint, and create an unbroken audit chain of your verification steps.
              </p>
            </div>
            <button
              onClick={onStartVerification}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Document Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="px-5 py-3.5">Run Reference</th>
                  <th className="px-5 py-3.5">Parcel Reference</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">SHA-256 Digest</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-medium text-emerald-400">
                      {run.auditRunReference}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-100">
                      {run.extractedFields.parcelNumber?.value || (
                        <span className="text-slate-500 italic">Not extracted</span>
                      )}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(run.status)}</td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                      {run.documentSha256.substring(0, 16)}...
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(run.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewReport(run.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Report</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(run.documentId)}
                          disabled={deletingId === run.documentId}
                          title="Delete document and report"
                          className="p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
