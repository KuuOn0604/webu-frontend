export type LearningMode = 'long_term' | 'deadline';
export type ReviewRating = 'easy' | 'good' | 'hard';

export interface OnboardingSetupPayload {
  learning_mode: LearningMode;
  onboarding_survey: Record<string, unknown>;
  deadline_date?: string;
}

export interface SetupResponse {
  status: string;
  message: string;
  updated_at: string;
}

export interface DailyTask {
  card_id: string;
  title: string;
  next_review_date: string;
}

export interface ReviewPayload {
  rating: ReviewRating;
}

export interface SubmissionHistoryRecord {
  date: string;
  count: number;
}

export interface UserStatsResponse {
  total_cards_mastered: number;
  average_retention_rate: number;
  submission_history: SubmissionHistoryRecord[];
}
