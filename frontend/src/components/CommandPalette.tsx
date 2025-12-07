import React, { useState, useEffect, useRef } from 'react';

export interface CommandAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  keywords?: string[];
  category?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandAction[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(searchLower)) ||
      cmd.category?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      filteredCommands[selectedIndex].action();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '15vh',
      zIndex: 10000,
      animation: 'fadeIn 0.2s ease-out'
    }}
    onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '640px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e9ecef',
          background: '#f8f9fa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '18px',
                background: 'transparent',
                color: '#2c3e50'
              }}
            />
            <kbd style={{
              background: '#e9ecef',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6c757d',
              fontWeight: '600'
            }}>ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '8px'
        }}>
          {filteredCommands.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#95a5a6'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤷</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#6c757d' }}>
                No commands found
              </div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>
                Try searching for something else
              </div>
            </div>
          ) : (
            <>
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: 'none',
                    background: index === selectedIndex ? '#e7f3ff' : 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.15s',
                    marginBottom: '4px',
                    textAlign: 'left',
                    borderLeft: index === selectedIndex ? '3px solid #667eea' : '3px solid transparent'
                  }}>
                  <span style={{ fontSize: '24px' }}>{cmd.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: index === selectedIndex ? '#667eea' : '#2c3e50',
                      marginBottom: '2px'
                    }}>
                      {cmd.label}
                    </div>
                    {cmd.category && (
                      <div style={{
                        fontSize: '12px',
                        color: '#95a5a6'
                      }}>
                        {cmd.category}
                      </div>
                    )}
                  </div>
                  {index === selectedIndex && (
                    <kbd style={{
                      background: '#667eea',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>↵</kbd>
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e9ecef',
          background: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#6c757d'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>
              <kbd style={{ 
                background: '#e9ecef', 
                padding: '2px 6px', 
                borderRadius: '4px',
                marginRight: '4px'
              }}>↑↓</kbd>
              Navigate
            </span>
            <span>
              <kbd style={{ 
                background: '#e9ecef', 
                padding: '2px 6px', 
                borderRadius: '4px',
                marginRight: '4px'
              }}>↵</kbd>
              Select
            </span>
          </div>
          <span>{filteredCommands.length} results</span>
        </div>
      </div>
    </div>
  );
};

// Hook to use command palette
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, openPalette: () => setIsOpen(true), closePalette: () => setIsOpen(false) };
};
