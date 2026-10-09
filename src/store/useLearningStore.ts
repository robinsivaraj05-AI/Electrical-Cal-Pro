import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LearningState {
  bookmarkedTopics: string[];
  completedTopics: string[];
  recentlyViewed: string[];
  quizScores: Record<string, number>;
  readingProgress: Record<string, number>;

  toggleBookmark: (topicId: string) => void;
  markCompleted: (topicId: string) => void;
  addRecentlyViewed: (topicId: string) => void;
  setQuizScore: (topicId: string, score: number) => void;
  setReadingProgress: (topicId: string, progress: number) => void;
  isBookmarked: (topicId: string) => boolean;
  isCompleted: (topicId: string) => boolean;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      bookmarkedTopics: [],
      completedTopics: [],
      recentlyViewed: [],
      quizScores: {},
      readingProgress: {},

      toggleBookmark: (topicId) =>
        set((s) => ({
          bookmarkedTopics: s.bookmarkedTopics.includes(topicId)
            ? s.bookmarkedTopics.filter((id) => id !== topicId)
            : [...s.bookmarkedTopics, topicId],
        })),

      markCompleted: (topicId) =>
        set((s) => ({
          completedTopics: s.completedTopics.includes(topicId)
            ? s.completedTopics
            : [...s.completedTopics, topicId],
        })),

      addRecentlyViewed: (topicId) =>
        set((s) => ({
          recentlyViewed: [topicId, ...s.recentlyViewed.filter((id) => id !== topicId)].slice(0, 10),
        })),

      setQuizScore: (topicId, score) =>
        set((s) => ({ quizScores: { ...s.quizScores, [topicId]: score } })),

      setReadingProgress: (topicId, progress) =>
        set((s) => ({ readingProgress: { ...s.readingProgress, [topicId]: progress } })),

      isBookmarked: (topicId) => get().bookmarkedTopics.includes(topicId),
      isCompleted: (topicId) => get().completedTopics.includes(topicId),
    }),
    { name: 'eleccalc-learning' }
  )
);
