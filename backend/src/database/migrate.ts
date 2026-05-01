import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';

// ─── Resolve __dirname for ESM ───────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensure the `migrations` tracking table exists.
 */
async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id          SERIAL PRIMARY KEY,
      filename    VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Return a sorted list of .sql filenames from the migrations directory.
 */
function getMigrationFiles(): string[] {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.warn('⚠️  Migrations directory not found:', migrationsDir);
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

/**
 * Return the set of migration filenames that have already been executed.
 */
async function getExecutedMigrations(): Promise<Set<string>> {
  const result = await query('SELECT filename FROM migrations ORDER BY id');
  return new Set(result.rows.map((row: { filename: string }) => row.filename));
}

/**
 * Run all pending SQL migration files in order.
 *
 * - Creates a `migrations` tracking table if it doesn't exist.
 * - Reads .sql files from `./migrations/`, skipping any already executed.
 * - Wraps each migration in a transaction for atomicity.
 */
export async function runMigrations(): Promise<void> {
  console.log('\n🔄 Running database migrations…');

  try {
    await ensureMigrationsTable();

    const files = getMigrationFiles();
    const executed = await getExecutedMigrations();

    if (files.length === 0) {
      console.log('📂 No migration files found.');
      return;
    }

    let appliedCount = 0;

    for (const file of files) {
      if (executed.has(file)) {
        console.log(`  ⏭️  ${file} — already applied`);
        continue;
      }

      const filePath = path.join(__dirname, 'migrations', file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`  ▶️  Applying ${file}…`);

      // Wrap each migration in a transaction
      await query('BEGIN');
      try {
        await query(sql);
        await query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        await query('COMMIT');
        console.log(`  ✅ ${file} — applied successfully`);
        appliedCount++;
      } catch (err) {
        await query('ROLLBACK');
        console.error(`  ❌ ${file} — FAILED, rolled back`);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('✅ All migrations are up to date.');
    } else {
      console.log(`✅ Applied ${appliedCount} migration(s) successfully.\n`);
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}
