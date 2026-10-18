-- =============================================================================
-- TERRATRACE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Target: PostgreSQL 14+ / Supabase PostgreSQL
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('INDIVIDUAL', 'COMPANY')),
    display_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone VARCHAR(30) DEFAULT '+254',
    country VARCHAR(60) DEFAULT 'Kenya',
    identity_verification_status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED'
        CHECK (identity_verification_status IN ('NOT_STARTED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'ACTION_REQUIRED')),
    id_number TEXT, -- Optional, collected only when lawfully justified
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    registered_name TEXT NOT NULL,
    registration_number TEXT,
    country VARCHAR(60) DEFAULT 'Kenya',
    representative_name TEXT NOT NULL,
    representative_email TEXT NOT NULL,
    phone VARCHAR(30) DEFAULT '+254',
    verification_status VARCHAR(30) NOT NULL DEFAULT 'SELF_DECLARED'
        CHECK (verification_status IN ('UNVERIFIED', 'SELF_DECLARED', 'VERIFIED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Documents Table (Private Storage Vault Metadata)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    private_storage_path TEXT NOT NULL UNIQUE,
    original_sha256 VARCHAR(64) NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'TITLE_DEED'
        CHECK (document_type IN ('TITLE_DEED', 'CERTIFICATE_OF_TITLE', 'CERTIFICATE_OF_LEASE', 'MUTATION_FORM', 'ALLOTMENT_LETTER', 'SURVEY_PLAN', 'OFFICIAL_SEARCH', 'OTHER_LAND_DOCUMENT')),
    processing_status VARCHAR(30) NOT NULL DEFAULT 'UPLOADED'
        CHECK (processing_status IN ('UPLOADED', 'PROCESSING', 'EXTRACTED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retention_until TIMESTAMPTZ
);

-- 4. Reference Records Table (User-Supplied or Independent)
CREATE TABLE IF NOT EXISTS reference_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL DEFAULT 'USER_SUPPLIED_INPUT'
        CHECK (source_type IN ('USER_SUPPLIED_INPUT', 'USER_UPLOADED_REFERENCE', 'OFFICIAL_REGISTRY_PROVIDER', 'NO_REFERENCE_PROVIDED')),
    source_name TEXT,
    parcel_number TEXT,
    title_number TEXT,
    registered_owner TEXT,
    county_or_locality TEXT,
    land_area TEXT,
    registration_date TEXT,
    notes TEXT,
    obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Verification Runs Table
CREATE TABLE IF NOT EXISTS verification_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL
        CHECK (status IN (
            'MATCHED_USER_SUPPLIED_DATA',
            'REVIEW_REQUIRED',
            'INSUFFICIENT_INFORMATION',
            'OFFICIAL_VERIFICATION_REQUIRED',
            'OFFICIAL_SOURCE_MATCH',
            'PROCESSING_FAILED',
            'REFERENCE_UNAVAILABLE'
        )),
    status_explanation TEXT NOT NULL,
    findings_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    reference_source_type VARCHAR(50) NOT NULL DEFAULT 'NO_REFERENCE_PROVIDED',
    reference_record_id UUID REFERENCES reference_records(id) ON DELETE SET NULL,
    document_sha256 VARCHAR(64) NOT NULL,
    audit_run_reference VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Audit Events Table (Cryptographic Hash Chaining)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_run_id UUID NOT NULL REFERENCES verification_runs(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    event_hash VARCHAR(64) NOT NULL,
    document_hash VARCHAR(64) NOT NULL,
    actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Identity Verification Requests Table
CREATE TABLE IF NOT EXISTS identity_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider_reference TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance and authorized querying
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_sha256 ON documents(original_sha256);
CREATE INDEX IF NOT EXISTS idx_verification_owner ON verification_runs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_run ON audit_events(verification_run_id);
CREATE INDEX IF NOT EXISTS idx_reference_records_owner ON reference_records(owner_user_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Zero cross-user data leakage guarantee
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verification_requests ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update only their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Organizations: Only the owner user can access their organization
CREATE POLICY "Owners can access own organization"
    ON organizations FOR ALL
    USING (auth.uid() = owner_user_id);

-- Documents: Strict owner isolation
CREATE POLICY "Users can view and upload own documents"
    ON documents FOR ALL
    USING (auth.uid() = owner_user_id);

-- Reference Records: Strict owner isolation
CREATE POLICY "Users can view and manage own reference records"
    ON reference_records FOR ALL
    USING (auth.uid() = owner_user_id);

-- Verification Runs: Users can only view their own runs
CREATE POLICY "Users can view own verification runs"
    ON verification_runs FOR ALL
    USING (auth.uid() = owner_user_id);

-- Audit Events: Users can only view audit events associated with their verification runs
CREATE POLICY "Users can view own audit events"
    ON audit_events FOR SELECT
    USING (auth.uid() = actor_id);

-- Identity Verification Requests
CREATE POLICY "Users can view and submit own identity verification"
    ON identity_verification_requests FOR ALL
    USING (auth.uid() = owner_user_id);
