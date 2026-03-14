
import React, { useState } from 'react';
import type { ConsultingResult } from '../types';
import { ClipboardCheckIcon, CopyIcon, JsonIcon } from './icons';

interface ConsultingModalProps {
  isOpen: boolean;
  onClose: () => void;
  consulting: ConsultingResult | null;
  isLoading: boolean;
  error: string | null;
}

const ConsultingModal: React.FC<ConsultingModalProps> = ({ isOpen, onClose, consulting, isLoading, error }) => {
  const [copyButtonText, setCopyButtonText] = useState('분석 내용 복사');

  if (!isOpen) return null;

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

  const handleDownloadJson = () => {
    if (!consulting) return;
    const fileName = `channel_consulting_report.json`;
    downloadFile(JSON.stringify(consulting, null, 2), fileName, 'application/json');
  };

  const formatConsultingForCopy = (c: ConsultingResult): string => {
    let text = `AI 채널 진단 및 성장 컨설팅\n\n`;
    text += `== ${c.overallDiagnosis.title} ==\n${c.overallDiagnosis.summary}\n\n`;
    text += `== 영역별 상세 분석 ==\n`;
    c.detailedAnalysis.forEach(item => {
        text += `\n[${item.area}]\n`;
        text += `- 문제점: ${item.problem}\n`;
        text += `- 해결책: ${item.solution}\n`;
    });
    text += `\n== 실행 계획(Action Plan) ==\n`;
    text += `\n[${c.actionPlan.shortTerm.title} (${c.actionPlan.shortTerm.period})]\n`;
    c.actionPlan.shortTerm.steps.forEach(step => text += `- ${step}\n`);
    text += `\n[${c.actionPlan.longTerm.title} (${c.actionPlan.longTerm.period})]\n`;
    c.actionPlan.longTerm.steps.forEach(step => text += `- ${step}\n`);
    return text;
  };

  const handleCopy = () => {
    if (!consulting) return;
    const textToCopy = formatConsultingForCopy(consulting);
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyButtonText('복사 완료!');
        setTimeout(() => setCopyButtonText('분석 내용 복사'), 2000);
    }, (err) => {
        console.error('Copy failed', err);
        setCopyButtonText('복사 실패');
        setTimeout(() => setCopyButtonText('분석 내용 복사'), 2000);
    });
  };
  
  const getAreaIcon = (area: string) => {
    if (area.includes('콘텐츠')) return 'fas fa-lightbulb text-yellow-500';
    if (area.includes('참여')) return 'fas fa-users text-blue-500';
    if (area.includes('브랜딩')) return 'fas fa-tags text-purple-500';
    if (area.includes('수익')) return 'fas fa-sack-dollar text-green-500';
    return 'fas fa-chart-pie text-slate-500';
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg max-w-4xl w-full text-left border-t-4 border-blue-500 relative animate-fade-in-up max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ClipboardCheckIcon />
                AI 채널 진단 및 성장 컨설팅
            </h2>
            <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-3xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="닫기"
            >
            &times;
            </button>
        </div>

        <div className="overflow-y-auto pr-2 flex-grow">
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-10 text-slate-500 dark:text-slate-400 h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">AI 컨설턴트가 채널을 정밀 진단 중입니다...</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">데이터에 기반한 최적의 성장 솔루션을 도출하고 있습니다.</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg text-red-700 dark:text-red-300">
                <p className="font-bold mb-1"><i className="fas fa-exclamation-circle mr-1"></i> 컨설팅 리포트 생성 오류!</p>
                <p>{error}</p>
            </div>
          )}
          {consulting && (
            <div className="space-y-8">
              <div className="text-center p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-2">{consulting.overallDiagnosis.title}</h3>
                <p className="text-slate-700 dark:text-slate-300 max-w-3xl mx-auto whitespace-pre-wrap">{consulting.overallDiagnosis.summary}</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">영역별 상세 분석 및 솔루션</h3>
                <div className="space-y-4">
                  {consulting.detailedAnalysis.map((item, index) => (
                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h4 className="font-bold text-md text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-2">
                        <i className={getAreaIcon(item.area)}></i> {item.area}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-300 dark:border-blue-500">
                           <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-1">문제점</p>
                           <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{item.problem}</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-300 dark:border-green-500">
                            <p className="font-semibold text-green-800 dark:text-green-300 text-sm mb-1">솔루션</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{item.solution}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

               <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">성장을 위한 Action Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Short-term Plan */}
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200">{consulting.actionPlan.shortTerm.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">{consulting.actionPlan.shortTerm.period}</p>
                        <ul className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 text-sm">
                            {consulting.actionPlan.shortTerm.steps.map((step, i) => <li key={i}>{step}</li>)}
                        </ul>
                    </div>
                    {/* Long-term Plan */}
                     <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200">{consulting.actionPlan.longTerm.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">{consulting.actionPlan.longTerm.period}</p>
                         <ul className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 text-sm">
                            {consulting.actionPlan.longTerm.steps.map((step, i) => <li key={i}>{step}</li>)}
                        </ul>
                    </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {consulting && (
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 flex justify-end items-center gap-3">
                <button
                    onClick={handleCopy}
                    disabled={copyButtonText !== '분석 내용 복사'}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
                >
                    <CopyIcon />
                    {copyButtonText}
                </button>
                <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 dark:hover:bg-green-500 transition-colors"
                >
                    <JsonIcon />
                    JSON 다운로드
                </button>
            </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ConsultingModal;