import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Interfaces ──────────────────────────────────────────────

interface WorkingHours {
  workingDays: number[];
  openingTime: string;
  closingTime: string;
  appointmentDuration: number;
}

// ═══════════════════════════════════════════════════════════════
// CONFIG OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get a single config value by key.
 */
export async function getConfig(key: string): Promise<string | null> {
  const result = await query(
    'SELECT config_value FROM clinic_configuration WHERE config_key = $1',
    [key]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].config_value;
}

/**
 * Get all config entries as a key-value map.
 */
export async function getAllConfig(): Promise<Record<string, string>> {
  const result = await query(
    'SELECT config_key, config_value, description FROM clinic_configuration ORDER BY config_key'
  );

  const config: Record<string, string> = {};
  for (const row of result.rows) {
    config[row.config_key] = row.config_value;
  }
  return config;
}

/**
 * Get all config entries with full detail (key, value, description).
 */
export async function getAllConfigDetailed() {
  const result = await query(
    'SELECT id, config_key, config_value, description, updated_at FROM clinic_configuration ORDER BY config_key'
  );

  return result.rows;
}

/**
 * Update a single config value (admin only).
 * Returns the updated row.
 */
export async function updateConfig(key: string, value: string) {
  // Check the key exists
  const existing = await query(
    'SELECT id FROM clinic_configuration WHERE config_key = $1',
    [key]
  );

  if (existing.rows.length === 0) {
    throw new AppError(`Configuration key '${key}' not found.`, 404);
  }

  const result = await query(
    `UPDATE clinic_configuration
     SET config_value = $1, updated_at = CURRENT_TIMESTAMP
     WHERE config_key = $2
     RETURNING config_key, config_value, description, updated_at`,
    [value, key]
  );

  return result.rows[0];
}

/**
 * Get parsed working hours from clinic configuration.
 * Convenience method that returns structured data instead of raw strings.
 */
export async function getWorkingHours(): Promise<WorkingHours> {
  const config = await getAllConfig();

  const workingDaysStr = config['working_days'];
  const openingTime = config['opening_time'];
  const closingTime = config['closing_time'];
  const durationStr = config['appointment_duration_minutes'];

  if (!workingDaysStr || !openingTime || !closingTime || !durationStr) {
    throw new AppError('Clinic configuration is incomplete. Missing required keys.', 500);
  }

  return {
    workingDays: workingDaysStr.split(',').map(Number),
    openingTime,
    closingTime,
    appointmentDuration: parseInt(durationStr, 10),
  };
}
