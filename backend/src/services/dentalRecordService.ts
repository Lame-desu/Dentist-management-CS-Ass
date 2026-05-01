import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { AppointmentStatus, NotificationType, UserRole } from '../utils/constants.js';

// ─── Interfaces ──────────────────────────────────────────────

interface CreateRecordInput {
  appointmentId: number;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescriptions?: {
    medicineName: string;
    dosage: string;
    duration?: string;
    remarks?: string;
  }[];
}

interface UpdateRecordInput {
  diagnosis?: string;
  treatment?: string;
  notes?: string;
}

// ─── Notification Helper ─────────────────────────────────────

async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: string,
  relatedAppointmentId?: number
): Promise<void> {
  await query(
    `INSERT INTO notifications (user_id, title, message, type, related_appointment_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, title, message, type, relatedAppointmentId || null]
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE DENTAL RECORD
// ═══════════════════════════════════════════════════════════════

/**
 * Dentist creates a dental record after a consultation.
 * - Validates appointment exists & status is 'approved'
 * - Validates the dentist owns the appointment
 * - Creates the dental record linked to appointment, patient, and dentist
 * - Automatically marks the appointment as 'completed'
 * - Optionally creates inline prescriptions
 * - Notifies the patient
 */
export async function createRecord(dentistUserId: string, data: CreateRecordInput) {
  const { appointmentId, diagnosis, treatment, notes, prescriptions } = data;

  // 1. Get dentist record
  const dentistResult = await query(
    `SELECT d.id, d.user_id, u.full_name AS dentist_name
     FROM dentists d
     INNER JOIN users u ON u.id = d.user_id
     WHERE d.user_id = $1`,
    [dentistUserId]
  );
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist profile not found.', 404);
  }
  const dentist = dentistResult.rows[0];

  // 2. Get appointment and validate
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

  // 3. Validate appointment status is 'approved'
  if (appointment.status !== AppointmentStatus.APPROVED) {
    throw new AppError(
      `Dental record can only be created for approved appointments. Current status: '${appointment.status}'.`,
      400
    );
  }

  // 4. Validate this dentist owns the appointment
  if (appointment.dentist_id !== dentist.id) {
    throw new AppError('You can only create records for your own appointments.', 403);
  }

  // 5. Check if a dental record already exists for this appointment
  const existingRecord = await query(
    'SELECT id FROM dental_records WHERE appointment_id = $1',
    [appointmentId]
  );
  if (existingRecord.rows.length > 0) {
    throw new AppError('A dental record already exists for this appointment.', 409);
  }

  // 6. Create the dental record
  const recordResult = await query(
    `INSERT INTO dental_records (appointment_id, patient_id, dentist_id, diagnosis, treatment, notes, visit_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      appointmentId,
      appointment.patient_id,
      dentist.id,
      diagnosis,
      treatment,
      notes || null,
      appointment.appointment_date,
    ]
  );
  const record = recordResult.rows[0];

  // 7. Auto-complete the appointment
  await query(
    `UPDATE appointments SET status = $1 WHERE id = $2`,
    [AppointmentStatus.COMPLETED, appointmentId]
  );

  // 8. Create inline prescriptions if provided
  let prescriptionCount = 0;
  if (prescriptions && prescriptions.length > 0) {
    for (const rx of prescriptions) {
      await query(
        `INSERT INTO prescriptions (dental_record_id, medicine_name, dosage, duration, remarks)
         VALUES ($1, $2, $3, $4, $5)`,
        [record.id, rx.medicineName, rx.dosage, rx.duration || null, rx.remarks || null]
      );
      prescriptionCount++;
    }
  }

  // 9. Notify patient
  const visitDate = new Date(appointment.appointment_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  await createNotification(
    appointment.patient_user_id,
    'Dental Record Added',
    `Your dental record from ${visitDate} has been added by Dr. ${dentist.dentist_name}.`,
    NotificationType.GENERAL,
    appointmentId
  );

  return {
    ...record,
    prescription_count: prescriptionCount,
  };
}

// ═══════════════════════════════════════════════════════════════
// GET RECORDS BY PATIENT
// ═══════════════════════════════════════════════════════════════

/**
 * Get all dental records for a patient with role-based access control.
 * - Patients can only see their own records
 * - Dentists can see records for patients they've treated
 * - Receptionists can view all (read-only) for coordination
 * - Admins can view all
 */
export async function getRecordsByPatient(
  patientId: number,
  requestingUserId: string,
  requestingRole: string
) {
  // Access control
  if (requestingRole === UserRole.PATIENT) {
    // Verify this is the patient's own records
    const patientCheck = await query(
      'SELECT id FROM patients WHERE id = $1 AND user_id = $2',
      [patientId, requestingUserId]
    );
    if (patientCheck.rows.length === 0) {
      throw new AppError('Access denied. You can only view your own records.', 403);
    }
  } else if (requestingRole === UserRole.DENTIST) {
    // Verify the dentist has treated this patient
    const dentistCheck = await query(
      `SELECT dr.id FROM dental_records dr
       INNER JOIN dentists d ON d.id = dr.dentist_id
       WHERE dr.patient_id = $1 AND d.user_id = $2
       LIMIT 1`,
      [patientId, requestingUserId]
    );
    if (dentistCheck.rows.length === 0) {
      throw new AppError('Access denied. You can only view records for patients you have treated.', 403);
    }
  }
  // Receptionists and admins have full read access

  // Fetch records with prescriptions
  const records = await query(
    `SELECT dr.*,
            u_d.full_name AS dentist_name,
            d.specialization,
            u_p.full_name AS patient_name,
            (SELECT COUNT(*) FROM prescriptions p WHERE p.dental_record_id = dr.id) AS prescription_count
     FROM dental_records dr
     INNER JOIN dentists d ON d.id = dr.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     INNER JOIN patients pat ON pat.id = dr.patient_id
     INNER JOIN users u_p ON u_p.id = pat.user_id
     WHERE dr.patient_id = $1
     ORDER BY dr.visit_date DESC, dr.created_at DESC`,
    [patientId]
  );

  // For each record, fetch prescriptions
  const recordsWithPrescriptions = [];
  for (const record of records.rows) {
    const prescriptions = await query(
      'SELECT * FROM prescriptions WHERE dental_record_id = $1 ORDER BY created_at ASC',
      [record.id]
    );
    recordsWithPrescriptions.push({
      ...record,
      prescriptions: prescriptions.rows,
    });
  }

  return recordsWithPrescriptions;
}

// ═══════════════════════════════════════════════════════════════
// GET RECORD BY ID
// ═══════════════════════════════════════════════════════════════

/**
 * Get a single dental record with full data and prescriptions.
 * Same access rules as getRecordsByPatient.
 */
export async function getRecordById(
  recordId: number,
  requestingUserId: string,
  requestingRole: string
) {
  // Fetch the record
  const recordResult = await query(
    `SELECT dr.*,
            u_d.full_name AS dentist_name,
            d.specialization,
            d.user_id AS dentist_user_id,
            u_p.full_name AS patient_name,
            pat.user_id AS patient_user_id
     FROM dental_records dr
     INNER JOIN dentists d ON d.id = dr.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     INNER JOIN patients pat ON pat.id = dr.patient_id
     INNER JOIN users u_p ON u_p.id = pat.user_id
     WHERE dr.id = $1`,
    [recordId]
  );

  if (recordResult.rows.length === 0) {
    throw new AppError('Dental record not found.', 404);
  }

  const record = recordResult.rows[0];

  // Access control
  if (requestingRole === UserRole.PATIENT) {
    if (record.patient_user_id.toString() !== requestingUserId) {
      throw new AppError('Access denied. You can only view your own records.', 403);
    }
  } else if (requestingRole === UserRole.DENTIST) {
    if (record.dentist_user_id.toString() !== requestingUserId) {
      // Check if the dentist has ever treated this patient
      const dentistCheck = await query(
        `SELECT dr.id FROM dental_records dr
         INNER JOIN dentists d ON d.id = dr.dentist_id
         WHERE dr.patient_id = $1 AND d.user_id = $2
         LIMIT 1`,
        [record.patient_id, requestingUserId]
      );
      if (dentistCheck.rows.length === 0) {
        throw new AppError('Access denied. You can only view records for patients you have treated.', 403);
      }
    }
  }
  // Receptionists and admins have full read access

  // Fetch prescriptions
  const prescriptions = await query(
    'SELECT * FROM prescriptions WHERE dental_record_id = $1 ORDER BY created_at ASC',
    [recordId]
  );

  return {
    ...record,
    prescriptions: prescriptions.rows,
    prescription_count: prescriptions.rows.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// UPDATE RECORD
// ═══════════════════════════════════════════════════════════════

/**
 * Dentist updates their own dental record.
 * Only diagnosis, treatment, and notes can be updated.
 */
export async function updateRecord(recordId: number, dentistUserId: string, data: UpdateRecordInput) {
  // Get dentist record
  const dentistResult = await query(
    'SELECT id FROM dentists WHERE user_id = $1',
    [dentistUserId]
  );
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist profile not found.', 404);
  }
  const dentistId = dentistResult.rows[0].id;

  // Get the dental record
  const recordResult = await query(
    'SELECT * FROM dental_records WHERE id = $1',
    [recordId]
  );
  if (recordResult.rows.length === 0) {
    throw new AppError('Dental record not found.', 404);
  }
  const record = recordResult.rows[0];

  // Verify ownership
  if (record.dentist_id !== dentistId) {
    throw new AppError('You can only update your own dental records.', 403);
  }

  // Build update query dynamically
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (data.diagnosis !== undefined) {
    updates.push(`diagnosis = $${paramIdx++}`);
    params.push(data.diagnosis);
  }
  if (data.treatment !== undefined) {
    updates.push(`treatment = $${paramIdx++}`);
    params.push(data.treatment);
  }
  if (data.notes !== undefined) {
    updates.push(`notes = $${paramIdx++}`);
    params.push(data.notes);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update. Provide at least one of: diagnosis, treatment, notes.', 400);
  }

  params.push(recordId);
  const updatedResult = await query(
    `UPDATE dental_records SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
    params
  );

  return updatedResult.rows[0];
}

// ═══════════════════════════════════════════════════════════════
// GET RECORDS BY DENTIST
// ═══════════════════════════════════════════════════════════════

/**
 * Get all records created by a specific dentist.
 * Used for the dentist's own clinical history view.
 */
export async function getRecordsByDentist(dentistUserId: string) {
  // Get dentist record
  const dentistResult = await query(
    'SELECT id FROM dentists WHERE user_id = $1',
    [dentistUserId]
  );
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist profile not found.', 404);
  }
  const dentistId = dentistResult.rows[0].id;

  const records = await query(
    `SELECT dr.*,
            u_p.full_name AS patient_name,
            (SELECT COUNT(*) FROM prescriptions p WHERE p.dental_record_id = dr.id) AS prescription_count
     FROM dental_records dr
     INNER JOIN patients pat ON pat.id = dr.patient_id
     INNER JOIN users u_p ON u_p.id = pat.user_id
     WHERE dr.dentist_id = $1
     ORDER BY dr.visit_date DESC, dr.created_at DESC`,
    [dentistId]
  );

  return records.rows;
}

// ═══════════════════════════════════════════════════════════════
// GET PATIENT'S OWN RECORDS (shortcut using user_id)
// ═══════════════════════════════════════════════════════════════

/**
 * Patient views their own dental records via /my endpoint.
 */
export async function getMyRecords(patientUserId: string) {
  const patientResult = await query(
    'SELECT id FROM patients WHERE user_id = $1',
    [patientUserId]
  );
  if (patientResult.rows.length === 0) {
    throw new AppError('Patient profile not found.', 404);
  }
  const patientId = patientResult.rows[0].id;

  return getRecordsByPatient(patientId, patientUserId, UserRole.PATIENT);
}
