import { Task, ProgressStats, SubjectName, ChapterStats, MicrotopicStats, SubjectStats, TestPlan, AnalyzedTopic } from "../types";
import { syllabus } from "../data/syllabus";

export function cn(...inputs: (string | undefined | null | false)[]): string {
    return inputs.filter(Boolean).join(' ');
}

// Helper function to create an empty stats object
const createEmptyStats = () => ({
  total: 0,
  completed: 0,
  completionRate: 0,
  avgDifficulty: 0,
  avgAccuracy: null,
  difficulties: [],
  accuracies: []
});

export function calculateProgress(tasks: Task[]): ProgressStats {
  // Initialize the stats object with the full syllabus structure
  const initialSubjects: { [key in SubjectName]: SubjectStats } = {
    Physics: { ...createEmptyStats(), chapters: {} },
    // FIX: Corrected typo from createEmptystats to createEmptyStats.
    Chemistry: { ...createEmptyStats(), chapters: {} },
    Botany: { ...createEmptyStats(), chapters: {} },
    Zoology: { ...createEmptyStats(), chapters: {} },
  };

  const stats: ProgressStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'Completed').length,
    completionRate: 0,
    subjects: initialSubjects
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
        if (task.difficulty) {
            subject.difficulties.push(task.difficulty);
            chapter.difficulties.push(task.difficulty);
        }
        if (task.totalQuestions !== undefined && task.correctAnswers !== undefined && task.totalQuestions > 0) {
            const accuracy = (task.correctAnswers / task.totalQuestions) * 100;
            subject.accuracies.push(accuracy);
            chapter.accuracies.push(accuracy);
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
            if (task.difficulty) {
                microtopic.difficulties.push(task.difficulty);
            }
            if (task.totalQuestions !== undefined && task.correctAnswers !== undefined && task.totalQuestions >= 0) { // Allow 0 correct answers
                const accuracy = task.totalQuestions > 0 ? (task.correctAnswers / task.totalQuestions) * 100 : 0;
                microtopic.accuracies.push(accuracy);
            }
        }
    });
  });

  // Calculate percentages and averages
  if (stats.totalTasks > 0) {
    stats.completionRate = (stats.completedTasks / stats.totalTasks) * 100;
  }
  
  Object.values(stats.subjects).forEach(subject => {
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

  return stats;
}

function calculateOverallScore(avgDifficulty: number, avgAccuracy: number | null): number {
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
    correctAnswers: number | undefined
): string {
    const accuracy =
        totalQuestions !== undefined &&
        correctAnswers !== undefined &&
        totalQuestions > 0
            ? (correctAnswers / totalQuestions) * 100
            : undefined;

    const score = calculateOverallScore(difficulty || 0, accuracy !== undefined ? accuracy : null);

    const accuracyString = accuracy !== undefined ? `${accuracy.toFixed(1)}% (${correctAnswers}/${totalQuestions})` : 'N/A';

    const summary = [
        "\n\n--- Performance Metrics ---",
        `Difficulty: ${difficulty ? `${difficulty}/5` : 'N/A'}`,
        `Accuracy: ${accuracyString}`,
        `Weighted Score: ${score.toFixed(0)}/100`,
    ].join("\n");

    return summary;
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