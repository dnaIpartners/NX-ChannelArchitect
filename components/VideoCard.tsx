
import React, { useState } from 'react';
import type { AnalyzedVideo } from '../types';
import { ViewIcon, LikeIcon, CommentIcon, InformationCircleIcon, ChartBarIcon } from './icons';
import { summarizeTranscript } from '../services/youtubeService';

interface VideoCardProps {
  video: AnalyzedVideo;
  rank: number;
  onAnalyzeChannel?: (channelId: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, rank, onAnalyzeChannel }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatDuration = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
  };


  const handleSummarizeVideo = async () => {
    if (isSummaryLoading || summary) return; // Prevent multiple clicks

    setIsSummaryLoading(true);
    setSummaryError(null);

    try {
      // Step 1: Check if description exists
      if (!video.description.trim()) {
        throw new Error('요약할 영상 설명이 없습니다.');
      }

      // Step 2: Get summary from description
      const generatedSummary = await summarizeTranscript(video.description);
      setSummary(generatedSummary);

    } catch (err: any) {
      setSummaryError(err.message);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const scoreColor =
    video.popularityScore > 0 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 w-full flex flex-col sm:flex-row">
      <div className="sm:w-1/3 relative flex-shrink-0">
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="block">
          <div className="aspect-video bg-slate-200 dark:bg-slate-700 relative">
            <img className="w-full h-full object-cover" src={video.thumbnailUrl} alt={video.title} />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs font-semibold px-2 py-1 rounded">
              {formatDuration(video.duration)}
            </div>
          </div>
        </a>
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white font-bold text-lg w-10 h-10 flex items-center justify-center rounded-full">
          {rank}
        </div>
        {video.videoType === 'short' && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md tracking-wider">
            SHORTS
          </div>
        )}
      </div>
      <div className="p-6 sm:w-2/3 flex flex-col justify-between">
        <div>
          <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400">
            <h3 className="font-bold text-lg mb-1 leading-tight line-clamp-2">{video.title}</h3>
          </a>
           <div className="flex items-center justify-between">
            <a href={`https://www.youtube.com/channel/${video.channelId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline min-w-0 truncate pr-2">
                {video.channelTitle}
            </a>
            {onAnalyzeChannel && (
                <button
                    onClick={() => onAnalyzeChannel(video.channelId)}
                    className="flex-shrink-0 ml-2 flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                    title={`${video.channelTitle} 채널 분석하기`}
                >
                    <ChartBarIcon />
                    <span>채널 분석</span>
                </button>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">게시일: {new Date(video.publishedAt).toLocaleString('ko-KR')}</p>
          {video.hashtags && video.hashtags.length > 0 && (
            <div className="my-3 flex flex-wrap gap-2">
              {video.hashtags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-300 text-xs font-semibold rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {video.description && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {video.description.length > 200
                  ? `${video.description.substring(0, 200)}...`
                  : video.description
                }
              </p>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 my-4">
            <span className="flex items-center gap-1.5"><ViewIcon /> {formatNumber(video.viewCount)}</span>
            <span className="flex items-center gap-1.5"><LikeIcon /> {formatNumber(video.likeCount)}</span>
            <span className="flex items-center gap-1.5"><CommentIcon /> {formatNumber(video.commentCount)}</span>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">인기 점수</span>
                <div className="relative group flex items-center">
                    <InformationCircleIcon className="h-4 w-4 text-slate-400 cursor-pointer" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        조회수(60%), 좋아요(30%), 댓글(10%)을 정규화하여 가중 합산한 점수입니다.
                    </div>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{video.popularityScore.toFixed(1)}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
              <div className={`${scoreColor} h-2.5 rounded-full`} style={{ width: `${video.popularityScore}%` }}></div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {isSummaryLoading ? (
              <div className="flex flex-col items-center justify-center text-center p-4 text-slate-500 dark:text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-sm font-semibold">AI가 영상을 요약하고 있습니다...</p>
              </div>
            ) : summaryError ? (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg text-red-700 dark:text-red-300 text-sm">
                <p className="font-bold mb-1"><i className="fas fa-exclamation-circle mr-1"></i> 요약 실패</p>
                <p>{summaryError}</p>
              </div>
            ) : summary ? (
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">AI 영상 요약</h4>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
              </div>
            ) : (
              video.description.trim() && (
                <button
                  onClick={handleSummarizeVideo}
                  className="w-full px-4 py-2 bg-gray-800 dark:bg-slate-200 text-white dark:text-slate-800 text-sm font-medium rounded-full hover:bg-black dark:hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-magic-sparkles"></i>
                  AI로 영상 요약하기
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;