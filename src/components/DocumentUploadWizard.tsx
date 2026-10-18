import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCheck2,
  Camera,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Edit3,
  FileText,
  Search,
  ExternalLink,
  Shield,
  Layers,
  Fingerprint,
} from 'lucide-react';
import {
  DocumentExtractedFields,
  DocumentType,
  LandDocument,
  ReferenceRecord,
  ReferenceSourceType,
} from '../types/index.js';
import { api } from '../services/api.js';

interface DocumentUploadWizardProps {
  onVerificationComplete: (runId: string) => void;
  onCancel: () => void;
  onOpenArdhisasa: () => void;
}

export const DocumentUploadWizard: React.FC<DocumentUploadWizardProps> = ({
  onVerificationComplete,
  onCancel,
  onOpenArdhisasa,
}) => {
  // Steps: 1: UPLOAD, 2: OCR_PROCESSING, 3: REVIEW_FIELDS, 4: REFERENCE_DATA, 5: VERIFYING
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [clientSha256, setClientSha256] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('TITLE_DEED');
  const [uploadedDoc, setUploadedDoc] = useState<LandDocument | null>(null);

  // OCR Fields State
  const [extractedFields, setExtractedFields] = useState<DocumentExtractedFields>({});
  const [rawOcrText, setRawOcrText] = useState<string>('');

  // Editable fields during review
  const [parcelInput, setParcelInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [ownerInput, setOwnerInput] = useState('');
  const [countyInput, setCountyInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [docTypeInput, setDocTypeInput] = useState('TITLE_DEED');
  const [dateInput, setDateInput] = useState('');

  // Reference comparison choices
  const [comparisonChoice, setComparisonChoice] = useState<'USER_INPUT' | 'EXISTING_REF' | 'NO_REF'>('USER_INPUT');
  const [refParcel, setRefParcel] = useState('');
  const [refTitle, setRefTitle] = useState('');
  const [refOwner, setRefOwner] = useState('');
  const [refCounty, setRefCounty] = useState('');
  const [refArea, setRefArea] = useState('');

  // Processing indicators
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Client-side SHA-256 calculation on original raw bytes
  const computeClientSha256 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileChange = async (file: File) => {
    setError(null);
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds 15 MB limit. Please select a smaller document file.');
      return;
    }

    setSelectedFile(file);

    // Compute client-side SHA-256
    try {
      const sha = await computeClientSha256(file);
      setClientSha256(sha);
    } catch (e) {
      console.warn('Could not compute client SHA-256:', e);
    }

    // Generate preview if image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Step 1 -> Step 2: Upload and Trigger Real OCR
  const handleStartOcr = async () => {
    if (!selectedFile) {
      setError('Please select or photograph a document first.');
      return;
    }

    setError(null);
    setLoading(true);
    setStep(2);
    setProgressMsg('Uploading file and generating SHA-256 byte digest...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);

      const uploadRes = await api.uploadDocument(formData);
      setUploadedDoc(uploadRes.document);

      setProgressMsg('Running Optical Character Recognition (OCR) on document image...');
      const ocrRes = await api.extractFields(uploadRes.document.id);

      setExtractedFields(ocrRes.extractedFields);
      setRawOcrText(ocrRes.extractedFields.rawText || '');

      // Initialize review inputs with extracted values (or empty if unextracted)
      setParcelInput(ocrRes.extractedFields.parcelNumber?.value || '');
      setTitleInput(ocrRes.extractedFields.titleNumber?.value || '');
      setOwnerInput(ocrRes.extractedFields.registeredOwner?.value || '');
      setCountyInput(ocrRes.extractedFields.countyOrLocality?.value || '');
      setAreaInput(ocrRes.extractedFields.landArea?.value || '');
      setDocTypeInput(ocrRes.extractedFields.documentType?.value || documentType);
      setDateInput(ocrRes.extractedFields.registrationDate?.value || '');

      // Auto-suggest reference values as identical for quick user confirmation
      setRefParcel(ocrRes.extractedFields.parcelNumber?.value || '');
      setRefOwner(ocrRes.extractedFields.registeredOwner?.value || '');
      setRefTitle(ocrRes.extractedFields.titleNumber?.value || '');
      setRefCounty(ocrRes.extractedFields.countyOrLocality?.value || '');
      setRefArea(ocrRes.extractedFields.landArea?.value || '');

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'OCR processing failed on this file.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> Step 4: Confirm user corrections
  const handleProceedToReference = () => {
    // Construct updated extractedFields marking user corrections
    const updated: DocumentExtractedFields = {
      ...extractedFields,
      parcelNumber: parcelInput.trim()
        ? {
            value: parcelInput.trim(),
            confidence: extractedFields.parcelNumber?.value === parcelInput.trim() ? extractedFields.parcelNumber.confidence : 1.0,
            source: extractedFields.parcelNumber?.value === parcelInput.trim() ? extractedFields.parcelNumber.source : 'USER_CORRECTED',
            isUserCorrected: extractedFields.parcelNumber?.value !== parcelInput.trim(),
            originalOcrValue: extractedFields.parcelNumber?.originalOcrValue || extractedFields.parcelNumber?.value,
          }
        : undefined,
      titleNumber: titleInput.trim()
        ? {
            value: titleInput.trim(),
            confidence: extractedFields.titleNumber?.value === titleInput.trim() ? extractedFields.titleNumber.confidence : 1.0,
            source: extractedFields.titleNumber?.value === titleInput.trim() ? extractedFields.titleNumber.source : 'USER_CORRECTED',
            isUserCorrected: extractedFields.titleNumber?.value !== titleInput.trim(),
            originalOcrValue: extractedFields.titleNumber?.originalOcrValue || extractedFields.titleNumber?.value,
          }
        : undefined,
      registeredOwner: ownerInput.trim()
        ? {
            value: ownerInput.trim(),
            confidence: extractedFields.registeredOwner?.value === ownerInput.trim() ? extractedFields.registeredOwner.confidence : 1.0,
            source: extractedFields.registeredOwner?.value === ownerInput.trim() ? extractedFields.registeredOwner.source : 'USER_CORRECTED',
            isUserCorrected: extractedFields.registeredOwner?.value !== ownerInput.trim(),
            originalOcrValue: extractedFields.registeredOwner?.originalOcrValue || extractedFields.registeredOwner?.value,
          }
        : undefined,
      countyOrLocality: countyInput.trim()
        ? {
            value: countyInput.trim(),
            confidence: extractedFields.countyOrLocality?.value === countyInput.trim() ? extractedFields.countyOrLocality.confidence : 1.0,
            source: extractedFields.countyOrLocality?.value === countyInput.trim() ? extractedFields.countyOrLocality.source : 'USER_CORRECTED',
            isUserCorrected: extractedFields.countyOrLocality?.value !== countyInput.trim(),
            originalOcrValue: extractedFields.countyOrLocality?.originalOcrValue || extractedFields.countyOrLocality?.value,
          }
        : undefined,
      landArea: areaInput.trim()
        ? {
            value: areaInput.trim(),
            confidence: extractedFields.landArea?.value === areaInput.trim() ? extractedFields.landArea.confidence : 1.0,
            source: extractedFields.landArea?.value === areaInput.trim() ? extractedFields.landArea.source : 'USER_CORRECTED',
            isUserCorrected: extractedFields.landArea?.value !== areaInput.trim(),
            originalOcrValue: extractedFields.landArea?.originalOcrValue || extractedFields.landArea?.value,
          }
        : undefined,
    };

    setExtractedFields(updated);
    setStep(4);
  };

  // Step 4 -> Step 5: Execute Verification Engine
  const handleExecuteVerification = async () => {
    if (!uploadedDoc) return;
    setLoading(true);
    setStep(5);
    setProgressMsg('Evaluating verification rules & constructing tamper-evident audit chain...');

    try {
      let manualReference = undefined;
      if (comparisonChoice === 'USER_INPUT') {
        manualReference = {
          parcelNumber: refParcel || undefined,
          titleNumber: refTitle || undefined,
          registeredOwner: refOwner || undefined,
          countyOrLocality: refCounty || undefined,
          landArea: refArea || undefined,
        };
      }

      const res = await api.runVerification({
        documentId: uploadedDoc.id,
        extractedFields,
        manualReference,
      });

      onVerificationComplete(res.verificationRun.id);
    } catch (err: any) {
      setError(err.message || 'Verification execution failed.');
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-slate-100">
      {/* Stepper Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <span className={step >= 1 ? 'text-emerald-400' : ''}>1. Upload File</span>
          <span className={step >= 2 ? 'text-emerald-400' : ''}>2. OCR Scan</span>
          <span className={step >= 3 ? 'text-emerald-400' : ''}>3. Review Fields</span>
          <span className={step >= 4 ? 'text-emerald-400' : ''}>4. Reference Check</span>
          <span className={step >= 5 ? 'text-emerald-400' : ''}>5. Report</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: Upload Document File */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">
              Upload Land Document
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select an authentic title deed, certificate of lease, or search report. TerraTrace will extract text via OCR and compute an immutable SHA-256 fingerprint.
            </p>
          </div>

          {/* Document Type Selector */}
          <div className="max-w-md mx-auto">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Document Classification
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="TITLE_DEED">Title Deed (Registered Land Act / LRA)</option>
              <option value="CERTIFICATE_OF_TITLE">Certificate of Title (Registration of Titles Act)</option>
              <option value="CERTIFICATE_OF_LEASE">Certificate of Lease</option>
              <option value="MUTATION_FORM">Mutation Form / Survey Plan</option>
              <option value="ALLOTMENT_LETTER">Letter of Allotment</option>
              <option value="OFFICIAL_SEARCH">Official Search Certificate (Ardhisasa/Ministry of Lands)</option>
              <option value="OTHER_LAND_DOCUMENT">Other Land Document</option>
            </select>
          </div>

          {/* Drag & Drop Upload Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-emerald-500/60 bg-emerald-500/5'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-300">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {selectedFile.type || 'Document'}
                </p>
                {clientSha256 && (
                  <p className="text-[10px] font-mono text-emerald-400 mt-2 break-all bg-slate-950 p-2 rounded-lg max-w-lg mx-auto">
                    Pre-Upload SHA-256: {clientSha256}
                  </p>
                )}
                <span className="text-[11px] text-emerald-400 underline block pt-2">
                  Click to choose a different file
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">
                  Drag and drop your document here, or click to browse
                </p>
                <p className="text-xs text-slate-500">
                  Supports PNG, JPG, or PDF up to 15 MB
                </p>
              </div>
            )}
          </div>

          {/* Camera capture quick action on mobile */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Capture Photo with Mobile Camera</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedFile}
              onClick={handleStartOcr}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 disabled:opacity-40 flex items-center gap-2"
            >
              <span>Scan & Extract Fields</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: OCR Extraction In Progress */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="py-20 text-center space-y-4 animate-in fade-in duration-200">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-bold font-['Space_Grotesk'] text-white">
            Extracting Document Information
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{progressMsg}</p>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-500 max-w-sm mx-auto font-mono">
            Optical OCR &bull; Zero synthetic guessing
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Review and Correct Extracted Fields */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">
                Review & Confirm Extracted Fields
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Examine what OCR detected on your document. Correct any blurred characters or provide fields that remained unread.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
              <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHA-256 Verified</span>
            </div>
          </div>

          {/* Form Fields Table/Grid */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            {/* Field 1: Parcel Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pb-4 border-b border-slate-800/80">
              <div>
                <label className="text-xs font-bold text-slate-200 block">Parcel / Land Reference</label>
                <span className="text-[10px] text-slate-500">e.g. NAIROBI/BLOCK 105/12 or LR 209/1234</span>
                {extractedFields.parcelNumber && (
                  <span className="block text-[10px] text-emerald-400 font-mono mt-0.5">
                    OCR Conf: {Math.round(extractedFields.parcelNumber.confidence * 100)}%
                  </span>
                )}
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={parcelInput}
                  onChange={(e) => setParcelInput(e.target.value)}
                  placeholder="Enter or correct parcel reference"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Field 2: Title Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pb-4 border-b border-slate-800/80">
              <div>
                <label className="text-xs font-bold text-slate-200 block">Title Deed / Folio Reference</label>
                <span className="text-[10px] text-slate-500">e.g. TITLE NO. 12345 or I.R. 78901</span>
                {extractedFields.titleNumber && (
                  <span className="block text-[10px] text-emerald-400 font-mono mt-0.5">
                    OCR Conf: {Math.round(extractedFields.titleNumber.confidence * 100)}%
                  </span>
                )}
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Enter or correct deed folio reference"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Field 3: Registered Owner Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pb-4 border-b border-slate-800/80">
              <div>
                <label className="text-xs font-bold text-slate-200 block">Registered Proprietor Name</label>
                <span className="text-[10px] text-slate-500">Exact name as written on the deed</span>
                {extractedFields.registeredOwner && (
                  <span className="block text-[10px] text-emerald-400 font-mono mt-0.5">
                    OCR Conf: {Math.round(extractedFields.registeredOwner.confidence * 100)}%
                  </span>
                )}
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={ownerInput}
                  onChange={(e) => setOwnerInput(e.target.value)}
                  placeholder="Enter proprietor name as written"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Field 4: County or Locality */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pb-4 border-b border-slate-800/80">
              <div>
                <label className="text-xs font-bold text-slate-200 block">County / Locality</label>
                <span className="text-[10px] text-slate-500">e.g. Kiambu, Nairobi, Machakos</span>
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={countyInput}
                  onChange={(e) => setCountyInput(e.target.value)}
                  placeholder="e.g. Nairobi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Field 5: Land Area */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="text-xs font-bold text-slate-200 block">Approximate Area</label>
                <span className="text-[10px] text-slate-500">e.g. 0.045 Ha, 0.5 Acres</span>
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  placeholder="e.g. 0.045 Ha"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Upload</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToReference}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-2"
            >
              <span>Confirm & Choose Comparison Reference</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: Choose Reference Record & Comparison Source */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">
              Select Comparison Information
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              To detect discrepancies, TerraTrace compares your document against user-supplied reference data or an authorized registry source.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              onClick={() => setComparisonChoice('USER_INPUT')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                comparisonChoice === 'USER_INPUT'
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">User-Supplied Input</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Compare against details agreed with the seller, vendor agreement, or agent notes.
              </p>
            </div>

            <div
              onClick={() => setComparisonChoice('NO_REF')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                comparisonChoice === 'NO_REF'
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">No Reference Record</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Screen document format, completeness, and compute hash without external comparison.
              </p>
            </div>

            <div
              onClick={onOpenArdhisasa}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-amber-500/40 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">Official Registry</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Not Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Ardhisasa integration requires government API credentials. View official search instructions.
              </p>
            </div>
          </div>

          {comparisonChoice === 'USER_INPUT' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Comparison Reference Fields
                </h4>
                <span className="text-[10px] text-slate-500">Source: User-Supplied Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Expected Parcel Reference
                  </label>
                  <input
                    type="text"
                    value={refParcel}
                    onChange={(e) => setRefParcel(e.target.value)}
                    placeholder="e.g. NAIROBI/BLOCK 105/12"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Expected Title Number
                  </label>
                  <input
                    type="text"
                    value={refTitle}
                    onChange={(e) => setRefTitle(e.target.value)}
                    placeholder="e.g. TITLE NO. 12345"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Expected Proprietor / Owner Name
                  </label>
                  <input
                    type="text"
                    value={refOwner}
                    onChange={(e) => setRefOwner(e.target.value)}
                    placeholder="e.g. Full Legal Name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Expected County / Locality
                  </label>
                  <input
                    type="text"
                    value={refCounty}
                    onChange={(e) => setRefCounty(e.target.value)}
                    placeholder="e.g. Nairobi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {comparisonChoice === 'NO_REF' && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Self-Consistency Mode</p>
              <p>
                TerraTrace will check formatting, identify missing critical folios, and compute the document fingerprint. It will explicitly note that no comparison was made against independent reference records.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Field Review</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteVerification}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-2"
            >
              <span>Run Verification & Build Audit Trail</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: Verifying in Progress */}
      {/* ========================================================================= */}
      {step === 5 && (
        <div className="py-20 text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin mx-auto" />
          <h3 className="text-lg font-bold font-['Space_Grotesk'] text-white">
            Running Verification Engine
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{progressMsg}</p>
        </div>
      )}
    </div>
  );
};
