
import React from 'react';
import type { TargetChannel } from '../types';
import { InformationCircleIcon } from './icons';

interface ChannelCardProps {
  channel: TargetChannel;
  rank: number;
  onAnalyze: (channelId: string) => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, rank, onAnalyze }) => {
  const formatNumber = (num: number, compact = true): string => {
    if (num === -1) return '비공개';
    const options: Intl.NumberFormatOptions = compact ? { notation: 'compact', compactDisplay: 'short' } : {};
    return new Intl.NumberFormat('ko-KR', options).format(num);
  };

  const rankColor =
    rank === 1 ? 'bg-amber-400 text-amber-900' :
    rank === 2 ? 'bg-slate-300 text-slate-800' :
    rank === 3 ? 'bg-orange-300 text-orange-800' :
    'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 w-full flex">
      <div className="w-1/3 flex-shrink-0 relative bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
        <a href={`https://www.youtube.com/channel/${channel.id}`} target="_blank" rel="noopener noreferrer" className="block p-4">
            <img className="rounded-full aspect-square object-cover shadow-lg mx-auto" src={channel.thumbnailUrl} alt={channel.title} />
        </a>
        <div className={`absolute top-2 left-2 ${rankColor} font-bold text-lg w-10 h-10 flex items-center justify-center rounded-full shadow-md`}>
          {rank}
        </div>
      </div>
      <div className="p-5 flex flex-col justify-between w-2/3 min-w-0">
        <div>
            <div>
              <a href={`https://www.youtube.com/channel/${channel.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400">
                <h3 className="font-bold text-lg mb-1 leading-tight line-clamp-2">{channel.title}</h3>
              </a>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">개설일: {new Date(channel.publishedAt).toLocaleDateString('ko-KR')}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-4">{channel.description}</p>
            </div>
            <div className="space-y-3 text-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700">
                    <h4 className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-2">채널 기본 지표</h4>
                    <div className="flex justify-around text-center">
                        <div>
                            <div className="font-bold text-lg text-slate-700 dark:text-slate-200">{formatNumber(channel.subscriberCount)}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">구독자</div>
                        </div>
                         <div>
                            <div className="font-bold text-lg text-slate-700 dark:text-slate-200">{formatNumber(channel.viewCount)}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">총 조회수</div>
                        </div>
                         <div>
                            <div className="font-bold text-lg text-slate-700 dark:text-slate-200">{formatNumber(channel.videoCount, false)}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">총 영상</div>
                        </div>
                    </div>
                </div>
                 <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-500/30">
                    <div className="flex items-center gap-1 mb-2">
                        <h4 className="font-semibold text-blue-500 dark:text-blue-300 text-xs uppercase tracking-wider">성장 효율 분석</h4>
                        <div className="relative group flex items-center">
                            <InformationCircleIcon className="h-4 w-4 text-slate-400 cursor-pointer" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                구독자 수를 총 영상 수로 나눈 값으로, 영상 1개당 구독자 전환 효율을 의미합니다.
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-around text-center">
                        <div>
                            <div className="font-bold text-lg text-blue-700 dark:text-blue-300">{channel.subscriberVideoRatio.toFixed(1)}</div>
                            <div className="text-xs text-blue-500 dark:text-blue-400">구독자/영상 비율</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
            <a href={`https://www.youtube.com/channel/${channel.id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-200 dark:text-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                채널 바로가기
            </a>
            <button onClick={() => onAnalyze(channel.id)} className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                채널 분석
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelCard;