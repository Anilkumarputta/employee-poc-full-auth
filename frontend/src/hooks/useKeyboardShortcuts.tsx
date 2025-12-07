import { useEffect } from 'react';

export type ShortcutKey = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
};

export const useKeyboardShortcuts = (shortcuts: ShortcutKey[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === e.shiftKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === e.altKey;
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Keyboard Shortcuts Help Modal
import React, { useState } from 'react';

export const KeyboardShortcutsHelp: React.FC<{ shortcuts: ShortcutKey[] }> = ({ shortcuts }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      animation: 'fadeIn 0.3s ease-out'
    }}
    onClick={() => setIsOpen(false)}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>⌨️</span>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {shortcuts.map((shortcut, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '10px',
              border: '1px solid #e9ecef'
            }}>
              <span style={{ fontSize: '14px', color: '#495057' }}>{shortcut.description}</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {shortcut.ctrl && (
                  <kbd style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>Ctrl</kbd>
                )}
                {shortcut.shift && (
                  <kbd style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>Shift</kbd>
                )}
                {shortcut.alt && (
                  <kbd style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>Alt</kbd>
                )}
                <kbd style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  minWidth: '30px',
                  textAlign: 'center'
                }}>
                  {shortcut.key.toUpperCase()}
                </kbd>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '25px',
          padding: '15px',
          background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
          borderRadius: '10px',
          fontSize: '13px',
          color: '#00838f',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <span>Press <kbd style={{ 
            background: '#00acc1', 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: '4px',
            fontWeight: '600'
          }}>Shift + ?</kbd> to toggle this help anytime</span>
        </div>
      </div>
    </div>
  );
};
