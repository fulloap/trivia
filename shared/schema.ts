import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (simplified for unique usernames)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  totalScore: integer("total_score").default(0),
  gamesPlayed: integer("games_played").default(0),
  sessionId: varchar("session_id"), // To track current browser session
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

// Countries table
export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  flag: varchar("flag", { length: 10 }).notNull(),
  primaryColor: varchar("primary_color", { length: 20 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 10 }).notNull(),
  level: integer("level").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "completar", "multiple", "verdadero_falso"
  question: text("question").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  options: jsonb("options"), // For multiple choice questions
  points: integer("points").default(100),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User progress table
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  countryCode: varchar("country_code", { length: 10 }).notNull(),
  level: integer("level").notNull(),
  questionsAnswered: integer("questions_answered").default(0),
  correctAnswers: integer("correct_answers").default(0),
  totalScore: integer("total_score").default(0),
  isCompleted: boolean("is_completed").default(false),
  lastPlayedAt: timestamp("last_played_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz sessions table
export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  countryCode: varchar("country_code", { length: 10 }).notNull(),
  level: integer("level").notNull(),
  currentQuestionIndex: integer("current_question_index").default(0),
  sessionData: jsonb("session_data"), // Store current quiz state
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Rankings table for leaderboards
export const rankings = pgTable("rankings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  countryCode: varchar("country_code", { length: 10 }).notNull(),
  level: integer("level").notNull(),
  score: integer("score").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  accuracy: integer("accuracy").notNull(), // percentage
  completedAt: timestamp("completed_at").defaultNow(),
});

// Schema types
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertCountry = typeof countries.$inferInsert;
export type Country = typeof countries.$inferSelect;

export type InsertQuestion = typeof questions.$inferInsert;
export type Question = typeof questions.$inferSelect;

export type InsertUserProgress = typeof userProgress.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;

export type InsertQuizSession = typeof quizSessions.$inferInsert;
export type QuizSession = typeof quizSessions.$inferSelect;

export type InsertRanking = typeof rankings.$inferInsert;
export type Ranking = typeof rankings.$inferSelect;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
});

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizSessionSchema = createInsertSchema(quizSessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertRankingSchema = createInsertSchema(rankings).omit({
  id: true,
  completedAt: true,
});

// Username validation schema
export const usernameSchema = z.string()
  .min(3, "El nombre debe tener al menos 3 caracteres")
  .max(50, "El nombre no puede tener más de 50 caracteres")
  .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guiones bajos permitidos");

export type UsernameInput = z.infer<typeof usernameSchema>;
