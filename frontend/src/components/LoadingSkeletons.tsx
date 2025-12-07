import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div style={{ padding: '40px' }}>
      {/* Header Skeleton */}
      <div style={{ marginBottom: '30px' }}>
        <div className="skeleton skeleton-title" style={{ width: '40%' }} />
        <div className="skeleton skeleton-text" style={{ width: '30%', marginTop: '10px' }} />
      </div>

      {/* Cards Grid Skeleton */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%', marginBottom: '15px' }} />
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            <div className="skeleton" style={{ height: '32px', width: '80%', margin: '15px 0' }} />
            <div className="skeleton skeleton-text" style={{ width: '50%' }} />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {[1, 2].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: '30px' }}>
            <div className="skeleton skeleton-title" style={{ width: '50%', marginBottom: '20px' }} />
            <div className="skeleton" style={{ height: '200px', width: '100%' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div style={{ padding: '20px' }}>
      {/* Search/Filter Bar Skeleton */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div className="skeleton" style={{ height: '40px', width: '300px' }} />
        <div className="skeleton" style={{ height: '40px', width: '150px' }} />
        <div className="skeleton" style={{ height: '40px', width: '150px' }} />
      </div>

      {/* Table Skeleton */}
      <div className="skeleton-card">
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton skeleton-text" />
          ))}
        </div>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '15px', 
            padding: '15px',
            borderBottom: i < rows - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            {[1, 2, 3, 4, 5].map(j => (
              <div key={j} className="skeleton skeleton-text" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="skeleton-card" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', gap: '15px' }}>
        <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-title" style={{ width: '70%', marginBottom: '10px' }} />
          <div className="skeleton skeleton-text" style={{ width: '90%' }} />
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
};

export const LoadingSpinner: React.FC<{ size?: number; color?: string }> = ({ 
  size = 40, 
  color = '#667eea' 
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `4px solid rgba(102, 126, 234, 0.1)`,
        borderTop: `4px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
