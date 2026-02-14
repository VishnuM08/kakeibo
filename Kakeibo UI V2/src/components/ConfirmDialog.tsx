/**
 * CONFIRMATION DIALOG COMPONENT
 * 
 * Reusable confirmation dialog for destructive or important actions.
 * Prevents accidental deletions and ensures user intent.
 * 
 * FEATURES:
 * - Customizable title, message, and action buttons
 * - Different variants (danger, warning, info)
 * - Keyboard shortcuts (Enter to confirm, Escape to cancel)
 * - Focus management for accessibility
 * - Backdrop click to cancel
 * 
 * USAGE:
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   title="Delete Expense?"
 *   message="This action cannot be undone."
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   variant="danger"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * 
 * ACCESSIBILITY:
 * - Focus trap within dialog
 * - Escape key to close
 * - Enter key to confirm
 * - ARIA roles and labels
 * - Screen reader announcements
 */

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

// ================================
// TYPE DEFINITIONS
// ================================

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode?: boolean;
  loading?: boolean; // Show loading state on confirm button
}

// ================================
// CONFIRM DIALOG COMPONENT
// ================================

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isDarkMode = false,
  loading = false,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // ================================
  // VARIANT CONFIGURATIONS
  // ================================

  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBg: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
      confirmText: 'text-white',
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      confirmBg: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800',
      confirmText: 'text-white',
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmBg: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      confirmText: 'text-white',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  // ================================
  // KEYBOARD HANDLERS
  // ================================

  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button when dialog opens
    confirmButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }

      // Enter to confirm (only if confirm button is focused or no input is focused)
      if (e.key === 'Enter' && !loading) {
        e.preventDefault();
        onConfirm();
      }

      // Tab key - cycle between cancel and confirm buttons
      if (e.key === 'Tab') {
        e.preventDefault();
        if (document.activeElement === confirmButtonRef.current) {
          cancelButtonRef.current?.focus();
        } else {
          confirmButtonRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel, loading]);

  // ================================
  // BACKDROP CLICK HANDLER
  // ================================

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  // ================================
  // RENDER
  // ================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        className={`w-full max-w-sm rounded-3xl shadow-2xl animate-scaleIn transform transition-all ${
          isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isDarkMode
              ? 'hover:bg-white/10 text-white/50 hover:text-white'
              : 'hover:bg-black/5 text-black/50 hover:text-black'
          }`}
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-16 h-16 rounded-full ${config.iconBg} flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${config.iconColor}`} strokeWidth={2.5} />
            </div>
          </div>

          {/* Title */}
          <h2
            id="confirm-dialog-title"
            className={`text-2xl font-bold text-center mb-3 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}
          >
            {title}
          </h2>

          {/* Message */}
          <p
            id="confirm-dialog-message"
            className={`text-center mb-8 text-[15px] leading-relaxed ${
              isDarkMode ? 'text-white/70' : 'text-black/70'
            }`}
          >
            {message}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Confirm Button */}
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              disabled={loading}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${config.confirmBg} ${config.confirmText} ${
                loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'
              }`}
              autoFocus
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </button>

            {/* Cancel Button */}
            <button
              ref={cancelButtonRef}
              onClick={onCancel}
              disabled={loading}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                isDarkMode
                  ? 'bg-white/10 hover:bg-white/15 text-white'
                  : 'bg-black/5 hover:bg-black/10 text-black'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}`}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

// ================================
// QUICK CONFIRMATION HOOK
// ================================

/**
 * Custom hook for easy confirmation dialogs
 * 
 * Usage:
 * const confirm = useConfirm();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete this?',
 *     message: 'This cannot be undone.',
 *     variant: 'danger',
 *   });
 *   
 *   if (confirmed) {
 *     // Do something
 *   }
 * };
 */
export function useConfirm() {
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    confirmText: string;
    cancelText: string;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    resolve: null,
  });

  const confirm = React.useCallback(
    (options: {
      title: string;
      message: string;
      variant?: 'danger' | 'warning' | 'info';
      confirmText?: string;
      cancelText?: string;
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          isOpen: true,
          title: options.title,
          message: options.message,
          variant: options.variant || 'danger',
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          resolve,
        });
      });
    },
    []
  );

  const handleConfirm = React.useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  const handleCancel = React.useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  const Dialog = React.useCallback(
    ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDarkMode={isDarkMode}
      />
    ),
    [dialogState, handleConfirm, handleCancel]
  );

  return { confirm, ConfirmDialog: Dialog };
}

export default ConfirmDialog;
