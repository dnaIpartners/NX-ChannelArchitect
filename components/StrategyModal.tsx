
import React, { useState } from 'react';
import type { StrategyResult } from '../types';
import { LightbulbIcon, TargetIcon, CalendarIcon, UsersIcon, TagIcon, CopyIcon, JsonIcon } from './icons';

interface StrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: StrategyResult | null;
  isLoading: boolean;
  error: string | null;
  title: string;
}

const DetailCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 h-full">
        <div className="flex items-center mb-2">
            <div className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 mr-3">
                {icon}
            </div>
            <h4 className="font-bold text-md text-slate-700 dark:text-slate-200">{title}</h4>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{children}</p>
    </div>
);

const StrategySection: React.FC<{ icon: React.ReactNode; title: string; items: { title: string; description: string }[] }> = ({ icon, title, items }) => (
    <div>
        <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            {icon}
            {title}
        </h3>
        <div className="space-y-4">
            {items.map((item, index) => (
                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 ml-8">
                    <h4 className="font-bold text-md text-slate-700 dark:text-slate-200">{item.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                </div>
            ))}
        </div>
    </div>
);


const StrategyModal: React.FC<StrategyModalProps> = ({ isOpen, onClose, strategy, isLoading, error, title }) => {
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
    if (!strategy) return;
    const fileName = `channel_strategy_analysis.json`;
    downloadFile(JSON.stringify(strategy, null, 2), fileName, 'application/json');
  };

  const formatStrategyForCopy = (s: StrategyResult): string => {
    let text = `AI 채널 운영 전략\n\n`;
    text += `== ${s.coreConcept.title} ==\n${s.coreConcept.description}\n\n`;
    text += `== 상세 운영 방법 ==\n`;
    text += `- ${s.detailedPlan.contentDirection.title}: ${s.detailedPlan.contentDirection.details}\n`;
    text += `- ${s.detailedPlan.uploadSchedule.title}: ${s.detailedPlan.uploadSchedule.details}\n`;
    text += `- ${s.detailedPlan.communityEngagement.title}: ${s.detailedPlan.communityEngagement.details}\n`;
    if (s.detailedPlan.keywordStrategy) {
        text += `- ${s.detailedPlan.keywordStrategy.title}: ${s.detailedPlan.keywordStrategy.details}\n`;
    }
    text += `\n== ${s.initialStrategy.title} ==\n`;
    s.initialStrategy.phases.forEach(p => {
        text += `\n- ${p.phaseTitle} (${p.focus}):\n`;
        p.actionItems.forEach(item => text += `  * ${item}\n`);
    });
    text += `\n== ${s.suggestedTitles.title} ==\n`;
    s.suggestedTitles.titles.forEach((title, i) => text += `${i+1}. ${title}\n`);

    if(s.kpiSettings) {
        text += `\n== ${s.kpiSettings.title} ==\n`;
        s.kpiSettings.kpis.forEach(kpi => {
            text += `- ${kpi.kpiTitle}: ${kpi.description}\n`;
        });
    }
    if(s.riskManagement) {
        text += `\n== ${s.riskManagement.title} ==\n`;
        s.riskManagement.risks.forEach(risk => {
            text += `- ${risk.riskTitle}: ${risk.strategy}\n`;
        });
    }
    if(s.revenueModel) {
        text += `\n== ${s.revenueModel.title} ==\n`;
        s.revenueModel.streams.forEach(stream => {
            text += `- ${stream.revenueTitle}: ${stream.description}\n`;
        });
    }

    return text;
  };

  const handleCopy = () => {
    if (!strategy) return;
    const textToCopy = formatStrategyForCopy(strategy);
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
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                <i className="fas fa-brain text-blue-500 mr-2"></i>
                {title}
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
                    <p className="text-lg font-semibold">AI가 채널 데이터를 분석하고 있습니다...</p>
                    <p className="text-sm">최고의 전략을 위해 잠시만 기다려주세요.</p>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg text-red-700 dark:text-red-300">
                    <p className="font-bold mb-1"><i className="fas fa-exclamation-circle mr-1"></i> 전략 분석 실패</p>
                    <p>{error}</p>
              </div>
            )}
            {strategy && (
                <div className="space-y-8">
                    {/* Core Concept */}
                    <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-500/30 shadow-sm">
                        <h3 className="flex items-center text-xl font-bold text-blue-800 dark:text-blue-300 mb-2">
                            <LightbulbIcon className="w-6 h-6 mr-3" />
                            {strategy.coreConcept.title}
                        </h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{strategy.coreConcept.description}</p>
                    </div>

                    {/* Detailed Plan */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">상세 운영 방법</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailCard icon={<TargetIcon />} title={strategy.detailedPlan.contentDirection.title}>
                                {strategy.detailedPlan.contentDirection.details}
                            </DetailCard>
                            <DetailCard icon={<CalendarIcon />} title={strategy.detailedPlan.uploadSchedule.title}>
                                {strategy.detailedPlan.uploadSchedule.details}
                            </DetailCard>
                            <DetailCard icon={<UsersIcon />} title={strategy.detailedPlan.communityEngagement.title}>
                                {strategy.detailedPlan.communityEngagement.details}
                            </DetailCard>
                             {strategy.detailedPlan.keywordStrategy && (
                                <DetailCard icon={<TagIcon />} title={strategy.detailedPlan.keywordStrategy.title}>
                                    {strategy.detailedPlan.keywordStrategy.details}
                                </DetailCard>
                            )}
                        </div>
                    </div>
                    
                    {/* Initial Strategy Timeline */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{strategy.initialStrategy.title}</h3>
                        <div className="relative border-l-2 border-blue-200 dark:border-blue-500/30 ml-4 pl-8 space-y-10">
                            {strategy.initialStrategy.phases.map((phase, index) => (
                                <div key={index} className="relative">
                                    <div className="absolute -left-[42px] top-1 bg-blue-500 w-6 h-6 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-xs">{index + 1}</div>
                                    <h4 className="font-bold text-blue-700 dark:text-blue-400 text-lg">{phase.phaseTitle}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{phase.focus}</p>
                                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 text-sm">
                                        {phase.actionItems.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Suggested Titles */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{strategy.suggestedTitles.title}</h3>
                         <div className="grid sm:grid-cols-2 gap-3">
                            {strategy.suggestedTitles.titles.map((title, index) => (
                                <div key={index} className="flex items-start p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold mr-3">{index + 1}.</span>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{title}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="!mt-12 pt-8 border-t-2 border-slate-200 dark:border-slate-700 border-dashed space-y-8">
                         {/* KPI Settings */}
                        <StrategySection 
                            icon={<i className="fas fa-chart-line text-blue-500 mr-3"></i>}
                            title={strategy.kpiSettings.title}
                            items={strategy.kpiSettings.kpis.map(k => ({ title: k.kpiTitle, description: k.description }))}
                        />

                        {/* Risk Management */}
                        <StrategySection 
                            icon={<i className="fas fa-shield-halved text-blue-500 mr-3"></i>}
                            title={strategy.riskManagement.title}
                            items={strategy.riskManagement.risks.map(r => ({ title: r.riskTitle, description: r.strategy }))}
                        />

                        {/* Revenue Model */}
                        <StrategySection 
                            icon={<i className="fas fa-sack-dollar text-green-500 mr-3"></i>}
                            title={strategy.revenueModel.title}
                            items={strategy.revenueModel.streams.map(s => ({ title: s.revenueTitle, description: s.description }))}
                        />
                    </div>
                </div>
            )}
        </div>
        {strategy && (
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

export default StrategyModal;