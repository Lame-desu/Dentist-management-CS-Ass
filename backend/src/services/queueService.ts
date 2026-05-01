import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { AppointmentStatus, QueueStatus, NotificationType } from '../utils/constants.js';
import { createNotification } from './notificationService.js';

// ═══════════════════════════════════════════════════════════════
// ADD TO QUEUE
// ═══════════════════════════════════════════════════════════════

/**
 * Add an approved appointment's patient to today's queue.
 * - Validates: appointment is 'approved', appointment date is today
 * - Auto-assigns next queue number for today
 * - Creates queue entry with status 'waiting'
 * - Notifies the dentist
 */
export async function addToQueue(appointmentId: number, receptionistId?: string) {
  // 1. Get appointment with patient and dentist details
  const apptResult = await query(
    `SELECT a.*,
            p.id AS pat_id, p.user_id AS patient_user_id,
            u_p.full_name AS patient_name,
            d.id AS dent_id, d.user_id AS dentist_user_id,
            u_d.full_name AS dentist_name
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN users u_p ON u_p.id = p.user_id
     INNER JOIN dentists d ON d.id = a.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     WHERE a.id = $1`,
    [appointmentId]
  );

  if (apptResult.rows.length === 0) {
    throw new AppError('Appointment not found.', 404);
  }

  const appointment = apptResult.rows[0];

  // 2. Validate appointment status is 'approved'
  if (appointment.status !== AppointmentStatus.APPROVED) {
    throw new AppError(
      `Only approved appointments can be added to the queue. Current status: '${appointment.status}'.`,
      400
    );
  }

  // 3. Validate appointment date is today
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const apptDate = new Date(appointment.appointment_date).toISOString().split('T')[0];

  if (apptDate !== todayStr) {
    throw new AppError(
      'Only appointments scheduled for today can be added to the queue.',
      400
    );
  }

  // 4. Check if already in queue
  const existingEntry = await query(
    'SELECT id FROM queue_entries WHERE appointment_id = $1',
    [appointmentId]
  );
  if (existingEntry.rows.length > 0) {
    throw new AppError('This appointment is already in the queue.', 409);
  }

  // 5. Get next queue number for today
  const maxQueueResult = await query(
    'SELECT COALESCE(MAX(queue_number), 0) AS max_num FROM queue_entries WHERE queue_date = CURRENT_DATE'
  );
  const nextQueueNumber = parseInt(maxQueueResult.rows[0].max_num, 10) + 1;

  // 6. Create queue entry
  const queueResult = await query(
    `INSERT INTO queue_entries (appointment_id, patient_id, dentist_id, queue_number, status, queue_date)
     VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
     RETURNING *`,
    [
      appointmentId,
      appointment.pat_id,
      appointment.dent_id,
      nextQueueNumber,
      QueueStatus.WAITING,
    ]
  );

  const queueEntry = queueResult.rows[0];

  // 7. Notify the dentist
  await createNotification(
    appointment.dentist_user_id,
    'Patient Arrived',
    `Patient ${appointment.patient_name} has arrived (Queue #${nextQueueNumber}).`,
    NotificationType.GENERAL,
    appointmentId
  );

  return {
    ...queueEntry,
    patient_name: appointment.patient_name,
    dentist_name: appointment.dentist_name,
  };
}

// ═══════════════════════════════════════════════════════════════
// GET TODAY'S QUEUE
// ═══════════════════════════════════════════════════════════════

/**
 * Get today's queue entries, optionally filtered by dentist.
 * Returns with patient and dentist details, sorted by queue_number.
 */
export async function getTodayQueue(dentistId?: number) {
  const conditions: string[] = ['qe.queue_date = CURRENT_DATE'];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (dentistId) {
    conditions.push(`qe.dentist_id = $${paramIdx++}`);
    params.push(dentistId);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const result = await query(
    `SELECT qe.*,
            u_p.full_name AS patient_name, u_p.phone_number AS patient_phone,
            u_d.full_name AS dentist_name,
            a.appointment_time, a.is_emergency, a.reason
     FROM queue_entries qe
     INNER JOIN patients p ON p.id = qe.patient_id
     INNER JOIN users u_p ON u_p.id = p.user_id
     INNER JOIN dentists d ON d.id = qe.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     INNER JOIN appointments a ON a.id = qe.appointment_id
     ${whereClause}
     ORDER BY qe.queue_number ASC`,
    params
  );

  return result.rows;
}

// ═══════════════════════════════════════════════════════════════
// CALL PATIENT
// ═══════════════════════════════════════════════════════════════

/**
 * Mark patient as 'in_progress' (being seen). Sets called_time.
 */
export async function callPatient(queueEntryId: string, receptionistId: string) {
  const entryResult = await query(
    `SELECT qe.*, u_p.full_name AS patient_name, p.user_id AS patient_user_id,
            d.user_id AS dentist_user_id, u_d.full_name AS dentist_name
     FROM queue_entries qe
     INNER JOIN patients p ON p.id = qe.patient_id
     INNER JOIN users u_p ON u_p.id = p.user_id
     INNER JOIN dentists d ON d.id = qe.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     WHERE qe.id = $1`,
    [queueEntryId]
  );

  if (entryResult.rows.length === 0) {
    throw new AppError('Queue entry not found.', 404);
  }

  const entry = entryResult.rows[0];

  if (entry.status !== QueueStatus.WAITING) {
    throw new AppError(
      `Can only call patients with 'waiting' status. Current status: '${entry.status}'.`,
      400
    );
  }

  await query(
    `UPDATE queue_entries SET status = $1, called_time = CURRENT_TIMESTAMP WHERE id = $2`,
    [QueueStatus.IN_PROGRESS, queueEntryId]
  );

  // Notify the patient
  await createNotification(
    entry.patient_user_id,
    'Your Turn',
    `You are being called. Please proceed to Dr. ${entry.dentist_name}'s office.`,
    NotificationType.GENERAL,
    entry.appointment_id
  );

  return { id: entry.id, status: QueueStatus.IN_PROGRESS };
}

// ═══════════════════════════════════════════════════════════════
// COMPLETE QUEUE ENTRY
// ═══════════════════════════════════════════════════════════════

/**
 * Mark queue entry as completed. Sets completed_time.
 */
export async function completeQueueEntry(queueEntryId: string) {
  const entryResult = await query(
    'SELECT * FROM queue_entries WHERE id = $1',
    [queueEntryId]
  );

  if (entryResult.rows.length === 0) {
    throw new AppError('Queue entry not found.', 404);
  }

  const entry = entryResult.rows[0];

  if (entry.status !== QueueStatus.IN_PROGRESS) {
    throw new AppError(
      `Can only complete entries with 'in_progress' status. Current status: '${entry.status}'.`,
      400
    );
  }

  await query(
    `UPDATE queue_entries SET status = $1, completed_time = CURRENT_TIMESTAMP WHERE id = $2`,
    [QueueStatus.COMPLETED, queueEntryId]
  );

  return { id: entry.id, status: QueueStatus.COMPLETED };
}

// ═══════════════════════════════════════════════════════════════
// CANCEL QUEUE ENTRY
// ═══════════════════════════════════════════════════════════════

/**
 * Mark queue entry as cancelled (patient left).
 */
export async function cancelQueueEntry(queueEntryId: string) {
  const entryResult = await query(
    'SELECT * FROM queue_entries WHERE id = $1',
    [queueEntryId]
  );

  if (entryResult.rows.length === 0) {
    throw new AppError('Queue entry not found.', 404);
  }

  const entry = entryResult.rows[0];

  if (entry.status === QueueStatus.COMPLETED) {
    throw new AppError('Cannot cancel an already completed queue entry.', 400);
  }

  if (entry.status === 'cancelled') {
    throw new AppError('Queue entry is already cancelled.', 400);
  }

  await query(
    `UPDATE queue_entries SET status = $1 WHERE id = $2`,
    ['cancelled', queueEntryId]
  );

  return { id: entry.id, status: 'cancelled' };
}

// ═══════════════════════════════════════════════════════════════
// QUEUE STATISTICS
// ═══════════════════════════════════════════════════════════════

/**
 * Get queue statistics for a given date (defaults to today).
 * Includes: total waiting, in progress, completed, cancelled, and average wait time.
 */
export async function getQueueStats(date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Status counts
  const statusResult = await query(
    `SELECT status, COUNT(*) AS count
     FROM queue_entries
     WHERE queue_date = $1
     GROUP BY status`,
    [targetDate]
  );

  const counts: Record<string, number> = {
    waiting: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  };

  for (const row of statusResult.rows) {
    const count = parseInt(row.count, 10);
    counts[row.status] = count;
    counts.total += count;
  }

  // Average wait time (from check_in_time to called_time for entries that have been called)
  const avgWaitResult = await query(
    `SELECT AVG(EXTRACT(EPOCH FROM (called_time - check_in_time)) / 60) AS avg_wait_minutes
     FROM queue_entries
     WHERE queue_date = $1 AND called_time IS NOT NULL`,
    [targetDate]
  );

  const avgWaitMinutes = avgWaitResult.rows[0].avg_wait_minutes
    ? Math.round(parseFloat(avgWaitResult.rows[0].avg_wait_minutes))
    : 0;

  return {
    date: targetDate,
    ...counts,
    averageWaitMinutes: avgWaitMinutes,
  };
}
