// Utility functions for exporting data to CSV/Excel

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers
  const headers = Object.keys(data[0]);
  
  // Create HTML table
  let html = '<table>';
  
  // Add header row
  html += '<thead><tr>';
  headers.forEach(header => {
    html += `<th style="background-color: #667eea; color: white; padding: 10px; border: 1px solid #ddd; font-weight: bold;">${header}</th>`;
  });
  html += '</tr></thead>';
  
  // Add data rows
  html += '<tbody>';
  data.forEach((row, index) => {
    html += '<tr>';
    headers.forEach(header => {
      const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
      html += `<td style="padding: 8px; border: 1px solid #ddd; background-color: ${bgColor};">${row[header] || ''}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  // Create blob and download
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Button Component
import React from 'react';

interface ExportButtonProps {
  data: any[];
  filename: string;
  label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  data, 
  filename, 
  label = '📥 Export' 
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
        }}>
        {label}
        <span style={{ fontSize: '12px' }}>▼</span>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
            overflow: 'hidden',
            minWidth: '180px',
            animation: 'slideUp 0.2s ease-out'
          }}>
            <button
              onClick={() => {
                exportToCSV(data, filename);
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
              <span style={{ fontSize: '18px' }}>📄</span>
              <div>
                <div style={{ fontWeight: '600', color: '#2c3e50' }}>Export to CSV</div>
                <div style={{ fontSize: '11px', color: '#95a5a6' }}>Comma-separated values</div>
              </div>
            </button>

            <div style={{ height: '1px', background: '#e9ecef', margin: '0 10px' }} />

            <button
              onClick={() => {
                exportToExcel(data, filename);
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <div>
                <div style={{ fontWeight: '600', color: '#2c3e50' }}>Export to Excel</div>
                <div style={{ fontSize: '11px', color: '#95a5a6' }}>Microsoft Excel format</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
