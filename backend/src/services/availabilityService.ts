import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { getWorkingHours } from './clinicConfigService.js';

// ─── Interfaces ──────────────────────────────────────────────

interface AvailabilityInput {
  dayOfWeek: number;   // 0=Sun … 6=Sat
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM
  isAvailable: boolean;
}

interface TimeSlot {
  time: string;
  status: 'free' | 'booked';
  appointment?: {
    id: number;
    patientName: string;
    status: string;
    reason: string | null;
    isEmergency: boolean;
  };
}

// ─── Time Helpers ────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Normalize a TIME value returned by Postgres (could be "08:00:00") to "HH:MM".
 */
function normalizeTime(t: string): string {
  return t.substring(0, 5);
}

// ─── Internal: resolve dentist record ID from user ID ────────

async function getDentistRecordId(dentistUserId: string | number): Promise<number> {
  const result = await query(
    'SELECT id FROM dentists WHERE user_id = $1',
    [dentistUserId]
  );
  if (result.rows.length === 0) {
    throw new AppError('Dentist profile not found.', 404);
  }
  return result.rows[0].id;
}

// ═══════════════════════════════════════════════════════════════
// AVAILABILITY CRUD
// ═══════════════════════════════════════════════════════════════

/**
 * Set / replace the full weekly availability for a dentist.
 * Uses upsert (INSERT … ON CONFLICT) — any provided days are replaced,
 * days NOT provided in the input are deleted.
 */
export async function setAvailability(dentistId: number, availabilityData: AvailabilityInput[]) {
  // Validate dentist exists
  const dentistCheck = await query('SELECT id FROM dentists WHERE id = $1', [dentistId]);
  if (dentistCheck.rows.length === 0) {
    throw new AppError('Dentist not found.', 404);
  }

  // Validate inputs
  for (const entry of availabilityData) {
    if (entry.dayOfWeek < 0 || entry.dayOfWeek > 6) {
      throw new AppError(`Invalid dayOfWeek: ${entry.dayOfWeek}. Must be 0-6.`, 400);
    }
    if (timeToMinutes(entry.startTime) >= timeToMinutes(entry.endTime)) {
      throw new AppError(
        `startTime (${entry.startTime}) must be before endTime (${entry.endTime}) for day ${entry.dayOfWeek}.`,
        400
      );
    }
  }

  // Check for duplicate days in input
  const days = availabilityData.map((d) => d.dayOfWeek);
  if (new Set(days).size !== days.length) {
    throw new AppError('Duplicate dayOfWeek entries are not allowed.', 400);
  }

  // Delete existing availability for this dentist (full replace)
  await query('DELETE FROM dentist_availability WHERE dentist_id = $1', [dentistId]);

  // Insert new entries
  const results = [];
  for (const entry of availabilityData) {
    const result = await query(
      `INSERT INTO dentist_availability (dentist_id, day_of_week, start_time, end_time, is_available)
       VALUES ($1, $2, $3::time, $4::time, $5)
       RETURNING *`,
      [dentistId, entry.dayOfWeek, entry.startTime, entry.endTime, entry.isAvailable]
    );
    results.push(result.rows[0]);
  }

  return results;
}

/**
 * Get the full weekly availability for a dentist.
 */
export async function getAvailability(dentistId: number) {
  // Validate dentist exists
  const dentistCheck = await query(
    `SELECT d.id, u.full_name AS dentist_name, d.specialization
     FROM dentists d
     INNER JOIN users u ON u.id = d.user_id
     WHERE d.id = $1`,
    [dentistId]
  );
  if (dentistCheck.rows.length === 0) {
    throw new AppError('Dentist not found.', 404);
  }

  const result = await query(
    `SELECT id, dentist_id, day_of_week, start_time, end_time, is_available
     FROM dentist_availability
     WHERE dentist_id = $1
     ORDER BY day_of_week ASC`,
    [dentistId]
  );

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    dentist: dentistCheck.rows[0],
    availability: result.rows.map((row: Record<string, unknown>) => ({
      ...row,
      start_time: normalizeTime(row.start_time as string),
      end_time: normalizeTime(row.end_time as string),
      dayName: dayNames[row.day_of_week as number],
    })),
  };
}

/**
 * Update availability for a single day of the week.
 */
export async function updateDayAvailability(
  dentistId: number,
  dayOfWeek: number,
  data: { startTime?: string; endTime?: string; isAvailable?: boolean }
) {
  // Validate dentist exists
  const dentistCheck = await query('SELECT id FROM dentists WHERE id = $1', [dentistId]);
  if (dentistCheck.rows.length === 0) {
    throw new AppError('Dentist not found.', 404);
  }

  // Check existing entry for this day
  const existing = await query(
    'SELECT * FROM dentist_availability WHERE dentist_id = $1 AND day_of_week = $2',
    [dentistId, dayOfWeek]
  );

  if (existing.rows.length === 0) {
    // Create a new entry — need startTime/endTime
    if (!data.startTime || !data.endTime) {
      throw new AppError('startTime and endTime are required when creating availability for a new day.', 400);
    }

    if (timeToMinutes(data.startTime) >= timeToMinutes(data.endTime)) {
      throw new AppError(`startTime (${data.startTime}) must be before endTime (${data.endTime}).`, 400);
    }

    const result = await query(
      `INSERT INTO dentist_availability (dentist_id, day_of_week, start_time, end_time, is_available)
       VALUES ($1, $2, $3::time, $4::time, $5)
       RETURNING *`,
      [dentistId, dayOfWeek, data.startTime, data.endTime, data.isAvailable ?? true]
    );

    return result.rows[0];
  }

  // Update existing entry
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (data.startTime !== undefined) {
    updates.push(`start_time = $${paramIdx++}::time`);
    params.push(data.startTime);
  }
  if (data.endTime !== undefined) {
    updates.push(`end_time = $${paramIdx++}::time`);
    params.push(data.endTime);
  }
  if (data.isAvailable !== undefined) {
    updates.push(`is_available = $${paramIdx++}`);
    params.push(data.isAvailable);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update.', 400);
  }

  // Validate times if both are being set
  const finalStart = data.startTime || normalizeTime(existing.rows[0].start_time);
  const finalEnd = data.endTime || normalizeTime(existing.rows[0].end_time);
  if (timeToMinutes(finalStart) >= timeToMinutes(finalEnd)) {
    throw new AppError(`startTime (${finalStart}) must be before endTime (${finalEnd}).`, 400);
  }

  params.push(dentistId, dayOfWeek);
  const result = await query(
    `UPDATE dentist_availability
     SET ${updates.join(', ')}
     WHERE dentist_id = $${paramIdx++} AND day_of_week = $${paramIdx}
     RETURNING *`,
    params
  );

  return result.rows[0];
}

/**
 * Toggle availability on/off for a specific day.
 */
export async function toggleDayAvailability(dentistId: number, dayOfWeek: number) {
  // Validate dentist
  const dentistCheck = await query('SELECT id FROM dentists WHERE id = $1', [dentistId]);
  if (dentistCheck.rows.length === 0) {
    throw new AppError('Dentist not found.', 404);
  }

  const existing = await query(
    'SELECT is_available FROM dentist_availability WHERE dentist_id = $1 AND day_of_week = $2',
    [dentistId, dayOfWeek]
  );

  if (existing.rows.length === 0) {
    throw new AppError(`No availability record found for day ${dayOfWeek}. Set availability first.`, 404);
  }

  const newValue = !existing.rows[0].is_available;

  const result = await query(
    `UPDATE dentist_availability
     SET is_available = $1
     WHERE dentist_id = $2 AND day_of_week = $3
     RETURNING *`,
    [newValue, dentistId, dayOfWeek]
  );

  return result.rows[0];
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULE VIEWS
// ═══════════════════════════════════════════════════════════════

/**
 * Get detailed day schedule for a dentist on a specific date.
 * Returns the availability window, all booked appointments, and
 * a combined slot-by-slot view showing occupied and free slots.
 */
export async function getDentistDaySchedule(dentistId: number, date: string) {
  // Validate dentist
  const dentistResult = await query(
    `SELECT d.id, u.full_name AS dentist_name, d.specialization
     FROM dentists d
     INNER JOIN users u ON u.id = d.user_id
     WHERE d.id = $1`,
    [dentistId]
  );
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist not found.', 404);
  }
  const dentist = dentistResult.rows[0];

  const dayOfWeek = new Date(date).getDay();

  // Get dentist availability for this day
  const availResult = await query(
    `SELECT start_time, end_time, is_available
     FROM dentist_availability
     WHERE dentist_id = $1 AND day_of_week = $2`,
    [dentistId, dayOfWeek]
  );

  // Get clinic working hours
  const workingHours = await getWorkingHours();
  const slotDuration = workingHours.appointmentDuration;

  // If no availability record or not available, return empty schedule
  if (availResult.rows.length === 0 || !availResult.rows[0].is_available) {
    return {
      dentist: { id: dentist.id, name: dentist.dentist_name, specialization: dentist.specialization },
      date,
      dayOfWeek,
      isAvailable: false,
      availability: null,
      bookedAppointments: [],
      slots: [],
      summary: { totalSlots: 0, bookedSlots: 0, freeSlots: 0 },
    };
  }

  const availability = availResult.rows[0];
  const dentistStart = normalizeTime(availability.start_time);
  const dentistEnd = normalizeTime(availability.end_time);

  // Effective window = intersection of clinic hours and dentist hours
  const effectiveStart = Math.max(
    timeToMinutes(workingHours.openingTime),
    timeToMinutes(dentistStart)
  );
  const effectiveEnd = Math.min(
    timeToMinutes(workingHours.closingTime),
    timeToMinutes(dentistEnd)
  );

  // Get booked appointments for this date (active statuses only)
  const bookedResult = await query(
    `SELECT a.id, a.appointment_time, a.status, a.is_emergency, a.reason,
            u_p.full_name AS patient_name
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN users u_p ON u_p.id = p.user_id
     WHERE a.dentist_id = $1 AND a.appointment_date = $2
       AND a.status NOT IN ('cancelled', 'rejected')
     ORDER BY a.appointment_time ASC`,
    [dentistId, date]
  );

  // Build a map of booked times
  const bookedMap = new Map<string, Record<string, unknown>>();
  for (const appt of bookedResult.rows) {
    const timeKey = normalizeTime(appt.appointment_time);
    bookedMap.set(timeKey, appt);
  }

  // Generate slot-by-slot view
  const slots: TimeSlot[] = [];
  for (let t = effectiveStart; t + slotDuration <= effectiveEnd; t += slotDuration) {
    const timeStr = minutesToTime(t);
    const booked = bookedMap.get(timeStr);

    if (booked) {
      slots.push({
        time: timeStr,
        status: 'booked',
        appointment: {
          id: booked.id as number,
          patientName: booked.patient_name as string,
          status: booked.status as string,
          reason: booked.reason as string | null,
          isEmergency: booked.is_emergency as boolean,
        },
      });
    } else {
      slots.push({ time: timeStr, status: 'free' });
    }
  }

  const bookedSlots = slots.filter((s) => s.status === 'booked').length;
  const freeSlots = slots.filter((s) => s.status === 'free').length;

  return {
    dentist: { id: dentist.id, name: dentist.dentist_name, specialization: dentist.specialization },
    date,
    dayOfWeek,
    isAvailable: true,
    availability: {
      startTime: dentistStart,
      endTime: dentistEnd,
      effectiveStartTime: minutesToTime(effectiveStart),
      effectiveEndTime: minutesToTime(effectiveEnd),
    },
    bookedAppointments: bookedResult.rows.map((r: Record<string, unknown>) => ({
      ...r,
      appointment_time: normalizeTime(r.appointment_time as string),
    })),
    slots,
    summary: {
      totalSlots: slots.length,
      bookedSlots,
      freeSlots,
      slotDurationMinutes: slotDuration,
    },
  };
}

/**
 * Get a 7-day week schedule overview for a dentist.
 * Starts from weekStartDate and covers 7 consecutive days.
 */
export async function getDentistWeekSchedule(dentistId: number, weekStartDate: string) {
  // Validate dentist
  const dentistResult = await query(
    `SELECT d.id, u.full_name AS dentist_name, d.specialization
     FROM dentists d
     INNER JOIN users u ON u.id = d.user_id
     WHERE d.id = $1`,
    [dentistId]
  );
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist not found.', 404);
  }
  const dentist = dentistResult.rows[0];

  // Get all availability for this dentist
  const availResult = await query(
    `SELECT day_of_week, start_time, end_time, is_available
     FROM dentist_availability
     WHERE dentist_id = $1`,
    [dentistId]
  );

  const availMap = new Map<number, Record<string, unknown>>();
  for (const row of availResult.rows) {
    availMap.set(row.day_of_week, row);
  }

  // Get appointment counts for the 7-day window
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const endDateStr = endDate.toISOString().split('T')[0];

  const appointmentCounts = await query(
    `SELECT appointment_date, COUNT(*) AS count
     FROM appointments
     WHERE dentist_id = $1
       AND appointment_date >= $2
       AND appointment_date <= $3
       AND status NOT IN ('cancelled', 'rejected')
     GROUP BY appointment_date`,
    [dentistId, weekStartDate, endDateStr]
  );

  const countMap = new Map<string, number>();
  for (const row of appointmentCounts.rows) {
    // Normalize date to YYYY-MM-DD string
    const dateStr = new Date(row.appointment_date).toISOString().split('T')[0];
    countMap.set(dateStr, parseInt(row.count, 10));
  }

  // Build 7-day overview
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const days = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const dow = currentDate.getDay();

    const avail = availMap.get(dow);
    const appointmentCount = countMap.get(dateStr) || 0;

    days.push({
      date: dateStr,
      dayOfWeek: dow,
      dayName: dayNames[dow],
      isAvailable: avail ? avail.is_available : false,
      startTime: avail ? normalizeTime(avail.start_time as string) : null,
      endTime: avail ? normalizeTime(avail.end_time as string) : null,
      appointmentCount,
    });
  }

  return {
    dentist: { id: dentist.id, name: dentist.dentist_name, specialization: dentist.specialization },
    weekStart: weekStartDate,
    weekEnd: endDateStr,
    days,
  };
}

/**
 * Find dentists available at a specific date and time.
 * Used by receptionists when reassigning appointments.
 */
export async function getAvailableDentistsForSlot(date: string, time: string) {
  const dayOfWeek = new Date(date).getDay();

  // Get clinic config for slot duration
  const workingHours = await getWorkingHours();
  const slotDuration = workingHours.appointmentDuration;

  // Find dentists who:
  // 1. Have availability on this day of week
  // 2. The time falls within their availability window
  // 3. Are active users
  // 4. Don't already have an appointment at this time
  const result = await query(
    `SELECT d.id AS dentist_id, u.full_name AS dentist_name, d.specialization,
            da.start_time, da.end_time
     FROM dentists d
     INNER JOIN users u ON u.id = d.user_id
     INNER JOIN dentist_availability da ON da.dentist_id = d.id
     WHERE da.day_of_week = $1
       AND da.is_available = true
       AND da.start_time <= $2::time
       AND da.end_time >= ($2::time + ($3 || ' minutes')::interval)
       AND u.is_active = true
       AND d.id NOT IN (
         SELECT a.dentist_id FROM appointments a
         WHERE a.appointment_date = $4
           AND a.appointment_time = $2::time
           AND a.status NOT IN ('cancelled', 'rejected')
       )
     ORDER BY u.full_name ASC`,
    [dayOfWeek, time, slotDuration, date]
  );

  return {
    date,
    time,
    dayOfWeek,
    availableDentists: result.rows.map((row: Record<string, unknown>) => ({
      ...row,
      start_time: normalizeTime(row.start_time as string),
      end_time: normalizeTime(row.end_time as string),
    })),
  };
}
