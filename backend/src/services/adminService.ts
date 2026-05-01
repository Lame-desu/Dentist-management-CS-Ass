import { query } from '../config/database.js';

// ═══════════════════════════════════════════════════════════════
// DASHBOARD STATISTICS
// ═══════════════════════════════════════════════════════════════

/**
 * Get aggregate dashboard statistics:
 * - Total patients, dentists, receptionists
 * - Today's appointments (by status)
 * - This week's and this month's appointment counts
 * - Status distribution (pie chart data)
 * - Top 5 busiest dentists
 */
export async function getDashboardStats() {
  // ── User Counts ────────────────────────────────────────────
  const userCountsResult = await query(
    `SELECT role, COUNT(*) AS count
     FROM users
     WHERE is_active = true
     GROUP BY role`
  );

  const userCounts: Record<string, number> = {
    patient: 0,
    dentist: 0,
    receptionist: 0,
    admin: 0,
  };

  for (const row of userCountsResult.rows) {
    userCounts[row.role] = parseInt(row.count, 10);
  }

  // ── Today's Appointments ───────────────────────────────────
  const todayApptResult = await query(
    `SELECT status, COUNT(*) AS count
     FROM appointments
     WHERE appointment_date = CURRENT_DATE
     GROUP BY status`
  );

  const todayAppointments: Record<string, number> = {};
  let todayTotal = 0;
  for (const row of todayApptResult.rows) {
    const count = parseInt(row.count, 10);
    todayAppointments[row.status] = count;
    todayTotal += count;
  }
  todayAppointments.total = todayTotal;

  // ── This Week's Appointments ───────────────────────────────
  const weekApptResult = await query(
    `SELECT COUNT(*) AS count
     FROM appointments
     WHERE appointment_date >= date_trunc('week', CURRENT_DATE)
       AND appointment_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'`
  );
  const thisWeekCount = parseInt(weekApptResult.rows[0].count, 10);

  // ── This Month's Appointments ──────────────────────────────
  const monthApptResult = await query(
    `SELECT COUNT(*) AS count
     FROM appointments
     WHERE appointment_date >= date_trunc('month', CURRENT_DATE)
       AND appointment_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`
  );
  const thisMonthCount = parseInt(monthApptResult.rows[0].count, 10);

  // ── Appointment Status Distribution (pie chart) ────────────
  const statusDistResult = await query(
    `SELECT status, COUNT(*) AS count
     FROM appointments
     GROUP BY status
     ORDER BY count DESC`
  );

  const statusDistribution = statusDistResult.rows.map((row) => ({
    status: row.status,
    count: parseInt(row.count, 10),
  }));

  // ── Top 5 Busiest Dentists ─────────────────────────────────
  const busiestResult = await query(
    `SELECT d.id AS dentist_id, u.full_name AS dentist_name,
            d.specialization, COUNT(a.id) AS appointment_count
     FROM dentists d
     INNER JOIN users u ON u.id = d.user_id
     LEFT JOIN appointments a ON a.dentist_id = d.id
     WHERE u.is_active = true
     GROUP BY d.id, u.full_name, d.specialization
     ORDER BY appointment_count DESC
     LIMIT 5`
  );

  const topDentists = busiestResult.rows.map((row) => ({
    dentistId: row.dentist_id,
    dentistName: row.dentist_name,
    specialization: row.specialization,
    appointmentCount: parseInt(row.appointment_count, 10),
  }));

  return {
    users: {
      totalPatients: userCounts.patient,
      totalDentists: userCounts.dentist,
      totalReceptionists: userCounts.receptionist,
      totalAdmins: userCounts.admin,
    },
    todayAppointments,
    thisWeekAppointments: thisWeekCount,
    thisMonthAppointments: thisMonthCount,
    statusDistribution,
    topDentists,
  };
}

// ═══════════════════════════════════════════════════════════════
// APPOINTMENT REPORT
// ═══════════════════════════════════════════════════════════════

/**
 * Detailed appointment statistics for a date range:
 * - Daily appointment counts
 * - Status distribution
 * - Average appointments per dentist
 * - Cancellation rate
 * - Emergency appointment count
 */
export async function getAppointmentReport(from: string, to: string) {
  // ── Daily Appointment Counts ───────────────────────────────
  const dailyResult = await query(
    `SELECT appointment_date::text AS date, COUNT(*) AS count
     FROM appointments
     WHERE appointment_date >= $1 AND appointment_date <= $2
     GROUP BY appointment_date
     ORDER BY appointment_date ASC`,
    [from, to]
  );

  const dailyCounts = dailyResult.rows.map((row) => ({
    date: row.date,
    count: parseInt(row.count, 10),
  }));

  // ── Status Distribution ────────────────────────────────────
  const statusResult = await query(
    `SELECT status, COUNT(*) AS count
     FROM appointments
     WHERE appointment_date >= $1 AND appointment_date <= $2
     GROUP BY status
     ORDER BY count DESC`,
    [from, to]
  );

  const statusDistribution = statusResult.rows.map((row) => ({
    status: row.status,
    count: parseInt(row.count, 10),
  }));

  // ── Total for the period ───────────────────────────────────
  const totalResult = await query(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE appointment_date >= $1 AND appointment_date <= $2`,
    [from, to]
  );
  const totalAppointments = parseInt(totalResult.rows[0].total, 10);

  // ── Average appointments per dentist ───────────────────────
  const avgPerDentistResult = await query(
    `SELECT AVG(cnt) AS avg_per_dentist FROM (
       SELECT dentist_id, COUNT(*) AS cnt
       FROM appointments
       WHERE appointment_date >= $1 AND appointment_date <= $2
       GROUP BY dentist_id
     ) sub`,
    [from, to]
  );
  const avgPerDentist = avgPerDentistResult.rows[0].avg_per_dentist
    ? Math.round(parseFloat(avgPerDentistResult.rows[0].avg_per_dentist) * 10) / 10
    : 0;

  // ── Cancellation Rate ──────────────────────────────────────
  const cancelledResult = await query(
    `SELECT COUNT(*) AS count FROM appointments
     WHERE appointment_date >= $1 AND appointment_date <= $2 AND status = 'cancelled'`,
    [from, to]
  );
  const cancelledCount = parseInt(cancelledResult.rows[0].count, 10);
  const cancellationRate = totalAppointments > 0
    ? Math.round((cancelledCount / totalAppointments) * 100 * 10) / 10
    : 0;

  // ── Emergency Appointment Count ────────────────────────────
  const emergencyResult = await query(
    `SELECT COUNT(*) AS count FROM appointments
     WHERE appointment_date >= $1 AND appointment_date <= $2 AND is_emergency = true`,
    [from, to]
  );
  const emergencyCount = parseInt(emergencyResult.rows[0].count, 10);

  return {
    period: { from, to },
    totalAppointments,
    dailyCounts,
    statusDistribution,
    avgAppointmentsPerDentist: avgPerDentist,
    cancellationRate,
    emergencyCount,
  };
}

// ═══════════════════════════════════════════════════════════════
// PATIENT REPORT
// ═══════════════════════════════════════════════════════════════

/**
 * Patient statistics:
 * - New patient registrations over time
 * - Total active patients
 * - Patients with most visits
 */
export async function getPatientReport(from?: string, to?: string) {
  // ── New Patient Registrations ──────────────────────────────
  const conditions: string[] = ["u.role = 'patient'"];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (from) {
    conditions.push(`u.created_at >= $${paramIdx++}::date`);
    params.push(from);
  }
  if (to) {
    conditions.push(`u.created_at < ($${paramIdx++}::date + INTERVAL '1 day')`);
    params.push(to);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const registrationsResult = await query(
    `SELECT u.created_at::date::text AS date, COUNT(*) AS count
     FROM users u
     ${whereClause}
     GROUP BY u.created_at::date
     ORDER BY u.created_at::date ASC`,
    params
  );

  const registrations = registrationsResult.rows.map((row) => ({
    date: row.date,
    count: parseInt(row.count, 10),
  }));

  // ── Total Active Patients ──────────────────────────────────
  const activeResult = await query(
    `SELECT COUNT(*) AS count FROM users WHERE role = 'patient' AND is_active = true`
  );
  const totalActivePatients = parseInt(activeResult.rows[0].count, 10);

  // ── Patients with Most Visits ──────────────────────────────
  const topPatientsResult = await query(
    `SELECT p.id AS patient_id, u.full_name AS patient_name,
            COUNT(a.id) AS visit_count
     FROM patients p
     INNER JOIN users u ON u.id = p.user_id
     LEFT JOIN appointments a ON a.patient_id = p.id AND a.status = 'completed'
     WHERE u.is_active = true
     GROUP BY p.id, u.full_name
     ORDER BY visit_count DESC
     LIMIT 10`
  );

  const topPatients = topPatientsResult.rows.map((row) => ({
    patientId: row.patient_id,
    patientName: row.patient_name,
    visitCount: parseInt(row.visit_count, 10),
  }));

  return {
    period: { from: from || 'all-time', to: to || 'present' },
    totalActivePatients,
    newRegistrations: registrations,
    topPatientsByVisits: topPatients,
  };
}
