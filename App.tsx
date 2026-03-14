import React, { useState, useMemo, useEffect } from 'react';
import type { AnalyzedVideo, YouTubeChannel, StrategyResult, ChannelExtraStats, GrowthAnalysisResult, TargetChannel, TopicAnalysisResult, TopicChannelInfo, ConsultingResult, TopicInsightResult } from './types';
// Fix: Renamed `calculateExtraStats` to `calculateExtraChannelStats` to match the exported member from `youtubeService`.
import { isApiKeySet, findChannel, analyzeChannelVideos, initGoogleClient, generateChannelStrategy, calculateExtraChannelStats, generateChannelGrowthAnalysis, analyzeVideosByKeyword, generateKeywordStrategy, findRisingStarChannels, analyzeTopicCompetition, generateChannelConsulting, generateTopicInsight } from './services/youtubeService';
import SearchBar from './components/SearchBar';
import ApiKeyMessage from './components/ApiKeyMessage';
import VideoCard from './components/VideoCard';
import ChannelCard from './components/ChannelCard';
import ExportButtons from './components/ExportButtons';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import StrategyModal from './components/StrategyModal';
import GrowthAnalysisModal from './components/GrowthAnalysis';
import ConsultingModal from './components/ConsultingModal';
import GuideModal from './components/GuideModal';
import { LandingPage } from './components/LandingPage';
import { SettingsIcon, BrainIcon, TimelineIcon, TagIcon, ChartBarIcon, RocketIcon, StarIcon, KeyIcon, InformationCircleIcon, ClipboardCheckIcon, QuestionMarkCircleIcon, YouTubeIcon, CopyIcon, JsonIcon } from './components/icons';

type AnalysisTab = 'channel' | 'keyword' | 'findTarget';
type VideoTypeFilter = 'all' | 'short' | 'regular';
type TargetStrategy = 'risingStar' | 'emptyHouse';
type CountryFilter = 'all' | 'korea' | 'foreign';

const youtubeCategories = [
    { id: '', name: '모든 카테고리' },
    { id: '1', name: '영화 & 애니메이션' },
    { id: '2', name: '자동차' },
    { id: '10', name: '음악' },
    { id: '15', name: '반려동물 & 동물' },
    { id: '17', name: '스포츠' },
    { id: '20', name: '게임' },
    { id: '22', name: '인물 & 브이로그' },
    { id: '23', name: '코미디' },
    { id: '24', name: '엔터테인먼트' },
    { id: '25', 'name': '뉴스 & 정치' },
    { id: '26', name: '노하우 & 스타일' },
    { id: '27', name: '교육' },
    { id: '28', name: '과학 & 기술' },
];

const risingStarPeriods = [
    { value: 'all', label: '전체 기간' },
    { value: '3m', label: '최근 3개월 내 개설' },
    { value: '6m', label: '최근 6개월 내 개설' },
    { value: '1y', label: '최근 1년 내 개설' },
];

const emptyHousePeriods = [
    { value: 'all', label: '전체 기간' },
    { value: '3m', label: '최근 3개월 내 영상' },
    { value: '6m', label: '최근 6개월 내 영상' },
    { value: '1y', label: '최근 1년 내 영상' },
];


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Common state
  const [activeTab, setActiveTab] = useState<AnalysisTab>('channel');
  const [isClientReady, setIsClientReady] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ message: string; count?: number; total?: number }>({ message: '' });

  // Channel/Keyword Analysis State
  const [videos, setVideos] = useState<AnalyzedVideo[]>([]);
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [channelStats, setChannelStats] = useState<ChannelExtraStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Find Target Channel State
  const [targetStrategy, setTargetStrategy] = useState<TargetStrategy>('risingStar');
  const [targetQuery, setTargetQuery] = useState('');
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [targetChannels, setTargetChannels] = useState<TargetChannel[]>([]);
  const [topicAnalysisResult, setTopicAnalysisResult] = useState<TopicAnalysisResult | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6m');
  const [topicInsight, setTopicInsight] = useState<TopicInsightResult | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  // UI state
  const [sortOrder, setSortOrder] = useState<'popularity' | 'views' | 'date'>('popularity');
  const [filterCount, setFilterCount] = useState<number>(20);
  const [videoTypeFilter, setVideoTypeFilter] = useState<VideoTypeFilter>('all');
  const [countryFilter, setCountryFilter] = useState<CountryFilter>('all');
  const [copyTargetButtonText, setCopyTargetButtonText] = useState('텍스트 복사');

  // Modals State
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [isStrategyLoading, setIsStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);
  const [isGrowthAnalysisModalOpen, setIsGrowthAnalysisModalOpen] = useState(false);
  const [isGrowthLoading, setIsGrowthLoading] = useState(false);
  const [growthError, setGrowthError] = useState<string | null>(null);
  const [growthResult, setGrowthResult] = useState<GrowthAnalysisResult | null>(null);
  const [isConsultingModalOpen, setIsConsultingModalOpen] = useState(false);
  const [isConsultingLoading, setIsConsultingLoading] = useState(false);
  const [consultingError, setConsultingError] = useState<string | null>(null);
  const [consultingResult, setConsultingResult] = useState<ConsultingResult | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);


  const handleGenericError = (err: unknown, errorSetter: (message: string | null) => void) => {
    const message = (err instanceof Error) ? err.message : '알 수 없는 오류가 발생했습니다.';
    errorSetter(message);
    console.error("오류 발생:", err);
  };
  
  const ensureClientReady = async () => {
    if (!isClientReady) {
      setProgress({ message: 'Google API 클라이언트를 초기화하는 중입니다...' });
      await initGoogleClient();
      setIsClientReady(true);
    }
  };

  const resetAllAnalysisStates = () => {
      setIsLoading(true);
      setError(null);
      setProgress({ message: '' });
      // channel/keyword
      setChannel(null);
      setVideos([]);
      setChannelStats(null);
      setSearchQuery('');
      setSelectedCategory('');
      setCountryFilter('all');
      // target
      setTargetChannels([]);
      setTopicAnalysisResult(null);
      setTopicInsight(null);
      setTargetQuery('');
      setTargetCategory('');
      setCopyTargetButtonText('텍스트 복사');
      // modals
      setGrowthResult(null);
      setIsGrowthAnalysisModalOpen(false);
      setStrategyResult(null);
      setIsStrategyModalOpen(false);
      setConsultingResult(null);
      setIsConsultingModalOpen(false);
  };


  const handleChannelSearch = async (query: string) => {
    resetAllAnalysisStates();
    try {
      await ensureClientReady();

      let searchQuery = query;
      try {
        const url = new URL(query);
        if ((url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') && url.pathname.includes('/@')) {
          const pathParts = url.pathname.split('/');
          const handlePart = pathParts.find(part => part.startsWith('@'));
          if (handlePart) {
            searchQuery = decodeURIComponent(handlePart);
          }
        }
      } catch (e) { /* Not a URL, proceed as query */ }
      
      setProgress({ message: '채널 정보를 찾는 중입니다...' });
      const foundChannel = await findChannel(searchQuery);
      if (!foundChannel) {
        setError('채널을 찾을 수 없습니다. 채널 이름이나 ID를 정확히 입력해주세요.');
        setIsLoading(false);
        return;
      }
      setChannel(foundChannel);
      
      const onProgress = (message: string, count?: number, total?: number) => {
        setProgress({ message, count, total });
      };
      
      const analyzedData = await analyzeChannelVideos(foundChannel, onProgress);
      setVideos(analyzedData);
      // Fix: Renamed `calculateExtraStats` to `calculateExtraChannelStats` to match the imported function name.
      const extraStats = calculateExtraChannelStats(analyzedData);
      setChannelStats(extraStats);

    } catch (err: unknown) {
      handleGenericError(err, setError);
      setIsClientReady(false);
      if (err instanceof Error && err.message.includes('API')) {
          setIsApiKeyModalOpen(true);
      }
    } finally {
      setIsLoading(false);
      setProgress({ message: '' });
    }
  };

  const handleKeywordSearch = async (query: string, categoryId: string) => {
    resetAllAnalysisStates();
    try {
        await ensureClientReady();
        setSearchQuery(query);
        const onProgress = (message: string, count?: number, total?: number) => {
            setProgress({ message, count, total });
        };
        const analyzedData = await analyzeVideosByKeyword(query, categoryId, onProgress);
        setVideos(analyzedData);
    } catch (err) {
        handleGenericError(err, setError);
        setIsClientReady(false);
        if (err instanceof Error && err.message.includes('API')) {
            setIsApiKeyModalOpen(true);
        }
    } finally {
        setIsLoading(false);
        setProgress({ message: '' });
    }
  };

  const handleTargetSearch = async () => {
    if (!targetQuery.trim()) {
        setError("분석할 해시태그를 입력해주세요.");
        return;
    }
    if (!isApiKeySet()) {
      setError("분석을 시작하려면 먼저 API 키를 설정해야 합니다.");
      setIsApiKeyModalOpen(true);
      return;
    }
    resetAllAnalysisStates();
    try {
        await ensureClientReady();
        const onProgress = (message: string) => setProgress({ message });
        
        const hashtagQuery = `#${targetQuery.replace(/#/g, '')}`;

        if(targetStrategy === 'risingStar') {
            const result = await findRisingStarChannels(hashtagQuery, targetCategory, selectedPeriod, onProgress);
            setTargetChannels(result);
        } else { // emptyHouse
            const result = await analyzeTopicCompetition(hashtagQuery, targetCategory, selectedPeriod, onProgress);
            setTopicAnalysisResult(result);

            if (result.topVideos.length > 0) {
                setIsInsightLoading(true);
                try {
                    const topVideos = result.topVideos;
                    const totalViews = topVideos.reduce((sum, v) => sum + v.viewCount, 0);
                    const averageViews = topVideos.length > 0 ? totalViews / topVideos.length : 0;
                    const sortedViews = topVideos.map(v => v.viewCount).sort((a, b) => a - b);
                    const mid = Math.floor(sortedViews.length / 2);
                    const medianViews = sortedViews.length === 0 ? 0 : sortedViews.length % 2 !== 0 ? sortedViews[mid] : (sortedViews[mid - 1] + sortedViews[mid]) / 2;

                    const insightResult = await generateTopicInsight(
                        targetQuery,
                        result,
                        { totalViews, averageViews, medianViews }
                    );
                    setTopicInsight(insightResult);
                } catch (insightErr) {
                    console.error("AI 인사이트 생성 실패:", insightErr);
                } finally {
                    setIsInsightLoading(false);
                }
            }
        }

    } catch (err) {
        handleGenericError(err, setError);
        setIsClientReady(false);
        if (err instanceof Error && err.message.includes('API')) {
            setIsApiKeyModalOpen(true);
        }
    } finally {
        setIsLoading(false);
        setProgress({ message: '' });
    }
  };


  const handleSearch = async (query: string) => {
    if (!isApiKeySet()) {
      setError("분석을 시작하려면 먼저 API 키를 설정해야 합니다.");
      setIsApiKeyModalOpen(true);
      return;
    }
    if (activeTab === 'channel') {
      handleChannelSearch(query);
    } else if (activeTab === 'keyword') {
      handleKeywordSearch(query, selectedCategory);
    }
  };

  const triggerChannelAnalysis = (channelId: string) => {
    setActiveTab('channel');
    handleChannelSearch(channelId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeySubmit = async () => {
    setIsApiKeyModalOpen(false);
    setIsClientReady(false);
    setError(null);
    setProgress({ message: 'Google API 클라이언트를 초기화하는 중입니다...' });
    try {
        await initGoogleClient();
        setIsClientReady(true);
    } catch (err) {
        handleGenericError(err, setError);
        setIsClientReady(false);
        setIsApiKeyModalOpen(true);
    } finally {
        setProgress({ message: '' });
    }
  };
  
  const handleGenerateStrategy = async () => {
    if (((activeTab === 'channel' && !channel) || (activeTab === 'keyword' && !searchQuery)) || videos.length === 0) return;

    setIsStrategyModalOpen(true);
    setIsStrategyLoading(true);
    setStrategyError(null);
    setStrategyResult(null);
    try {
      const result = activeTab === 'channel' && channel
        ? await generateChannelStrategy(channel, sortedAndFilteredVideos)
        : activeTab === 'keyword' && searchQuery
        ? await generateKeywordStrategy(searchQuery, sortedAndFilteredVideos)
        : null;

      if (result) {
        setStrategyResult(result);
      } else {
        throw new Error("분석 컨텍스트(채널 또는 키워드)가 없습니다.");
      }
    } catch (err) {
      handleGenericError(err, setStrategyError);
    } finally {
      setIsStrategyLoading(false);
    }
  };

  const handleGenerateGrowthAnalysis = async () => {
    if (!channel || videos.length === 0) return;
    setIsGrowthAnalysisModalOpen(true);
    setIsGrowthLoading(true);
    setGrowthError(null);
    setGrowthResult(null);
    try {
      const result = await generateChannelGrowthAnalysis(channel, videos);
      setGrowthResult(result);
    } catch (err) {
      handleGenericError(err, setGrowthError);
    } finally {
      setIsGrowthLoading(false);
    }
  };

  const handleGenerateConsulting = async () => {
    if (!channel || videos.length === 0) return;
    setIsConsultingModalOpen(true);
    setIsConsultingLoading(true);
    setConsultingError(null);
    setConsultingResult(null);
    try {
      const result = await generateChannelConsulting(channel, videos);
      setConsultingResult(result);
    } catch (err) {
      handleGenericError(err, setConsultingError);
    } finally {
      setIsConsultingLoading(false);
    }
  };


  const sortedAndFilteredVideos = useMemo(() => {
    const filteredByCountry = videos.filter(video => {
        if (activeTab === 'channel' || countryFilter === 'all') {
            return true;
        }
        const country = video.country;
        // 국가 정보가 없는 채널은 '해외'로 간주
        if (!country) return countryFilter === 'foreign';
        if (countryFilter === 'korea') return country === 'KR';
        if (countryFilter === 'foreign') return country !== 'KR';
        return true;
      });

    const filteredByType = filteredByCountry.filter(video => {
      if (videoTypeFilter === 'all') return true;
      return video.videoType === videoTypeFilter;
    });

    let sorted = [...filteredByType];
    if (sortOrder === 'popularity') {
      sorted.sort((a, b) => b.popularityScore - a.popularityScore);
    } else if (sortOrder === 'views') {
      sorted.sort((a, b) => b.viewCount - a.viewCount);
    } else if (sortOrder === 'date') {
      sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    return sorted.slice(0, filterCount);
  }, [videos, sortOrder, filterCount, videoTypeFilter, countryFilter, activeTab]);
  
  const sortedAndFilteredTargetChannels = useMemo(() => {
      const filtered = targetChannels.filter(channel => {
        if (countryFilter === 'all') return true;
        const country = channel.country;
        if (!country) return countryFilter === 'foreign';
        if (countryFilter === 'korea') return country === 'KR';
        if (countryFilter === 'foreign') return country !== 'KR';
        return true;
      });
      return filtered.sort((a, b) => b.subscriberVideoRatio - a.subscriberVideoRatio);
  }, [targetChannels, countryFilter]);

  const filteredTopicAnalysisResult = useMemo(() => {
    if (!topicAnalysisResult) {
        return null;
    }
    
    const filteredByCountry = topicAnalysisResult.topVideos.filter(video => {
        if (countryFilter === 'all') return true;
        const country = video.country;
        if (!country) return countryFilter === 'foreign';
        if (countryFilter === 'korea') return country === 'KR';
        if (countryFilter === 'foreign') return country !== 'KR';
        return true;
    });

    const filteredVideos = filteredByCountry.filter(video => {
        if (videoTypeFilter === 'all') return true;
        return video.videoType === videoTypeFilter;
    });

    const newChannelDistribution = new Map<string, TopicChannelInfo>();
    
    for (const video of filteredVideos) {
        const originalInfo = topicAnalysisResult.channelDistribution.get(video.channelId);
        if (newChannelDistribution.has(video.channelId)) {
            newChannelDistribution.get(video.channelId)!.videoCountInTop50++;
        } else {
            if (originalInfo) {
                 newChannelDistribution.set(video.channelId, {
                    ...originalInfo,
                    videoCountInTop50: 1,
                 });
            }
        }
    }

    return {
        topVideos: filteredVideos,
        uniqueChannelCount: newChannelDistribution.size,
        channelDistribution: newChannelDistribution,
        channelActivity: topicAnalysisResult.channelActivity,
    };
  }, [topicAnalysisResult, videoTypeFilter, countryFilter]);

  const formatNumber = (num: number, compact = true): string => {
    if (num === -1) return '비공개';
    const options: Intl.NumberFormatOptions = compact ? { notation: 'compact', compactDisplay: 'short' } : {};
    return new Intl.NumberFormat('ko-KR', options).format(num);
  };

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

  const handleDownloadTargetJson = () => {
    const queryText = targetQuery.replace(/\s/g, '_');
    if (targetStrategy === 'risingStar' && targetChannels.length > 0) {
        const fileName = `rising_star_channels_${queryText}.json`;
        downloadFile(JSON.stringify(sortedAndFilteredTargetChannels, null, 2), fileName, 'application/json');
    } else if (targetStrategy === 'emptyHouse' && filteredTopicAnalysisResult) {
        const fileName = `empty_house_topic_${queryText}.json`;
        const dataToDownload = {
            analysis: filteredTopicAnalysisResult,
            insight: topicInsight,
        };
        const serializableData = {
            ...dataToDownload,
            analysis: {
                ...dataToDownload.analysis,
                channelDistribution: Array.from(dataToDownload.analysis.channelDistribution.entries()),
            }
        };
        downloadFile(JSON.stringify(serializableData, null, 2), fileName, 'application/json');
    }
  };

  const handleCopyTargetText = () => {
      let textToCopy = '';

      if (targetStrategy === 'risingStar' && sortedAndFilteredTargetChannels.length > 0) {
          textToCopy = `라이징 스타 채널 분석: #${targetQuery}\n`;
          textToCopy += `분석된 채널 수: ${sortedAndFilteredTargetChannels.length}\n\n`;
          sortedAndFilteredTargetChannels.forEach((channel, index) => {
              textToCopy += `${index + 1}. ${channel.title}\n`;
              textToCopy += `- 구독자: ${formatNumber(channel.subscriberCount, false)}\n`;
              textToCopy += `- 총 영상: ${formatNumber(channel.videoCount, false)}\n`;
              textToCopy += `- 구독자/영상 비율: ${channel.subscriberVideoRatio.toFixed(1)}\n`;
              textToCopy += `- 채널 링크: https://www.youtube.com/channel/${channel.id}\n\n`;
          });
      } else if (targetStrategy === 'emptyHouse' && filteredTopicAnalysisResult && topicInsight) {
          const topVideos = filteredTopicAnalysisResult.topVideos;
          const totalViews = topVideos.reduce((sum, v) => sum + v.viewCount, 0);
          const averageViews = topVideos.length > 0 ? totalViews / topVideos.length : 0;
          const sortedViews = topVideos.map(v => v.viewCount).sort((a, b) => a - b);
          const mid = Math.floor(sortedViews.length / 2);
          const medianViews = sortedViews.length === 0 ? 0 : sortedViews.length % 2 !== 0 ? sortedViews[mid] : (sortedViews[mid - 1] + sortedViews[mid]) / 2;
          
          textToCopy = `빈집 토픽 분석: #${targetQuery}\n\n`;
          textToCopy += `== 시장 데이터 요약 ==\n`;
          textToCopy += `- 상위 영상 총 조회수: ${formatNumber(totalViews, false)}\n`;
          textToCopy += `- 영상 당 평균 조회수: ${formatNumber(averageViews, false)}\n`;
          textToCopy += `- 영상 당 중간값 조회수: ${formatNumber(medianViews, false)}\n`;
          textToCopy += `- 고유 채널 수: ${filteredTopicAnalysisResult.uniqueChannelCount}개\n\n`;
          
          textToCopy += `== AI 심층 분석 ==\n`;
          textToCopy += `[${topicInsight.hashtagAnalysis.title}]\n${topicInsight.hashtagAnalysis.summary}\n\n`;
          textToCopy += `[${topicInsight.marketAnalysis.title}]\n${topicInsight.marketAnalysis.summary}\n\n`;
          
          textToCopy += `[${topicInsight.finalVerdict.title}]\n`;
          textToCopy += `- 최종 결론: ${topicInsight.finalVerdict.verdict}\n`;
          textToCopy += `- 판단 근거: ${topicInsight.finalVerdict.reason}\n`;
          textToCopy += `\n[${topicInsight.finalVerdict.strategyTitle}]\n`;
          topicInsight.finalVerdict.strategy.forEach(item => textToCopy += `- ${item}\n`);
      }

      if (textToCopy) {
          navigator.clipboard.writeText(textToCopy).then(() => {
              setCopyTargetButtonText('복사 완료!');
              setTimeout(() => setCopyTargetButtonText('텍스트 복사'), 2000);
          }, (err) => {
              console.error('Copy failed', err);
              setCopyTargetButtonText('복사 실패');
              setTimeout(() => setCopyTargetButtonText('텍스트 복사'), 2000);
          });
      }
  };


  const handleTabChange = (tab: AnalysisTab) => {
    setActiveTab(tab);
    resetAllAnalysisStates();
    setIsLoading(false);
    if (tab === 'findTarget') {
        setSelectedPeriod('6m');
    }
  };
  
  const handleTargetStrategyChange = (strategy: TargetStrategy) => {
    setTargetStrategy(strategy);
    setTargetChannels([]);
    setTopicAnalysisResult(null);
    setError(null);
    // Set default period for each strategy
    if (strategy === 'risingStar') {
        setSelectedPeriod('6m');
    } else {
        setSelectedPeriod('3m');
    }
  }

  const tabButtonClasses = (tabName: AnalysisTab) => 
    `flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full transition-colors ${
      activeTab === tabName
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;
  
  const filterButtonClasses = (filterName: VideoTypeFilter, disabled = false) => 
    `px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
      disabled 
        ? 'text-slate-400 bg-slate-200 dark:bg-slate-600 dark:text-slate-500 cursor-not-allowed'
        : videoTypeFilter === filterName
          ? 'bg-blue-600 text-white shadow'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
    }`;
    
  const countryFilterButtonClasses = (filterName: CountryFilter, disabled = false) => 
    `px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
      disabled 
        ? 'text-slate-400 bg-slate-200 dark:bg-slate-600 dark:text-slate-500 cursor-not-allowed'
        : countryFilter === filterName
          ? 'bg-blue-600 text-white shadow'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
    }`;

  const searchPlaceholder = activeTab === 'channel' 
    ? '유튜브 채널 이름 또는 ID를 입력하세요...' 
    : '분석할 키워드를 입력하세요...';
    
  const targetSearchPlaceholder = "분석할 해시태그를 입력하세요 (예: AI그림)";

  const strategyModalTitle = activeTab === 'channel' ? 'AI 채널 운영 전략' : 'AI 키워드 전략 분석';

  if (!isAuthenticated) {
    return <LandingPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
           <div className="relative flex justify-center items-center">
             <div className="text-center">
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                  <i className="fas fa-rocket text-blue-600 mr-2"></i>
                  NX ChannelArchitect
                  <sup className="text-blue-500 font-bold text-lg ml-1">PRO</sup>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">유튜브 채널과 키워드를 분석하고 숨겨진 인사이트를 발견하세요.</p>
             </div>
             <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button 
                  onClick={() => setIsGuideModalOpen(true)}
                  className="p-3 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  aria-label="사용 설명서"
                  title="사용 설명서"
                >
                  <QuestionMarkCircleIcon />
                </button>
                <button 
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="p-3 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  aria-label="API 키 설정"
                  title="API 키 설정"
                >
                  <SettingsIcon />
                </button>
             </div>
           </div>
           <div className="mt-6 border-b-2 border-slate-200 dark:border-slate-700 flex justify-center">
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-full -mb-px">
                  <button onClick={() => handleTabChange('channel')} className={tabButtonClasses('channel')}>
                    <ChartBarIcon /> 채널 분석
                  </button>
                  <button onClick={() => handleTabChange('keyword')} className={tabButtonClasses('keyword')}>
                    <TagIcon className="h-5 w-5" /> 키워드 분석
                  </button>
                  <button onClick={() => handleTabChange('findTarget')} className={tabButtonClasses('findTarget')}>
                    <RocketIcon className="h-5 w-5" /> 공략 채널 찾기
                  </button>
              </div>
           </div>
           <div className="mt-4 flex justify-center">
             { (activeTab === 'channel' || activeTab === 'keyword') && (
                <div className="flex w-full max-w-4xl items-stretch gap-2">
                    <div className="flex-grow">
                      <SearchBar onSearch={handleSearch} isLoading={isLoading} placeholder={searchPlaceholder} />
                    </div>
                    {activeTab === 'keyword' && (
                        <>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 text-base bg-white dark:bg-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            disabled={isLoading}
                            aria-label="카테고리 선택"
                        >
                            {youtubeCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                        </>
                    )}
                </div>
             )}
              { activeTab === 'findTarget' && (
                  <div className="w-full max-w-5xl space-y-3">
                    <div className="flex justify-center">
                        <div className="flex items-center gap-2 p-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                            <button onClick={() => handleTargetStrategyChange('risingStar')} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full transition-colors ${targetStrategy === 'risingStar' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                                <StarIcon /> 라이징 스타 채널 찾기
                            </button>
                            <button onClick={() => handleTargetStrategyChange('emptyHouse')} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full transition-colors ${targetStrategy === 'emptyHouse' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                                <KeyIcon /> 빈집 토픽 찾기
                            </button>
                        </div>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleTargetSearch(); }} className="flex w-full items-stretch gap-2 bg-white dark:bg-slate-800 p-2 rounded-full border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                        <input
                            type="text"
                            value={targetQuery}
                            onChange={(e) => setTargetQuery(e.target.value)}
                            placeholder={targetSearchPlaceholder}
                            className="w-full px-5 py-2 text-base bg-transparent border-none focus:outline-none focus:ring-0 dark:text-slate-100"
                            disabled={isLoading}
                        />
                         <select
                            value={targetCategory}
                            onChange={(e) => setTargetCategory(e.target.value)}
                            className="text-base bg-slate-100 dark:bg-slate-700 dark:text-slate-200 border-transparent rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            disabled={isLoading}
                            aria-label="카테고리 선택"
                        >
                            {youtubeCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="text-base bg-slate-100 dark:bg-slate-700 dark:text-slate-200 border-transparent rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            disabled={isLoading}
                            aria-label="기간 선택"
                        >
                            {(targetStrategy === 'risingStar' ? risingStarPeriods : emptyHousePeriods).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        <button
                            type="submit"
                            className="flex items-center justify-center px-8 py-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors font-bold"
                            disabled={isLoading}
                        >
                            <span>분석 시작</span>
                        </button>
                    </form>
                  </div>
              )}
           </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 flex-grow">
        
        {isLoading && (
          <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-2xl shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">{progress.message}</p>
            {progress.count !== undefined && progress.total !== undefined && progress.total > 0 && (
              <div className="w-full max-w-md mx-auto bg-slate-200 dark:bg-slate-700 rounded-full mt-2">
                <div 
                  className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                  style={{ width: `${(progress.count / progress.total) * 100}%` }}
                >
                  {`${progress.count} / ${progress.total}`}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-center p-10 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-500/30 rounded-2xl shadow-md">
            <i className="fas fa-exclamation-triangle text-red-500 fa-2x mb-3"></i>
            <p className="text-lg font-semibold text-red-700 dark:text-red-300">오류 발생!</p>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {!isLoading && !error && (activeTab === 'channel' || activeTab === 'keyword') && videos.length > 0 && (
          <div className="space-y-6">
            <AnalyticsDashboard videos={videos} displayVideos={sortedAndFilteredVideos} channel={channel} channelStats={channelStats} searchQuery={searchQuery} />
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                  {(activeTab === 'keyword' || (activeTab === 'channel' && videos.some(v => v.country))) && (
                    <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                      <button onClick={() => setCountryFilter('all')} className={countryFilterButtonClasses('all', activeTab === 'channel')}>전체</button>
                      <button onClick={() => setCountryFilter('korea')} className={countryFilterButtonClasses('korea', activeTab === 'channel')}>한국</button>
                      <button onClick={() => setCountryFilter('foreign')} className={countryFilterButtonClasses('foreign', activeTab === 'channel')}>해외</button>
                    </div>
                  )}
                  <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                    <button onClick={() => setVideoTypeFilter('all')} className={filterButtonClasses('all')}>전체</button>
                    <button onClick={() => setVideoTypeFilter('regular')} className={filterButtonClasses('regular')}>일반 영상</button>
                    <button onClick={() => setVideoTypeFilter('short')} className={filterButtonClasses('short')}>쇼츠</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="sortOrder" className="font-semibold text-slate-600 dark:text-slate-300">정렬:</label>
                    <select id="sortOrder" value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      <option value="popularity">인기순</option>
                      <option value="views">조회수순</option>
                      <option value="date">최신순</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="filterCount" className="font-semibold text-slate-600 dark:text-slate-300">표시:</label>
                    <select id="filterCount" value={filterCount} onChange={e => setFilterCount(Number(e.target.value))} className="rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      <option value={10}>상위 10개</option>
                      <option value={20}>상위 20개</option>
                      <option value={50}>상위 50개</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={handleGenerateStrategy}
                    className="flex items-center space-x-2 bg-gray-800 dark:bg-slate-200 text-white dark:text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50"
                    disabled={isStrategyLoading}
                  >
                    <BrainIcon />
                    <span>AI로 경쟁 전략 분석</span>
                  </button>
                  {activeTab === 'channel' && (
                      <>
                        <button 
                          onClick={handleGenerateGrowthAnalysis}
                          className="flex items-center space-x-2 bg-gray-800 dark:bg-slate-200 text-white dark:text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50"
                          disabled={isGrowthLoading}
                        >
                          <TimelineIcon />
                          <span>AI로 성장 과정 분석</span>
                        </button>
                        <button
                          onClick={handleGenerateConsulting}
                          className="text-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                          disabled={isConsultingLoading}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <ClipboardCheckIcon />
                            <div>
                              <span>AI 채널 진단 및 컨설팅</span>
                              <p className="text-xs text-indigo-200 font-normal -mt-1">내 채널이라면</p>
                            </div>
                          </div>
                        </button>
                      </>
                  )}
              </div>
              <ExportButtons data={videos} exportTitle={channel ? channel.title : searchQuery} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sortedAndFilteredVideos.map((video, index) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  rank={index + 1}
                  onAnalyzeChannel={activeTab === 'keyword' ? triggerChannelAnalysis : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && activeTab === 'findTarget' && (
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                            <button onClick={() => setCountryFilter('all')} className={countryFilterButtonClasses('all')}>전체</button>
                            <button onClick={() => setCountryFilter('korea')} className={countryFilterButtonClasses('korea')}>한국</button>
                            <button onClick={() => setCountryFilter('foreign')} className={countryFilterButtonClasses('foreign')}>해외</button>
                        </div>
                        { targetStrategy === 'emptyHouse' && (
                            <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                                <button onClick={() => setVideoTypeFilter('all')} className={filterButtonClasses('all')}>전체</button>
                                <button onClick={() => setVideoTypeFilter('regular')} className={filterButtonClasses('regular')}>일반 영상</button>
                                <button onClick={() => setVideoTypeFilter('short')} className={filterButtonClasses('short')}>쇼츠</button>
                            </div>
                        )}
                    </div>
                </div>

                {targetStrategy === 'risingStar' && targetChannels.length > 0 && (
                  <>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
                                    분석 결과: <span className="text-blue-600 dark:text-blue-400">{sortedAndFilteredTargetChannels.length}</span>개의 라이징 스타 채널
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">이 채널들은 최근에 개설되었지만, 영상 대비 구독자 전환율이 높아 빠르게 성장하고 있습니다.</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={handleCopyTargetText}
                                    disabled={copyTargetButtonText !== '텍스트 복사'}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
                                >
                                    <CopyIcon />
                                    {copyTargetButtonText}
                                </button>
                                <button
                                    onClick={handleDownloadTargetJson}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 dark:hover:bg-green-500 transition-colors"
                                >
                                    <JsonIcon />
                                    <span>JSON 다운로드</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {sortedAndFilteredTargetChannels.map((channel, index) => (
                        <ChannelCard key={channel.id} channel={channel} rank={index + 1} onAnalyze={triggerChannelAnalysis} />
                      ))}
                    </div>
                  </>
                )}
                
                {targetStrategy === 'emptyHouse' && filteredTopicAnalysisResult && (
                  (() => {
                    // Prevent rendering the analysis summary if no videos are found
                    if (filteredTopicAnalysisResult.topVideos.length === 0) return null;

                    const topVideos = filteredTopicAnalysisResult.topVideos;

                    const totalViews = topVideos.reduce((sum, v) => sum + v.viewCount, 0);
                    const averageViews = topVideos.length > 0 ? totalViews / topVideos.length : 0;
                    const sortedViews = topVideos.map(v => v.viewCount).sort((a, b) => a - b);
                    const mid = Math.floor(sortedViews.length / 2);
                    const medianViews = sortedViews.length === 0 ? 0 : sortedViews.length % 2 !== 0 ? sortedViews[mid] : (sortedViews[mid - 1] + sortedViews[mid]) / 2;
                    const channelActivity = topicAnalysisResult?.channelActivity;

                    return (
                      <>
                        <div className="p-6 rounded-2xl shadow-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">시장 데이터 요약</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopyTargetText}
                                    disabled={copyTargetButtonText !== '텍스트 복사'}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
                                >
                                    <CopyIcon />
                                    {copyTargetButtonText}
                                </button>
                                <button
                                    onClick={handleDownloadTargetJson}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 dark:hover:bg-green-500 transition-colors"
                                >
                                    <JsonIcon />
                                    <span>JSON 다운로드</span>
                                </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-center gap-1">
                                        상위 영상 총 조회수
                                        <div className="relative group">
                                            <InformationCircleIcon className="h-4 w-4 text-slate-400 cursor-pointer" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                분석된 상위 영상들의 총 조회수 합계입니다. 토픽의 전체적인 파급력을 나타냅니다.
                                            </div>
                                        </div>
                                    </p>
                                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{formatNumber(totalViews)}</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-center gap-1">
                                        평균 조회수
                                        <div className="relative group">
                                            <InformationCircleIcon className="h-4 w-4 text-slate-400 cursor-pointer" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                상위 영상들의 평균적인 성과입니다. 영상 하나가 기대할 수 있는 조회수 수준을 보여줍니다.
                                            </div>
                                        </div>
                                    </p>
                                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{formatNumber(averageViews)}</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-center gap-1">
                                        중간값 조회수
                                        <div className="relative group">
                                            <InformationCircleIcon className="h-4 w-4 text-slate-400 cursor-pointer" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                조회수를 순서대로 나열했을 때 중앙에 위치하는 값입니다. 극단적인 조회수(어그로성 영상 등)의 영향을 제외한 일반적인 성과를 파악하는 데 도움이 됩니다.
                                            </div>
                                        </div>
                                    </p>
                                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{formatNumber(medianViews)}</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-center gap-1">
                                        고유 채널 수
                                        <div className="relative group">
                                            <InformationCircleIcon className="h-4 w-4 text-slate-400 cursor-pointer" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                상위 {topVideos.length}개 영상에 등장하는 서로 다른 채널의 수입니다. 채널 집중도를 나타냅니다.
                                            </div>
                                        </div>
                                    </p>
                                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{filteredTopicAnalysisResult.uniqueChannelCount}개</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-center gap-1">
                                        평균 업로드 주기
                                        <div className="relative group">
                                            <InformationCircleIcon className="h-4 w-4 text-slate-400 cursor-pointer" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                상위 채널들의 최근 영상 업로드 간격의 평균입니다. 토픽의 현재 활성도(경쟁 속도)를 나타냅니다.
                                            </div>
                                        </div>
                                    </p>
                                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                      {channelActivity ? `${channelActivity.averageIntervalDays.toFixed(1)}일` : 'N/A'}
                                    </p>
                                </div>
                          </div>
                        </div>

                        {isInsightLoading && (
                            <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-2xl shadow-md">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">AI가 조회수 및 트렌드를 심층 분석 중입니다...</p>
                            </div>
                        )}
                        {topicInsight && !isInsightLoading && (
                          (() => {
                              const { title, verdict, reason, strategyTitle, strategy: strategyItems } = topicInsight.finalVerdict;

                              return (
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <h4 className="font-bold text-md text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                            <TagIcon className="h-5 w-5 text-purple-500" /> {topicInsight.hashtagAnalysis.title}
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{topicInsight.hashtagAnalysis.summary}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <h4 className="font-bold text-md text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                            <ChartBarIcon /> {topicInsight.marketAnalysis.title}
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{topicInsight.marketAnalysis.summary}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                                        <h4 className="font-bold text-md text-slate-700 dark:text-slate-200 mb-4 text-center flex items-center justify-center gap-2">
                                            <ClipboardCheckIcon className="h-5 w-5 text-slate-500" /> {title}
                                        </h4>
                                        <div className="text-center mb-6">
                                            <span className={`px-6 py-2 text-2xl font-extrabold rounded-full ${
                                                verdict === '블루오션' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' :
                                                verdict === '레드오션' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                                                'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}>
                                                {verdict}
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            {reason && (
                                                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                                    <h5 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">판단 근거</h5>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{reason}</p>
                                                </div>
                                            )}
                                            {strategyItems && strategyItems.length > 0 && (
                                                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                                    <h5 className="font-semibold text-green-700 dark:text-green-300 mb-2">{strategyTitle}</h5>
                                                    <ul className="space-y-2">
                                                        {strategyItems.map((item, index) => (
                                                            <li key={index} className="flex items-start text-sm text-slate-700 dark:text-slate-300">
                                                                <span className="text-green-500 mr-2">✔</span>
                                                                <span>{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                              );
                          })()
                        )}

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="xl:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3">주요 채널 분포</h3>
                                <div className="space-y-3 max-h-[1000px] overflow-y-auto">
                                {Array.from(filteredTopicAnalysisResult.channelDistribution.entries())
                                    .sort(([, a], [, b]) => b.videoCountInTop50 - a.videoCountInTop50)
                                    .map(([id, info]) => (
                                        <div key={id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center">
                                                <img src={info.thumbnailUrl} alt={info.title} className="w-10 h-10 rounded-full mr-3"/>
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{info.title}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">구독자: {formatNumber(info.subscriberCount)}</p>
                                                </div>
                                                <div className="text-center ml-2 flex-shrink-0">
                                                    <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">{info.videoCountInTop50}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">영상 수</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-end gap-2">
                                                <a href={`https://www.youtube.com/channel/${id}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-200 dark:bg-slate-600 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                                                    채널 바로가기
                                                </a>
                                                <button onClick={() => triggerChannelAnalysis(id)} className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                                                    채널 분석
                                                </button>
                                            </div>
                                        </div>
                                ))}
                                </div>
                            </div>
                            <div className="xl:col-span-2">
                                 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3">상위 인기 동영상 목록</h3>
                                 <div className="space-y-4">
                                    {filteredTopicAnalysisResult.topVideos.map((video, index) => (
                                       <VideoCard 
                                          key={video.id} 
                                          video={video} 
                                          rank={index + 1} 
                                          onAnalyzeChannel={triggerChannelAnalysis} 
                                       />
                                    ))}
                                 </div>
                            </div>
                        </div>
                      </>
                    );
                  })()
                )}
            </div>
        )}


        {!isLoading && !error && videos.length === 0 && targetChannels.length === 0 && !topicAnalysisResult && (
           <div className="text-center py-10 px-6">
             <div className="text-blue-400 mb-4">
                <i className="fas fa-binoculars fa-5x"></i>
             </div>
             <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">탐험을 시작하세요</h2>
             <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {activeTab === 'channel' && "분석하고 싶은 YouTube 채널을 검색하여 채널 성장의 비밀을 파헤쳐보세요!"}
                {activeTab === 'keyword' && "관심있는 키워드를 검색하여 인기 동영상 트렌드를 분석해보세요!"}
                {activeTab === 'findTarget' && "분석 전략을 선택하고 해시태그와 카테고리를 지정하여 숨겨진 기회를 찾아보세요!"}
             </p>
           </div>
        )}
      </main>
      
      <footer className="bg-white dark:bg-slate-800 mt-auto py-4 border-t dark:border-slate-700">
        <div className="container mx-auto px-4 flex justify-between items-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Developed by <span className="font-bold">Next Experience Lab</span>
            </p>
          
        </div>
      </footer>
      
      <ApiKeyMessage
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySubmit={handleKeySubmit}
      />

      <StrategyModal
        isOpen={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        strategy={strategyResult}
        isLoading={isStrategyLoading}
        error={strategyError}
        title={strategyModalTitle}
      />
      
      <GrowthAnalysisModal
        isOpen={isGrowthAnalysisModalOpen}
        onClose={() => setIsGrowthAnalysisModalOpen(false)}
        analysis={growthResult}
        isLoading={isGrowthLoading}
        error={growthError}
      />

      <ConsultingModal
        isOpen={isConsultingModalOpen}
        onClose={() => setIsConsultingModalOpen(false)}
        consulting={consultingResult}
        isLoading={isConsultingLoading}
        error={consultingError}
      />
      
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

    </div>
  );
};

export default App;