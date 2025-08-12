import {
  users,
  countries,
  questions,
  userProgress,
  quizSessions,
  rankings,
  type User,
  type InsertUser,
  type Country,
  type InsertCountry,
  type Question,
  type InsertQuestion,
  type UserProgress,
  type InsertUserProgress,
  type QuizSession,
  type InsertQuizSession,
  type Ranking,
  type InsertRanking,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (simplified for username system)
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser, referralCode?: string): Promise<User>;
  updateUserSession(userId: number, sessionId: string): Promise<void>;
  updateUserScore(userId: number, additionalScore: number): Promise<void>;
  addBonusHelp(userId: number): Promise<void>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  isUsernameAvailable(username: string): Promise<boolean>;

  // Country operations
  getAllCountries(): Promise<Country[]>;
  getCountryByCode(code: string): Promise<Country | undefined>;
  createCountry(country: InsertCountry): Promise<Country>;

  // Question operations
  getQuestionsByCountryAndLevel(countryCode: string, level: number): Promise<Question[]>;
  getQuestionById(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;

  // User progress operations
  getUserProgress(userId: number, countryCode: string, level: number): Promise<UserProgress | undefined>;
  getUserProgressByCountry(userId: number, countryCode: string): Promise<UserProgress[]>;
  upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress>;

  // Quiz session operations
  getActiveQuizSession(userId: number): Promise<QuizSession | undefined>;
  getQuizSessionById(sessionId: number): Promise<QuizSession | undefined>;
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  updateQuizSession(sessionId: number, data: Partial<QuizSession>): Promise<QuizSession>;
  completeQuizSession(sessionId: number): Promise<void>;

  // Ranking operations
  addRanking(ranking: InsertRanking): Promise<Ranking>;
  getRankingsByCountryAndLevel(countryCode: string, level: number, limit?: number): Promise<(Ranking & { username: string })[]>;
  getGlobalRankingsByLevel(level: number, limit?: number): Promise<(Ranking & { username: string })[]>;
  getUserRankingsByCountry(userId: number, countryCode: string): Promise<(Ranking & { username: string })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: InsertUser, referralCode?: string): Promise<User> {
    // Generate unique referral code for new user
    const newUserReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Find referrer if referral code provided
    let referrerId = null;
    if (referralCode) {
      const [referrer] = await db.select().from(users).where(eq(users.referralCode, referralCode));
      if (referrer) {
        referrerId = referrer.id;
      }
    }
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        referralCode: newUserReferralCode,
        referredBy: referrerId,
      })
      .returning();
    return user;
  }

  async updateUserSession(userId: number, sessionId: string): Promise<void> {
    await db
      .update(users)
      .set({
        sessionId,
        lastActiveAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserScore(userId: number, additionalScore: number): Promise<void> {
    await db
      .update(users)
      .set({
        totalScore: sql`${users.totalScore} + ${additionalScore}`,
        gamesPlayed: sql`${users.gamesPlayed} + 1`,
        lastActiveAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return !user;
  }

  async addBonusHelp(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        bonusHelps: sql`${users.bonusHelps} + 1`,
      })
      .where(eq(users.id, userId));
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, referralCode));
    return user;
  }

  // Country operations
  async getAllCountries(): Promise<Country[]> {
    return await db.select().from(countries).where(eq(countries.isActive, true));
  }

  async getCountryByCode(code: string): Promise<Country | undefined> {
    const [country] = await db.select().from(countries).where(eq(countries.code, code));
    return country;
  }

  async createCountry(countryData: InsertCountry): Promise<Country> {
    const [country] = await db.insert(countries).values(countryData).returning();
    return country;
  }

  // Question operations
  async getQuestionsByCountryAndLevel(countryCode: string, level: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.countryCode, countryCode),
          eq(questions.level, level),
          eq(questions.isActive, true)
        )
      );
  }

  async getQuestionById(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(questionData: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(questionData).returning();
    return question;
  }

  // User progress operations
  async getUserProgress(userId: number, countryCode: string, level: number): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.countryCode, countryCode),
          eq(userProgress.level, level)
        )
      );
    return progress;
  }

  async getUserProgressByCountry(userId: number, countryCode: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.countryCode, countryCode)
        )
      )
      .orderBy(userProgress.level);
  }

  async upsertUserProgress(progressData: InsertUserProgress): Promise<UserProgress> {
    const [progress] = await db
      .insert(userProgress)
      .values(progressData)
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.countryCode, userProgress.level],
        set: {
          ...progressData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return progress;
  }

  // Quiz session operations
  async getActiveQuizSession(userId: number): Promise<QuizSession | undefined> {
    const [session] = await db
      .select()
      .from(quizSessions)
      .where(
        and(
          eq(quizSessions.userId, userId),
          sql`${quizSessions.completedAt} IS NULL`
        )
      )
      .orderBy(desc(quizSessions.startedAt))
      .limit(1);
    return session;
  }

  async getQuizSessionById(sessionId: number): Promise<QuizSession | undefined> {
    const [session] = await db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.id, sessionId));
    return session;
  }

  async createQuizSession(sessionData: InsertQuizSession): Promise<QuizSession> {
    const [session] = await db.insert(quizSessions).values(sessionData).returning();
    return session;
  }

  async updateQuizSession(sessionId: number, data: Partial<QuizSession>): Promise<QuizSession> {
    const [session] = await db
      .update(quizSessions)
      .set(data)
      .where(eq(quizSessions.id, sessionId))
      .returning();
    return session;
  }

  async completeQuizSession(sessionId: number): Promise<void> {
    await db
      .update(quizSessions)
      .set({ completedAt: new Date() })
      .where(eq(quizSessions.id, sessionId));
  }

  // Ranking operations
  async addRanking(rankingData: InsertRanking): Promise<Ranking> {
    const [ranking] = await db.insert(rankings).values(rankingData).returning();
    return ranking;
  }

  async getRankingsByCountryAndLevel(countryCode: string, level: number, limit = 50): Promise<(Ranking & { username: string })[]> {
    return await db
      .select({
        id: rankings.id,
        userId: rankings.userId,
        countryCode: rankings.countryCode,
        level: rankings.level,
        score: rankings.score,
        correctAnswers: rankings.correctAnswers,
        totalQuestions: rankings.totalQuestions,
        accuracy: rankings.accuracy,
        completedAt: rankings.completedAt,
        username: users.username,
      })
      .from(rankings)
      .innerJoin(users, eq(rankings.userId, users.id))
      .where(
        and(
          eq(rankings.countryCode, countryCode),
          eq(rankings.level, level)
        )
      )
      .orderBy(desc(rankings.score), desc(rankings.accuracy))
      .limit(limit);
  }

  async getGlobalRankingsByLevel(level: number, limit = 50): Promise<(Ranking & { username: string })[]> {
    console.log('Storage getGlobalRankingsByLevel called with level:', level);
    const result = await db
      .select({
        id: rankings.id,
        userId: rankings.userId,
        countryCode: rankings.countryCode,
        level: rankings.level,
        score: rankings.score,
        correctAnswers: rankings.correctAnswers,
        totalQuestions: rankings.totalQuestions,
        accuracy: rankings.accuracy,
        completedAt: rankings.completedAt,
        username: users.username,
      })
      .from(rankings)
      .innerJoin(users, eq(rankings.userId, users.id))
      .where(eq(rankings.level, level))
      .orderBy(desc(rankings.score), desc(rankings.accuracy))
      .limit(limit);
    
    console.log('Storage getGlobalRankingsByLevel returning:', result.length, 'records');
    return result;
  }

  async getUserRankingsByCountry(userId: number, countryCode: string): Promise<(Ranking & { username: string })[]> {
    return await db
      .select({
        id: rankings.id,
        userId: rankings.userId,
        countryCode: rankings.countryCode,
        level: rankings.level,
        score: rankings.score,
        correctAnswers: rankings.correctAnswers,
        totalQuestions: rankings.totalQuestions,
        accuracy: rankings.accuracy,
        completedAt: rankings.completedAt,
        username: users.username,
      })
      .from(rankings)
      .innerJoin(users, eq(rankings.userId, users.id))
      .where(
        and(
          eq(rankings.userId, userId),
          eq(rankings.countryCode, countryCode)
        )
      )
      .orderBy(desc(rankings.score), asc(rankings.level));
  }
}

export const storage = new DatabaseStorage();