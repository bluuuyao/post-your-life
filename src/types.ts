export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  multiSelect?: boolean;
}

export interface QuizAnswers {
  [key: string]: string | string[];
}

export interface NicheResult {
  platform: string;
  nicheType: string;
  reasoning: string;
  trendingTopics: {
    title: string;
    description: string;
    url?: string;
  }[];
  styleGuide: string;
}

export interface GeneratedPost {
  title: string;
  content: string;
  tags: string[];
  layoutType: 'editorial' | 'minimal' | 'vibrant';
}
