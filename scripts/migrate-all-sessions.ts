import { db } from '../server/db.js';
import { quizSessions, rankings, users } from '../shared/schema.js';
import { eq, and, isNotNull, isNull, notInArray } from 'drizzle-orm';

/**
 * Script to migrate ALL quiz sessions to rankings table
 * This includes both completed and incomplete sessions to generate full rankings
 */

async function migrateAllSessions() {
  console.log('🚀 Starting migration of ALL quiz sessions to rankings...');

  try {
    // Get all sessions (both completed and active) that have session data
    const allSessions = await db
      .select({
        id: quizSessions.id,
        userId: quizSessions.userId,
        countryCode: quizSessions.countryCode,
        level: quizSessions.level,
        sessionData: quizSessions.sessionData,
        completedAt: quizSessions.completedAt,
        startedAt: quizSessions.startedAt,
        score: quizSessions.score,
        correctAnswers: quizSessions.correctAnswers,
      })
      .from(quizSessions)
      .where(
        isNotNull(quizSessions.sessionData)
      );

    console.log(`Found ${allSessions.length} sessions with data to analyze`);

    // Get existing rankings to avoid duplicates
    const existingRankings = await db.select().from(rankings);
    const existingKeys = new Set(
      existingRankings.map(r => `${r.userId}-${r.countryCode}-${r.level}`)
    );

    let migratedCount = 0;
    let skippedCount = 0;

    for (const session of allSessions) {
      try {
        // Create unique key for this session
        const sessionKey = `${session.userId}-${session.countryCode}-${session.level}`;
        
        // Skip if we already have a ranking for this user/country/level
        if (existingKeys.has(sessionKey)) {
          console.log(`⚠️  Ranking already exists for user ${session.userId}, ${session.countryCode} Level ${session.level}, skipping`);
          skippedCount++;
          continue;
        }

        // Parse session data
        const sessionData = session.sessionData as any;
        if (!sessionData || !sessionData.answers) {
          console.log(`⚠️  Session ${session.id} has no answer data, skipping`);
          skippedCount++;
          continue;
        }

        const correctAnswers = sessionData?.correctAnswers || 0;
        const totalQuestions = sessionData?.answers?.length || 0;
        const score = sessionData?.score || 0;
        
        // Skip sessions with no meaningful data
        if (totalQuestions === 0) {
          console.log(`⚠️  Session ${session.id} has no questions answered, skipping`);
          skippedCount++;
          continue;
        }

        // Calculate accuracy
        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        // Use completedAt if available, otherwise use startedAt as approximation
        const completionTime = session.completedAt || session.startedAt;

        // Create ranking entry
        await db.insert(rankings).values({
          userId: session.userId,
          countryCode: session.countryCode,
          level: session.level,
          score,
          correctAnswers,
          totalQuestions,
          accuracy,
          completedAt: completionTime,
        });

        // Mark this combination as processed
        existingKeys.add(sessionKey);

        migratedCount++;
        console.log(`✅ Migrated session ${session.id} for user ${session.userId} (${session.countryCode} Level ${session.level}): ${correctAnswers}/${totalQuestions} correct, ${score} points, ${accuracy}% accuracy`);

      } catch (error) {
        console.error(`❌ Error migrating session ${session.id}:`, error);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} sessions`);
    console.log(`⚠️  Skipped (already exists/no data): ${skippedCount} sessions`);
    console.log(`📝 Total processed: ${allSessions.length} sessions`);

    // Verify rankings count
    const totalRankings = await db.select().from(rankings);
    console.log(`🎯 Total rankings in database: ${totalRankings.length}`);

    // Show some sample rankings
    const sampleRankings = await db
      .select({
        id: rankings.id,
        userId: rankings.userId,
        countryCode: rankings.countryCode,
        level: rankings.level,
        score: rankings.score,
        correctAnswers: rankings.correctAnswers,
        totalQuestions: rankings.totalQuestions,
        accuracy: rankings.accuracy,
      })
      .from(rankings)
      .limit(5);

    console.log('\n📈 Sample rankings:');
    sampleRankings.forEach(ranking => {
      console.log(`  User ${ranking.userId}: ${ranking.countryCode} L${ranking.level} - ${ranking.correctAnswers}/${ranking.totalQuestions} (${ranking.accuracy}%) - Score: ${ranking.score}`);
    });

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateAllSessions()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });