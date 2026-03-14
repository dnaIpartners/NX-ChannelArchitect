
import React from 'react';
import type { AnalyzedVideo } from '../types';
import { DownloadIcon } from './icons';

interface ExportButtonsProps {
  data: AnalyzedVideo[];
  exportTitle: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ data, exportTitle }) => {
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleExportJSON = () => {
    const fileName = `${exportTitle.replace(/\s/g, '_')}_analysis.json`;
    downloadFile(JSON.stringify(data, null, 2), fileName, 'application/json');
  };

  const handleExportCSV = () => {
    const header = 'ID,Title,Published At,Thumbnail URL,View Count,Like Count,Comment Count,Popularity Score,Keywords,Hashtags\n';
    const rows = data.map(v => 
      [
        v.id,
        `"${v.title.replace(/"/g, '""')}"`,
        v.publishedAt,
        v.thumbnailUrl,
        v.viewCount,
        v.likeCount,
        v.commentCount,
        v.popularityScore.toFixed(2),
        `"${(v.tags || []).join(', ')}"`,
        `"${(v.hashtags || []).join(', ')}"`
      ].join(',')
    ).join('\n');
    
    const bom = '\uFEFF'; // BOM for Excel compatibility
    const csvContent = bom + header + rows;
    const fileName = `${exportTitle.replace(/\s/g, '_')}_analysis.csv`;
    downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
  };

  return (
    <div className="flex items-center space-x-3">
      <button 
        onClick={handleExportJSON}
        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 dark:hover:bg-green-500 transition-colors"
      >
        <DownloadIcon />
        <span>JSON 내보내기</span>
      </button>
      <button 
        onClick={handleExportCSV}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
      >
        <DownloadIcon />
        <span>CSV 내보내기</span>
      </button>
    </div>
  );
};

export default ExportButtons;