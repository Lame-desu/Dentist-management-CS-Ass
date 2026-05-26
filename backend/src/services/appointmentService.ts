import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { AppointmentStatus, NotificationType, UserRole } from '../utils/constants.js';
import { createNotification } from './notificationService.js';
import {
  sendNewAppointmentRequestEmail,
  sendAppointmentForwardedEmail,
  sendAppointmentRejectedEmail,
  sendAppointmentAssignedEmail,
  sendAppointmentReassignedEmail,
  sendAppointmentApprovedEmail,
  sendDentistRejectedNotificationEmail,
  sendAppointmentRescheduleEmail,
  sendAppointmentCancelledEmail,
  sendWalkInAppointmentEmail,
} from './emailService.js';


interface CreateAppointmentInput {
  dentistId: number;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  isEmergency?: boolean;
  reason?: string;
}

interface AppointmentFilters {
  status?: string;
  from?: string;
  to?: string;
  dentistId?: number;
  patientId?: number;
  page?: number;
  limit?: number;
}

interface WalkInInput {
  patientId?: number;
  patientData?: {
    fullName: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  dentistId: number;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  isEmergency?: boolean;
}

// ─── Clinic Config Helper ────────────────────────────────────


async function getClinicConfig(): Promise<Record<string, string>> {
  const result = await query('SELECT config_key, config_value FROM clinic_configuration');
  const config: Record<string, string> = {};
  for (const row of result.rows) {
    config[row.config_key] = row.config_value;
  }
  return config;
}

// ─── Time Slot Helper ────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════
// PATIENT ACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Patient creates a new appointment request.
 * Status starts as 'pending' — awaiting receptionist review.
 */
export async function createAppointment(patientUserId: string, data: CreateAppointmentInput) {
  const { dentistId, appointmentDate, appointmentTime, isEmergency = false, reason } = data;

  // 1. Validate dentist exists and is active
  const dentistResult = await query(
    `SELECT d.id, d.user_id, u.full_name AS dentist_name
     FROM dentists d
     INNER JOIN users u ON u.id = d.user_id
     WHERE d.id = $1 AND u.is_active = true`,
    [dentistId]
  );
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist not found or is not active.', 404);
  }
  const dentist = dentistResult.rows[0];

  // 2. Get patient record
  const patientResult = await query(
    `SELECT p.id AS patient_id, u.full_name AS patient_name
     FROM patients p
     INNER JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1`,
    [patientUserId]
  );
  if (patientResult.rows.length === 0) {
    throw new AppError('Patient profile not found.', 404);
  }
  const patient = patientResult.rows[0];

  // 3. Validate date is in the future
  const apptDate = new Date(appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (apptDate <= today) {
    throw new AppError('Appointment date must be in the future (not today or past dates).', 400);
  }

  // 4. Get clinic configuration
  const config = await getClinicConfig();
  const workingDays = config.working_days.split(',').map(Number);
  const openingTime = config.opening_time;
  const closingTime = config.closing_time;
  const slotDuration = parseInt(config.appointment_duration_minutes, 10);

  // 5. Check if appointment is on a working day
  const dayOfWeek = apptDate.getDay(); // 0=Sun, 6=Sat
  if (!workingDays.includes(dayOfWeek)) {
    throw new AppError('The clinic is closed on this day. Please choose a working day.', 400);
  }

  // 6. Validate time is within clinic working hours
  const apptMinutes = timeToMinutes(appointmentTime);
  const openMinutes = timeToMinutes(openingTime);
  const closeMinutes = timeToMinutes(closingTime);

  if (apptMinutes < openMinutes || apptMinutes + slotDuration > closeMinutes) {
    throw new AppError(
      `Appointment time must be within clinic hours (${openingTime} - ${closingTime}).`,
      400
    );
  }

  // 7. Check dentist availability for this day of week
  if (!isEmergency) {
    const availResult = await query(
      `SELECT id FROM dentist_availability
       WHERE dentist_id = $1 AND day_of_week = $2 AND is_available = true
         AND start_time <= $3::time AND end_time >= ($3::time + ($4 || ' minutes')::interval)`,
      [dentistId, dayOfWeek, appointmentTime, slotDuration]
    );
    if (availResult.rows.length === 0) {
      throw new AppError('The dentist is not available at the requested day/time.', 400);
    }
  }

  // 8. Check no double-booking
  const conflictResult = await query(
    `SELECT id FROM appointments
     WHERE dentist_id = $1
       AND appointment_date = $2
       AND appointment_time = $3::time
       AND status NOT IN ('cancelled', 'rejected')`,
    [dentistId, appointmentDate, appointmentTime]
  );
  if (conflictResult.rows.length > 0) {
    throw new AppError('This time slot is already booked. Please choose another time.', 409);
  }

  // 9. Create the appointment
  const appointmentResult = await query(
    `INSERT INTO appointments (patient_id, dentist_id, appointment_date, appointment_time, status, is_emergency, reason, created_by_role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      patient.patient_id,
      dentistId,
      appointmentDate,
      appointmentTime,
      AppointmentStatus.PENDING,
      isEmergency,
      reason || null,
      'patient',
    ]
  );

  const appointment = appointmentResult.rows[0];

  // 10. Notify ALL active receptionists
  const receptionists = await query(
    `SELECT u.id AS user_id, u.email, u.full_name FROM users u
     INNER JOIN receptionists r ON r.user_id = u.id
     WHERE u.is_active = true`
  );

  for (const rec of receptionists.rows) {
    await createNotification(
      rec.user_id,
      'New Appointment Request',
      `New appointment request from ${patient.patient_name} for Dr. ${dentist.dentist_name} on ${appointmentDate} at ${appointmentTime}.`,
      NotificationType.APPOINTMENT_REQUEST,
      appointment.id
    );

    // Email 9: Notify receptionist about new appointment request
    sendNewAppointmentRequestEmail(
      rec.email,
      rec.full_name,
      patient.patient_name,
      dentist.dentist_name,
      appointmentDate,
      appointmentTime,
      isEmergency,
      reason
    ).catch(() => {});
  }

  return appointment;
}

/**
 * Get a patient's own appointments with optional filters.
 */
export async function getPatientAppointments(patientUserId: string, filters: AppointmentFilters = {}) {
  const { status, from, to, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  // Get patient record id
  const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [patientUserId]);
  if (patientResult.rows.length === 0) {
    throw new AppError('Patient profile not found.', 404);
  }
  const patientId = patientResult.rows[0].id;

  const conditions: string[] = ['a.patient_id = $1'];
  const params: unknown[] = [patientId];
  let paramIdx = 2;

  if (status) {
    conditions.push(`a.status = $${paramIdx++}`);
    params.push(status);
  }
  if (from) {
    conditions.push(`a.appointment_date >= $${paramIdx++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`a.appointment_date <= $${paramIdx++}`);
    params.push(to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count
  const countResult = await query(
    `SELECT COUNT(*) FROM appointments a ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Fetch with dentist details
  const appointmentsResult = await query(
    `SELECT a.*, u_d.full_name AS dentist_name, d.specialization
     FROM appointments a
     INNER JOIN dentists d ON d.id = a.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     ${whereClause}
     ORDER BY a.appointment_date DESC, a.appointment_time DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    [...params, limit, offset]
  );

  return {
    appointments: appointmentsResult.rows,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Cancel an appointment (by patient or receptionist).
 * Not allowed when status is 'completed'.
 */
export async function cancelAppointment(appointmentId: string, userId: string, role: string) {
  // Get appointment
  const apptResult = await query(
    `SELECT a.*, p.user_id AS patient_user_id,
            u_p.full_name AS patient_name,
            u_d.full_name AS dentist_name,
            d.user_id AS dentist_user_id
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

  // Check permission: only own patient or receptionist
  if (role === UserRole.PATIENT && appointment.patient_user_id.toString() !== userId) {
    throw new AppError('You can only cancel your own appointments.', 403);
  }

  if (role !== UserRole.PATIENT && role !== UserRole.RECEPTIONIST) {
    throw new AppError('Only patients or receptionists can cancel appointments.', 403);
  }

  // Cannot cancel completed appointments
  if (appointment.status === AppointmentStatus.COMPLETED) {
    throw new AppError('Cannot cancel a completed appointment.', 400);
  }

  // Update status
  await query(
    `UPDATE appointments SET status = $1 WHERE id = $2`,
    [AppointmentStatus.CANCELLED, appointmentId]
  );

  // Notify relevant parties
  const cancellerName = role === UserRole.PATIENT ? appointment.patient_name : 'Receptionist';
  const message = `Appointment on ${appointment.appointment_date} at ${appointment.appointment_time} has been cancelled by ${cancellerName}.`;

  // Notify patient (if receptionist cancelled)
  if (role === UserRole.RECEPTIONIST) {
    await createNotification(
      appointment.patient_user_id,
      'Appointment Cancelled',
      message,
      NotificationType.APPOINTMENT_CANCELLED,
      appointment.id
    );

    // Email 7: Notify patient about cancellation
    const patientEmailResult = await query('SELECT email, full_name FROM users WHERE id = $1', [appointment.patient_user_id]);
    if (patientEmailResult.rows.length > 0) {
      sendAppointmentCancelledEmail(
        patientEmailResult.rows[0].email,
        patientEmailResult.rows[0].full_name,
        role,
        appointment.patient_name,
        appointment.dentist_name,
        appointment.appointment_date,
        appointment.appointment_time
      ).catch(() => {});
    }
  }

  // Notify dentist
  await createNotification(
    appointment.dentist_user_id,
    'Appointment Cancelled',
    message,
    NotificationType.APPOINTMENT_CANCELLED,
    appointment.id
  );

  // Email 7: Notify dentist about cancellation
  const dentistEmailResult = await query('SELECT email, full_name FROM users WHERE id = $1', [appointment.dentist_user_id]);
  if (dentistEmailResult.rows.length > 0) {
    sendAppointmentCancelledEmail(
      dentistEmailResult.rows[0].email,
      dentistEmailResult.rows[0].full_name,
      role,
      appointment.patient_name,
      appointment.dentist_name,
      appointment.appointment_date,
      appointment.appointment_time
    ).catch(() => {});
  }

  // Notify receptionists (if patient cancelled)
  if (role === UserRole.PATIENT) {
    const receptionists = await query(
      `SELECT u.id AS user_id, u.email, u.full_name FROM users u
       INNER JOIN receptionists r ON r.user_id = u.id
       WHERE u.is_active = true`
    );
    for (const rec of receptionists.rows) {
      await createNotification(
        rec.user_id,
        'Appointment Cancelled',
        message,
        NotificationType.APPOINTMENT_CANCELLED,
        appointment.id
      );

      // Email 7: Notify receptionist about cancellation
      sendAppointmentCancelledEmail(
        rec.email,
        rec.full_name,
        role,
        appointment.patient_name,
        appointment.dentist_name,
        appointment.appointment_date,
        appointment.appointment_time
      ).catch(() => {});
    }
  }

  return { id: appointment.id, status: AppointmentStatus.CANCELLED };
}

// ═══════════════════════════════════════════════════════════════
// RECEPTIONIST ACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all pending appointments for receptionist review.
 */
export async function getPendingAppointments() {
  const result = await query(
    `SELECT a.*,
            u_p.full_name AS patient_name, u_p.email AS patient_email, u_p.phone_number AS patient_phone,
            u_d.full_name AS dentist_name, d.specialization
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN users u_p ON u_p.id = p.user_id
     INNER JOIN dentists d ON d.id = a.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     WHERE a.status = $1
     ORDER BY a.is_emergency DESC, a.created_at ASC`,
    [AppointmentStatus.PENDING]
  );

  return result.rows;
}

/**
 * Receptionist reviews and acts on an appointment.
 * Actions: 'forward', 'reject', 'reassign'
 */
export async function reviewAppointment(
  appointmentId: string,
  receptionistUserId: string,
  action: 'forward' | 'reject' | 'reassign',
  data?: { rejectionReason?: string; newDentistId?: number }
) {
  // Get receptionist record
  const recResult = await query('SELECT id FROM receptionists WHERE user_id = $1', [receptionistUserId]);
  if (recResult.rows.length === 0) {
    throw new AppError('Receptionist profile not found.', 404);
  }
  const receptionistId = recResult.rows[0].id;

  // Get appointment
  const apptResult = await query(
    `SELECT a.*, p.user_id AS patient_user_id,
            u_p.full_name AS patient_name,
            u_d.full_name AS dentist_name,
            d.user_id AS dentist_user_id
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

  if (appointment.status !== AppointmentStatus.PENDING) {
    throw new AppError(`Can only review appointments with status 'pending'. Current status: '${appointment.status}'.`, 400);
  }

  switch (action) {
    case 'forward': {
      await query(
        `UPDATE appointments SET status = $1, reviewed_by = $2 WHERE id = $3`,
        [AppointmentStatus.FORWARDED, receptionistId, appointmentId]
      );

      // Notify dentist
      await createNotification(
        appointment.dentist_user_id,
        'New Appointment Forwarded',
        `Appointment from ${appointment.patient_name} on ${appointment.appointment_date} at ${appointment.appointment_time} has been forwarded to you for review.`,
        NotificationType.APPOINTMENT_FORWARDED,
        appointment.id
      );

      // Email 1: Notify dentist about forwarded appointment
      const dentistEmailResult = await query('SELECT email, full_name FROM users WHERE id = $1', [appointment.dentist_user_id]);
      if (dentistEmailResult.rows.length > 0) {
        sendAppointmentForwardedEmail(
          dentistEmailResult.rows[0].email,
          dentistEmailResult.rows[0].full_name,
          appointment.patient_name,
          appointment.appointment_date,
          appointment.appointment_time,
          appointment.reason,
          appointment.is_emergency
        ).catch(() => {});
      }

      return { id: appointment.id, status: AppointmentStatus.FORWARDED };
    }

    case 'reject': {
      if (!data?.rejectionReason) {
        throw new AppError('Rejection reason is required.', 400);
      }

      await query(
        `UPDATE appointments SET status = $1, reviewed_by = $2, rejection_reason = $3 WHERE id = $4`,
        [AppointmentStatus.REJECTED, receptionistId, data.rejectionReason, appointmentId]
      );

      // Notify patient
      await createNotification(
        appointment.patient_user_id,
        'Appointment Rejected',
        `Your appointment request for ${appointment.appointment_date} at ${appointment.appointment_time} has been rejected. Reason: ${data.rejectionReason}`,
        NotificationType.APPOINTMENT_REJECTED,
        appointment.id
      );

      // Email 3: Notify patient about rejection by receptionist
      const patientEmailResult = await query('SELECT email FROM users WHERE id = $1', [appointment.patient_user_id]);
      if (patientEmailResult.rows.length > 0) {
        sendAppointmentRejectedEmail(
          patientEmailResult.rows[0].email,
          appointment.patient_name,
          appointment.appointment_date,
          appointment.appointment_time,
          data.rejectionReason,
          'receptionist'
        ).catch(() => {});
      }

      return { id: appointment.id, status: AppointmentStatus.REJECTED };
    }

    case 'reassign': {
      if (!data?.newDentistId) {
        throw new AppError('New dentist ID is required for reassignment.', 400);
      }

      // Validate new dentist exists
      const newDentistResult = await query(
        `SELECT d.id, d.user_id, u.full_name AS dentist_name
         FROM dentists d
         INNER JOIN users u ON u.id = d.user_id
         WHERE d.id = $1 AND u.is_active = true`,
        [data.newDentistId]
      );
      if (newDentistResult.rows.length === 0) {
        throw new AppError('New dentist not found or is not active.', 404);
      }
      const newDentist = newDentistResult.rows[0];

      // Check new dentist availability for the same time
      const dayOfWeek = new Date(appointment.appointment_date).getDay();
      const config = await getClinicConfig();
      const slotDuration = parseInt(config.appointment_duration_minutes, 10);

      const availCheck = await query(
        `SELECT id FROM dentist_availability
         WHERE dentist_id = $1 AND day_of_week = $2 AND is_available = true
           AND start_time <= $3::time AND end_time >= ($3::time + ($4 || ' minutes')::interval)`,
        [data.newDentistId, dayOfWeek, appointment.appointment_time, slotDuration]
      );
      if (availCheck.rows.length === 0) {
        throw new AppError('The new dentist is not available at the requested day/time.', 400);
      }

      // Check no double-booking for new dentist
      const conflictResult = await query(
        `SELECT id FROM appointments
         WHERE dentist_id = $1 AND appointment_date = $2 AND appointment_time = $3::time
           AND status NOT IN ('cancelled', 'rejected') AND id != $4`,
        [data.newDentistId, appointment.appointment_date, appointment.appointment_time, appointmentId]
      );
      if (conflictResult.rows.length > 0) {
        throw new AppError('The new dentist already has an appointment at this time.', 409);
      }

      await query(
        `UPDATE appointments SET dentist_id = $1, status = $2, reviewed_by = $3 WHERE id = $4`,
        [data.newDentistId, AppointmentStatus.FORWARDED, receptionistId, appointmentId]
      );

      // Notify new dentist
      await createNotification(
        newDentist.user_id,
        'New Appointment Assigned',
        `An appointment from ${appointment.patient_name} on ${appointment.appointment_date} at ${appointment.appointment_time} has been assigned to you.`,
        NotificationType.APPOINTMENT_FORWARDED,
        appointment.id
      );

      // Email 2a: Notify new dentist about assigned appointment
      const newDentistEmailResult = await query('SELECT email, full_name FROM users WHERE id = $1', [newDentist.user_id]);
      if (newDentistEmailResult.rows.length > 0) {
        sendAppointmentAssignedEmail(
          newDentistEmailResult.rows[0].email,
          newDentistEmailResult.rows[0].full_name,
          appointment.patient_name,
          appointment.appointment_date,
          appointment.appointment_time,
          appointment.reason
        ).catch(() => {});
      }

      // Notify patient about reassignment
      await createNotification(
        appointment.patient_user_id,
        'Appointment Reassigned',
        `Your appointment on ${appointment.appointment_date} at ${appointment.appointment_time} has been reassigned to Dr. ${newDentist.dentist_name}.`,
        NotificationType.APPOINTMENT_FORWARDED,
        appointment.id
      );

      // Email 2b: Notify patient about reassignment
      const patientEmailResult = await query('SELECT email FROM users WHERE id = $1', [appointment.patient_user_id]);
      if (patientEmailResult.rows.length > 0) {
        sendAppointmentReassignedEmail(
          patientEmailResult.rows[0].email,
          appointment.patient_name,
          appointment.dentist_name,
          newDentist.dentist_name,
          appointment.appointment_date,
          appointment.appointment_time
        ).catch(() => {});
      }

      return { id: appointment.id, status: AppointmentStatus.FORWARDED, newDentistId: data.newDentistId };
    }

    default:
      throw new AppError('Invalid action. Must be forward, reject, or reassign.', 400);
  }
}

/**
 * Get all forwarded appointments (for receptionist monitoring).
 */
export async function getForwardedAppointments() {
  const result = await query(
    `SELECT a.*,
            u_p.full_name AS patient_name, u_p.email AS patient_email, u_p.phone_number AS patient_phone,
            u_d.full_name AS dentist_name, d.specialization,
            u_r.full_name AS reviewed_by_name
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN users u_p ON u_p.id = p.user_id
     INNER JOIN dentists d ON d.id = a.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     LEFT JOIN receptionists r ON r.id = a.reviewed_by
     LEFT JOIN users u_r ON u_r.id = r.user_id
     WHERE a.status = $1
     ORDER BY a.is_emergency DESC, a.appointment_date ASC, a.appointment_time ASC`,
    [AppointmentStatus.FORWARDED]
  );

  return result.rows;
}

/**
 * Receptionist creates a walk-in appointment.
 * Skips pending status → starts at 'forwarded' (receptionist is the gatekeeper).
 */
export async function createWalkInAppointment(receptionistUserId: string, data: WalkInInput) {
  const { dentistId, appointmentDate, appointmentTime, reason, isEmergency = false } = data;

  // Get receptionist record
  const recResult = await query('SELECT id FROM receptionists WHERE user_id = $1', [receptionistUserId]);
  if (recResult.rows.length === 0) {
    throw new AppError('Receptionist profile not found.', 404);
  }
  const receptionistId = recResult.rows[0].id;

  // Validate dentist exists
  const dentistResult = await query(
    `SELECT d.id, d.user_id, u.full_name AS dentist_name
     FROM dentists d
     INNER JOIN users u ON u.id = d.user_id
     WHERE d.id = $1 AND u.is_active = true`,
    [dentistId]
  );
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist not found or is not active.', 404);
  }
  const dentist = dentistResult.rows[0];

  // Resolve or create patient
  let patientId: number;

  if (data.patientId) {
    // Use existing patient
    const existingPatient = await query('SELECT id FROM patients WHERE id = $1', [data.patientId]);
    if (existingPatient.rows.length === 0) {
      throw new AppError('Patient not found.', 404);
    }
    patientId = existingPatient.rows[0].id;
  } else if (data.patientData) {
    // Try to find existing patient by email or phone
    let existingUser = null;
    if (data.patientData.email) {
      const result = await query('SELECT id FROM users WHERE email = $1', [data.patientData.email]);
      if (result.rows.length > 0) {
        existingUser = result.rows[0];
      }
    }
    if (!existingUser && data.patientData.phoneNumber) {
      const result = await query('SELECT id FROM users WHERE phone_number = $1', [data.patientData.phoneNumber]);
      if (result.rows.length > 0) {
        existingUser = result.rows[0];
      }
    }

    if (existingUser) {
      // Get patient record for existing user
      const patResult = await query('SELECT id FROM patients WHERE user_id = $1', [existingUser.id]);
      if (patResult.rows.length > 0) {
        patientId = patResult.rows[0].id;
      } else {
        throw new AppError('User found but has no patient profile. Contact admin.', 400);
      }
    } else {
      // Create new user + patient profile (invited via email)
      const crypto = await import('crypto');
      const { sendInvitationEmail: sendInvite } = await import('./emailService.js');
      const emailToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const patientEmail = data.patientData.email || `walkin_${Date.now()}@temp.local`;

      const newUserResult = await query(
        `INSERT INTO users (full_name, email, phone_number, password_hash, role, email_verification_token, email_token_expires_at)
         VALUES ($1, $2, $3, NULL, $4, $5, $6)
         RETURNING id`,
        [
          data.patientData.fullName,
          patientEmail,
          data.patientData.phoneNumber || null,
          UserRole.PATIENT,
          emailToken,
          tokenExpiresAt,
        ]
      );

      const newUserId = newUserResult.rows[0].id;

      const newPatientResult = await query(
        `INSERT INTO patients (user_id, date_of_birth, gender)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          newUserId,
          data.patientData.dateOfBirth || null,
          data.patientData.gender || null,
        ]
      );

      patientId = newPatientResult.rows[0].id;

      // Send invitation email (non-blocking — don't await, fire and forget)
      if (data.patientData.email) {
        sendInvite(patientEmail, data.patientData.fullName, 'patient', emailToken).catch(() => {});
      }
    }
  } else {
    throw new AppError('Either patientId or patientData must be provided.', 400);
  }

  // Validate time slot (same as createAppointment but less strict for emergencies)
  if (!isEmergency) {
    const config = await getClinicConfig();
    const slotDuration = parseInt(config.appointment_duration_minutes, 10);
    const dayOfWeek = new Date(appointmentDate).getDay();

    // Check dentist availability
    const availCheck = await query(
      `SELECT id FROM dentist_availability
       WHERE dentist_id = $1 AND day_of_week = $2 AND is_available = true
         AND start_time <= $3::time AND end_time >= ($3::time + ($4 || ' minutes')::interval)`,
      [dentistId, dayOfWeek, appointmentTime, slotDuration]
    );
    if (availCheck.rows.length === 0) {
      throw new AppError('The dentist is not available at the requested day/time.', 400);
    }
  }

  // Check no double-booking
  const conflictResult = await query(
    `SELECT id FROM appointments
     WHERE dentist_id = $1 AND appointment_date = $2 AND appointment_time = $3::time
       AND status NOT IN ('cancelled', 'rejected')`,
    [dentistId, appointmentDate, appointmentTime]
  );
  if (conflictResult.rows.length > 0) {
    throw new AppError('This time slot is already booked.', 409);
  }

  // Create appointment with status 'forwarded' (skips pending)
  const appointmentResult = await query(
    `INSERT INTO appointments (patient_id, dentist_id, reviewed_by, appointment_date, appointment_time, status, is_emergency, reason, created_by_role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      patientId,
      dentistId,
      receptionistId,
      appointmentDate,
      appointmentTime,
      AppointmentStatus.FORWARDED,
      isEmergency,
      reason || null,
      'receptionist',
    ]
  );

  const appointment = appointmentResult.rows[0];

  // Notify the assigned dentist
  await createNotification(
    dentist.user_id,
    'Walk-in Appointment Assigned',
    `A walk-in appointment on ${appointmentDate} at ${appointmentTime} has been assigned to you.`,
    NotificationType.APPOINTMENT_FORWARDED,
    appointment.id
  );

  // Email 8: Notify dentist about walk-in appointment
  const dentistEmailResult = await query('SELECT email, full_name FROM users WHERE id = $1', [dentist.user_id]);
  // Resolve patient name for the email
  const walkInPatientName = data.patientData?.fullName
    || (await query('SELECT u.full_name FROM patients p INNER JOIN users u ON u.id = p.user_id WHERE p.id = $1', [patientId])).rows[0]?.full_name
    || 'Walk-in Patient';
  if (dentistEmailResult.rows.length > 0) {
    sendWalkInAppointmentEmail(
      dentistEmailResult.rows[0].email,
      dentistEmailResult.rows[0].full_name,
      walkInPatientName,
      appointmentDate,
      appointmentTime,
      isEmergency
    ).catch(() => {});
  }

  return appointment;
}

/**
 * Receptionist views all appointments with filters and pagination.
 */
export async function getAllAppointments(filters: AppointmentFilters = {}) {
  const { status, from, to, dentistId, patientId, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (status) {
    conditions.push(`a.status = $${paramIdx++}`);
    params.push(status);
  }
  if (from) {
    conditions.push(`a.appointment_date >= $${paramIdx++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`a.appointment_date <= $${paramIdx++}`);
    params.push(to);
  }
  if (dentistId) {
    conditions.push(`a.dentist_id = $${paramIdx++}`);
    params.push(dentistId);
  }
  if (patientId) {
    conditions.push(`a.patient_id = $${paramIdx++}`);
    params.push(patientId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count
  const countResult = await query(
    `SELECT COUNT(*) FROM appointments a ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Fetch
  const appointmentsResult = await query(
    `SELECT a.*,
            u_p.full_name AS patient_name, u_p.email AS patient_email,
            u_d.full_name AS dentist_name, d.specialization,
            u_r.full_name AS reviewed_by_name
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN users u_p ON u_p.id = p.user_id
     INNER JOIN dentists d ON d.id = a.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     LEFT JOIN receptionists r ON r.id = a.reviewed_by
     LEFT JOIN users u_r ON u_r.id = r.user_id
     ${whereClause}
     ORDER BY a.appointment_date DESC, a.appointment_time DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    [...params, limit, offset]
  );

  return {
    appointments: appointmentsResult.rows,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ═══════════════════════════════════════════════════════════════
// DENTIST ACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get appointments assigned to this dentist with filters.
 */
export async function getDentistAppointments(dentistUserId: string, filters: AppointmentFilters = {}) {
  const { status, from, to, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  // Get dentist record
  const dentistResult = await query('SELECT id FROM dentists WHERE user_id = $1', [dentistUserId]);
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist profile not found.', 404);
  }
  const dentistId = dentistResult.rows[0].id;

  const conditions: string[] = ['a.dentist_id = $1'];
  const params: unknown[] = [dentistId];
  let paramIdx = 2;

  if (status) {
    conditions.push(`a.status = $${paramIdx++}`);
    params.push(status);
  }
  if (from) {
    conditions.push(`a.appointment_date >= $${paramIdx++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`a.appointment_date <= $${paramIdx++}`);
    params.push(to);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Count
  const countResult = await query(
    `SELECT COUNT(*) FROM appointments a ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Fetch
  const appointmentsResult = await query(
    `SELECT a.*,
            u_p.full_name AS patient_name, u_p.email AS patient_email, u_p.phone_number AS patient_phone,
            p.date_of_birth, p.gender, p.allergies
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN users u_p ON u_p.id = p.user_id
     ${whereClause}
     ORDER BY a.appointment_date ASC, a.appointment_time ASC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    [...params, limit, offset]
  );

  return {
    appointments: appointmentsResult.rows,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Dentist responds to a forwarded appointment.
 * Actions: 'approve', 'reject', 'reschedule'
 */
export async function respondToAppointment(
  appointmentId: string,
  dentistUserId: string,
  action: 'approve' | 'reject' | 'reschedule',
  data?: { rejectionReason?: string; suggestedDate?: string; suggestedTime?: string }
) {
  // Get dentist record
  const dentistResult = await query(
    `SELECT d.id, u.full_name AS dentist_name
     FROM dentists d
     INNER JOIN users u ON u.id = d.user_id
     WHERE d.user_id = $1`,
    [dentistUserId]
  );
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist profile not found.', 404);
  }
  const dentistRecord = dentistResult.rows[0];

  // Get appointment
  const apptResult = await query(
    `SELECT a.*, p.user_id AS patient_user_id,
            u_p.full_name AS patient_name
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN users u_p ON u_p.id = p.user_id
     WHERE a.id = $1`,
    [appointmentId]
  );

  if (apptResult.rows.length === 0) {
    throw new AppError('Appointment not found.', 404);
  }

  const appointment = apptResult.rows[0];

  // Verify this appointment belongs to this dentist
  if (appointment.dentist_id !== dentistRecord.id) {
    throw new AppError('This appointment is not assigned to you.', 403);
  }

  // Dentist can only respond to forwarded appointments
  if (appointment.status !== AppointmentStatus.FORWARDED) {
    throw new AppError(`Can only respond to appointments with status 'forwarded'. Current status: '${appointment.status}'.`, 400);
  }

  // Get receptionist user_id for notification (if reviewed_by is set)
  let receptionistUserId: number | null = null;
  if (appointment.reviewed_by) {
    const recResult = await query(
      'SELECT user_id FROM receptionists WHERE id = $1',
      [appointment.reviewed_by]
    );
    if (recResult.rows.length > 0) {
      receptionistUserId = recResult.rows[0].user_id;
    }
  }

  switch (action) {
    case 'approve': {
      await query(
        `UPDATE appointments SET status = $1 WHERE id = $2`,
        [AppointmentStatus.APPROVED, appointmentId]
      );

      // Notify patient
      await createNotification(
        appointment.patient_user_id,
        'Appointment Approved',
        `Your appointment with Dr. ${dentistRecord.dentist_name} on ${appointment.appointment_date} at ${appointment.appointment_time} has been approved.`,
        NotificationType.APPOINTMENT_APPROVED,
        appointment.id
      );

      // Email 4: Notify patient about approval
      const approvedPatientEmail = await query('SELECT email FROM users WHERE id = $1', [appointment.patient_user_id]);
      if (approvedPatientEmail.rows.length > 0) {
        sendAppointmentApprovedEmail(
          approvedPatientEmail.rows[0].email,
          appointment.patient_name,
          dentistRecord.dentist_name,
          appointment.appointment_date,
          appointment.appointment_time
        ).catch(() => {});
      }

      // Notify receptionist
      if (receptionistUserId) {
        await createNotification(
          receptionistUserId,
          'Appointment Approved',
          `Dr. ${dentistRecord.dentist_name} has approved the appointment for ${appointment.patient_name} on ${appointment.appointment_date}.`,
          NotificationType.APPOINTMENT_APPROVED,
          appointment.id
        );
      }

      return { id: appointment.id, status: AppointmentStatus.APPROVED };
    }

    case 'reject': {
      if (!data?.rejectionReason) {
        throw new AppError('Rejection reason is required.', 400);
      }

      await query(
        `UPDATE appointments SET status = $1, rejection_reason = $2 WHERE id = $3`,
        [AppointmentStatus.REJECTED, data.rejectionReason, appointmentId]
      );

      // Notify receptionist (who will take further action — may reassign)
      if (receptionistUserId) {
        await createNotification(
          receptionistUserId,
          'Appointment Rejected by Dentist',
          `Dr. ${dentistRecord.dentist_name} rejected the appointment for ${appointment.patient_name} on ${appointment.appointment_date}. Reason: ${data.rejectionReason}`,
          NotificationType.APPOINTMENT_REJECTED,
          appointment.id
        );
      }

      // Also notify all active receptionists in case the original is unavailable
      const receptionists = await query(
        `SELECT u.id AS user_id, u.email, u.full_name FROM users u
         INNER JOIN receptionists r ON r.user_id = u.id
         WHERE u.is_active = true AND u.id != $1`,
        [receptionistUserId || 0]
      );
      for (const rec of receptionists.rows) {
        await createNotification(
          rec.user_id,
          'Appointment Rejected by Dentist',
          `Dr. ${dentistRecord.dentist_name} rejected the appointment for ${appointment.patient_name}. Reason: ${data.rejectionReason}`,
          NotificationType.APPOINTMENT_REJECTED,
          appointment.id
        );

        // Email 5: Notify receptionist about dentist rejection
        sendDentistRejectedNotificationEmail(
          rec.email,
          rec.full_name,
          dentistRecord.dentist_name,
          appointment.patient_name,
          appointment.appointment_date,
          data.rejectionReason
        ).catch(() => {});
      }

      // Email 5: Also send to the original reviewing receptionist if not already included
      if (receptionistUserId) {
        const origRecEmail = await query('SELECT email, full_name FROM users WHERE id = $1', [receptionistUserId]);
        if (origRecEmail.rows.length > 0) {
          sendDentistRejectedNotificationEmail(
            origRecEmail.rows[0].email,
            origRecEmail.rows[0].full_name,
            dentistRecord.dentist_name,
            appointment.patient_name,
            appointment.appointment_date,
            data.rejectionReason
          ).catch(() => {});
        }
      }

      // Email 5 (patient side): Notify patient about dentist rejection
      const rejectedPatientEmail = await query('SELECT email FROM users WHERE id = $1', [appointment.patient_user_id]);
      if (rejectedPatientEmail.rows.length > 0) {
        sendAppointmentRejectedEmail(
          rejectedPatientEmail.rows[0].email,
          appointment.patient_name,
          appointment.appointment_date,
          appointment.appointment_time,
          data.rejectionReason,
          'dentist'
        ).catch(() => {});
      }

      return { id: appointment.id, status: AppointmentStatus.REJECTED };
    }

    case 'reschedule': {
      const notes = data?.suggestedDate && data?.suggestedTime
        ? `Dentist suggests rescheduling to ${data.suggestedDate} at ${data.suggestedTime}.`
        : 'Dentist requests rescheduling. Please contact the clinic for a new time.';

      await query(
        `UPDATE appointments SET status = $1, notes = $2 WHERE id = $3`,
        [AppointmentStatus.RESCHEDULED, notes, appointmentId]
      );

      // Notify receptionist to relay to patient
      if (receptionistUserId) {
        await createNotification(
          receptionistUserId,
          'Appointment Reschedule Requested',
          `Dr. ${dentistRecord.dentist_name} has requested to reschedule the appointment for ${appointment.patient_name}. ${notes}`,
          NotificationType.APPOINTMENT_RESCHEDULED,
          appointment.id
        );

        // Email 6: Notify receptionist about reschedule request
        const recEmailResult = await query('SELECT email, full_name FROM users WHERE id = $1', [receptionistUserId]);
        if (recEmailResult.rows.length > 0) {
          sendAppointmentRescheduleEmail(
            recEmailResult.rows[0].email,
            recEmailResult.rows[0].full_name,
            dentistRecord.dentist_name,
            appointment.patient_name,
            appointment.appointment_date,
            appointment.appointment_time,
            data?.suggestedDate,
            data?.suggestedTime,
            notes
          ).catch(() => {});
        }
      }

      // Notify patient
      await createNotification(
        appointment.patient_user_id,
        'Appointment Reschedule Requested',
        `Dr. ${dentistRecord.dentist_name} has requested to reschedule your appointment. ${notes}`,
        NotificationType.APPOINTMENT_RESCHEDULED,
        appointment.id
      );

      // Email 6: Notify patient about reschedule request
      const patientRescheduleEmail = await query('SELECT email, full_name FROM users WHERE id = $1', [appointment.patient_user_id]);
      if (patientRescheduleEmail.rows.length > 0) {
        sendAppointmentRescheduleEmail(
          patientRescheduleEmail.rows[0].email,
          patientRescheduleEmail.rows[0].full_name,
          dentistRecord.dentist_name,
          appointment.patient_name,
          appointment.appointment_date,
          appointment.appointment_time,
          data?.suggestedDate,
          data?.suggestedTime,
          notes
        ).catch(() => {});
      }

      return { id: appointment.id, status: AppointmentStatus.RESCHEDULED };
    }

    default:
      throw new AppError('Invalid action. Must be approve, reject, or reschedule.', 400);
  }
}

/**
 * Dentist marks an approved appointment as completed.
 */
export async function completeAppointment(appointmentId: string, dentistUserId: string) {
  // Get dentist record
  const dentistResult = await query('SELECT id FROM dentists WHERE user_id = $1', [dentistUserId]);
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist profile not found.', 404);
  }
  const dentistId = dentistResult.rows[0].id;

  // Get appointment
  const apptResult = await query(
    `SELECT a.*, p.user_id AS patient_user_id
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     WHERE a.id = $1`,
    [appointmentId]
  );

  if (apptResult.rows.length === 0) {
    throw new AppError('Appointment not found.', 404);
  }

  const appointment = apptResult.rows[0];

  if (appointment.dentist_id !== dentistId) {
    throw new AppError('This appointment is not assigned to you.', 403);
  }

  if (appointment.status !== AppointmentStatus.APPROVED) {
    throw new AppError(`Can only complete appointments with status 'approved'. Current status: '${appointment.status}'.`, 400);
  }

  await query(
    `UPDATE appointments SET status = $1 WHERE id = $2`,
    [AppointmentStatus.COMPLETED, appointmentId]
  );

  // Notify patient
  await createNotification(
    appointment.patient_user_id,
    'Appointment Completed',
    `Your appointment has been marked as completed. Thank you for visiting the clinic.`,
    NotificationType.GENERAL,
    appointment.id
  );

  return { id: appointment.id, status: AppointmentStatus.COMPLETED };
}

/**
 * Get dentist's schedule for a specific day (booked and available slots).
 */
export async function getDentistSchedule(dentistUserId: string, date: string) {
  // Get dentist record
  const dentistResult = await query(
    `SELECT d.id, u.full_name AS dentist_name, d.specialization
     FROM dentists d
     INNER JOIN users u ON u.id = d.user_id
     WHERE d.user_id = $1`,
    [dentistUserId]
  );
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist profile not found.', 404);
  }
  const dentist = dentistResult.rows[0];

  // Get booked appointments for this day
  const bookedResult = await query(
    `SELECT a.id, a.appointment_time, a.status, a.is_emergency, a.reason,
            u_p.full_name AS patient_name
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN users u_p ON u_p.id = p.user_id
     WHERE a.dentist_id = $1 AND a.appointment_date = $2
       AND a.status NOT IN ('cancelled', 'rejected')
     ORDER BY a.appointment_time ASC`,
    [dentist.id, date]
  );

  // Get available slots
  const availableSlots = await getAvailableSlots(dentist.id, date);

  return {
    dentist: { id: dentist.id, name: dentist.dentist_name, specialization: dentist.specialization },
    date,
    bookedAppointments: bookedResult.rows,
    availableSlots,
  };
}

// ═══════════════════════════════════════════════════════════════
// SHARED / UTILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Get a single appointment with full joined details.
 */
export async function getAppointmentById(id: string) {
  const result = await query(
    `SELECT a.*,
            u_p.full_name AS patient_name, u_p.email AS patient_email, u_p.phone_number AS patient_phone,
            p.date_of_birth, p.gender,
            u_d.full_name AS dentist_name, d.specialization,
            u_r.full_name AS reviewed_by_name
     FROM appointments a
     INNER JOIN patients p ON p.id = a.patient_id
     INNER JOIN users u_p ON u_p.id = p.user_id
     INNER JOIN dentists d ON d.id = a.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     LEFT JOIN receptionists r ON r.id = a.reviewed_by
     LEFT JOIN users u_r ON u_r.id = r.user_id
     WHERE a.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Appointment not found.', 404);
  }

  return result.rows[0];
}

/**
 * Calculate available time slots for a dentist on a given date.
 * Slots are based on: dentist availability, existing appointments, and clinic config.
 */
export async function getAvailableSlots(dentistId: number | string, date: string) {
  const config = await getClinicConfig();
  const slotDuration = parseInt(config.appointment_duration_minutes, 10);
  const openingTime = config.opening_time;
  const closingTime = config.closing_time;

  const dayOfWeek = new Date(date).getDay();

  // Get dentist availability for this day
  const availResult = await query(
    `SELECT start_time, end_time FROM dentist_availability
     WHERE dentist_id = $1 AND day_of_week = $2 AND is_available = true`,
    [dentistId, dayOfWeek]
  );

  if (availResult.rows.length === 0) {
    return []; // Dentist not available on this day
  }

  const availability = availResult.rows[0];

  // Determine effective start and end times (intersection of clinic hours and dentist hours)
  const effectiveStart = Math.max(
    timeToMinutes(openingTime),
    timeToMinutes(availability.start_time.substring(0, 5))
  );
  const effectiveEnd = Math.min(
    timeToMinutes(closingTime),
    timeToMinutes(availability.end_time.substring(0, 5))
  );

  // Get existing booked appointments for this day
  const bookedResult = await query(
    `SELECT appointment_time FROM appointments
     WHERE dentist_id = $1 AND appointment_date = $2
       AND status NOT IN ('cancelled', 'rejected')`,
    [dentistId, date]
  );

  const bookedTimes = new Set(
    bookedResult.rows.map((r: Record<string, unknown>) => {
      const time = r.appointment_time as string;
      return time.substring(0, 5);
    })
  );

  // Generate available slots
  const slots: string[] = [];
  for (let t = effectiveStart; t + slotDuration <= effectiveEnd; t += slotDuration) {
    const timeStr = minutesToTime(t);
    if (!bookedTimes.has(timeStr)) {
      slots.push(timeStr);
    }
  }

  return slots;
}
