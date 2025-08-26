import { db } from '../server/db.js';
import { quizSessions, rankings, users } from '../shared/schema.js';
import { eq, and, isNotNull } from 'drizzle-orm';

/**
 * Script to migrate completed quiz sessions to rankings table
 * This fixes the issue where completed sessions weren't automatically creating ranking entries
 */

async function migrateCompletedSessions() {
  console.log('🚀 Starting migration of completed quiz sessions to rankings...');

  try {
    // Get all completed sessions that don't have rankings
    const completedSessions = await db
      .select({
        id: quizSessions.id,
        userId: quizSessions.userId,
        countryCode: quizSessions.countryCode,
        level: quizSessions.level,
        sessionData: quizSessions.sessionData,
        completedAt: quizSessions.completedAt,
        score: quizSessions.score,
        correctAnswers: quizSessions.correctAnswers,
      })
      .from(quizSessions)
      .where(
        and(
          isNotNull(quizSessions.completedAt),
          isNotNull(quizSessions.sessionData)
        )
      );

    console.log(`Found ${completedSessions.length} completed sessions to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const session of completedSessions) {
      try {
        // Check if ranking already exists for this session (more flexible check)
        const existingRanking = await db
          .select()
          .from(rankings)
          .where(
            and(
              eq(rankings.userId, session.userId),
              eq(rankings.countryCode, session.countryCode),
              eq(rankings.level, session.level)
            )
          );

        if (existingRanking.length > 0) {
          console.log(`⚠️  Ranking already exists for session ${session.id}, skipping`);
          skippedCount++;
          continue;
        }

        // Parse session data to get correct answers and total questions
        const sessionData = session.sessionData as any;
        const correctAnswers = sessionData?.correctAnswers || 0;
        const totalQuestions = sessionData?.answers?.length || 0;
        const score = sessionData?.score || 0;
        
        // Calculate accuracy
        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        // Create ranking entry
        await db.insert(rankings).values({
          userId: session.userId,
          countryCode: session.countryCode,
          level: session.level,
          score,
          correctAnswers,
          totalQuestions,
          accuracy,
          completedAt: session.completedAt!,
        });

        migratedCount++;
        console.log(`✅ Migrated session ${session.id} for user ${session.userId} (${session.countryCode} Level ${session.level}): ${correctAnswers}/${totalQuestions} correct, ${score} points, ${accuracy}% accuracy`);

      } catch (error) {
        console.error(`❌ Error migrating session ${session.id}:`, error);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} sessions`);
    console.log(`⚠️  Skipped (already exists): ${skippedCount} sessions`);
    console.log(`📝 Total processed: ${completedSessions.length} sessions`);

    // Verify rankings count
    const totalRankings = await db.select().from(rankings);
    console.log(`🎯 Total rankings in database: ${totalRankings.length}`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateCompletedSessions()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });