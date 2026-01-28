'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  reason?: string;
}

export default function ProtectedRoute({ children, reason }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowModal(true);
    } else if (isAuthenticated) {
      setShowModal(false);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="protected-route-loading">
        <div className="protected-route-loading__spinner" />
        <p className="protected-route-loading__text">Yükleniyor...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="protected-route-blocked">
          {/* Bulanık arka plan - içerik gizli */}
          <div className="protected-route-blocked__overlay" />
        </div>
        <AuthModal 
          isOpen={showModal} 
          onClose={() => {}} 
          reason={reason}
        />
      </>
    );
  }

  return <>{children}</>;
}

