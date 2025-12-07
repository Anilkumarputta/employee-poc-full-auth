import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, duration = 4000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return { bg: '#10b981', border: '#059669' };
      case 'error': return { bg: '#ef4444', border: '#dc2626' };
      case 'warning': return { bg: '#f59e0b', border: '#d97706' };
      case 'info': return { bg: '#3b82f6', border: '#2563eb' };
    }
  };

  const colors = getColors();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      background: colors.bg,
      color: 'white',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '500px',
      animation: isExiting ? 'slideOutRight 0.3s ease-out' : 'slideInRight 0.3s ease-out',
      border: `2px solid ${colors.border}`,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ fontSize: '24px' }}>{getIcon()}</div>
      <div style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>{message}</div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'scale(1)';
        }}>
        ✕
      </button>
    </div>
  );
};

// Toast Container Component
interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, padding: '20px', zIndex: 10000 }}>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ marginBottom: index < toasts.length - 1 ? '10px' : '0' }}>
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Custom hook for using toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return { toasts, showToast, removeToast };
};
