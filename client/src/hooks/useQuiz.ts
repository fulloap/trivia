import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Question, QuizSession } from '@shared/schema';

interface AnswerResult {
  isCorrect: boolean;
  points: number;
  explanation: string;
  correctAnswer: string;
  totalScore: number;
}

export function useQuiz(countryCode?: string, level?: number) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch questions for the current country and level
  const { data: questions = [], isLoading: loadingQuestions } = useQuery<Question[]>({
    queryKey: ['/api/questions', countryCode, level],
    enabled: !!countryCode && !!level,
  });

  // Start quiz mutation
  const startQuizMutation = useMutation({
    mutationFn: async ({ countryCode, level }: { countryCode: string; level: number }) => {
      const response = await apiRequest('POST', '/api/quiz/start', { countryCode, level });
      return response.json();
    },
    onSuccess: (newSession) => {
      setSession(newSession);
      setCurrentQuestionIndex(newSession.currentQuestionIndex || 0);
      setScore(newSession.sessionData?.score || 0);
      setCorrectAnswers(newSession.sessionData?.correctAnswers || 0);
      setIsCompleted(false);
    },
    onError: (error) => {
      console.error('Error starting quiz:', error);
    },
  });

  // Answer question mutation
  const answerQuestionMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      questionId, 
      answer, 
      timeSpent 
    }: { 
      sessionId: number; 
      questionId: number; 
      answer: string; 
      timeSpent: number; 
    }) => {
      const response = await apiRequest('POST', '/api/quiz/answer', {
        sessionId,
        questionId,
        answer,
        timeSpent,
      });
      return response.json();
    },
    onSuccess: (result: AnswerResult) => {
      setCurrentQuestionIndex(prev => prev + 1);
      setScore(result.totalScore);
      setCorrectAnswers(prev => prev + (result.isCorrect ? 1 : 0));
    },
  });

  // Complete quiz mutation
  const completeQuizMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('POST', '/api/quiz/complete', { sessionId });
      return response.json();
    },
    onSuccess: () => {
      setIsCompleted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
    },
  });

  const startQuiz = useCallback((countryCode: string, level: number) => {
    if (!startQuizMutation.isPending) {
      startQuizMutation.mutate({ countryCode, level });
    }
  }, [startQuizMutation]);

  const answerQuestion = useCallback((answer: string, timeSpent: number = 0) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!session || !currentQuestion || answerQuestionMutation.isPending) return;
    
    answerQuestionMutation.mutate({
      sessionId: session.id,
      questionId: currentQuestion.id,
      answer,
      timeSpent,
    });
  }, [session, questions, currentQuestionIndex, answerQuestionMutation]);

  const resetQuiz = useCallback(() => {
    setSession(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setIsCompleted(false);
  }, []);

  // Check if quiz should be completed
  if (questions.length > 0 && currentQuestionIndex >= questions.length && session && !isCompleted && !completeQuizMutation.isPending) {
    completeQuizMutation.mutate(session.id);
  }

  const currentQuestion = questions.length > 0 && currentQuestionIndex < questions.length 
    ? questions[currentQuestionIndex] 
    : null;

  return {
    session,
    questions,
    currentQuestion,
    currentQuestionIndex,
    score,
    correctAnswers,
    isCompleted,
    isLoading: loadingQuestions || startQuizMutation.isPending,
    isAnswering: answerQuestionMutation.isPending,
    answerResult: answerQuestionMutation.data,
    startQuiz,
    answerQuestion,
    resetQuiz,
    hasMoreQuestions: currentQuestionIndex < questions.length,
    totalQuestions: questions.length,
    progress: questions.length > 0 ? (currentQuestionIndex / questions.length) * 100 : 0,
  };
}