import {
  AuditEvent,
  DocumentExtractedFields,
  LandDocument,
  ReferenceRecord,
  RegistryStatusResponse,
  UserProfile,
  VerificationRun,
} from '../types/index.js';

const TOKEN_KEY = 'terratrace_auth_token';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) =>
    request<{ token: string; user: UserProfile; organization?: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: any) =>
    request<{ token: string; user: UserProfile; organization?: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{ user: UserProfile; organization?: any }>('/api/auth/me'),

  updateProfile: (payload: any) =>
    request<{ user: UserProfile; organization?: any }>('/api/auth/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Documents
  uploadDocument: (formData: FormData) =>
    request<{ document: LandDocument; message: string }>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    }),

  getDocuments: () =>
    request<{ documents: LandDocument[] }>('/api/documents'),

  getDocument: (id: string) =>
    request<{ document: LandDocument }>(`/api/documents/${id}`),

  extractFields: (id: string) =>
    request<{ documentId: string; extractedFields: DocumentExtractedFields; message: string }>(
      `/api/documents/${id}/extract`,
      { method: 'POST' }
    ),

  deleteDocument: (id: string) =>
    request<{ success: boolean }>(`/api/documents/${id}`, {
      method: 'DELETE',
    }),

  // Reference records
  createReferenceRecord: (payload: any) =>
    request<{ referenceRecord: ReferenceRecord }>('/api/reference-records', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getReferenceRecords: () =>
    request<{ referenceRecords: ReferenceRecord[] }>('/api/reference-records'),

  // Verifications
  runVerification: (payload: {
    documentId: string;
    extractedFields: DocumentExtractedFields;
    referenceRecordId?: string;
    manualReference?: any;
  }) =>
    request<{ verificationRun: VerificationRun }>('/api/verifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getVerifications: () =>
    request<{ verificationRuns: VerificationRun[] }>('/api/verifications'),

  getVerification: (id: string) =>
    request<{ verificationRun: VerificationRun; document?: LandDocument }>(`/api/verifications/${id}`),

  // Audit
  getAuditEvents: (runId: string) =>
    request<{ events: AuditEvent[] }>(`/api/audit/${runId}`),

  verifyAuditChain: (runId: string) =>
    request<{
      chainValidation: { isValid: boolean; tamperedIndex?: number; reason?: string };
      totalEvents: number;
      latestHash: string | null;
    }>(`/api/audit/${runId}/verify`),

  tamperTestAuditChain: (runId: string, eventIndex = 1) =>
    request<{
      tamperSimulated: boolean;
      chainValidation: { isValid: boolean; tamperedIndex?: number; reason?: string };
      message: string;
    }>(`/api/audit/${runId}/tamper-test`, {
      method: 'POST',
      body: JSON.stringify({ eventIndex }),
    }),

  // Official Registry & Identity
  getRegistryStatus: () =>
    request<RegistryStatusResponse>('/api/registry/status'),

  getIdentityStatus: () =>
    request<{ providerConnected: boolean; status: string; message: string; disclaimer: string }>(
      '/api/identity-verification/status'
    ),

  startIdentityVerification: () =>
    request<{ status: string; message: string }>('/api/identity-verification/start', {
      method: 'POST',
    }),
};
