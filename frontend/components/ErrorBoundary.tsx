'use client';

import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-[400px] flex items-center justify-center p-8"
        >
          <div className="max-w-md w-full bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6"
            >
              <ExclamationTriangleIcon className="w-10 h-10 text-red-400" />
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-3">Bir Hata Oluştu</h2>
            <p className="text-gray-400 mb-6">
              Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya tekrar deneyin.
            </p>

            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-black/30 rounded-lg text-left">
                <p className="text-sm text-red-400 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold transition-all"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Tekrar Dene
            </button>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

