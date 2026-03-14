export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  uploadsPlaylistId: string;
  videoCount: number;
  publishedAt: string;
  subscriberCount: number;
  viewCount: number;
}

export interface VideoStatistics {
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface VideoDetails {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  tags: string[]; // These are keywords
  hashtags: string[]; // These are from the description
  duration: number; // Duration in seconds
  videoType: 'short' | 'regular';
  channelId: string;
  channelTitle: string;
}

export interface AnalyzedVideo extends VideoDetails, VideoStatistics {
  popularityScore: number;
  country?: string;
}

export interface StrategyResult {
  coreConcept: {
    title: string;
    description: string;
  };
  detailedPlan: {
    contentDirection: {
      title: string;
      details: string;
    };
    uploadSchedule: {
      title: string;
      details: string;
    };
    communityEngagement: {
      title: string;
      details: string;
    };
    keywordStrategy: {
      title: string;
      details: string;
    };
  };
  initialStrategy: {
    title: string;
    phases: Array<{
      phaseTitle: string;
      focus: string;
      actionItems: string[];
    }>;
  };
  suggestedTitles: {
    title: string;
    titles: string[];
  };
  // New detailed strategy sections
  kpiSettings: {
    title: string;
    kpis: Array<{
      kpiTitle: string;
      description: string;
    }>;
  };
  riskManagement: {
    title: string;
    risks: Array<{
      riskTitle: string;
      strategy: string;
    }>;
  };
  revenueModel: {
    title: string;
    streams: Array<{
      revenueTitle: string;
      description: string;
    }>;
  };
}

export interface ChannelExtraStats {
  firstVideoDate: string;
  averageUploadIntervalAll: string;
  averageUploadIntervalRecent: string;
}

export interface GrowthPhase {
  phaseTitle: string;
  period: string;
  performanceSummary: string;
  strategyAnalysis: string;
  keyVideos: Array<{
    title: string;
    reason: string;
  }>;
  quantitativeAnalysis: {
    title: string;
    avgViews: string;
    likeViewRatio: string;
    commentViewRatio: string;
  };
  contentStrategyAnalysis: {
    title: string;
    avgVideoDuration: string;
    uploadFrequency: string;
    titleThumbnailStrategy: string;
  };
}

export interface GrowthAnalysisResult {
  title: string;
  overallSummary: string;
  phases: GrowthPhase[];
}

export interface TargetChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  videoCount: number;
  subscriberCount: number;
  viewCount: number;
  subscriberVideoRatio: number;
  country?: string;
}

export interface TopicChannelInfo {
  videoCountInTop50: number;
  title: string;
  subscriberCount: number;
  thumbnailUrl: string;
  country?: string;
}

export interface TopicAnalysisResult {
  topVideos: AnalyzedVideo[];
  uniqueChannelCount: number;
  channelDistribution: Map<string, TopicChannelInfo>;
  channelActivity: {
    averageIntervalDays: number;
    distribution: Record<string, number>;
    analyzedChannelCount: number;
  } | null;
}

export interface TopicInsightResult {
  hashtagAnalysis: {
    title: string;
    summary: string;
  };
  marketAnalysis: {
    title: string;
    summary: string;
  };
  finalVerdict: {
    title: string;
    verdict: string;
    reason: string;
    strategyTitle: string;
    strategy: string[];
  };
}

export interface ConsultingResult {
  overallDiagnosis: {
    title: string;
    summary: string;
  };
  detailedAnalysis: Array<{
    area: string;
    problem: string;
    solution: string;
  }>;
  actionPlan: {
    shortTerm: {
      title: string;
      period: string;
      steps: string[];
    };
    longTerm: {
      title: string;
      period: string;
      steps: string[];
    };
  };
}