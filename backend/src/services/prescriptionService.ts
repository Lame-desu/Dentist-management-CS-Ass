import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { UserRole } from '../utils/constants.js';
import { sendPrescriptionAddedEmail } from './emailService.js';

// ─── Interfaces ──────────────────────────────────────────────

interface CreatePrescriptionInput {
  medicineName: string;
  dosage: string;
  duration?: string;
  remarks?: string;
}

interface UpdatePrescriptionInput {
  medicineName?: string;
  dosage?: string;
  duration?: string;
  remarks?: string;
}

// ─── Helper: Validate dentist owns the dental record ─────────

async function validateDentistOwnsRecord(dentistUserId: string, dentalRecordId: number) {
  // Get dentist record
  const dentistResult = await query(
    'SELECT id FROM dentists WHERE user_id = $1',
    [dentistUserId]
  );
  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist profile not found.', 404);
  }
  const dentistId = dentistResult.rows[0].id;

  // Get dental record
  const recordResult = await query(
    'SELECT * FROM dental_records WHERE id = $1',
    [dentalRecordId]
  );
  if (recordResult.rows.length === 0) {
    throw new AppError('Dental record not found.', 404);
  }
  const record = recordResult.rows[0];

  // Verify ownership
  if (record.dentist_id !== dentistId) {
    throw new AppError('You can only manage prescriptions for your own dental records.', 403);
  }

  return { dentistId, record };
}

// ═══════════════════════════════════════════════════════════════
// CREATE PRESCRIPTION
// ═══════════════════════════════════════════════════════════════

/**
 * Add a single prescription to a dental record.
 * Only the dentist who created the record can add prescriptions.
 */
export async function createPrescription(
  dentistUserId: string,
  dentalRecordId: number,
  data: CreatePrescriptionInput
) {
  await validateDentistOwnsRecord(dentistUserId, dentalRecordId);

  const result = await query(
    `INSERT INTO prescriptions (dental_record_id, medicine_name, dosage, duration, remarks)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [dentalRecordId, data.medicineName, data.dosage, data.duration || null, data.remarks || null]
  );

  // Email 11: Notify patient about new prescription
  const patientInfo = await query(
    `SELECT u.email, u.full_name AS patient_name, u_d.full_name AS dentist_name, dr.visit_date
     FROM dental_records dr
     INNER JOIN patients p ON p.id = dr.patient_id
     INNER JOIN users u ON u.id = p.user_id
     INNER JOIN dentists d ON d.id = dr.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     WHERE dr.id = $1`,
    [dentalRecordId]
  );
  if (patientInfo.rows.length > 0) {
    const info = patientInfo.rows[0];
    sendPrescriptionAddedEmail(
      info.email,
      info.patient_name,
      info.dentist_name,
      info.visit_date,
      [{ medicineName: data.medicineName, dosage: data.dosage, duration: data.duration, remarks: data.remarks }]
    ).catch(() => {});
  }

  return result.rows[0];
}

// ═══════════════════════════════════════════════════════════════
// CREATE BULK PRESCRIPTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Add multiple prescriptions at once to a dental record.
 * Common workflow — dentist prescribes several medicines after consultation.
 */
export async function createBulkPrescriptions(
  dentistUserId: string,
  dentalRecordId: number,
  prescriptions: CreatePrescriptionInput[]
) {
  await validateDentistOwnsRecord(dentistUserId, dentalRecordId);

  if (!prescriptions || prescriptions.length === 0) {
    throw new AppError('At least one prescription is required.', 400);
  }

  const createdPrescriptions = [];
  for (const rx of prescriptions) {
    const result = await query(
      `INSERT INTO prescriptions (dental_record_id, medicine_name, dosage, duration, remarks)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dentalRecordId, rx.medicineName, rx.dosage, rx.duration || null, rx.remarks || null]
    );
    createdPrescriptions.push(result.rows[0]);
  }

  // Email 11: Notify patient about new prescriptions
  const patientInfo = await query(
    `SELECT u.email, u.full_name AS patient_name, u_d.full_name AS dentist_name, dr.visit_date
     FROM dental_records dr
     INNER JOIN patients p ON p.id = dr.patient_id
     INNER JOIN users u ON u.id = p.user_id
     INNER JOIN dentists d ON d.id = dr.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     WHERE dr.id = $1`,
    [dentalRecordId]
  );
  if (patientInfo.rows.length > 0) {
    const info = patientInfo.rows[0];
    sendPrescriptionAddedEmail(
      info.email,
      info.patient_name,
      info.dentist_name,
      info.visit_date,
      prescriptions.map(rx => ({ medicineName: rx.medicineName, dosage: rx.dosage, duration: rx.duration, remarks: rx.remarks }))
    ).catch(() => {});
  }

  return createdPrescriptions;
}

// ═══════════════════════════════════════════════════════════════
// GET PRESCRIPTIONS BY RECORD
// ═══════════════════════════════════════════════════════════════

/**
 * Get all prescriptions for a specific dental record.
 */
export async function getPrescriptionsByRecord(recordId: number) {
  // Verify the record exists
  const recordCheck = await query('SELECT id FROM dental_records WHERE id = $1', [recordId]);
  if (recordCheck.rows.length === 0) {
    throw new AppError('Dental record not found.', 404);
  }

  const result = await query(
    'SELECT * FROM prescriptions WHERE dental_record_id = $1 ORDER BY created_at ASC',
    [recordId]
  );

  return result.rows;
}

// ═══════════════════════════════════════════════════════════════
// GET PRESCRIPTIONS BY PATIENT
// ═══════════════════════════════════════════════════════════════

/**
 * Get all prescriptions across all dental records for a patient.
 * Grouped by dental record with visit date.
 */
export async function getPrescriptionsByPatient(patientUserId: string) {
  // Get patient record
  const patientResult = await query(
    'SELECT id FROM patients WHERE user_id = $1',
    [patientUserId]
  );
  if (patientResult.rows.length === 0) {
    throw new AppError('Patient profile not found.', 404);
  }
  const patientId = patientResult.rows[0].id;

  // Get all dental records for this patient with their prescriptions
  const records = await query(
    `SELECT dr.id AS dental_record_id,
            dr.visit_date,
            dr.diagnosis,
            u_d.full_name AS dentist_name,
            d.specialization
     FROM dental_records dr
     INNER JOIN dentists d ON d.id = dr.dentist_id
     INNER JOIN users u_d ON u_d.id = d.user_id
     WHERE dr.patient_id = $1
     ORDER BY dr.visit_date DESC`,
    [patientId]
  );

  const groupedPrescriptions = [];
  for (const record of records.rows) {
    const prescriptions = await query(
      'SELECT * FROM prescriptions WHERE dental_record_id = $1 ORDER BY created_at ASC',
      [record.dental_record_id]
    );
    if (prescriptions.rows.length > 0) {
      groupedPrescriptions.push({
        dental_record_id: record.dental_record_id,
        visit_date: record.visit_date,
        diagnosis: record.diagnosis,
        dentist_name: record.dentist_name,
        specialization: record.specialization,
        prescriptions: prescriptions.rows,
      });
    }
  }

  return groupedPrescriptions;
}

// ═══════════════════════════════════════════════════════════════
// UPDATE PRESCRIPTION
// ═══════════════════════════════════════════════════════════════

/**
 * Update a prescription. Only the dentist who created the parent record can update.
 */
export async function updatePrescription(
  prescriptionId: number,
  dentistUserId: string,
  data: UpdatePrescriptionInput
) {
  // Get the prescription
  const rxResult = await query(
    'SELECT * FROM prescriptions WHERE id = $1',
    [prescriptionId]
  );
  if (rxResult.rows.length === 0) {
    throw new AppError('Prescription not found.', 404);
  }
  const prescription = rxResult.rows[0];

  // Validate dentist owns the parent dental record
  await validateDentistOwnsRecord(dentistUserId, prescription.dental_record_id);

  // Build update query dynamically
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (data.medicineName !== undefined) {
    updates.push(`medicine_name = $${paramIdx++}`);
    params.push(data.medicineName);
  }
  if (data.dosage !== undefined) {
    updates.push(`dosage = $${paramIdx++}`);
    params.push(data.dosage);
  }
  if (data.duration !== undefined) {
    updates.push(`duration = $${paramIdx++}`);
    params.push(data.duration);
  }
  if (data.remarks !== undefined) {
    updates.push(`remarks = $${paramIdx++}`);
    params.push(data.remarks);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update. Provide at least one of: medicineName, dosage, duration, remarks.', 400);
  }

  params.push(prescriptionId);
  const updatedResult = await query(
    `UPDATE prescriptions SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
    params
  );

  return updatedResult.rows[0];
}

// ═══════════════════════════════════════════════════════════════
// DELETE PRESCRIPTION
// ═══════════════════════════════════════════════════════════════

/**
 * Remove a prescription. Only the dentist who created the parent record can delete.
 */
export async function deletePrescription(prescriptionId: number, dentistUserId: string) {
  // Get the prescription
  const rxResult = await query(
    'SELECT * FROM prescriptions WHERE id = $1',
    [prescriptionId]
  );
  if (rxResult.rows.length === 0) {
    throw new AppError('Prescription not found.', 404);
  }
  const prescription = rxResult.rows[0];

  // Validate dentist owns the parent dental record
  await validateDentistOwnsRecord(dentistUserId, prescription.dental_record_id);

  await query('DELETE FROM prescriptions WHERE id = $1', [prescriptionId]);

  return { id: prescriptionId, deleted: true };
}
