
import type { YouTubeChannel, VideoDetails, VideoStatistics, AnalyzedVideo, StrategyResult, ChannelExtraStats, GrowthAnalysisResult, TargetChannel, TopicAnalysisResult, TopicChannelInfo, ConsultingResult, TopicInsightResult } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const LOCAL_STORAGE_KEY = 'yt_ak_e'; // Short name for less conspicuous storage key
const GEMINI_LOCAL_STORAGE_KEY = 'gm_ak_e';

// Simple XOR "encryption". Not cryptographically secure, but obfuscates the key.
const SECRET_KEY = 'youtube-data-explorer-secret';

const encrypt = (text: string): string => {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  return btoa(result); // Base64 encode to handle any characters
};

const decrypt = (text: string): string => {
  if (!text) return '';
  const decoded = atob(text);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  return result;
};


declare const gapi: any; // Declare gapi for TypeScript

export const setApiKey = (key: string) => {
  if (!key) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } else {
    localStorage.setItem(LOCAL_STORAGE_KEY, encrypt(key));
  }
};

export const getApiKey = (): string | undefined => {
  const encryptedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (encryptedKey) {
    try {
      return decrypt(encryptedKey);
    } catch (e) {
      console.error("API 키 복호화 실패, 저장된 키를 삭제합니다.", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return undefined;
    }
  }
  
  const envKey = process.env.API_KEY;
  if (envKey && envKey !== 'YOUR_API_KEY') return envKey;
  
  return undefined;
}

export const setGeminiApiKey = (key: string) => {
  if (!key) {
    localStorage.removeItem(GEMINI_LOCAL_STORAGE_KEY);
  } else {
    localStorage.setItem(GEMINI_LOCAL_STORAGE_KEY, encrypt(key));
  }
};

export const getGeminiApiKey = (): string | undefined => {
  const encryptedKey = localStorage.getItem(GEMINI_LOCAL_STORAGE_KEY);
  if (encryptedKey) {
    try {
      return decrypt(encryptedKey);
    } catch (e) {
      console.error("Gemini API 키 복호화 실패, 저장된 키를 삭제합니다.", e);
      localStorage.removeItem(GEMINI_LOCAL_STORAGE_KEY);
      return undefined;
    }
  }
  
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey !== 'YOUR_GEMINI_API_KEY') return envKey;
  
  return undefined;
}

export const isApiKeySet = (): boolean => {
  return getApiKey() !== undefined && getGeminiApiKey() !== undefined;
};

export const testApiKey = async (key: string): Promise<{ success: boolean; error?: Error }> => {
  const testUrl = `https://www.googleapis.com/youtube/v3/i18nRegions?part=snippet&hl=en_US&key=${key}`;
  try {
    const response = await fetch(testUrl);
    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data?.error?.message || `HTTP 에러: ${response.status}`;
        const errorReason = data?.error?.errors?.[0]?.reason || 'unknownReason';
        const mockGapiError = { result: { error: { message: errorMessage, errors: [{ reason: errorReason }] } } };
        throw createApiError(mockGapiError, 'API 키 테스트');
    }
    return { success: true };
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('API 키 테스트')) {
       return { success: false, error };
    }
    return { success: false, error: createApiError(error, 'API 키 테스트') };
  }
};


// A new, robust, centralized error handler for all API interactions.
const createApiError = (error: any, context: string): Error => {
  console.error(`${context} 오류 (Raw):`, error); // Keep raw log for developers

  // Extract common error details, regardless of structure
  const gapiError = error?.result?.error || error?.error || error;
  const reason = gapiError?.errors?.[0]?.reason || gapiError?.reason;
  const message = gapiError?.message || gapiError?.details || (typeof gapiError === 'string' ? gapiError : '');

  // --- Rule-based error identification ---

  // Rule 1: Invalid API Key (Most Common)
  // Check for the specific reason code or telling phrases in the message.
  if (reason === 'apiKeyInvalid' || (message && message.toLowerCase().includes('api key not valid'))) {
    return new Error(`${context} 오류: API 키가 유효하지 않습니다. Google Cloud Console에서 올른 키를 복사했는지, 만료되지 않았는지 확인해주세요.`);
  }

  // Rule 2: Referer Blocked
  if (reason === 'ipRefererBlocked' || reason === 'httpRefererBlocked' || (message && (message.includes('RefererNotAllowedMapError') || message.includes('referer blocked')))) {
    return new Error(`${context} 오류: API 키의 HTTP 리퍼러 제한 설정에 의해 요청이 차단되었습니다. Google Cloud Console에서 현재 웹사이트의 주소가 허용 목록에 있는지 확인해주세요.`);
  }

  // Rule 3: API Not Enabled
  if (reason === 'accessNotConfigured' || reason === 'serviceDisabled') {
      return new Error(`${context} 오류: YouTube Data API v3가 활성화되지 않았습니다. Google Cloud Console에서 프로젝트에 해당 API를 사용 설정했는지 확인해주세요.`);
  }
  
  // Rule 4: Quota Exceeded
  if (reason === 'quotaExceeded') {
      return new Error(`${context} 오류: API 할당량을 초과했습니다. 잠시 후 다시 시도하거나 Google Cloud Console에서 할당량을 확인해주세요.`);
  }
  
  // Rule 5: Network Error (Failed to fetch)
  if (error instanceof Error && (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('failed to fetch'))) {
      const serverContext = context.includes('스크립트') ? ' 외부 스크립트 서버에 일시적인 오류가 있을 수 있습니다.' : '';
      return new Error(`${context} 오류: 네트워크 연결에 문제가 발생했습니다.${serverContext} 인터넷 연결을 확인하고 다시 시도해주세요.`);
  }
  
  // --- Fallbacks ---

  // Use the extracted message if it exists
  if (message) {
      // Add code if present
      const code = gapiError.code ? ` (코드: ${gapiError.code})` : '';
      return new Error(`${context} 오류: ${message}${code}`);
  }

  // Final fallback for anything else
  if (error instanceof Error) {
    // If the error message already contains the context, don't add it again.
    if (error.message.includes(context)) {
        return error;
    }
    return new Error(`${context} 오류: ${error.message}`);
  }

  return new Error(`${context} 오류: 알 수 없는 오류가 발생했습니다. 네트워크 연결을 확인하거나 API 키가 올른지 다시 확인해주세요.`);
};


// Initialize the Google API client
export const initGoogleClient = (): Promise<void> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('API 키가 설정되지 않았습니다.'));
  }

  return new Promise((resolve, reject) => {
    // gapi is loaded from the script tag in index.html
    gapi.load('client', () => {
      gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'],
      }).then(() => {
        resolve();
      }).catch((error: any) => {
        reject(createApiError(error, 'Google API 클라이언트 초기화'));
      });
    });
  });
};

// Find channel by search query
export async function findChannel(query: string): Promise<YouTubeChannel | null> {
  try {
    let channelId: string | null = null;
    const channelIdRegex = /^UC[A-Za-z0-9_-]{22}$/;

    if (channelIdRegex.test(query)) {
      channelId = query;
    } else {
      const response = await gapi.client.youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'channel',
        maxResults: 1
      });

      if (response.result.items.length > 0) {
        channelId = response.result.items[0].id.channelId;
      }
    }

    if (!channelId) return null;

    const channelDetailsResponse = await gapi.client.youtube.channels.list({
        part: 'snippet,contentDetails,statistics',
        id: channelId
    });

    if (channelDetailsResponse.result.items.length === 0) return null;
    const item = channelDetailsResponse.result.items[0];

    const subscriberCount = item.statistics.hiddenSubscriberCount 
        ? -1 
        : parseInt(item.statistics.subscriberCount, 10);

    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.default.url,
      uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
      publishedAt: item.snippet.publishedAt,
      videoCount: parseInt(item.statistics.videoCount, 10),
      subscriberCount: subscriberCount,
      viewCount: parseInt(item.statistics.viewCount, 10),
    };

  } catch (error) {
    throw createApiError(error, '채널 검색');
  }
}


// Get all video IDs from a channel's upload playlist
async function getChannelVideoIds(playlistId: string, onProgress: (count: number) => void): Promise<string[]> {
  let videoIds: string[] = [];
  let nextPageToken: string | undefined = undefined;

  try {
    do {
      const response = await gapi.client.youtube.playlistItems.list({
        part: 'contentDetails',
        playlistId: playlistId,
        maxResults: 50,
        pageToken: nextPageToken,
      });

      const items = response.result.items || [];
      const ids = items.map((item: any) => item.contentDetails.videoId);
      videoIds = [...videoIds, ...ids];
      onProgress(videoIds.length);
      nextPageToken = response.result.nextPageToken;

    } while (nextPageToken);

    return videoIds;
  } catch(error) {
    throw createApiError(error, '영상 목록 조회');
  }
}

const extractHashtags = (description: string): string[] => {
    if (!description) return [];
    const regex = /#([a-zA-Z0-9_ㄱ-ㅎ|ㅏ-ㅣ|가-힣]+)/g;
    const matches = description.match(regex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
};

function parseISO8601Duration(durationString: string): number {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = durationString.match(regex);
    if (!matches) return 0;

    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);

    return (hours * 3600) + (minutes * 60) + seconds;
}

// Get details and stats for a batch of videos
async function getVideoDetailsAndStats(videoIds: string[]): Promise<(VideoDetails & VideoStatistics)[]> {
  const videosData: (VideoDetails & VideoStatistics)[] = [];
  
  try {
    for (let i = 0; i < videoIds.length; i += 50) {
      const videoIdChunk = videoIds.slice(i, i + 50);
      const response = await gapi.client.youtube.videos.list({
        part: 'snippet,statistics,contentDetails,player',
        id: videoIdChunk.join(','),
      });

      const items = response.result.items || [];

      const chunkData = items.map((item: any) => {
        const durationInSeconds = parseISO8601Duration(item.contentDetails.duration);
        let videoType: 'short' | 'regular' = 'regular';

        // 3분 이하(180초) 영상은 모두 쇼츠로 분류합니다.
        if (durationInSeconds > 0 && durationInSeconds <= 180) {
            videoType = 'short';
        }

        return {
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          thumbnailUrl: item.snippet.thumbnails.medium.url,
          tags: item.snippet.tags || [],
          hashtags: extractHashtags(item.snippet.description),
          duration: durationInSeconds,
          videoType: videoType,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
          viewCount: parseInt(item.statistics.viewCount || '0', 10),
          likeCount: parseInt(item.statistics.likeCount || '0', 10),
          commentCount: parseInt(item.statistics.commentCount || '0', 10),
        };
      });
      videosData.push(...chunkData);
    }
    return videosData;
  } catch (error) {
    throw createApiError(error, '영상 상세 정보 조회');
  }
}

export async function summarizeTranscript(description: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않아 요약 기능을 사용할 수 없습니다.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `다음은 유튜브 영상의 설명입니다. 이 설명의 핵심 내용을 3~5개의 문장으로 간결하게 요약해주세요. 한국어로 답변해주세요.\n\n---\n\n${description}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const summary = response.text;
    if (!summary) {
      throw new Error('모델이 요약 내용을 생성하지 못했습니다.');
    }
    return summary;

  } catch (error: any) {
    console.error("Gemini API 요약 오류 (Raw):", error);
    const message = error?.message || 'Gemini API 호출 중 오류가 발생했습니다.';
    if (message.includes('API key not valid')) {
       throw new Error('API 키가 유효하지 않습니다. Gemini API를 사용할 수 있는 올른 키인지 확인해주세요.');
    }
    throw new Error(`영상 요약 중 오류 발생: ${message}`);
  }
}


// Main function to analyze a channel
export async function analyzeChannelVideos(
  channel: YouTubeChannel, 
  onProgress: (message: string, count?: number, total?: number) => void
): Promise<AnalyzedVideo[]> {
  onProgress('채널의 모든 영상 ID를 수집 중입니다...');
  const videoIds = await getChannelVideoIds(channel.uploadsPlaylistId, (count) => {
    onProgress('영상 ID 수집 진행 중...', count, channel.videoCount);
  });
  
  onProgress(`총 ${videoIds.length}개의 영상 정보를 가져오는 중입니다...`);
  const videosData = await getVideoDetailsAndStats(videoIds);

  onProgress('인기 점수를 계산 중입니다...');
  const maxValues = videosData.reduce(
    (max, video) => ({
      viewCount: Math.max(max.viewCount, video.viewCount),
      likeCount: Math.max(max.likeCount, video.likeCount),
      commentCount: Math.max(max.commentCount, video.commentCount),
    }),
    { viewCount: 1, likeCount: 1, commentCount: 1 }
  );

  const analyzedVideos = videosData.map((video) => {
    const normalizedViews = video.viewCount / maxValues.viewCount;
    const normalizedLikes = video.likeCount / maxValues.likeCount;
    const normalizedComments = video.commentCount / maxValues.commentCount;
    const popularityScore = (normalizedViews * 0.6 + normalizedLikes * 0.3 + normalizedComments * 0.1) * 100;
    
    return { ...video, popularityScore };
  });
  
  onProgress('분석 완료!');
  return analyzedVideos.sort((a, b) => b.popularityScore - a.popularityScore);
}

export async function analyzeVideosByKeyword(
  query: string,
  categoryId: string,
  onProgress: (message: string, count?: number, total?: number) => void
): Promise<AnalyzedVideo[]> {
  onProgress(`'${query}' 키워드로 영상 검색 중...`);
  try {
    const requestParams: any = {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: 50, // Analyze top 50 results
      order: 'relevance',
    };

    if (categoryId) {
      requestParams.videoCategoryId = categoryId;
    }

    const response = await gapi.client.youtube.search.list(requestParams);

    const items = response.result.items || [];
    if (items.length === 0) {
      onProgress('영상을 찾을 수 없습니다.', 0, 0);
      return [];
    }

    const videoIds = items.map((item: any) => item.id.videoId);
    onProgress(`총 ${videoIds.length}개의 영상 정보를 가져오는 중입니다...`);
    const videosData = await getVideoDetailsAndStats(videoIds);
    
    onProgress('채널 국가 정보 조회 중...');
    const channelIds = [...new Set(videosData.map(v => v.channelId))];
    const channelDetailsResponse = await gapi.client.youtube.channels.list({
      part: 'snippet',
      id: channelIds.join(','),
    });
    const channelItems = channelDetailsResponse.result.items || [];
    const channelCountryMap = new Map<string, string>();
    channelItems.forEach((ch: any) => {
      if (ch.snippet.country) {
        channelCountryMap.set(ch.id, ch.snippet.country);
      }
    });

    const videosWithCountry = videosData.map(video => ({
      ...video,
      country: channelCountryMap.get(video.channelId)
    }));


    onProgress('인기 점수를 계산 중입니다...');
    if (videosWithCountry.length === 0) {
        onProgress('분석 완료!');
        return [];
    }
      
    const maxValues = videosWithCountry.reduce(
      (max, video) => ({
        viewCount: Math.max(max.viewCount, video.viewCount),
        likeCount: Math.max(max.likeCount, video.likeCount),
        commentCount: Math.max(max.commentCount, video.commentCount),
      }),
      { viewCount: 1, likeCount: 1, commentCount: 1 }
    );

    const analyzedVideos = videosWithCountry.map((video) => {
      const normalizedViews = video.viewCount / maxValues.viewCount;
      const normalizedLikes = video.likeCount / maxValues.likeCount;
      const normalizedComments = video.commentCount / maxValues.commentCount;
      const popularityScore = (normalizedViews * 0.6 + normalizedLikes * 0.3 + normalizedComments * 0.1) * 100;
      
      return { ...video, popularityScore };
    });
    
    onProgress('분석 완료!');
    return analyzedVideos.sort((a, b) => b.popularityScore - a.popularityScore);

  } catch (error) {
    throw createApiError(error, '키워드 영상 검색');
  }
}

const strategySchema = {
    type: Type.OBJECT,
    properties: {
        coreConcept: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "채널의 핵심 컨셉 제목" },
                description: { type: Type.STRING, description: "핵심 컨셉에 대한 상세 설명" }
            },
            required: ['title', 'description']
        },
        detailedPlan: {
            type: Type.OBJECT,
            properties: {
                contentDirection: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "콘텐츠 제작 방향 제목" },
                        details: { type: Type.STRING, description: "콘텐츠 제작 방향에 대한 상세 설명" }
                    },
                    required: ['title', 'details']
                },
                uploadSchedule: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "업로드 주기 제목" },
                        details: { type: Type.STRING, description: "업로드 주기에 대한 상세 설명" }
                    },
                    required: ['title', 'details']
                },
                communityEngagement: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "커뮤니티 소통 방식 제목" },
                        details: { type: Type.STRING, description: "커뮤니티 소통 방식에 대한 상세 설명" }
                    },
                    required: ['title', 'details']
                },
                keywordStrategy: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "해시태그 및 키워드 사용 전략 제목" },
                        details: { type: Type.STRING, description: "인기 키워드를 기반으로 한 노출 극대화 전략" }
                    },
                    required: ['title', 'details']
                }
            },
            required: ['contentDirection', 'uploadSchedule', 'communityEngagement', 'keywordStrategy']
        },
        initialStrategy: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "채널 개설초기 운용전략의 전체 제목" },
                phases: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            phaseTitle: { type: Type.STRING, description: "전략 단계의 제목 (예: '1개월차: 기반 다지기')" },
                            focus: { type: Type.STRING, description: "해당 단계의 핵심 목표" },
                            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['phaseTitle', 'focus', 'actionItems']
                    }
                }
            },
            required: ['title', 'phases']
        },
        suggestedTitles: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "추천 영상 제목 목록의 전체 제목" },
                titles: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['title', 'titles']
        },
        kpiSettings: {
            type: Type.OBJECT,
            description: "구체적인 성과 측정 지표(KPI) 설정",
            properties: {
                title: { type: Type.STRING },
                kpis: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            kpiTitle: { type: Type.STRING, description: "KPI 항목 제목 (예: '월별 구독자 수')"},
                            description: { type: Type.STRING, description: "KPI에 대한 상세 설명 및 목표치" }
                        },
                        required: ['kpiTitle', 'description']
                    }
                }
            },
            required: ['title', 'kpis']
        },
        riskManagement: {
            type: Type.OBJECT,
            description: "위기 관리 및 리스크 대응 전략",
            properties: {
                title: { type: Type.STRING },
                risks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            riskTitle: { type: Type.STRING, description: "리스크 항목 제목 (예: '평판 관리')" },
                            strategy: { type: Type.STRING, description: "해당 리스크에 대한 대응 전략" }
                        },
                        required: ['riskTitle', 'strategy']
                    }
                }
            },
            required: ['title', 'risks']
        },
        revenueModel: {
            type: Type.OBJECT,
            description: "수익 모델 다각화 전략",
            properties: {
                title: { type: Type.STRING },
                streams: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            revenueTitle: { type: Type.STRING, description: "수익 모델 항목 제목 (예: '굿즈/머천다이징')" },
                            description: { type: Type.STRING, description: "해당 수익 모델에 대한 상세 설명 및 실행 계획" }
                        },
                        required: ['revenueTitle', 'description']
                    }
                }
            },
            required: ['title', 'streams']
        }
    },
    required: ['coreConcept', 'detailedPlan', 'initialStrategy', 'suggestedTitles', 'kpiSettings', 'riskManagement', 'revenueModel']
};


export async function generateChannelStrategy(channel: YouTubeChannel, videos: AnalyzedVideo[]): Promise<StrategyResult> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않아 전략 분석 기능을 사용할 수 없습니다.');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const videoDataForPrompt = videos.slice(0, 20).map(v => ({
            title: v.title,
            views: v.viewCount,
            likes: v.likeCount,
            popularity: v.popularityScore.toFixed(1),
            type: v.videoType,
            duration: v.duration, // Add duration in seconds
        }));
        
        const allKeywords = videos.flatMap(v => v.tags || []);
        const keywordCounts = allKeywords.reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const popularKeywords = Object.entries(keywordCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([tag]) => tag);


        const prompt = `
당신은 최고의 유튜브 채널 전략가입니다. 다음은 '${channel.title}' 채널의 데이터입니다. 이 데이터를 심층 분석하여, 이 채널과 경쟁하여 이길 수 있는 새로운 유튜브 채널 운영 전략을 제안해주세요.

**분석 대상 채널 정보:**
- 채널명: ${channel.title}
- 채널 설명: ${channel.description}
- 인기 영상 데이터 (상위 20개 샘플):
${JSON.stringify(videoDataForPrompt, null, 2)}
- 주요 인기 키워드 (분석 기반): ${popularKeywords.join(', ')}

**요청 사항:**
위 데이터를 바탕으로, 경쟁 채널을 이길 수 있는 새로운 유튜브 채널 전략을 JSON 형식으로 제안해주세요. 특히 영상의 **플레이 시간(duration)**을 포함한 모든 속성을 종합적으로 분석하여, 시청자 유지에 가장 유리한 최적의 영상 길이에 대한 분석도 포함해주세요. 응답은 반드시 제공된 JSON 스키마를 준수해야 합니다.
- coreConcept: 채널의 핵심 컨셉.
- detailedPlan: 콘텐츠, 업로드, 커뮤니티에 대한 구체적인 운영 계획. 여기에 '해시태그 및 키워드 사용 전략(keywordStrategy)'을 포함해주세요. 이 전략은 위에서 제공된 '주요 인기 키워드'를 기반으로 영상 노출을 극대화하는 방안이어야 합니다.
- initialStrategy: 초기 3개월간의 단계별 성장 전략.
- suggestedTitles: 새로운 컨셉에 맞는 영상 제목 10개.

**추가 요청 사항:**
전략의 실행력을 높이기 위해 다음 3가지 항목을 반드시 포함하여 분석해주세요.
- kpiSettings: 구체적인 성과 측정 지표(KPI)를 설정해주세요. 월별/분기별 구독자, 조회수, 참여율 등 정량적 목표와 정성적 목표를 포함해야 합니다.
- riskManagement: 채널 운영 시 발생할 수 있는 위기 및 리스크(예: 평판 관리, 법적 문제)와 그에 대한 구체적인 대응 전략을 제시해주세요.
- revenueModel: 광고 수익 외에 채널을 지속 가능하게 만들 수 있는 다양한 수익 모델(예: 굿즈, 멤버십, PPL)을 제안하고 단계별 실행 계획을 설명해주세요.

모든 내용은 한국어로 작성해주세요.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: strategySchema,
            }
        });

        const resultText = response.text;
        if (!resultText) {
            throw new Error('모델이 전략을 생성하지 못했습니다.');
        }
        return JSON.parse(resultText) as StrategyResult;

    } catch (error: any) {
        console.error("Gemini API 채널 전략 생성 오류 (Raw):", error);
        const message = error?.message || 'Gemini API 호출 중 오류가 발생했습니다.';
        if (message.includes('API key not valid')) {
            throw new Error('API 키가 유효하지 않습니다. Gemini API를 사용할 수 있는 올바른 키인지 확인해주세요.');
        }
        throw new Error(`채널 전략 분석 중 오류 발생: ${message}`);
    }
}

export async function generateKeywordStrategy(query: string, videos: AnalyzedVideo[]): Promise<StrategyResult> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않아 전략 분석 기능을 사용할 수 없습니다.');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const videoDataForPrompt = videos.slice(0, 20).map(v => ({
            title: v.title,
            views: v.viewCount,
            likes: v.likeCount,
            popularity: v.popularityScore.toFixed(1),
            type: v.videoType,
            duration: v.duration,
        }));
        
        const allKeywords = videos.flatMap(v => v.tags || []);
        const keywordCounts = allKeywords.reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const popularKeywords = Object.entries(keywordCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([tag]) => tag);


        const prompt = `
당신은 최고의 유튜브 채널 전략가입니다. 다음은 '${query}' 키워드로 검색된 인기 영상 데이터입니다. 이 데이터를 심층 분석하여, 이 키워드 주제로 성공할 수 있는 새로운 유튜브 채널 운영 전략을 제안해주세요.

**분석 대상 키워드:** '${query}'
- 인기 영상 데이터 (상위 20개 샘플):
${JSON.stringify(videoDataForPrompt, null, 2)}
- 관련 인기 키워드 (분석 기반): ${popularKeywords.join(', ')}

**요청 사항:**
위 데이터를 바탕으로, '${query}' 주제로 성공할 새로운 유튜브 채널 전략을 JSON 형식으로 제안해주세요. 특히 영상의 **플레이 시간(duration)**을 포함한 모든 속성을 종합적으로 분석하여, 시청자 유지에 가장 유리한 최적의 영상 길이에 대한 분석도 포함해주세요. 응답은 반드시 제공된 JSON 스키마를 준수해야 합니다.
- coreConcept: 채널의 핵심 컨셉.
- detailedPlan: 콘텐츠, 업로드, 커뮤니티에 대한 구체적인 운영 계획. 여기에 '해시태그 및 키워드 사용 전략(keywordStrategy)'을 포함해주세요. 이 전략은 위에서 제공된 '관련 인기 키워드'를 기반으로 영상 노출을 극대화하는 방안이어야 합니다.
- initialStrategy: 초기 3개월간의 단계별 성장 전략.
- suggestedTitles: 새로운 컨셉에 맞는 영상 제목 10개.

**추가 요청 사항:**
전략의 실행력을 높이기 위해 다음 3가지 항목을 반드시 포함하여 분석해주세요.
- kpiSettings: 구체적인 성과 측정 지표(KPI)를 설정해주세요. 월별/분기별 구독자, 조회수, 참여율 등 정량적 목표와 정성적 목표를 포함해야 합니다.
- riskManagement: 채널 운영 시 발생할 수 있는 위기 및 리스크(예: 평판 관리, 법적 문제)와 그에 대한 구체적인 대응 전략을 제시해주세요.
- revenueModel: 광고 수익 외에 채널을 지속 가능하게 만들 수 있는 다양한 수익 모델(예: 굿즈, 멤버십, PPL)을 제안하고 단계별 실행 계획을 설명해주세요.

모든 내용은 한국어로 작성해주세요.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: strategySchema,
            }
        });

        const resultText = response.text;
        if (!resultText) {
            throw new Error('모델이 전략을 생성하지 못했습니다.');
        }
        return JSON.parse(resultText) as StrategyResult;

    } catch (error: any) {
        console.error("Gemini API 키워드 전략 생성 오류 (Raw):", error);
        const message = error?.message || 'Gemini API 호출 중 오류가 발생했습니다.';
        if (message.includes('API key not valid')) {
            throw new Error('API 키가 유효하지 않습니다. Gemini API를 사용할 수 있는 올바른 키인지 확인해주세요.');
        }
        throw new Error(`키워드 전략 분석 중 오류 발생: ${message}`);
    }
}

const formatInterval = (ms: number): string => {
    if (isNaN(ms) || ms <= 0) return '계산 불가';
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    hours = hours % 24;
    minutes = minutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}일`);
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0 && days === 0) parts.push(`${minutes}분`); // 분은 일 단위가 없을 때만 표시
    
    return parts.join(' ') || '방금 전';
};


export function calculateExtraChannelStats(videos: AnalyzedVideo[]): ChannelExtraStats {
    if (videos.length === 0) {
        return {
            firstVideoDate: 'N/A',
            averageUploadIntervalAll: 'N/A',
            averageUploadIntervalRecent: 'N/A',
        };
    }

    const sortedVideos = [...videos].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    const firstVideoDate = sortedVideos[0].publishedAt;

    const calculateAverage = (videoList: AnalyzedVideo[]): string => {
        if (videoList.length < 2) return '계산 불가';
        
        const sorted = [...videoList].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
        const intervals = [];
        for (let i = 1; i < sorted.length; i++) {
            const diff = new Date(sorted[i].publishedAt).getTime() - new Date(sorted[i-1].publishedAt).getTime();
            intervals.push(diff);
        }
        const totalInterval = intervals.reduce((acc, curr) => acc + curr, 0);
        const avgMs = totalInterval / intervals.length;
        return formatInterval(avgMs);
    };
    
    const recentVideos = sortedVideos.slice(-5);

    return {
        firstVideoDate,
        averageUploadIntervalAll: calculateAverage(sortedVideos),
        averageUploadIntervalRecent: calculateAverage(recentVideos),
    };
}

const growthAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "채널 성장 분석의 전체 제목" },
        overallSummary: { type: Type.STRING, description: "채널의 전체 성장 과정에 대한 총평" },
        phases: {
            type: Type.ARRAY,
            description: "채널의 성장 단계를 3개로 나눈 분석",
            items: {
                type: Type.OBJECT,
                properties: {
                    phaseTitle: { type: Type.STRING, description: "성장 단계의 제목 (예: '1. 기반 다지기')" },
                    period: { type: Type.STRING, description: "해당 단계의 기간 (예: '2022년 1월 ~ 2022년 6월')" },
                    performanceSummary: { type: Type.STRING, description: "해당 단계의 성과에 대한 정성적 요약" },
                    strategyAnalysis: { type: Type.STRING, description: "콘텐츠, 주제 등 해당 단계의 핵심 전략에 대한 정성적 분석" },
                    keyVideos: {
                        type: Type.ARRAY,
                        description: "해당 단계를 대표하는 주요 영상 2~3개",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: "영상 제목" },
                                reason: { type: Type.STRING, description: "이 영상이 왜 해당 단계의 핵심인지에 대한 설명" },
                            },
                            required: ['title', 'reason']
                        }
                    },
                    quantitativeAnalysis: {
                        type: Type.OBJECT,
                        description: "해당 단계의 정량적 성과 지표",
                        properties: {
                            title: { type: Type.STRING, description: "'정량적 성과 분석'이라는 제목"},
                            avgViews: { type: Type.STRING, description: "평균 조회수" },
                            likeViewRatio: { type: Type.STRING, description: "좋아요/조회수 비율" },
                            commentViewRatio: { type: Type.STRING, description: "댓글/조회수 비율 (1k 조회수 당)" }
                        },
                        required: ['title', 'avgViews', 'likeViewRatio', 'commentViewRatio']
                    },
                    contentStrategyAnalysis: {
                        type: Type.OBJECT,
                        description: "해당 단계의 콘텐츠 전략 심화 분석",
                        properties: {
                            title: { type: Type.STRING, description: "'콘텐츠 전략 심화 분석'이라는 제목"},
                            avgVideoDuration: { type: Type.STRING, description: "평균 영상 길이" },
                            uploadFrequency: { type: Type.STRING, description: "업로드 주기" },
                            titleThumbnailStrategy: { type: Type.STRING, description: "제목 및 썸네일 전략에 대한 정성적 분석"}
                        },
                        required: ['title', 'avgVideoDuration', 'uploadFrequency', 'titleThumbnailStrategy']
                    }
                },
                required: ['phaseTitle', 'period', 'performanceSummary', 'strategyAnalysis', 'keyVideos', 'quantitativeAnalysis', 'contentStrategyAnalysis']
            }
        }
    },
    required: ['title', 'overallSummary', 'phases']
};


export async function generateChannelGrowthAnalysis(channel: YouTubeChannel, videos: AnalyzedVideo[]): Promise<GrowthAnalysisResult> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않아 성장 분석 기능을 사용할 수 없습니다.');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const sortedVideos = [...videos].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
        
        const videoSample = (videoList: AnalyzedVideo[]) => videoList.map(v => ({
            publishedAt: v.publishedAt.split('T')[0],
            title: v.title,
            views: v.viewCount,
            likes: v.likeCount,
            duration: v.duration
        }));
        
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

        const calculatePhaseMetrics = (videoList: AnalyzedVideo[]) => {
            if (videoList.length === 0) {
                return { avgViews: 'N/A', likeViewRatio: 'N/A', commentViewRatio: 'N/A', avgVideoDuration: 'N/A', uploadFrequency: 'N/A', period: 'N/A' };
            }

            const totalViews = videoList.reduce((sum, v) => sum + v.viewCount, 0);
            const totalLikes = videoList.reduce((sum, v) => sum + v.likeCount, 0);
            const totalComments = videoList.reduce((sum, v) => sum + v.commentCount, 0);
            const totalDuration = videoList.reduce((sum, v) => sum + v.duration, 0);

            const avgViews = totalViews / videoList.length;
            const likeViewRatio = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
            const commentViewRatio = totalViews > 0 ? (totalComments / totalViews) * 1000 : 0;
            const avgVideoDuration = totalDuration / videoList.length;

            let uploadFrequency = '계산 불가';
            if (videoList.length > 1) {
                const totalInterval = new Date(videoList[videoList.length - 1].publishedAt).getTime() - new Date(videoList[0].publishedAt).getTime();
                if (totalInterval > 0) {
                    const avgIntervalMs = totalInterval / (videoList.length - 1);
                    uploadFrequency = formatInterval(avgIntervalMs);
                }
            }
            
            const period_start = new Date(videoList[0].publishedAt).toLocaleDateString('ko-KR');
            const period_end = new Date(videoList[videoList.length - 1].publishedAt).toLocaleDateString('ko-KR');

            return {
                avgViews: Math.round(avgViews).toLocaleString('ko-KR') + '회',
                likeViewRatio: `${likeViewRatio.toFixed(2)}%`,
                commentViewRatio: `${commentViewRatio.toFixed(2)}개`,
                avgVideoDuration: formatDuration(avgVideoDuration),
                uploadFrequency,
                period: `${period_start} ~ ${period_end}`
            };
        };

        const totalVideos = sortedVideos.length;
        const phaseSize = Math.floor(totalVideos / 3);
        const earlyPhaseVideos = sortedVideos.slice(0, phaseSize);
        const midPhaseVideos = sortedVideos.slice(phaseSize, 2 * phaseSize);
        const latePhaseVideos = sortedVideos.slice(2 * phaseSize);

        const phaseData = {
            early: {
                metrics: calculatePhaseMetrics(earlyPhaseVideos),
                samples: videoSample(earlyPhaseVideos.slice(0,5))
            },
            mid: {
                metrics: calculatePhaseMetrics(midPhaseVideos),
                samples: videoSample(midPhaseVideos.slice(Math.floor(midPhaseVideos.length / 2) -2, Math.floor(midPhaseVideos.length / 2) + 3))
            },
            late: {
                metrics: calculatePhaseMetrics(latePhaseVideos),
                samples: videoSample(latePhaseVideos.slice(-5))
            }
        };


        const prompt = `
당신은 최고의 유튜브 데이터 과학자입니다. '${channel.title}' 채널의 성장 과정을 시간 순서대로 심층 분석하여, 채널의 전략이 어떻게 변화하고 발전했는지 설명해주세요. 정성적 분석과 함께 제공된 정량적 데이터를 반드시 활용하여 근거를 제시해야 합니다.

**채널 정보:**
- 채널명: ${channel.title}
- 개설일: ${new Date(channel.publishedAt).toLocaleDateString('ko-KR')}
- 총 영상 수: ${videos.length}

**시기별 데이터 요약:**
- **초기 단계:**
  - 기간: ${phaseData.early.metrics.period}
  - 정량 지표: ${JSON.stringify(phaseData.early.metrics, null, 2)}
  - 영상 샘플: ${JSON.stringify(phaseData.early.samples, null, 2)}
- **중기 단계:**
  - 기간: ${phaseData.mid.metrics.period}
  - 정량 지표: ${JSON.stringify(phaseData.mid.metrics, null, 2)}
  - 영상 샘플: ${JSON.stringify(phaseData.mid.samples, null, 2)}
- **최신 단계:**
  - 기간: ${phaseData.late.metrics.period}
  - 정량 지표: ${JSON.stringify(phaseData.late.metrics, null, 2)}
  - 영상 샘플: ${JSON.stringify(phaseData.late.samples, null, 2)}

**요청 사항:**
위 데이터를 바탕으로, 채널의 성장 과정을 3개의 뚜렷한 단계(초기, 중기, 최신)로 나누어 JSON 형식으로 분석해주세요.
- **각 단계(Phase)별 분석:**
  - **performanceSummary**: 제공된 정량 지표(평균 조회수, 참여율 등)를 해석하여 해당 시기의 성과를 정성적으로 요약해주세요.
  - **strategyAnalysis**: 콘텐츠 주제, 포맷 등 주요 전략을 분석해주세요.
  - **quantitativeAnalysis**: 제공된 정량 지표를 그대로 JSON 객체에 채워주세요. (제목 포함)
  - **contentStrategyAnalysis**: 제공된 정량 지표(평균 영상 길이, 업로드 주기)와 영상 샘플을 바탕으로 콘텐츠 전략(영상 길이, 업로드 주기, 제목/썸네일 전략)을 심층 분석해주세요. (제목 포함)
  - **keyVideos**: 해당 단계의 방향성을 보여주는 대표 영상 2~3개와 그 이유를 설명해주세요.

모든 내용은 한국어로 작성하고, 제공된 JSON 스키마를 반드시 준수해야 합니다.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: growthAnalysisSchema,
            }
        });

        const resultText = response.text;
        if (!resultText) {
            throw new Error('모델이 성장 분석 데이터를 생성하지 못했습니다.');
        }
        return JSON.parse(resultText) as GrowthAnalysisResult;

    } catch (error: any) {
        console.error("Gemini API 성장 분석 오류 (Raw):", error);
        const message = error?.message || 'Gemini API 호출 중 오류가 발생했습니다.';
        if (message.includes('API key not valid')) {
            throw new Error('API 키가 유효하지 않습니다. Gemini API를 사용할 수 있는 올바른 키인지 확인해주세요.');
        }
        throw new Error(`채널 성장 분석 중 오류 발생: ${message}`);
    }
}


const getPublishedAfterDate = (p: string): string | undefined => {
    if (p === 'all' || !p) return undefined;
    const now = new Date();
    if (p.endsWith('m')) {
        now.setMonth(now.getMonth() - parseInt(p));
    } else if (p.endsWith('y')) {
        now.setFullYear(now.getFullYear() - parseInt(p));
    }
    return now.toISOString();
};


export async function findRisingStarChannels(
  keyword: string,
  categoryId: string,
  period: string, // e.g., '6m', '1y' for channel creation date
  onProgress: (message: string) => void
): Promise<TargetChannel[]> {
  try {
    const channelPublishedAfter = getPublishedAfterDate(period);
    
    // To find active new channels, we search for recent popular videos.
    const videoPublishedAfter = getPublishedAfterDate(period); 

    onProgress(`'${keyword}' 관련 인기 동영상을 검색하여 채널을 분석 중입니다...`);

    // Step 1: Search for VIDEOS to find associated channels
    const videoSearchParams: any = {
      part: 'snippet',
      q: keyword,
      type: 'video',
      order: 'viewCount',
      maxResults: 50,
      publishedAfter: videoPublishedAfter,
    };
    if (categoryId) {
      videoSearchParams.videoCategoryId = categoryId;
    }

    const videoSearchResponse = await gapi.client.youtube.search.list(videoSearchParams);
    const videoItems = videoSearchResponse.result.items || [];
    
    if (videoItems.length === 0) {
      onProgress('관련 동영상을 찾을 수 없어 채널을 분석할 수 없습니다.');
      return [];
    }

    // Step 2: Collect unique channel IDs
    const channelIds = [...new Set(videoItems.map((item: any) => item.snippet.channelId))];

    onProgress(`발견된 ${channelIds.length}개 채널의 상세 정보를 가져오는 중입니다...`);

    // Step 3: Get details for all found channels
    const channelDetailsResponse = await gapi.client.youtube.channels.list({
      part: 'snippet,statistics',
      id: channelIds.join(','),
    });
    const detailedChannelItems = channelDetailsResponse.result.items || [];

    onProgress(`채널 정보를 필터링하고 분석 중입니다...`);
    
    // Step 4: Filter for new channels and map to TargetChannel
    const targetChannels: TargetChannel[] = detailedChannelItems
      .filter((channel: any) => {
        // Filter by channel creation date if a period is specified
        if (!channelPublishedAfter) {
            return true; // For 'all' period, don't filter.
        }
        const channelPublishedDate = new Date(channel.snippet.publishedAt);
        return channelPublishedDate >= new Date(channelPublishedAfter);
      })
      .map((channel: any) => {
        const subscriberCount = channel.statistics?.hiddenSubscriberCount ? -1 : parseInt(channel.statistics?.subscriberCount || '0', 10);
        const videoCount = parseInt(channel.statistics?.videoCount || '0', 10);
        
        if (subscriberCount <= 0 || videoCount < 3) {
            return null;
        }

        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnailUrl: channel.snippet.thumbnails.default.url,
          publishedAt: channel.snippet.publishedAt,
          country: channel.snippet.country,
          videoCount: videoCount,
          viewCount: parseInt(channel.statistics?.viewCount || '0', 10),
          subscriberCount: subscriberCount,
          subscriberVideoRatio: subscriberCount / videoCount,
        };
      })
      .filter((c): c is TargetChannel => c !== null);

    if (targetChannels.length === 0) {
        onProgress('해당 기간 내에 개설된 라이징 스타 채널을 찾을 수 없습니다.');
        return [];
    }
    
    onProgress('분석 완료!');
    return targetChannels.sort((a, b) => b.subscriberVideoRatio - a.subscriberVideoRatio);

  } catch (error) {
    throw createApiError(error, '라이징 스타 채널 검색');
  }
}


export async function analyzeTopicCompetition(
  keyword: string,
  categoryId: string,
  period: string,
  onProgress: (message: string) => void
): Promise<TopicAnalysisResult> {
  try {
    onProgress(`'${keyword}' 키워드로 인기 동영상을 검색 중입니다...`);
    
    const searchParams: any = {
      part: 'snippet',
      q: keyword,
      type: 'video',
      order: 'viewCount',
      maxResults: 50,
    };
    if (categoryId) {
      searchParams.videoCategoryId = categoryId;
    }
    const publishedAfter = getPublishedAfterDate(period);
    if (publishedAfter) {
      searchParams.publishedAfter = publishedAfter;
    }

    const searchResponse = await gapi.client.youtube.search.list(searchParams);
    const videoItems = searchResponse.result.items || [];

    if (videoItems.length === 0) {
      onProgress('해당 조건의 인기 동영상을 찾을 수 없습니다.');
      return { topVideos: [], uniqueChannelCount: 0, channelDistribution: new Map(), channelActivity: null };
    }

    const videoIds = videoItems.map((item: any) => item.id.videoId);
    onProgress(`상위 ${videoIds.length}개 동영상의 상세 정보를 분석 중입니다...`);
    const videosData = await getVideoDetailsAndStats(videoIds);

    const allChannelIds = [...new Set(videosData.map(v => v.channelId))];
    onProgress(`관련 채널 ${allChannelIds.length}개 정보 조회 중...`);
    
    const channelDetailsResponse = await gapi.client.youtube.channels.list({
        part: 'snippet,statistics,contentDetails',
        id: allChannelIds.join(','),
    });
    const channelDetailsItems = channelDetailsResponse.result.items || [];
    
    onProgress(`채널별 최근 활동 빈도를 분석 중입니다...`);
    const channelActivityIntervals: number[] = [];
    for (const channel of channelDetailsItems) {
        const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;
        if (!playlistId) continue;
        try {
            const playlistItemsResponse = await gapi.client.youtube.playlistItems.list({
                part: 'snippet',
                playlistId: playlistId,
                maxResults: 2,
            });
            const items = playlistItemsResponse.result.items || [];
            if (items.length === 2) {
                const date1 = new Date(items[0].snippet.publishedAt);
                const date2 = new Date(items[1].snippet.publishedAt);
                const diffMs = Math.abs(date1.getTime() - date2.getTime());
                const diffDays = diffMs / (1000 * 60 * 60 * 24);
                if (diffDays > 0.01) { // 15분 이상 차이날 때만 유효한 간격으로 인정
                    channelActivityIntervals.push(diffDays);
                }
            }
        } catch (e) {
            console.warn(`Could not fetch playlist items for channel ${channel.id}`, e);
        }
    }
    
    let channelActivity = null;
    if (channelActivityIntervals.length > 0) {
        const distribution = { daily: 0, weekly: 0, biweekly: 0, monthly: 0, infrequent: 0 };
        let totalInterval = 0;
        channelActivityIntervals.forEach(days => {
            totalInterval += days;
            if (days < 2) distribution.daily++;
            else if (days <= 8) distribution.weekly++;
            else if (days <= 15) distribution.biweekly++;
            else if (days <= 45) distribution.monthly++;
            else distribution.infrequent++;
        });
        const averageIntervalDays = totalInterval / channelActivityIntervals.length;
        channelActivity = {
            averageIntervalDays,
            distribution,
            analyzedChannelCount: channelActivityIntervals.length,
        };
    }


    const channelInfoMap = new Map<string, { country?: string; subscriberCount: number; thumbnailUrl: string }>();
    channelDetailsItems.forEach((ch: any) => {
        channelInfoMap.set(ch.id, {
            country: ch.snippet.country,
            subscriberCount: ch.statistics?.hiddenSubscriberCount ? -1 : parseInt(ch.statistics?.subscriberCount || '0', 10),
            thumbnailUrl: ch.snippet.thumbnails.default.url,
        });
    });

    if (videosData.length === 0) {
      onProgress('조건에 맞는 동영상이 없습니다.');
      return { topVideos: [], uniqueChannelCount: 0, channelDistribution: new Map(), channelActivity: null };
    }

    onProgress('인기 점수를 계산 중입니다...');
    const maxValues = videosData.reduce(
      (max, video) => ({
        viewCount: Math.max(max.viewCount, video.viewCount),
        likeCount: Math.max(max.likeCount, video.likeCount),
        commentCount: Math.max(max.commentCount, video.commentCount),
      }),
      { viewCount: 1, likeCount: 1, commentCount: 1 }
    );

    const topVideos = videosData.map((video) => {
      const normalizedViews = video.viewCount / maxValues.viewCount;
      const normalizedLikes = video.likeCount / maxValues.likeCount;
      const normalizedComments = video.commentCount / maxValues.commentCount;
      const popularityScore = (normalizedViews * 0.6 + normalizedLikes * 0.3 + normalizedComments * 0.1) * 100;
      
      return { 
          ...video, 
          popularityScore,
          country: channelInfoMap.get(video.channelId)?.country
        };
    }).sort((a, b) => b.popularityScore - a.popularityScore);

    const channelDistribution = new Map<string, TopicChannelInfo>();
    for (const video of topVideos) {
        if (channelDistribution.has(video.channelId)) {
            channelDistribution.get(video.channelId)!.videoCountInTop50++;
        } else {
            const info = channelInfoMap.get(video.channelId);
            channelDistribution.set(video.channelId, {
                videoCountInTop50: 1,
                title: video.channelTitle,
                subscriberCount: info?.subscriberCount || 0,
                thumbnailUrl: info?.thumbnailUrl || '',
                country: info?.country,
            });
        }
    }

    onProgress('분석 완료!');
    return {
      topVideos,
      uniqueChannelCount: channelDistribution.size,
      channelDistribution,
      channelActivity,
    };

  } catch (error) {
    throw createApiError(error, '빈집 토픽 분석');
  }
}

const topicInsightSchema = {
    type: Type.OBJECT,
    properties: {
        hashtagAnalysis: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "해시태그 자체에 대한 분석 제목 (예: '해시태그 분석: '#플레이리스트'의 본질')" },
                summary: { type: Type.STRING, description: "해시태그의 본질, 콘텐츠 스타일, 진입 장벽 등에 대한 정성적 분석 요약" }
            },
            required: ['title', 'summary']
        },
        marketAnalysis: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "데이터 기반 시장 분석 제목 (예: '시장 데이터 분석: 경쟁 강도 및 기회')" },
                summary: { type: Type.STRING, description: "조회수, 발행 빈도, 채널 집중도 데이터에 대한 심층 분석 요약" }
            },
            required: ['title', 'summary']
        },
        finalVerdict: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "최종 결론 제목 (예: '최종 결론: 신규 크리에이터를 위한 전략')" },
                verdict: { type: Type.STRING, description: "해당 토픽에 대한 최종 판단. '블루오션' 또는 '레드오션' 중 하나여야 합니다." },
                reason: { type: Type.STRING, description: "왜 그렇게 판단했는지에 대한 핵심적인 이유 요약" },
                strategyTitle: { type: Type.STRING, description: "성공 전략 섹션의 제목 (예: '차별화를 위한 추천 전략')" },
                strategy: {
                    type: Type.ARRAY,
                    description: "신규 크리에이터가 성공적으로 진입하기 위한 구체적인 차별화 전략을 담은 목록",
                    items: { type: Type.STRING }
                }
            },
            required: ['title', 'verdict', 'reason', 'strategyTitle', 'strategy']
        }
    },
    required: ['hashtagAnalysis', 'marketAnalysis', 'finalVerdict']
};

export async function generateTopicInsight(
    keyword: string,
    analysisResult: TopicAnalysisResult,
    viewStats: { totalViews: number; averageViews: number; medianViews: number }
): Promise<TopicInsightResult> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않아 토픽 인사이트 분석을 사용할 수 없습니다.');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const { topVideos, uniqueChannelCount, channelActivity } = analysisResult;

        let activityPrompt = "상위 채널들의 최근 활동 빈도를 분석할 수 없습니다.";
        if (channelActivity && channelActivity.analyzedChannelCount > 0) {
            activityPrompt = `
- 분석된 채널 수: ${channelActivity.analyzedChannelCount}개
- 평균 업로드 주기: ${channelActivity.averageIntervalDays.toFixed(1)}일
- 주기별 채널 분포:
    - 매일 (2일 내): ${channelActivity.distribution.daily}개 채널
    - 주간 (2-8일): ${channelActivity.distribution.weekly}개 채널
    - 격주 (8-15일): ${channelActivity.distribution.biweekly}개 채널
    - 월간 (15-45일): ${channelActivity.distribution.monthly}개 채널
    - 비정기 (45일 이상): ${channelActivity.distribution.infrequent}개 채널
`;
        }


        const prompt = `
당신은 최고의 유튜브 시장 분석가입니다. 사용자가 입력한 '${keyword}'라는 해시태그에 대해, 먼저 해시태그 자체의 본질적인 특성을 분석하고, 그 다음 제공된 시장 데이터를 분석하여, 두 가지를 종합한 최종 결론을 내려주세요. 당신의 분석은 반드시 구체적이어야 하며, 제공된 데이터를 직접적으로 인용하여 근거를 제시해야 합니다.

**분석 과정:**
1.  **해시태그 자체 분석:** '${keyword}'라는 주제가 유튜브 생태계에서 일반적으로 어떤 특성을 갖는지 정성적으로 분석합니다.
2.  **시장 데이터 분석:** 제공된 정량적 데이터를 심층적으로 분석합니다.
3.  **최종 결론 도출:** 위 두 분석을 종합하여, 신규 크리에이터에게 이 시장이 기회인지(블루오션), 위기인지(레드오션) 명확히 결론 내리고, 성공 전략을 제시합니다.

**제공된 시장 데이터:**
1.  **조회수 지표:**
    *   상위 영상 총 조회수: ${viewStats.totalViews.toLocaleString('ko-KR')}
    *   영상 당 평균 조회수: ${Math.round(viewStats.averageViews).toLocaleString('ko-KR')}
    *   영상 당 중간값 조회수: ${Math.round(viewStats.medianViews).toLocaleString('ko-KR')}
2.  **채널 집중도:**
    *   상위 ${topVideos.length}개 영상에 등장하는 고유 채널 수: ${uniqueChannelCount}개
3.  **채널 활성도 (상위 채널들의 최근 업로드 주기 분석):**
    ${activityPrompt}

**요청 사항 (매우 중요):**
제공된 JSON 스키마에 따라 분석 결과를 한국어로 작성해주세요. 각 항목은 다음 지침을 반드시 따라야 합니다.

- **hashtagAnalysis:** '${keyword}' 해시태그의 본질적 특성을 분석해주세요. '진입 장벽이 낮다'와 같이 단순하게 결론 내리지 말고, '영상 편집 기술이 거의 필요 없어 진입 장벽이 낮다'처럼 **'왜'** 그런지에 대한 구체적인 이유를 제시해야 합니다.
- **marketAnalysis:** 제공된 **데이터를 직접적으로 인용**하여 현재 시장을 분석해주세요. 예를 들어, "평균 조회수(${Math.round(viewStats.averageViews).toLocaleString('ko-KR')})에 비해 중간값 조회수(${Math.round(viewStats.medianViews).toLocaleString('ko-KR')})가 현저히 낮은 것은, 소수의 바이럴 영상이 전체 조회수를 견인하고 있음을 시사합니다." 와 같이 분석의 근거를 명확히 밝혀야 합니다. **채널 활성도** 분석 시, 상위 채널들의 '현재' 활동성을 기반으로 시장의 경쟁 속도를 평가해야 합니다.
- **finalVerdict:**
    1.  위 두 분석을 종합하여 최종 결론을 내려주세요.
    2.  'verdict' 필드에는 반드시 '블루오션' 또는 '레드오션' 중 하나만 명시해야 합니다.
    3.  'reason' 필드에는 왜 그렇게 판단했는지에 대한 핵심적인 이유를 요약해주세요.
    4.  'strategy' 필드에는 신규 크리에이터가 성공적으로 진입하기 위한 구체적인 차별화 전략을 액션 아이템 목록(배열)으로 제시해주세요.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: topicInsightSchema,
            }
        });

        const resultText = response.text;
        if (!resultText) {
            throw new Error('모델이 토픽 인사이트를 생성하지 못했습니다.');
        }
        return JSON.parse(resultText) as TopicInsightResult;

    } catch (error: any) {
        console.error("Gemini API 토픽 인사이트 생성 오류 (Raw):", error);
        const message = error?.message || 'Gemini API 호출 중 오류가 발생했습니다.';
        if (message.includes('API key not valid')) {
            throw new Error('API 키가 유효하지 않습니다. Gemini API를 사용할 수 있는 올바른 키인지 확인해주세요.');
        }
        throw new Error(`토픽 인사이트 분석 중 오류 발생: ${message}`);
    }
}


const consultingSchema = {
    type: Type.OBJECT,
    properties: {
        overallDiagnosis: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "채널 종합 진단에 대한 제목" },
                summary: { type: Type.STRING, description: "채널의 현재 상태, 강점, 약점에 대한 종합적인 요약" }
            },
            required: ['title', 'summary']
        },
        detailedAnalysis: {
            type: Type.ARRAY,
            description: "영역별 상세 분석 및 솔루션",
            items: {
                type: Type.OBJECT,
                properties: {
                    area: { type: Type.STRING, description: "분석 영역 (예: '콘텐츠 전략', '시청자 참여', '브랜딩 및 정체성')" },
                    problem: { type: Type.STRING, description: "해당 영역에서 발견된 구체적인 문제점 또는 개선점" },
                    solution: { type: Type.STRING, description: "문제점에 대한 구체적이고 실행 가능한 해결 방안" }
                },
                required: ['area', 'problem', 'solution']
            }
        },
        actionPlan: {
            type: Type.OBJECT,
            description: "성장을 위한 단기/장기 실행 계획",
            properties: {
                shortTerm: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "단기 실행 계획의 제목" },
                        period: { type: Type.STRING, description: "단기 계획의 기간 (예: '1-3개월')" },
                        steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "구체적인 실행 항목 목록" }
                    },
                    required: ['title', 'period', 'steps']
                },
                longTerm: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "장기 실행 계획의 제목" },
                        period: { type: Type.STRING, description: "장기 계획의 기간 (예: '6-12개월')" },
                        steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "구체적인 실행 항목 목록" }
                    },
                    required: ['title', 'period', 'steps']
                }
            },
            required: ['shortTerm', 'longTerm']
        }
    },
    required: ['overallDiagnosis', 'detailedAnalysis', 'actionPlan']
};

export async function generateChannelConsulting(channel: YouTubeChannel, videos: AnalyzedVideo[]): Promise<ConsultingResult> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않아 컨설팅 기능을 사용할 수 없습니다.');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const videoDataForPrompt = videos.slice(0, 20).map(v => ({
            title: v.title,
            views: v.viewCount,
            likes: v.likeCount,
            comments: v.commentCount,
            type: v.videoType,
            duration: v.duration,
        }));
        
        const channelStats = calculateExtraChannelStats(videos);

        const prompt = `
당신은 최고의 유튜브 채널 컨설턴트입니다. 다음은 '${channel.title}' 채널의 데이터입니다. 이 채널의 **소유자 입장**에서 채널의 현 상황을 냉철하게 진단하고, 성장을 위한 구체적이고 실행 가능한 솔루션을 제안해주세요.

**분석 대상 채널 정보:**
- 채널명: ${channel.title}
- 채널 설명: ${channel.description}
- 채널 개설일: ${channel.publishedAt}
- 총 영상 수: ${channel.videoCount}
- 평균 업로드 주기(전체): ${channelStats.averageUploadIntervalAll}
- 평균 업로드 주기(최근): ${channelStats.averageUploadIntervalRecent}
- 인기 영상 데이터 (상위 20개 샘플):
${JSON.stringify(videoDataForPrompt, null, 2)}

**요청 사항:**
위 데이터를 바탕으로, 채널의 문제점을 진단하고 성장 솔루션을 JSON 형식으로 제안해주세요. 응답은 반드시 제공된 JSON 스키마를 준수해야 합니다.
- **overallDiagnosis**: 채널의 현주소를 요약하고, 핵심 강점과 약점을 명확히 진단해주세요.
- **detailedAnalysis**: '콘텐츠 전략', '시청자 참여', '브랜딩 및 정체성', '수익화' 4가지 영역으로 나누어, 각 영역의 문제점과 해결책을 상세히 분석해주세요.
- **actionPlan**: 위 분석을 바탕으로, 즉시 실행할 수 있는 단기(1-3개월) 및 장기(6-12개월) 실행 계획(Action Plan)을 구체적인 단계별로 제시해주세요.

모든 내용은 한국어로, 채널 소유자에게 직접 조언하는 듯한 전문적이고 친근한 어투로 작성해주세요.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: consultingSchema,
            }
        });

        const resultText = response.text;
        if (!resultText) {
            throw new Error('모델이 컨설팅 리포트를 생성하지 못했습니다.');
        }
        return JSON.parse(resultText) as ConsultingResult;

    } catch (error: any) {
        console.error("Gemini API 채널 컨설팅 오류 (Raw):", error);
        const message = error?.message || 'Gemini API 호출 중 오류가 발생했습니다.';
        if (message.includes('API key not valid')) {
            throw new Error('API 키가 유효하지 않습니다. Gemini API를 사용할 수 있는 올바른 키인지 확인해주세요.');
        }
        throw new Error(`채널 컨설팅 중 오류 발생: ${message}`);
    }
}