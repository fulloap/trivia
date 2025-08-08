import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertQuestionSchema, insertCountrySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Countries API
  app.get('/api/countries', async (req, res) => {
    try {
      const countries = await storage.getAllCountries();
      res.json(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  app.get('/api/countries/:code', async (req, res) => {
    try {
      const country = await storage.getCountryByCode(req.params.code);
      if (!country) {
        return res.status(404).json({ message: "Country not found" });
      }
      res.json(country);
    } catch (error) {
      console.error("Error fetching country:", error);
      res.status(500).json({ message: "Failed to fetch country" });
    }
  });

  // Questions API
  app.get('/api/questions/:countryCode/:level', async (req, res) => {
    try {
      const { countryCode, level } = req.params;
      const questions = await storage.getQuestionsByCountryAndLevel(
        countryCode,
        parseInt(level)
      );
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // User Progress API
  app.get('/api/progress/:countryCode', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { countryCode } = req.params;
      const progress = await storage.getUserProgressByCountry(userId, countryCode);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.get('/api/progress/:countryCode/:level', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { countryCode, level } = req.params;
      const progress = await storage.getUserProgress(userId, countryCode, parseInt(level));
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  // Quiz Session API
  app.post('/api/quiz/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { countryCode, level } = req.body;

      // Check for existing active session
      const existingSession = await storage.getActiveQuizSession(userId);
      if (existingSession) {
        return res.json(existingSession);
      }

      // Create new session
      const session = await storage.createQuizSession({
        userId,
        countryCode,
        level,
        currentQuestionIndex: 0,
        sessionData: {
          score: 0,
          correctAnswers: 0,
          startTime: new Date().toISOString(),
        },
      });

      res.json(session);
    } catch (error) {
      console.error("Error starting quiz:", error);
      res.status(500).json({ message: "Failed to start quiz" });
    }
  });

  app.post('/api/quiz/answer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId, questionId, answer, timeSpent } = req.body;

      // Get the session
      const session = await storage.getActiveQuizSession(userId);
      if (!session || session.id !== sessionId) {
        return res.status(404).json({ message: "Quiz session not found" });
      }

      // Get the question
      const question = await storage.getQuestionById(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Check if answer is correct
      const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
      const points = isCorrect ? question.points : 0;

      // Update session data
      const currentData = session.sessionData as any || {};
      const updatedData = {
        ...currentData,
        score: (currentData.score || 0) + points,
        correctAnswers: (currentData.correctAnswers || 0) + (isCorrect ? 1 : 0),
        answers: [
          ...(currentData.answers || []),
          {
            questionId,
            answer,
            isCorrect,
            points,
            timeSpent,
            answeredAt: new Date().toISOString(),
          }
        ],
      };

      // Update session
      await storage.updateQuizSession(sessionId, {
        currentQuestionIndex: (session.currentQuestionIndex || 0) + 1,
        sessionData: updatedData,
      });

      res.json({
        isCorrect,
        points,
        explanation: question.explanation,
        correctAnswer: question.correctAnswer,
        totalScore: updatedData.score,
      });
    } catch (error) {
      console.error("Error processing answer:", error);
      res.status(500).json({ message: "Failed to process answer" });
    }
  });

  app.post('/api/quiz/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.body;

      // Get the session
      const session = await storage.getActiveQuizSession(userId);
      if (!session || session.id !== sessionId) {
        return res.status(404).json({ message: "Quiz session not found" });
      }

      // Complete the session
      await storage.completeQuizSession(sessionId);

      // Update user progress
      const sessionData = session.sessionData as any || {};
      const totalQuestions = (sessionData.answers || []).length;
      const correctAnswers = sessionData.correctAnswers || 0;
      const totalScore = sessionData.score || 0;

      await storage.upsertUserProgress({
        userId,
        countryCode: session.countryCode,
        level: session.level,
        questionsAnswered: totalQuestions,
        correctAnswers,
        totalScore,
        isCompleted: true,
        lastPlayedAt: new Date(),
      });

      // Update user total score
      await storage.updateUserScore(userId, totalScore);

      res.json({
        session,
        results: {
          totalQuestions,
          correctAnswers,
          totalScore,
          accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
        },
      });
    } catch (error) {
      console.error("Error completing quiz:", error);
      res.status(500).json({ message: "Failed to complete quiz" });
    }
  });

  // Initialize default data
  app.post('/api/admin/init', async (req, res) => {
    try {
      // Initialize countries
      const countries = [
        {
          code: 'cuba',
          name: 'Cuba',
          flag: '🇨🇺',
          primaryColor: '#FF6B35',
          isActive: true,
        },
        {
          code: 'honduras',
          name: 'Honduras',
          flag: '🇭🇳',
          primaryColor: '#1E88E5',
          isActive: true,
        },
      ];

      for (const country of countries) {
        await storage.createCountry(country);
      }

      res.json({ message: "Initialization completed" });
    } catch (error) {
      console.error("Error initializing data:", error);
      res.status(500).json({ message: "Failed to initialize data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
