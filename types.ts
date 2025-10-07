export type SubjectName = 'Physics' | 'Chemistry' | 'Botany' | 'Zoology';
export type TaskType = 'Study' | 'Revision' | 'Practice';
export type TaskStatus = 'Pending' | 'Completed';
export type Theme = 'light' | 'dark';
export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  name: string;
  subject: SubjectName;
  chapter: string;
  microtopics: string[];
  taskType: TaskType;
  date: string; // YYYY-MM-DD
  status: TaskStatus;
  priority: Priority;
  difficulty?: number; // 1-5
  totalQuestions?: number;
  correctAnswers?: number;
  notes?: string;
  originalDate?: string;
}

export type Syllabus = {
  [key in SubjectName]: {
    [chapter: string]: string[];
  };
};

export interface MicrotopicStats {
  total: number;
  completed: number;
  completionRate: number;
  avgDifficulty: number;
  avgAccuracy: number | null;
  difficulties: number[];
  accuracies: number[];
}

export interface ChapterStats {
  total: number;
  completed: number;
  completionRate: number;
  avgDifficulty: number;
  avgAccuracy: number | null;
  difficulties: number[];
  accuracies: number[];
  microtopics: {
    [microtopic: string]: MicrotopicStats;
  };
}

export interface SubjectStats {
  total: number;
  completed: number;
  completionRate: number;
  avgDifficulty: number;
  avgAccuracy: number | null;
  difficulties: number[];
  accuracies: number[];
  chapters: {
    [chapter: string]: ChapterStats;
  };
}

export interface ProgressStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  subjects: {
    [key in SubjectName]: SubjectStats;
  };
}

// Test Planner Types
export interface TestPlanAnalysis {
  score?: number; // Kept for backward compatibility if needed, but replaced by marksObtained
  notes: string;
  totalMarks?: number;
  marksObtained?: number;
  rank?: number;
  percentile?: number;
}

export interface TopicPracticeAttempt {
  id: string;
  totalQuestions: number;
  correctAnswers: number;
}

export interface TopicStatus {
  subject: SubjectName;
  chapter: string;
  microtopic: string;
  revisionDifficulty?: number; // 1-5, logged for this specific test
  practiceAttempts: TopicPracticeAttempt[];
}


export interface TestPlan {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  syllabus: {
    [key in SubjectName]?: string[]; // Chapters per subject
  };
  topicStatus: TopicStatus[];
  status: 'Upcoming' | 'Completed';
  analysis?: TestPlanAnalysis;
}

export interface AnalyzedTopic {
  subject: SubjectName;
  chapter: string;
  microtopic: string;
  avgDifficulty: number;
  avgAccuracy: number | null;
  tasksCompleted: number;
  overallScore: number;
}