import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Question, QuizSession } from '@shared/schema';

interface QuizState {
  session: QuizSession | null;
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  score: number;
  correctAnswers: number;
  isCompleted: boolean;
}

interface AnswerResult {
  isCorrect: boolean;
  points: number;
  explanation: string;
  correctAnswer: string;
  totalScore: number;
}

export function useQuiz(countryCode?: string, level?: number) {
  const queryClient = useQueryClient();
  const [quizState, setQuizState] = useState<QuizState>({
    session: null,
    questions: [],
    currentQuestionIndex: 0,
    currentQuestion: null,
    score: 0,
    correctAnswers: 0,
    isCompleted: false,
  });

  // Fetch questions for the current country and level
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['/api/questions', countryCode, level],
    enabled: !!countryCode && !!level,
  });

  // Start quiz mutation
  const startQuizMutation = useMutation({
    mutationFn: async ({ countryCode, level }: { countryCode: string; level: number }) => {
      const response = await apiRequest('POST', '/api/quiz/start', { countryCode, level });
      return response.json();
    },
    onSuccess: (session) => {
      setQuizState(prev => ({
        ...prev,
        session,
        currentQuestionIndex: session.currentQuestionIndex || 0,
        score: session.sessionData?.score || 0,
        correctAnswers: session.sessionData?.correctAnswers || 0,
        isCompleted: false,
      }));
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
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        score: result.totalScore,
        correctAnswers: prev.correctAnswers + (result.isCorrect ? 1 : 0),
      }));
    },
  });

  // Complete quiz mutation
  const completeQuizMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('POST', '/api/quiz/complete', { sessionId });
      return response.json();
    },
    onSuccess: () => {
      setQuizState(prev => ({
        ...prev,
        isCompleted: true,
      }));
      // Invalidate progress queries
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
    },
  });

  // Update current question when questions or index changes
  useEffect(() => {
    if (questions.length > 0 && quizState.currentQuestionIndex < questions.length) {
      setQuizState(prev => ({
        ...prev,
        questions,
        currentQuestion: questions[prev.currentQuestionIndex],
      }));
    } else if (questions.length > 0 && quizState.currentQuestionIndex >= questions.length) {
      // Quiz is complete
      if (quizState.session && !quizState.isCompleted) {
        completeQuizMutation.mutate(quizState.session.id);
      }
    }
  }, [questions, quizState.currentQuestionIndex, quizState.session, quizState.isCompleted]);

  const startQuiz = (countryCode: string, level: number) => {
    startQuizMutation.mutate({ countryCode, level });
  };

  const answerQuestion = (answer: string, timeSpent: number = 0) => {
    if (!quizState.session || !quizState.currentQuestion) return;
    
    answerQuestionMutation.mutate({
      sessionId: quizState.session.id,
      questionId: quizState.currentQuestion.id,
      answer,
      timeSpent,
    });
  };

  const resetQuiz = () => {
    setQuizState({
      session: null,
      questions: [],
      currentQuestionIndex: 0,
      currentQuestion: null,
      score: 0,
      correctAnswers: 0,
      isCompleted: false,
    });
  };

  return {
    ...quizState,
    isLoading: loadingQuestions || startQuizMutation.isPending,
    isAnswering: answerQuestionMutation.isPending,
    answerResult: answerQuestionMutation.data,
    startQuiz,
    answerQuestion,
    resetQuiz,
    hasMoreQuestions: quizState.currentQuestionIndex < questions.length,
    totalQuestions: questions.length,
    progress: questions.length > 0 ? (quizState.currentQuestionIndex / questions.length) * 100 : 0,
  };
}
