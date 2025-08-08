import {
  users,
  countries,
  questions,
  userProgress,
  quizSessions,
  type User,
  type UpsertUser,
  type Country,
  type InsertCountry,
  type Question,
  type InsertQuestion,
  type UserProgress,
  type InsertUserProgress,
  type QuizSession,
  type InsertQuizSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserScore(userId: string, additionalScore: number): Promise<void>;

  // Country operations
  getAllCountries(): Promise<Country[]>;
  getCountryByCode(code: string): Promise<Country | undefined>;
  createCountry(country: InsertCountry): Promise<Country>;

  // Question operations
  getQuestionsByCountryAndLevel(countryCode: string, level: number): Promise<Question[]>;
  getQuestionById(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;

  // User progress operations
  getUserProgress(userId: string, countryCode: string, level: number): Promise<UserProgress | undefined>;
  getUserProgressByCountry(userId: string, countryCode: string): Promise<UserProgress[]>;
  upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress>;

  // Quiz session operations
  getActiveQuizSession(userId: string): Promise<QuizSession | undefined>;
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  updateQuizSession(sessionId: number, data: Partial<QuizSession>): Promise<QuizSession>;
  completeQuizSession(sessionId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserScore(userId: string, additionalScore: number): Promise<void> {
    await db
      .update(users)
      .set({
        totalScore: sql`${users.totalScore} + ${additionalScore}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
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
  async getUserProgress(userId: string, countryCode: string, level: number): Promise<UserProgress | undefined> {
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

  async getUserProgressByCountry(userId: string, countryCode: string): Promise<UserProgress[]> {
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
  async getActiveQuizSession(userId: string): Promise<QuizSession | undefined> {
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
}

export const storage = new DatabaseStorage();
