import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuestionSchema, insertCountrySchema, usernameSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    sessionId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to get current user from session
  const getCurrentUser = async (req: any) => {
    const sessionId = req.session?.sessionId;
    const userId = req.session?.userId;
    if (!sessionId || !userId) return null;
    
    const user = await storage.getUserById(userId);
    if (!user || user.sessionId !== sessionId) return null;
    
    return user;
  };

  // User authentication routes (simplified)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username } = req.body;
      
      // Validate username
      const validatedUsername = usernameSchema.parse(username);
      
      // Check if username is available
      const isAvailable = await storage.isUsernameAvailable(validatedUsername);
      if (!isAvailable) {
        return res.status(409).json({ message: "Este nombre de usuario ya está en uso" });
      }
      
      // Create user
      const sessionId = nanoid();
      const user = await storage.createUser({
        username: validatedUsername,
        sessionId,
      });
      
      // Set session
      req.session.userId = user.id;
      req.session.sessionId = sessionId;
      
      res.json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Error al crear el usuario" });
    }
  });

  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "No authenticated" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/logout', async (req: any, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
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
  app.get('/api/progress/:countryCode', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const { countryCode } = req.params;
      const progress = await storage.getUserProgressByCountry(user.id, countryCode);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.get('/api/progress/:countryCode/:level', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const { countryCode, level } = req.params;
      const progress = await storage.getUserProgress(user.id, countryCode, parseInt(level));
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  // Quiz Session API
  app.post('/api/quiz/start', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { countryCode, level } = req.body;

      // Check for existing active session
      const existingSession = await storage.getActiveQuizSession(user.id);
      if (existingSession) {
        return res.json(existingSession);
      }

      // Create new session
      const session = await storage.createQuizSession({
        userId: user.id,
        countryCode,
        level,
        currentQuestionIndex: 0,
        score: 0,
        correctAnswers: 0,
        hintsUsed: 0,
        hintsRemaining: 3, // Máximo 3 ayudas por sesión
        sessionData: {
          startTime: new Date().toISOString(),
        },
      });

      res.json(session);
    } catch (error) {
      console.error("Error starting quiz:", error);
      res.status(500).json({ message: "Failed to start quiz" });
    }
  });

  app.post('/api/quiz/answer', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { sessionId, questionId, answer, timeSpent } = req.body;

      // Get the session
      const session = await storage.getActiveQuizSession(user.id);
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
      const points = isCorrect ? 1 : 0; // Nuevo sistema: 1 punto por respuesta correcta

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

  app.post('/api/quiz/complete', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { sessionId } = req.body;

      // Get the session
      const session = await storage.getActiveQuizSession(user.id);
      if (!session || session.id !== sessionId) {
        return res.status(404).json({ message: "Quiz session not found" });
      }

      // Complete the session
      await storage.completeQuizSession(sessionId);

      // Update user progress and score
      const sessionData = session.sessionData as any || {};
      const totalQuestions = (sessionData.answers || []).length;
      const correctAnswers = sessionData.correctAnswers || 0;
      const totalScore = sessionData.score || 0;
      const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      await storage.upsertUserProgress({
        userId: user.id,
        countryCode: session.countryCode,
        level: session.level,
        questionsAnswered: totalQuestions,
        correctAnswers,
        totalScore,
        isCompleted: true,
        lastPlayedAt: new Date(),
      });

      // Update user total score
      await storage.updateUserScore(user.id, totalScore);

      // Add to rankings
      await storage.addRanking({
        userId: user.id,
        countryCode: session.countryCode,
        level: session.level,
        score: totalScore,
        correctAnswers,
        totalQuestions,
        accuracy,
      });

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

  // Use hint - nueva funcionalidad para ayudas
  app.post('/api/quiz/hint', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { sessionId, questionId } = req.body;

      const session = await storage.getActiveQuizSession(user.id);
      if (!session || session.id !== sessionId) {
        return res.status(404).json({ message: "Quiz session not found" });
      }

      const currentHints = session.hintsRemaining || 3;
      if (currentHints <= 0) {
        return res.status(400).json({ message: "No quedan ayudas disponibles" });
      }

      // Get the current question to provide the hint/description
      const question = await storage.getQuestionById(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Deduct hint cost (20 points) and reduce remaining hints
      const currentData = session.sessionData as any || {};
      const currentScore = currentData.score || 0;
      const newScore = Math.max(0, currentScore - 20);
      const newHintsRemaining = currentHints - 1;

      const updatedData = {
        ...currentData,
        score: newScore,
        hintsUsed: (currentData.hintsUsed || 0) + 1,
      };

      await storage.updateQuizSession(sessionId, {
        hintsRemaining: newHintsRemaining,
        sessionData: updatedData,
      });

      res.json({
        success: true,
        pointsDeducted: 20,
        newScore,
        hintsRemaining: newHintsRemaining,
        hint: question.description, // Esta es la pista/descripción que se muestra al usuario
      });
    } catch (error) {
      console.error("Error using hint:", error);
      res.status(500).json({ message: "Failed to use hint" });
    }
  });

  // Rankings API - Order matters! Specific routes first
  app.get('/api/rankings/global/:level', async (req, res) => {
    try {
      const { level } = req.params;
      const parsedLevel = parseInt(level);
      const limit = parseInt(req.query.limit as string) || 50;
      
      console.log('Global rankings request - level:', parsedLevel, 'limit:', limit);
      
      if (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 4) {
        return res.status(400).json({ message: "Invalid level parameter" });
      }
      
      const rankings = await storage.getGlobalRankingsByLevel(parsedLevel, limit);
      console.log('Global rankings result:', rankings.length, 'records');
      console.log('First few records:', rankings.slice(0, 2));
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching global rankings:", error);
      res.status(500).json({ message: "Failed to fetch global rankings" });
    }
  });

  app.get('/api/rankings/:countryCode/:level', async (req, res) => {
    try {
      const { countryCode, level } = req.params;
      const parsedLevel = parseInt(level);
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 4) {
        return res.status(400).json({ message: "Invalid level parameter" });
      }
      
      const rankings = await storage.getRankingsByCountryAndLevel(
        countryCode, 
        parsedLevel, 
        limit
      );
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      res.status(500).json({ message: "Failed to fetch rankings" });
    }
  });

  app.get('/api/rankings/user/:countryCode', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { countryCode } = req.params;
      console.log('User rankings request - userId:', user.id, 'countryCode:', countryCode);
      
      const rankings = await storage.getUserRankingsByCountry(user.id, countryCode);
      console.log('User rankings result:', rankings.length, 'records');
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching user rankings:", error);
      res.status(500).json({ message: "Failed to fetch user rankings" });
    }
  });

  // Test rankings (debug endpoint)
  app.post('/api/admin/test-rankings', async (req, res) => {
    try {
      const { level } = req.body;
      console.log('Testing rankings for level:', level);
      
      // Test direct SQL query
      const result = await storage.getGlobalRankingsByLevel(level || 1);
      console.log('Result from storage:', result);
      
      res.json({
        level: level || 1,
        results: result,
        count: result.length
      });
    } catch (error) {
      console.error("Error testing rankings:", error);
      res.status(500).json({ message: "Failed to test rankings", error: error instanceof Error ? error.message : String(error) });
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
        try {
          await storage.createCountry(country);
        } catch (e) {
          // Ignore duplicate errors
        }
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
