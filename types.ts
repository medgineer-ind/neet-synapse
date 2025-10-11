

// Fix: Removed self-import of `SubjectName` and `TaskType` which conflicted with local declarations.
export type SubjectName = 'Physics' | 'Chemistry' | 'Botany' | 'Zoology';
export type TaskType = 'Lecture' | 'Revision' | 'Practice' | 'SpacedRevision';
export type TaskStatus = 'Pending' | 'Completed';
export type Theme = 'light' | 'dark';
export type Priority = 'Low' | 'Medium' | 'High';

export interface StudySession {
  date: string; // ISO string
  duration: number; // in seconds
}

export interface RevisionAttempt {
  revisionDay: number;
  date: string; // ISO string
  duration: number; // in seconds
  difficulty: number; // 1-5
}


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
  incorrectAnswers?: number;
  notes?: string;
  originalDate?: string;
  sessions: StudySession[];
  sourceLectureTaskId?: string;
  revisionDay?: number; // 3, 5, 7, 15, 30
  revisionHistory?: RevisionAttempt[];
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
  totalTime: number;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
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
  totalTime: number;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
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
  totalTime: number;
  timeByCategory: {
    [key in TaskType]: number;
  };
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
}

export interface ProgressStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  subjects: {
    [key in SubjectName]: SubjectStats;
  };
  totalTimeStudied: number;
  timeByCategory: {
    [key in TaskType]: number;
  };
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
}

// Test Planner Types
export interface SubjectTestPerformance {
  totalQuestions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
}

export interface TestPlanAnalysis {
  score?: number; // Kept for backward compatibility if needed, but replaced by marksObtained
  notes: string;
  totalMarks?: number; // This will now be total *possible* marks
  marksObtained?: number; // This will be the calculated score
  rank?: number;
  percentile?: number;
  totalPrepTime?: number; // in seconds
  prepTimeByCategory?: {
    Revision: number;
    Practice: number;
  };
  prepTimeBySubject?: {
    [key in SubjectName]?: {
      Revision: number;
      Practice: number;
    };
  };
  testDuration?: number; // in seconds
  subjectWisePerformance?: {
    [key in SubjectName]?: SubjectTestPerformance;
  };
  progressSnapshot?: ProgressStats;
  predictedScore?: number;
}


export interface TopicPracticeAttempt {
  id: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  duration: number; // in seconds
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
  totalQuestions?: number;
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

// Timer type
export interface ActiveTimer {
    task?: Task;
    test?: TestPlan;
    startTime: number;
    elapsedTime: number; // Time in ms, accumulated during pauses
    isPaused: boolean;
}
