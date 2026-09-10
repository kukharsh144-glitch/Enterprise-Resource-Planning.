import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X,
  Loader2
} from 'lucide-react';
import './GlassToast.css';

/**
 * Global dispatcher to trigger right-side glassmorphic notifications.
 * Types: 'success' | 'error' | 'warning' | 'info' | 'loading'
 */
export const showGlassToast = ({ title, message, type = 'info', duration = 5000, action = null, id = null }) => {
  const toastId = id || 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  window.dispatchEvent(
    new CustomEvent('erp:glass-toast', {
      detail: {
        id: toastId,
        title,
        message,
        type,
        duration,
        action,
        createdAt: Date.now()
      }
    })
  );
  return toastId;
};

showGlassToast.success = (title, message, duration = 5000, action = null) => {
  return showGlassToast({ title, message, type: 'success', duration, action });
};

showGlassToast.error = (title, message, duration = 7500, action = null) => {
  return showGlassToast({ title, message, type: 'error', duration, action });
};

showGlassToast.warning = (title, message, duration = 6500, action = null) => {
  return showGlassToast({ title, message, type: 'warning', duration, action });
};

showGlassToast.info = (title, message, duration = 5000, action = null) => {
  return showGlassToast({ title, message, type: 'info', duration, action });
};

/**
 * Promise wrapper: Displays a loading toast, then automatically transitions
 * to either success or error toast upon promise settlement.
 */
showGlassToast.promise = async (promise, {
  loadingTitle = 'Processing...',
  loadingMessage = 'Executing request in background...',
  successTitle = 'Operation Successful',
  successMessage = (data) => data?.message || 'Action completed successfully.',
  errorTitle = 'Operation Failed',
  errorMessage = (err) => err?.response?.data?.message || err?.message || 'Something went wrong.'
}) => {
  const toastId = 'prom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  
  // Emit initial loading toast
  window.dispatchEvent(
    new CustomEvent('erp:glass-toast', {
      detail: {
        id: toastId,
        title: loadingTitle,
        message: loadingMessage,
        type: 'loading',
        duration: 60000, // keep alive until resolved
        createdAt: Date.now()
      }
    })
  );

  try {
    const result = await promise;
    const msg = typeof successMessage === 'function' ? successMessage(result) : successMessage;
    const tit = typeof successTitle === 'function' ? successTitle(result) : successTitle;

    // Update existing toast with success
    window.dispatchEvent(
      new CustomEvent('erp:glass-toast-update', {
        detail: {
          id: toastId,
          title: tit,
          message: msg,
          type: 'success',
          duration: 5000
        }
      })
    );
    return result;
  } catch (error) {
    const msg = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage;
    const tit = typeof errorTitle === 'function' ? errorTitle(error) : errorTitle;

    // Update existing toast with error
    window.dispatchEvent(
      new CustomEvent('erp:glass-toast-update', {
        detail: {
          id: toastId,
          title: tit,
          message: msg,
          type: 'error',
          duration: 8000
        }
      })
    );
    throw error;
  }
};

const toastTypeConfigs = {
  success: {
    icon: CheckCircle2,
    color: '#10b981',
    bgBadge: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(16, 185, 129, 0.42)',
    shadowGlow: 'rgba(16, 185, 129, 0.26)',
    progressBg: 'linear-gradient(90deg, #10b981, #34d399)'
  },
  error: {
    icon: AlertCircle,
    color: '#ef4444',
    bgBadge: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.46)',
    shadowGlow: 'rgba(239, 68, 68, 0.28)',
    progressBg: 'linear-gradient(90deg, #ef4444, #f87171)'
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
    bgBadge: 'rgba(245, 158, 11, 0.16)',
    border: 'rgba(245, 158, 11, 0.42)',
    shadowGlow: 'rgba(245, 158, 11, 0.25)',
    progressBg: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
  },
  info: {
    icon: Info,
    color: '#818cf8',
    bgBadge: 'rgba(99, 102, 241, 0.16)',
    border: 'rgba(99, 102, 241, 0.4)',
    shadowGlow: 'rgba(99, 102, 241, 0.25)',
    progressBg: 'linear-gradient(90deg, #6366f1, #818cf8)'
  },
  loading: {
    icon: Loader2,
    color: '#38bdf8',
    bgBadge: 'rgba(56, 189, 248, 0.16)',
    border: 'rgba(56, 189, 248, 0.4)',
    shadowGlow: 'rgba(56, 189, 248, 0.25)',
    progressBg: 'linear-gradient(90deg, #0284c7, #38bdf8)'
  }
};

export const GlassToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const toast = e.detail;
      if (!toast) return;

      setToasts(prev => {
        // If this ID already exists, update it
        const exists = prev.some(t => t.id === toast.id);
        if (exists) {
          return prev.map(t => t.id === toast.id ? { ...t, ...toast } : t);
        }
        return [toast, ...prev].slice(0, 6); // Keep top 6 notifications
      });
    };

    const handleToastUpdateEvent = (e) => {
      const updated = e.detail;
      if (!updated) return;
      setToasts(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
    };

    // Global listener to catch any unhandled promise rejections and present them nicely in glassmorphism
    const handleUnhandledRejection = (event) => {
      console.warn('Captured unhandled promise rejection:', event.reason);
      const reason = event.reason;
      const errMsg = 
        reason?.response?.data?.message || 
        reason?.message || 
        (typeof reason === 'string' ? reason : null);

      if (errMsg && !errMsg.includes('canceled') && !errMsg.includes('aborted')) {
        showGlassToast.error('Operation Notice', errMsg);
      }
    };

    window.addEventListener('erp:glass-toast', handleToastEvent);
    window.addEventListener('erp:glass-toast-update', handleToastUpdateEvent);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('erp:glass-toast', handleToastEvent);
      window.removeEventListener('erp:glass-toast-update', handleToastUpdateEvent);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="sm-glass-toast-portal" aria-live="polite">
      {toasts.map(toast => {
        const config = toastTypeConfigs[toast.type] || toastTypeConfigs.info;
        const IconComp = config.icon;

        return (
          <GlassToastItem 
            key={toast.id} 
            toast={toast} 
            config={config} 
            IconComp={IconComp} 
            onDismiss={() => removeToast(toast.id)} 
          />
        );
      })}
    </div>
  );
};

const GlassToastItem = ({ toast, config, IconComp, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const isLoading = toast.type === 'loading';

  useEffect(() => {
    if (isPaused || isLoading) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [isPaused, isLoading, toast.duration, toast.id, toast.type]);

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss();
    }, 280);
  };

  return (
    <div
      className={`sm-glass-toast-card ${isDismissing ? 'is-dismissing' : ''}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        borderColor: config.border,
        boxShadow: `0 20px 45px -10px rgba(0, 0, 0, 0.88), 0 0 24px ${config.shadowGlow}`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '13px' }}>
        {/* Glowing Badge Icon */}
        <div 
          className="sm-toast-icon-badge"
          style={{
            backgroundColor: config.bgBadge,
            color: config.color,
            boxShadow: `0 0 14px ${config.color}33`
          }}
        >
          <IconComp size={18} className={isLoading ? 'spinner' : ''} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
        </div>

        {/* Text Content */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}>
          {toast.title && (
            <h5 
              style={{ 
                margin: '0 0 3px 0', 
                fontSize: '13px', 
                fontWeight: 750, 
                color: config.color,
                letterSpacing: '0.01em'
              }}
            >
              {toast.title}
            </h5>
          )}
          <p 
            style={{ 
              margin: 0, 
              fontSize: '12px', 
              color: 'var(--text-secondary)', 
              lineHeight: 1.45,
              wordBreak: 'break-word'
            }}
          >
            {toast.message}
          </p>

          {/* Action button if provided */}
          {toast.action && (
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  if (typeof toast.action.onClick === 'function') toast.action.onClick();
                  handleDismiss();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: `1px solid ${config.border}`,
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {toast.action.label || 'Action'}
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="sm-toast-close-btn"
          title="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>

      {/* Shrinking Countdown Progress Bar */}
      {!isLoading && (
        <div className="sm-toast-progress-track">
          <div 
            className={`sm-toast-progress-fill ${isPaused ? 'is-paused' : ''}`}
            style={{
              background: config.progressBg,
              animationDuration: `${toast.duration || 5000}ms`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GlassToastContainer;
