import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import type { AnalyzedVideo, YouTubeChannel, ChannelExtraStats } from '../types';
import { InformationCircleIcon, ChartBarIcon, ViewIcon, LikeIcon, CommentIcon, TrendingUpIcon, PieChartIcon, CalendarIcon } from './icons';

type ChartType = 'score' | 'views' | 'likes' | 'comments' | 'timeline' | 'format' | 'channelShare' | 'videoAge';

interface AnalyticsDashboardProps {
  videos: AnalyzedVideo[]; // Full video list for overall stats
  displayVideos: AnalyzedVideo[]; // Filtered video list for display
  channel: YouTubeChannel | null;
  channelStats: ChannelExtraStats | null;
  searchQuery?: string;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label, unit, name }) => {
  if (active && payload && payload.length) {
    const videoTitle = payload[0]?.payload?.fullTitle || label;
    return (
      <div className="bg-white dark:bg-slate-900 p-3 border dark:border-slate-700 rounded-lg shadow-md max-w-xs">
        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{videoTitle}</p>
        <p className={`text-sm text-blue-600 dark:text-blue-400`}>
            {name}: {new Intl.NumberFormat('ko-KR').format(payload[0].value)}
            {unit}
        </p>
      </div>
    );
  }
  return null;
};

const StatWithTooltip: React.FC<{ label: string; value: string | undefined; tooltip: string }> = ({ label, value, tooltip }) => (
    <>
      <div className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
        {label}:
        <div className="relative group flex items-center">
          <InformationCircleIcon className="h-4 w-4 text-slate-400 cursor-pointer" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {tooltip}
          </div>
        </div>
      </div>
      <div className="text-slate-800 dark:text-slate-200 font-medium">{value || 'N/A'}</div>
    </>
);

const chartConfigs: Record<ChartType, { title: string; dataKey: string; name: string; unit: string; color?: string; }> = {
    score: { title: '인기 점수 분포', dataKey: 'popularityScore', name: '인기 점수', unit: '', color: '#ef4444' },
    views: { title: '조회수 분포', dataKey: 'viewCount', name: '조회수', unit: '회', color: '#ef4444' },
    likes: { title: '좋아요 수 분포', dataKey: 'likeCount', name: '좋아요 수', unit: '개', color: '#9ca3af' },
    comments: { title: '댓글 수 분포', dataKey: 'commentCount', name: '댓글 수', unit: '개', color: '#9ca3af' },
    timeline: { title: '성과 타임라인', dataKey: 'popularityScore', name: '인기 점수', unit: '', color: '#ef4444' },
    format: { title: '콘텐츠 포맷 분포', dataKey: 'value', name: '영상 수', unit: '개' },
    channelShare: { title: '채널 점유율 분포', dataKey: 'value', name: '영상 수', unit: '개' },
    videoAge: { title: '영상 연령 분포', dataKey: '영상 수', name: '영상 수', unit: '개', color: '#ef4444' },
};


const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ videos, displayVideos, channel, channelStats, searchQuery }) => {
  const [activeChart, setActiveChart] = useState<ChartType>('score');
  
  const isKeywordMode = !channel;
  
  const gridColor = '#334155'; // slate-700 for dark mode
  const textColor = '#94a3b8';  // slate-400 for dark mode


  useEffect(() => {
    // Reset to default chart when switching modes
    setActiveChart('score');
  }, [isKeywordMode]);

  const top20Videos = useMemo(() => displayVideos.slice(0, 20), [displayVideos]);
  
  const barChartData = useMemo(() => {
    // By strongly typing dataKey, we ensure that sorting is only performed on numeric properties, resolving type errors.
    return (videosData: AnalyzedVideo[], dataKey: 'popularityScore' | 'viewCount' | 'likeCount' | 'commentCount') =>
        videosData
        .map(v => ({
            name: v.title.substring(0, 15) + (v.title.length > 15 ? '...' : ''),
            fullTitle: v.title,
            value: v[dataKey]
        }))
        .sort((a, b) => b.value - a.value);
  }, []);

  const timelineData = useMemo(() => {
      return videos // Use full video list
        .map(v => ({
            date: new Date(v.publishedAt).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }),
            fullTitle: v.title,
            popularityScore: v.popularityScore,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [videos]);

  const formatData = useMemo(() => {
      const counts = videos.reduce((acc, video) => { // Use full video list
          if (video.videoType === 'short') {
              acc.shorts++;
          } else {
              acc.regular++;
          }
          return acc;
      }, { shorts: 0, regular: 0});
      return [
          { name: '일반 영상', value: counts.regular },
          { name: '쇼츠', value: counts.shorts },
      ];
  }, [videos]);

  const channelDistributionData = useMemo(() => {
    if (!isKeywordMode) return [];

    // FIX: Refactored logic to be more explicit for the TypeScript compiler.
    // The original implementation with chained `reduce` and `sort` with destructuring
    // caused type inference errors. This version uses a `for` loop and simpler
    // callbacks to ensure all variables are correctly typed as numbers.
    const channelCounts: Record<string, number> = {};
    for (const video of videos) {
      channelCounts[video.channelTitle] = (channelCounts[video.channelTitle] || 0) + 1;
    }

    const sortedChannels = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);
    const topChannels = sortedChannels.slice(0, 7);
    const otherCount = sortedChannels.slice(7).reduce((sum, entry) => sum + entry[1], 0);

    const data = topChannels.map(([name, value]) => ({ name, value }));
    if (otherCount > 0) {
        data.push({ name: '기타 채널', value: otherCount });
    }
    return data;
  }, [videos, isKeywordMode]);

  const videoAgeData = useMemo(() => {
    if (!isKeywordMode) return [];
    const now = new Date();
    
    // FIX: Refactored to a for-loop to resolve complex type inference issues in `reduce`.
    const ageBuckets: Record<string, number> = {
      '1개월 이내': 0,
      '1-3개월': 0,
      '3-6개월': 0,
      '6-12개월': 0,
      '1년 이상': 0,
    };

    for (const video of videos) {
      const publishedAt = new Date(video.publishedAt);
      if (isNaN(publishedAt.getTime())) {
        continue; // Skip invalid dates
      }
      const diffMonths =
        (now.getFullYear() - publishedAt.getFullYear()) * 12 +
        (now.getMonth() - publishedAt.getMonth());

      if (diffMonths < 1) ageBuckets['1개월 이내']++;
      else if (diffMonths < 3) ageBuckets['1-3개월']++;
      else if (diffMonths < 6) ageBuckets['3-6개월']++;
      else if (diffMonths < 12) ageBuckets['6-12개월']++;
      else ageBuckets['1년 이상']++;
    }

    return Object.entries(ageBuckets).map(([name, value]) => ({ name, '영상 수': value }));
  }, [videos, isKeywordMode]);


  const totalStats = useMemo(() => {
    return videos.reduce((acc, video) => { // Use full video list
      acc.views += video.viewCount;
      acc.likes += video.likeCount;
      acc.comments += video.commentCount;
      return acc;
    }, { views: 0, likes: 0, comments: 0 });
  }, [videos]);

  const formatNumber = (num: number) => {
    if (num === -1) return '비공개';
    return new Intl.NumberFormat('ko-KR', { notation: 'compact' }).format(num);
  }
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ko-KR');

  const dashboardTitle = channel ? channel.title : `키워드: "${searchQuery}"`;
  const dashboardSubtitle = channel ? '채널 분석 결과' : '검색 결과 분석';

  const renderActiveChart = () => {
      const config = chartConfigs[activeChart];
      switch (activeChart) {
          case 'score':
          case 'views':
          case 'likes':
          case 'comments':
              // The cast is safe because these cases only use configs with dataKeys that match the function's parameter type.
              const data = barChartData(top20Videos, config.dataKey as 'popularityScore' | 'viewCount' | 'likeCount' | 'commentCount');
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: textColor }} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(val) => formatNumber(val)} tick={{ fill: textColor }} />
                    <Tooltip content={<CustomTooltip unit={config.unit} name={config.name} />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}/>
                    <Bar dataKey="value" fill={config.color} name={config.name} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
          case 'timeline':
              return (
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                          <XAxis dataKey="date" tick={{ fontSize: 12, fill: textColor }} />
                          <YAxis tick={{fill: textColor}} />
                          <Tooltip content={<CustomTooltip unit={config.unit} name={config.name} />} />
                          <Line type="monotone" dataKey={config.dataKey} stroke={config.color} strokeWidth={2} dot={{ r: 4, fill: config.color }} activeDot={{ r: 8 }} name={config.name} />
                      </LineChart>
                  </ResponsiveContainer>
              );
          case 'format':
          case 'channelShare':
              const pieData = activeChart === 'format' ? formatData : channelDistributionData;
              const COLORS = ['#ef4444', '#f87171', '#fca5a5', '#9ca3af', '#6b7280', '#4b5563', '#d1d5db', '#e5e7eb'];
              return (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            // Fix: Explicitly type props for the label renderer to resolve TS errors.
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; }) => {
                                if (percent < 0.05) return null; // Hide label for small slices
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                return (
                                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold text-sm pointer-events-none">
                                        {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                );
                            }}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value}개`, name]} />
                    </PieChart>
                </ResponsiveContainer>
              );
          case 'videoAge':
            return (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={videoAgeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: textColor }} />
                    <YAxis allowDecimals={false} tick={{fill: textColor}} />
                    <Tooltip content={<CustomTooltip unit={config.unit} name={config.name} />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                    <Bar dataKey={config.dataKey} fill={config.color} name={config.name} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
          default:
              return null;
      }
  };

  const ChartButton: React.FC<{ type: ChartType; icon: React.ReactNode; text: string }> = ({ type, icon, text }) => {
    const isActive = activeChart === type;
    return (
        <button
            onClick={() => setActiveChart(type)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
            {icon}
            <span>{text}</span>
        </button>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="flex items-center md:col-span-1">
          {channel && <img src={channel.thumbnailUrl} alt={channel.title} className="w-20 h-20 rounded-full mr-4" />}
          {!channel && <div className="w-20 h-20 rounded-full mr-4 bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><i className="fas fa-search text-slate-500 text-3xl"></i></div>}
          <div>
            {channel ? (
              <a href={`https://www.youtube.com/channel/${channel.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 line-clamp-2">{dashboardTitle}</h2>
              </a>
            ) : (
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 line-clamp-2">{dashboardTitle}</h2>
            )}
            <p className="text-slate-500 dark:text-slate-400">{dashboardSubtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center items-center md:col-span-1">
            {isKeywordMode ? (
                <>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">총 조회수</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{formatNumber(totalStats.views)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">총 좋아요</p>
                        <p className="text-2xl font-bold text-gray-700 dark:text-slate-300">{formatNumber(totalStats.likes)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">총 댓글</p>
                        <p className="text-2xl font-bold text-gray-700 dark:text-slate-300">{formatNumber(totalStats.comments)}</p>
                    </div>
                </>
            ) : channel && (
                <>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">구독자 수</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{formatNumber(channel.subscriberCount)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">총 조회수</p>
                        <p className="text-2xl font-bold text-gray-700 dark:text-slate-300">{formatNumber(channel.viewCount)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">총 영상 수</p>
                        <p className="text-2xl font-bold text-gray-700 dark:text-slate-300">{formatNumber(channel.videoCount)}</p>
                    </div>
                </>
            )}
        </div>
        {channel && channelStats && (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-y-3 gap-x-6 text-sm md:col-span-1 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-700">
                <div className="font-semibold text-slate-600 dark:text-slate-400">채널 개설일:</div>
                <div className="text-slate-800 dark:text-slate-200 font-medium">{formatDate(channel.publishedAt)}</div>
                <div className="font-semibold text-slate-600 dark:text-slate-400">최초 업로드:</div>
                <div className="text-slate-800 dark:text-slate-200 font-medium">{channelStats?.firstVideoDate ? formatDate(channelStats.firstVideoDate) : 'N/A'}</div>
                <StatWithTooltip label="평균 업로드 주기" value={channelStats?.averageUploadIntervalAll} tooltip="채널의 모든 영상 게시일 간의 평균 시간 간격입니다." />
                <StatWithTooltip label="최근 업로드 주기" value={channelStats?.averageUploadIntervalRecent} tooltip="최근 업로드된 5개 영상의 평균 게시 간격입니다." />
            </div>
        )}
        {isKeywordMode && <div className="hidden md:block md:col-span-1"></div>}
      </div>

      <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl mb-4 flex items-center justify-center flex-wrap gap-2">
         <ChartButton type="score" icon={<ChartBarIcon />} text="인기 점수" />
         <ChartButton type="views" icon={<ViewIcon className="h-5 w-5"/>} text="조회수" />
         <ChartButton type="likes" icon={<LikeIcon className="h-5 w-5"/>} text="좋아요" />
         <ChartButton type="comments" icon={<CommentIcon className="h-5 w-5"/>} text="댓글" />
         {isKeywordMode ? (
            <>
                <ChartButton type="channelShare" icon={<PieChartIcon />} text="채널 점유율" />
                <ChartButton type="videoAge" icon={<CalendarIcon className="h-5 w-5" />} text="영상 연령" />
            </>
         ) : (
            <>
                <ChartButton type="timeline" icon={<TrendingUpIcon />} text="타임라인" />
                <ChartButton type="format" icon={<PieChartIcon />} text="콘텐츠 포맷" />
            </>
         )}
      </div>

      <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">
        {isKeywordMode ? `"${searchQuery}" 검색 결과 ` : ''}
        {chartConfigs[activeChart].title}
        {(activeChart === 'score' || activeChart === 'views' || activeChart === 'likes' || activeChart === 'comments') ? ' (Top 20)' : ''}
      </h3>
      <div className="w-full h-80">
        {renderActiveChart()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
