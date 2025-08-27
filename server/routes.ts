import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuestionSchema, insertCountrySchema, usernameSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

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
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Usuario, email y contraseña son requeridos" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      }
      
      // Validate email format
      if (!email.includes('@') || email.length < 5) {
        return res.status(400).json({ message: "Por favor ingresa un correo electrónico válido" });
      }
      
      // Validate username
      const validatedUsername = usernameSchema.parse(username);
      
      // Check if username or email are available
      const isUsernameAvailable = await storage.isUsernameAvailable(validatedUsername);
      if (!isUsernameAvailable) {
        return res.status(409).json({ message: "Este nombre de usuario ya está en uso" });
      }

      const isEmailAvailable = await storage.isEmailAvailable(email);
      if (!isEmailAvailable) {
        return res.status(409).json({ message: "Este correo electrónico ya está en uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Check for referral code
      const referralCode = req.query.ref as string;
      let referredBy: number | undefined;
      
      if (referralCode) {
        const referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer) {
          referredBy = referrer.id;
        }
      }
      
      // Create user
      const sessionId = nanoid();
      const user = await storage.createUser({
        username: validatedUsername,
        email,
        password: hashedPassword,
        sessionId,
        referralCode: 'REF' + nanoid(6).toUpperCase(),
        referredBy
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
      
      // Check for specific database errors
      if (error && typeof error === 'object') {
        const err = error as any;
        
        // Connection errors
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message?.includes('ECONNREFUSED')) {
          return res.status(500).json({ message: "Error desconocido en el servidor" });
        }
        
        // Constraint violation errors (duplicate username/email)
        if (err.code === '23505' || err.message?.includes('duplicate key') || err.message?.includes('unique constraint')) {
          if (err.message?.includes('username')) {
            return res.status(409).json({ message: "Este nombre de usuario ya está en uso" });
          }
          if (err.message?.includes('email')) {
            return res.status(409).json({ message: "Este correo electrónico ya está en uso" });
          }
          return res.status(409).json({ message: "Este usuario ya existe" });
        }
        
        // Invalid input errors
        if (err.code === '22P02' || err.message?.includes('invalid input')) {
          return res.status(400).json({ message: "Datos de usuario inválidos" });
        }
      }
      
      res.status(500).json({ message: "Error desconocido en el servidor" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
      }

      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Update session
      const sessionId = nanoid();
      await storage.updateUserSession(user.id, sessionId);

      // Set session
      req.session.userId = user.id;
      req.session.sessionId = sessionId;

      res.json({ user });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Error interno del servidor" });
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

  // Profile update endpoints
  app.post('/api/auth/update-email', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "El correo electrónico es requerido" });
      }

      // Check if email is available
      const isEmailAvailable = await storage.isEmailAvailable(email);
      if (!isEmailAvailable) {
        return res.status(409).json({ message: "Este correo electrónico ya está en uso" });
      }

      await storage.updateUserEmail(user.id, email);
      
      res.json({ message: "Correo actualizado exitosamente" });
    } catch (error) {
      console.error("Error updating email:", error);
      res.status(500).json({ message: "Error al actualizar el correo" });
    }
  });

  app.post('/api/auth/update-password', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Contraseña actual y nueva son requeridas" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres" });
      }

      // Verify current password
      if (!user.password) {
        return res.status(400).json({ message: "Usuario no tiene contraseña configurada" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "La contraseña actual es incorrecta" });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      await storage.updateUserPassword(user.id, hashedNewPassword);
      
      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Error al actualizar la contraseña" });
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

  // Get next question for active session (avoiding duplicates)
  app.get('/api/quiz/next-question', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Get active session
      const session = await storage.getActiveQuizSession(user.id);
      if (!session) {
        return res.status(404).json({ message: "No active quiz session found" });
      }

      // Get used question IDs from session data
      const sessionData = session.sessionData as any || {};
      const usedQuestionIds = sessionData.usedQuestionIds || [];

      // Get next random unused question
      const nextQuestion = await storage.getRandomQuestionNotUsed(
        session.countryCode,
        session.level,
        usedQuestionIds
      );

      if (!nextQuestion) {
        return res.status(404).json({ message: "No more questions available" });
      }

      res.json(nextQuestion);
    } catch (error) {
      console.error("Error fetching next question:", error);
      res.status(500).json({ message: "Failed to fetch next question" });
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
          usedQuestionIds: [], // Track used questions to avoid repeats
          answers: [],
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

      // Update session data and track used question
      const currentData = session.sessionData as any || {};
      const updatedData = {
        ...currentData,
        score: (currentData.score || 0) + points,
        correctAnswers: (currentData.correctAnswers || 0) + (isCorrect ? 1 : 0),
        usedQuestionIds: [...(currentData.usedQuestionIds || []), questionId],
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

      // Check if this completion triggers referral bonus
      await checkReferralProgress(user.id);

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

      // Calculate total hints available (base 3 + bonus helps)
      const userInfo = await storage.getUserById(user.id);
      const bonusHelps = userInfo?.bonusHelps || 0;
      const maxHints = 3 + bonusHelps;
      const currentHints = session.hintsRemaining !== undefined ? session.hintsRemaining : maxHints;
      if (!currentHints || currentHints <= 0) {
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
      const newHintsRemaining = (currentHints || 0) - 1;

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
        hint: question.description, // Descripción/contexto de la pregunta
        correctAnswer: question.correctAnswer, // La respuesta correcta
      });
    } catch (error) {
      console.error("Error using hint:", error);
      res.status(500).json({ message: "Failed to use hint" });
    }
  });

  // Referral system API
  app.get('/api/user/referral-info', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const referralLink = `https://trivia.cubacoin.org?ref=${user.referralCode}`;
      
      const referralsCount = await storage.getUserReferralsCount(user.id);
      
      res.json({
        referralCode: user.referralCode,
        referralLink,
        bonusHelps: user.bonusHelps || 0,
        referralsCount
      });
    } catch (error) {
      console.error("Error getting referral info:", error);
      res.status(500).json({ message: "Failed to get referral info" });
    }
  });

  // Get user statistics
  app.get('/api/user/stats', async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const userRankings = await storage.getUserRankings(user.id);
      const referralsCount = await storage.getUserReferralsCount(user.id);
      
      // Calculate statistics from rankings
      let totalCorrect = 0;
      let totalQuestions = 0;
      let gamesPlayed = userRankings.length;
      let bestLevel = 0;

      userRankings.forEach(ranking => {
        totalCorrect += ranking.correctAnswers;
        totalQuestions += ranking.totalQuestions;
        if (ranking.level > bestLevel) {
          bestLevel = ranking.level;
        }
      });

      const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      res.json({
        totalScore: user.totalScore || 0,
        gamesPlayed,
        bonusHelps: user.bonusHelps || 0,
        referralsCount,
        accuracy: Math.round(accuracy),
        bestLevel
      });
    } catch (error) {
      console.error("Error getting user stats:", error);
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  // Check referral progress and award bonus helps
  const checkReferralProgress = async (userId: number) => {
    try {
      const user = await storage.getUserById(userId);
      if (!user || !user.referredBy) return;

      // Count correct answers by this user
      const userRankings = await storage.getUserRankingsByCountry(userId, 'cuba'); // Check any country
      let totalCorrectAnswers = 0;
      for (const ranking of userRankings) {
        totalCorrectAnswers += ranking.correctAnswers;
      }

      // If user has completed 3 correct answers, give bonus help to referrer
      if (totalCorrectAnswers >= 3) {
        await storage.addBonusHelp(user.referredBy);
        console.log(`Bonus help awarded to user ${user.referredBy} for referral ${userId}`);
      }
    } catch (error) {
      console.error("Error checking referral progress:", error);
    }
  };

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
