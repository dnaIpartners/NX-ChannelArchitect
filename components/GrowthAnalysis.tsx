
import React, { useState } from 'react';
import type { GrowthAnalysisResult } from '../types';
import { LightbulbIcon, CopyIcon, JsonIcon, TimelineIcon } from './icons';

interface GrowthAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: GrowthAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

const GrowthAnalysisModal: React.FC<GrowthAnalysisModalProps> = ({ isOpen, onClose, analysis, isLoading, error }) => {
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
    if (!analysis) return;
    const fileName = `channel_growth_analysis.json`;
    downloadFile(JSON.stringify(analysis, null, 2), fileName, 'application/json');
  };

  const formatAnalysisForCopy = (a: GrowthAnalysisResult): string => {
    let text = `${a.title}\n\n`;
    text += `== 총평 ==\n${a.overallSummary}\n\n`;
    a.phases.forEach(p => {
        text += `== ${p.phaseTitle} (${p.period}) ==\n`;
        text += `\n[성과 요약]\n${p.performanceSummary}\n`;
        text += `\n[전략 분석]\n${p.strategyAnalysis}\n`;

        if (p.quantitativeAnalysis) {
            text += `\n[${p.quantitativeAnalysis.title}]\n`;
            text += `- 평균 조회수: ${p.quantitativeAnalysis.avgViews}\n`;
            text += `- 좋아요/조회수: ${p.quantitativeAnalysis.likeViewRatio}\n`;
            text += `- 댓글/조회수 (1k): ${p.quantitativeAnalysis.commentViewRatio}\n`;
        }

        if (p.contentStrategyAnalysis) {
            text += `\n[${p.contentStrategyAnalysis.title}]\n`;
            text += `- 평균 영상 길이: ${p.contentStrategyAnalysis.avgVideoDuration}\n`;
            text += `- 업로드 주기: ${p.contentStrategyAnalysis.uploadFrequency}\n`;
            text += `- 제목/썸네일 전략: ${p.contentStrategyAnalysis.titleThumbnailStrategy}\n`;
        }

        if (p.keyVideos && p.keyVideos.length > 0) {
            text += `\n[대표 영상]\n`;
            p.keyVideos.forEach(v => {
                text += `- ${v.title}: ${v.reason}\n`;
            });
        }
        text += `\n`;
    });
    return text;
  };

  const handleCopy = () => {
    if (!analysis) return;
    const textToCopy = formatAnalysisForCopy(analysis);
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyButtonText('복사 완료!');
        setTimeout(() => setCopyButtonText('분석 내용 복사'), 2000);
    }, (err) => {
        console.error('Copy failed', err);
        setCopyButtonText('복사 실패');
        setTimeout(() => setCopyButtonText('분석 내용 복사'), 2000);
    });
  };

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
                <TimelineIcon />
                AI 채널 성장 과정 분석
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
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">AI가 채널의 성장 과정을 분석 중입니다...</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">과거 데이터를 통해 미래의 성장 동력을 찾아내고 있습니다.</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg text-red-700 dark:text-red-300">
                <p className="font-bold mb-1"><i className="fas fa-exclamation-circle mr-1"></i> 성장 분석 오류!</p>
                <p>{error}</p>
            </div>
          )}
          {analysis && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">{analysis.title}</h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">{analysis.overallSummary}</p>
              </div>

              <div className="relative border-l-2 border-blue-200 dark:border-blue-500/30 ml-6 pl-10 space-y-12">
                {analysis.phases.map((phase, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-[54px] top-0 bg-blue-500 w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-lg shadow-md">{index + 1}</div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 p-5 rounded-lg">
                        <h3 className="font-bold text-blue-800 dark:text-blue-400 text-xl mb-1">{phase.phaseTitle}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-3">{phase.period}</p>
                        
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">성과 요약</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{phase.performanceSummary}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">전략 분석</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{phase.strategyAnalysis}</p>
                            </div>
                        </div>
                        
                        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-600 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            {phase.quantitativeAnalysis && (
                                <div>
                                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                        <i className="fas fa-chart-line text-blue-500"></i> {phase.quantitativeAnalysis.title}
                                    </h4>
                                    <div className="text-sm space-y-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-md border dark:border-slate-600">
                                        <p><strong>평균 조회수:</strong> {phase.quantitativeAnalysis.avgViews}</p>
                                        <p><strong>좋아요/조회수:</strong> {phase.quantitativeAnalysis.likeViewRatio}</p>
                                        <p><strong>댓글/조회수 (1k):</strong> {phase.quantitativeAnalysis.commentViewRatio}</p>
                                    </div>
                                </div>
                            )}
                            {phase.contentStrategyAnalysis && (
                                <div>
                                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                        <i className="fas fa-file-video text-blue-500"></i> {phase.contentStrategyAnalysis.title}
                                    </h4>
                                    <div className="text-sm space-y-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-md border dark:border-slate-600">
                                        <p><strong>평균 영상 길이:</strong> {phase.contentStrategyAnalysis.avgVideoDuration}</p>
                                        <p><strong>업로드 주기:</strong> {phase.contentStrategyAnalysis.uploadFrequency}</p>
                                        <p><strong>제목/썸네일 전략:</strong> {phase.contentStrategyAnalysis.titleThumbnailStrategy}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {phase.keyVideos && phase.keyVideos.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-600">
                                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">대표 영상</h4>
                                <div className="space-y-3">
                                    {phase.keyVideos.map((video, vIndex) => (
                                        <div key={vIndex} className="flex items-start">
                                            <LightbulbIcon className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{video.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{video.reason}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {analysis && (
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

export default GrowthAnalysisModal;