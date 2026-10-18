/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from './types/index.js';
import { api, authStorage } from './services/api.js';
import { Navbar } from './components/Navbar.js';
import { LandingHero } from './components/LandingHero.js';
import { AuthModal } from './components/AuthModal.js';
import { DashboardView } from './components/DashboardView.js';
import { DocumentUploadWizard } from './components/DocumentUploadWizard.js';
import { VerificationReportView } from './components/VerificationReportView.js';
import { ArdhisasaGuidanceView } from './components/ArdhisasaGuidanceView.js';
import { TestSuiteModal } from './components/TestSuiteModal.js';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [testSuiteOpen, setTestSuiteOpen] = useState(false);

  // Active view: 'HOME' | 'DASHBOARD' | 'VERIFY_WIZARD' | 'REPORT' | 'ARDHISASA'
  const [currentView, setCurrentView] = useState<string>('HOME');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Check stored session on mount
  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }

    api
      .getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        authStorage.clearToken();
        setUser(null);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  const handleOpenAuth = (mode: 'LOGIN' | 'REGISTER' = 'LOGIN') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setAuthModalOpen(false);
    if (currentView === 'HOME') {
      setCurrentView('DASHBOARD');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore
    }
    authStorage.clearToken();
    setUser(null);
    setCurrentView('HOME');
  };

  const handleStartVerification = () => {
    if (!user) {
      // Require registration/login first to maintain row-level security and document ownership
      setAuthModalMode('REGISTER');
      setAuthModalOpen(true);
      return;
    }
    setCurrentView('VERIFY_WIZARD');
  };

  const handleVerificationComplete = (runId: string) => {
    setSelectedRunId(runId);
    setCurrentView('REPORT');
  };

  const handleViewReport = (runId: string) => {
    setSelectedRunId(runId);
    setCurrentView('REPORT');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'VERIFY_WIZARD' && !user) {
            handleStartVerification();
            return;
          }
          setCurrentView(view);
        }}
        onOpenTestSuite={() => setTestSuiteOpen(true)}
      />

      {/* Main Content Render */}
      <main className="flex-1 flex flex-col">
        {currentView === 'HOME' && (
          <LandingHero
            onStartVerification={handleStartVerification}
            onExploreHowItWorks={() => {
              const el = document.getElementById('how-it-works');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                setCurrentView('HOME');
              }
            }}
            onOpenArdhisasa={() => setCurrentView('ARDHISASA')}
          />
        )}

        {currentView === 'DASHBOARD' && user && (
          <DashboardView
            user={user}
            onStartVerification={handleStartVerification}
            onViewReport={handleViewReport}
            onOpenArdhisasa={() => setCurrentView('ARDHISASA')}
          />
        )}

        {currentView === 'VERIFY_WIZARD' && user && (
          <DocumentUploadWizard
            onVerificationComplete={handleVerificationComplete}
            onCancel={() => setCurrentView(user ? 'DASHBOARD' : 'HOME')}
            onOpenArdhisasa={() => setCurrentView('ARDHISASA')}
          />
        )}

        {currentView === 'REPORT' && selectedRunId && (
          <VerificationReportView
            runId={selectedRunId}
            onBack={() => setCurrentView(user ? 'DASHBOARD' : 'HOME')}
            onOpenArdhisasa={() => setCurrentView('ARDHISASA')}
          />
        )}

        {currentView === 'ARDHISASA' && (
          <ArdhisasaGuidanceView
            onBackToDashboard={() => setCurrentView(user ? 'DASHBOARD' : 'HOME')}
            onStartVerification={handleStartVerification}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {/* In-App Automated Acceptance Test Runner */}
      <TestSuiteModal
        isOpen={testSuiteOpen}
        onClose={() => setTestSuiteOpen(false)}
      />
    </div>
  );
}
