
import { Task, ProgressStats, SubjectName, ChapterStats, MicrotopicStats, SubjectStats, TestPlan, AnalyzedTopic, TaskType } from "../types";
import { syllabus } from "../data/syllabus";

export function cn(...inputs: (string | undefined | null | false)[]): string {
    return inputs.filter(Boolean).join(' ');
}

export function formatDuration(seconds: number): string {
    if (seconds < 1) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);

    return parts.join(' ');
}

export function formatDurationForInput(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
}

export function parseDurationFromInput(timeString: string): number {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
        const [h, m, s] = parts;
        return h * 3600 + m * 60 + s;
    }
    return 0; // Return 0 if format is invalid
}

// Helper to get the start of the week (Monday)
function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
}

export function calculateStudyTimeStats(tasks: Task[]): {
    daily: { date: string; totalTime: number }[];
    weekly: { week: string; totalTime: number }[];
    monthly: { month: string; totalTime: number }[];
} {
    const dailyTotals: { [date: string]: number } = {};

    tasks.forEach(task => {
        if (task.sessions) {
            task.sessions.forEach(session => {
                const dateStr = session.date.split('T')[0];
                if (!dailyTotals[dateStr]) {
                    dailyTotals[dateStr] = 0;
                }
                dailyTotals[dateStr] += session.duration;
            });
        }
    });

    const sortedDaily = Object.entries(dailyTotals)
        .map(([date, totalTime]) => ({ date, totalTime }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const weeklyTotals: { [week: string]: number } = {};
    sortedDaily.forEach(({ date, totalTime }) => {
        const d = new Date(new Date(date).toLocaleString("en-US", { timeZone: "UTC" }));
        const weekStart = getStartOfWeek(d);
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weeklyTotals[weekKey]) {
            weeklyTotals[weekKey] = 0;
        }
        weeklyTotals[weekKey] += totalTime;
    });

    const sortedWeekly = Object.entries(weeklyTotals)
        .map(([week, totalTime]) => ({ week, totalTime }))
        .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());

    const monthlyTotals: { [month: string]: number } = {};
    sortedDaily.forEach(({ date, totalTime }) => {
        const monthKey = date.substring(0, 7) + '-01'; // YYYY-MM-01
        if (!monthlyTotals[monthKey]) {
            monthlyTotals[monthKey] = 0;
        }
        monthlyTotals[monthKey] += totalTime;
    });

    const sortedMonthly = Object.entries(monthlyTotals)
        .map(([month, totalTime]) => ({ month, totalTime }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    return {
        daily: sortedDaily,
        weekly: sortedWeekly,
        monthly: sortedMonthly,
    };
}


// Helper function to create an empty stats object
const createEmptyStats = () => ({
  total: 0,
  completed: 0,
  completionRate: 0,
  avgDifficulty: 0,
  avgAccuracy: null,
  difficulties: [],
  accuracies: [],
  totalTime: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  totalSkipped: 0,
});

const emptyTimeByCategory = { Lecture: 0, Revision: 0, Practice: 0, SpacedRevision: 0, Notes: 0 };

export function calculateProgress(tasks: Task[]): ProgressStats {
  // Initialize the stats object with the full syllabus structure
  const initialSubjects: { [key in SubjectName]: SubjectStats } = {
    Physics: { ...createEmptyStats(), chapters: {}, timeByCategory: { ...emptyTimeByCategory } },
    Chemistry: { ...createEmptyStats(), chapters: {}, timeByCategory: { ...emptyTimeByCategory } },
    Botany: { ...createEmptyStats(), chapters: {}, timeByCategory: { ...emptyTimeByCategory } },
    Zoology: { ...createEmptyStats(), chapters: {}, timeByCategory: { ...emptyTimeByCategory } },
  };

  const stats: ProgressStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'Completed').length,
    completionRate: 0,
    subjects: initialSubjects,
    totalTimeStudied: 0,
    timeByCategory: { ...emptyTimeByCategory },
    totalQuestions: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    totalSkipped: 0,
  };

  // Populate the structure based on the syllabus
  (Object.keys(syllabus) as SubjectName[]).forEach(subjectName => {
    stats.subjects[subjectName].chapters = Object.keys(syllabus[subjectName]).reduce((acc, chapterName) => {
      acc[chapterName] = {
        ...createEmptyStats(),
        microtopics: syllabus[subjectName][chapterName].reduce((mAcc, microtopicName) => {
          mAcc[microtopicName] = createEmptyStats() as MicrotopicStats;
          return mAcc;
        }, {} as { [key: string]: MicrotopicStats })
      };
      return acc;
    }, {} as { [key: string]: ChapterStats });
  });

  // Aggregate data from tasks
  tasks.forEach(task => {
    // Handle legacy tasks that might not have the microtopics array
    if (!task.microtopics || task.microtopics.length === 0) return;

    const subject = stats.subjects[task.subject];
    const chapter = subject?.chapters[task.chapter];
    if (!subject || !chapter) return;

    // Increment subject and chapter totals ONCE per task
    subject.total++;
    chapter.total++;

    if (task.status === 'Completed') {
        subject.completed++;
        chapter.completed++;

        const totalDuration = (task.sessions || []).reduce((sum, s) => sum + s.duration, 0);
        
        stats.timeByCategory[task.taskType] += totalDuration;
        subject.timeByCategory[task.taskType] += totalDuration;

        subject.totalTime += totalDuration;
        chapter.totalTime += totalDuration;

        if (task.difficulty) {
            subject.difficulties.push(task.difficulty);
            chapter.difficulties.push(task.difficulty);
        }
        if (task.totalQuestions !== undefined && task.correctAnswers !== undefined && task.totalQuestions > 0) {
            const accuracy = (task.correctAnswers / task.totalQuestions) * 100;
            subject.accuracies.push(accuracy);
            chapter.accuracies.push(accuracy);
        }
        
        if (task.taskType === 'Practice' && task.totalQuestions !== undefined && task.correctAnswers !== undefined) {
            const totalQ = task.totalQuestions;
            const correctA = task.correctAnswers;
            const incorrectA = task.incorrectAnswers || 0;
            const skippedA = totalQ - (correctA + incorrectA);

            // Aggregate at global, subject, and chapter level
            stats.totalQuestions += totalQ;
            stats.totalCorrect += correctA;
            subject.totalQuestions += totalQ;
            subject.totalCorrect += correctA;
            chapter.totalQuestions += totalQ;
            chapter.totalCorrect += correctA;

            if (incorrectA > 0) {
                stats.totalIncorrect += incorrectA;
                subject.totalIncorrect += incorrectA;
                chapter.totalIncorrect += incorrectA;
            }

            if (skippedA > 0) {
                stats.totalSkipped += skippedA;
                subject.totalSkipped += skippedA;
                chapter.totalSkipped += skippedA;
            }
        }
    }

    // Iterate over each microtopic in the task
    task.microtopics.forEach(microtopicName => {
        const microtopic = chapter.microtopics[microtopicName];
        if (!microtopic) return;

        // Increment microtopic total for each one associated with the task
        microtopic.total++;

        if (task.status === 'Completed') {
            microtopic.completed++;
            const totalDuration = (task.sessions || []).reduce((sum, s) => sum + s.duration, 0);
            // Distribute duration among microtopics
            const durationPerMicrotopic = task.microtopics.length > 0 ? totalDuration / task.microtopics.length : 0;
            microtopic.totalTime += durationPerMicrotopic;
            
            if (task.difficulty) {
                microtopic.difficulties.push(task.difficulty);
            }
            if (task.totalQuestions !== undefined && task.correctAnswers !== undefined && task.totalQuestions >= 0) { // Allow 0 correct answers
                const accuracy = task.totalQuestions > 0 ? (task.correctAnswers / task.totalQuestions) * 100 : 0;
                microtopic.accuracies.push(accuracy);
            }

            if (task.taskType === 'Practice' && task.totalQuestions !== undefined && task.correctAnswers !== undefined) {
                const totalQ = task.totalQuestions;
                const correctA = task.correctAnswers;
                const incorrectA = task.incorrectAnswers || 0;
                const skippedA = totalQ - (correctA + incorrectA);

                const ratio = task.microtopics.length > 0 ? 1 / task.microtopics.length : 0;
                microtopic.totalQuestions += totalQ * ratio;
                microtopic.totalCorrect += correctA * ratio;

                if (incorrectA > 0) {
                    microtopic.totalIncorrect += incorrectA * ratio;
                }
                if (skippedA > 0) {
                    microtopic.totalSkipped += skippedA * ratio;
                }
            }
        }
    });
  });

  // Calculate percentages and averages
  if (stats.totalTasks > 0) {
    stats.completionRate = (stats.completedTasks / stats.totalTasks) * 100;
  }
  
  (Object.values(stats.subjects) as SubjectStats[]).forEach(subject => {
    // Process chapters
    Object.values(subject.chapters).forEach(chapter => {
      // Process microtopics
      Object.values(chapter.microtopics).forEach(microtopic => {
        if (microtopic.total > 0) {
          microtopic.completionRate = (microtopic.completed / microtopic.total) * 100;
        }
        if (microtopic.difficulties.length > 0) {
          microtopic.avgDifficulty = microtopic.difficulties.reduce((a, b) => a + b, 0) / microtopic.difficulties.length;
        }
        if (microtopic.accuracies.length > 0) {
          microtopic.avgAccuracy = microtopic.accuracies.reduce((a, b) => a + b, 0) / microtopic.accuracies.length;
        } else {
          microtopic.avgAccuracy = null;
        }
      });

      if (chapter.total > 0) {
        chapter.completionRate = (chapter.completed / chapter.total) * 100;
      }
      if (chapter.difficulties.length > 0) {
        chapter.avgDifficulty = chapter.difficulties.reduce((a, b) => a + b, 0) / chapter.difficulties.length;
      }
      if (chapter.accuracies.length > 0) {
        chapter.avgAccuracy = chapter.accuracies.reduce((a, b) => a + b, 0) / chapter.accuracies.length;
      } else {
        chapter.avgAccuracy = null;
      }
    });

    if (subject.total > 0) {
      subject.completionRate = (subject.completed / subject.total) * 100;
    }
    if (subject.difficulties.length > 0) {
      subject.avgDifficulty = subject.difficulties.reduce((a, b) => a + b, 0) / subject.difficulties.length;
    }
    if (subject.accuracies.length > 0) {
      subject.avgAccuracy = subject.accuracies.reduce((a, b) => a + b, 0) / subject.accuracies.length;
    } else {
      subject.avgAccuracy = null;
    }
  });

  stats.totalTimeStudied = Object.values(stats.subjects).reduce((acc, subject) => acc + subject.totalTime, 0);

  return stats;
}

export function calculateOverallScore(avgDifficulty: number, avgAccuracy: number | null): number {
    const hasDifficulty = avgDifficulty > 0;
    const hasAccuracy = avgAccuracy !== null;

    if (hasDifficulty && hasAccuracy) {
        // Normalize difficulty: 1 (easy) -> 100, 5 (hard) -> 0
        const normalizedDifficultyScore = ((5 - avgDifficulty) / 4) * 100;
        return (normalizedDifficultyScore * 0.35) + (avgAccuracy * 0.65);
    } else if (hasDifficulty) {
        // If only difficulty exists, it contributes 100%
        return ((5 - avgDifficulty) / 4) * 100;
    } else if (hasAccuracy) {
        // If only accuracy exists, it contributes 100%
        return avgAccuracy;
    }
    return 0; // No data to score
}

export function generatePerformanceSummary(
    difficulty: number | undefined,
    totalQuestions: number | undefined,
    correctAnswers: number | undefined,
    duration?: number,
    incorrectAnswers?: number
): string {
    const accuracy =
        totalQuestions !== undefined &&
        correctAnswers !== undefined &&
        totalQuestions > 0
            ? (correctAnswers / totalQuestions) * 100
            : undefined;

    const score = calculateOverallScore(difficulty || 0, accuracy !== undefined ? accuracy : null);

    const accuracyString = accuracy !== undefined ? `${accuracy.toFixed(1)}% (${correctAnswers}/${totalQuestions})` : 'N/A';

    const summaryParts = ["\n\n--- Performance Metrics ---"];
    if (duration !== undefined && duration > 0) {
        summaryParts.push(`Total Time Spent: ${formatDuration(duration)}`);
    }
    summaryParts.push(`Difficulty: ${difficulty ? `${difficulty}/5` : 'N/A'}`);
    summaryParts.push(`Accuracy: ${accuracyString}`);
    
    const incorrectCount = incorrectAnswers || 0;
    const skippedCount = (totalQuestions !== undefined && correctAnswers !== undefined)
        ? totalQuestions - (correctAnswers + incorrectCount)
        : 0;

    if (incorrectCount > 0) {
        summaryParts.push(`Incorrect Answers: ${incorrectCount}`);
    }
    if (skippedCount > 0) {
        summaryParts.push(`Skipped Answers: ${skippedCount}`);
    }
    
    summaryParts.push(`Weighted Score: ${score.toFixed(0)}/100`);

    return summaryParts.join("\n");
}


export function analyzeSyllabusForTest(
  testSyllabus: TestPlan['syllabus'],
  progress: ProgressStats
): { weakTopics: AnalyzedTopic[]; averageTopics: AnalyzedTopic[]; strongTopics: AnalyzedTopic[] } {
  const allTopics: AnalyzedTopic[] = [];

  (Object.keys(testSyllabus) as SubjectName[]).forEach(subjectName => {
    const chapters = testSyllabus[subjectName];
    if (chapters) {
      chapters.forEach(chapterName => {
        const chapterData = progress.subjects[subjectName]?.chapters[chapterName];
        if (chapterData) {
          Object.entries(chapterData.microtopics).forEach(([microtopicName, microtopicData]) => {
            if (microtopicData.completed > 0 && (microtopicData.avgDifficulty > 0 || microtopicData.avgAccuracy !== null)) {
              const overallScore = calculateOverallScore(microtopicData.avgDifficulty, microtopicData.avgAccuracy);
              allTopics.push({
                subject: subjectName,
                chapter: chapterName,
                microtopic: microtopicName,
                avgDifficulty: microtopicData.avgDifficulty,
                avgAccuracy: microtopicData.avgAccuracy,
                tasksCompleted: microtopicData.completed,
                overallScore: overallScore,
              });
            }
          });
        }
      });
    }
  });

  const weakTopics = allTopics
    .filter(topic => topic.overallScore <= 40)
    .sort((a, b) => a.overallScore - b.overallScore);

  const averageTopics = allTopics
    .filter(topic => topic.overallScore > 40 && topic.overallScore <= 79)
    .sort((a, b) => a.overallScore - b.overallScore);

  const strongTopics = allTopics
    .filter(topic => topic.overallScore >= 80)
    .sort((a, b) => b.overallScore - a.overallScore);

  return { weakTopics, averageTopics, strongTopics };
}

export function analyzeTopicsForSubject(
  subjectStats: SubjectStats,
  subjectName: SubjectName
): { weakTopics: AnalyzedTopic[]; averageTopics: AnalyzedTopic[]; strongTopics: AnalyzedTopic[] } {
  const allTopics: AnalyzedTopic[] = [];

  Object.entries(subjectStats.chapters).forEach(([chapterName, chapterData]) => {
    Object.entries(chapterData.microtopics).forEach(([microtopicName, microtopicData]) => {
      if (microtopicData.completed > 0 && (microtopicData.avgDifficulty > 0 || microtopicData.avgAccuracy !== null)) {
        const overallScore = calculateOverallScore(microtopicData.avgDifficulty, microtopicData.avgAccuracy);
        allTopics.push({
          subject: subjectName,
          chapter: chapterName,
          microtopic: microtopicName,
          avgDifficulty: microtopicData.avgDifficulty,
          avgAccuracy: microtopicData.avgAccuracy,
          tasksCompleted: microtopicData.completed,
          overallScore: overallScore,
        });
      }
    });
  });

  const weakTopics = allTopics
    .filter(topic => topic.overallScore <= 40)
    .sort((a, b) => a.overallScore - b.overallScore);

  const averageTopics = allTopics
    .filter(topic => topic.overallScore > 40 && topic.overallScore <= 79)
    .sort((a, b) => a.overallScore - b.overallScore);

  const strongTopics = allTopics
    .filter(topic => topic.overallScore >= 80)
    .sort((a, b) => b.overallScore - a.overallScore);

  return { weakTopics, averageTopics, strongTopics };
}

export function getScoreColorClass(score: number): string {
    if (score <= 40) return 'text-red-400';
    if (score <= 79) return 'text-yellow-400';
    return 'text-green-400';
}

export function getScoreBgClass(score: number): string {
    if (score <= 40) return 'bg-red-500/10 hover:bg-red-500/20';
    if (score <= 79) return 'bg-yellow-500/10 hover:bg-yellow-500/20';
    return 'bg-green-500/10 hover:bg-green-500/20';
}

// Helper to get current ISO week string
export function getCurrentWeekString() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}
