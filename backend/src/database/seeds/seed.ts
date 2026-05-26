// ═══════════════════════════════════════════════════════════════
// DAMS — Database Seed Script
// Creates realistic demo data for development and demonstrations.
// Usage: npm run seed  (or set SEED_DB=true in docker-compose)
// ═══════════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import { query } from '../../config/database.js';

// ─── Helpers ───────────────────────────────────────────────────

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ─── Clear Existing Data (order matters for FK constraints) ───

async function clearData(): Promise<void> {
  console.log('🗑️  Clearing existing data…');
  const tables = [
    'queue_entries',
    'prescriptions',
    'dental_records',
    'notifications',
    'appointments',
    'dentist_availability',
    'receptionists',
    'dentists',
    'patients',
    'users',
  ];
  for (const table of tables) {
    await query(`DELETE FROM ${table}`);
    // Reset auto-increment sequences
    await query(`ALTER SEQUENCE IF EXISTS ${table}_id_seq RESTART WITH 1`);
  }
  console.log('   ✅ All data cleared.');
}

// ═══════════════════════════════════════════════════════════════
// SEED FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function seedUsers() {
  console.log('\n👤 Seeding users…');

  // ── Admin ──
  const adminHash = await hashPassword('admin123');
  await query(
    `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, is_email_verified)
     VALUES (1, 'System Administrator', 'admin@dams.com', '+251911000000', $1, 'admin', true)`,
    [adminHash]
  );
  console.log('   ✅ Admin: admin@dams.com / admin123');

  // ── Dentists ──
  const dentistHash = await hashPassword('dentist123');

  await query(
    `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, is_email_verified)
     VALUES (2, 'Dr. Abebe Kebede', 'abebe@dams.com', '+251912111111', $1, 'dentist', true)`,
    [dentistHash]
  );
  await query(
    `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, is_email_verified)
     VALUES (3, 'Dr. Tigist Haile', 'tigist@dams.com', '+251912222222', $1, 'dentist', true)`,
    [dentistHash]
  );
  await query(
    `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, is_email_verified)
     VALUES (4, 'Dr. Solomon Tadesse', 'solomon@dams.com', '+251912333333', $1, 'dentist', true)`,
    [dentistHash]
  );
  console.log('   ✅ 3 Dentists seeded');

  // ── Receptionists ──
  const receptionHash = await hashPassword('reception123');

  await query(
    `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, is_email_verified)
     VALUES (5, 'Meron Assefa', 'meron@dams.com', '+251913111111', $1, 'receptionist', true)`,
    [receptionHash]
  );
  await query(
    `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, is_email_verified)
     VALUES (6, 'Hana Girma', 'hana@dams.com', '+251913222222', $1, 'receptionist', true)`,
    [receptionHash]
  );
  console.log('   ✅ 2 Receptionists seeded');

  // ── Patients ──
  const patientHash = await hashPassword('patient123');

  await query(
    `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, is_email_verified)
     VALUES (7, 'Dawit Mengistu', 'dawit@dams.com', '+251914111111', $1, 'patient', true)`,
    [patientHash]
  );
  await query(
    `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, is_email_verified)
     VALUES (8, 'Sara Tesfaye', 'sara@dams.com', '+251914222222', $1, 'patient', true)`,
    [patientHash]
  );
  await query(
    `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, is_email_verified)
     VALUES (9, 'Yonas Bekele', 'yonas@dams.com', '+251914333333', $1, 'patient', true)`,
    [patientHash]
  );
  await query(
    `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, is_email_verified)
     VALUES (10, 'Bethlehem Wolde', 'bethlehem@dams.com', '+251914444444', $1, 'patient', true)`,
    [patientHash]
  );
  await query(
    `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, is_email_verified)
     VALUES (11, 'Kidus Alemu', 'kidus@dams.com', '+251914555555', $1, 'patient', true)`,
    [patientHash]
  );
  console.log('   ✅ 5 Patients seeded');

  // Reset sequence to next available
  await query(`SELECT setval('users_id_seq', 11)`);
}

// ─── Dentist Profiles + Availability ─────────────────────────

async function seedDentists() {
  console.log('\n🦷 Seeding dentist profiles & availability…');

  // Dr. Abebe Kebede — General Dentistry, 8 years
  await query(
    `INSERT INTO dentists (id, user_id, specialization, license_number, years_of_experience, bio)
     VALUES (1, 2, 'General Dentistry', 'ETH-DEN-2018-001', 8,
       'Experienced general dentist specializing in preventive care, restorations, and cosmetic dentistry. Graduated from Addis Ababa University School of Dentistry.')`
  );
  // Mon-Fri 8:00-17:00 (days 1-5)
  for (let day = 1; day <= 5; day++) {
    await query(
      `INSERT INTO dentist_availability (dentist_id, day_of_week, start_time, end_time) VALUES (1, $1, '08:00', '17:00')`,
      [day]
    );
  }

  // Dr. Tigist Haile — Orthodontics, 12 years
  await query(
    `INSERT INTO dentists (id, user_id, specialization, license_number, years_of_experience, bio)
     VALUES (2, 3, 'Orthodontics', 'ETH-DEN-2014-042', 12,
       'Board-certified orthodontist with over a decade of experience in braces, aligners, and corrective jaw procedures. Fellowship at Tikur Anbessa Hospital.')`
  );
  // Mon-Wed-Fri 9:00-16:00 (days 1,3,5)
  for (const day of [1, 3, 5]) {
    await query(
      `INSERT INTO dentist_availability (dentist_id, day_of_week, start_time, end_time) VALUES (2, $1, '09:00', '16:00')`,
      [day]
    );
  }

  // Dr. Solomon Tadesse — Oral Surgery, 5 years
  await query(
    `INSERT INTO dentists (id, user_id, specialization, license_number, years_of_experience, bio)
     VALUES (3, 4, 'Oral Surgery', 'ETH-DEN-2021-103', 5,
       'Skilled oral surgeon specializing in tooth extractions, dental implants, and maxillofacial procedures. Trained at St. Paul Hospital.')`
  );
  // Tue-Thu-Sat 8:00-14:00 (days 2,4,6)
  for (const day of [2, 4, 6]) {
    await query(
      `INSERT INTO dentist_availability (dentist_id, day_of_week, start_time, end_time) VALUES (3, $1, '08:00', '14:00')`,
      [day]
    );
  }

  await query(`SELECT setval('dentists_id_seq', 3)`);
  console.log('   ✅ 3 Dentist profiles + availability seeded');
}

// ─── Receptionist Profiles ───────────────────────────────────

async function seedReceptionists() {
  console.log('\n📋 Seeding receptionist profiles…');

  await query(
    `INSERT INTO receptionists (id, user_id, shift) VALUES (1, 5, 'morning')`
  );
  await query(
    `INSERT INTO receptionists (id, user_id, shift) VALUES (2, 6, 'full_day')`
  );

  await query(`SELECT setval('receptionists_id_seq', 2)`);
  console.log('   ✅ 2 Receptionist profiles seeded');
}

// ─── Patient Profiles ────────────────────────────────────────

async function seedPatients() {
  console.log('\n🏥 Seeding patient profiles…');

  await query(
    `INSERT INTO patients (id, user_id, date_of_birth, gender, address, emergency_contact, blood_group, allergies) VALUES
     (1, 7,  '1990-03-15', 'male',   'Bole Sub-city, Woreda 08, Addis Ababa',    '+251915111111', 'A+',  NULL),
     (2, 8,  '1985-07-22', 'female', 'Kirkos Sub-city, Woreda 03, Addis Ababa',   '+251915222222', 'B+',  'Penicillin'),
     (3, 9,  '1998-11-08', 'male',   'Arada Sub-city, Woreda 06, Addis Ababa',    '+251915333333', 'O+',  NULL),
     (4, 10, '1992-01-30', 'female', 'Yeka Sub-city, Woreda 11, Addis Ababa',     '+251915444444', 'AB-', 'Latex'),
     (5, 11, '2000-05-12', 'male',   'Nifas Silk-Lafto Sub-city, Addis Ababa',    '+251915555555', 'O-',  NULL)`
  );

  await query(`SELECT setval('patients_id_seq', 5)`);
  console.log('   ✅ 5 Patient profiles seeded');
}

// ─── Appointments ────────────────────────────────────────────

async function seedAppointments() {
  console.log('\n📅 Seeding appointments…');

  const todayStr = today();
  const yesterdayStr = daysAgo(1);
  const twoDaysAgoStr = daysAgo(2);
  const threeDaysAgoStr = daysAgo(3);
  const tomorrowStr = daysFromNow(1);
  const twoDaysFromNowStr = daysFromNow(2);

  // 1 — Completed appointment (3 days ago) — Dawit + Dr. Abebe
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, reviewed_by, appointment_date, appointment_time, status, reason, notes, created_by_role)
     VALUES (1, 1, 1, 1, $1, '09:00', 'completed', 'Routine checkup and cleaning', 'Patient was cooperative', 'patient')`,
    [threeDaysAgoStr]
  );

  // 2 — Completed appointment (2 days ago) — Sara + Dr. Tigist
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, reviewed_by, appointment_date, appointment_time, status, reason, notes, created_by_role)
     VALUES (2, 2, 2, 2, $1, '10:00', 'completed', 'Orthodontic consultation for braces', 'Recommended ceramic braces', 'patient')`,
    [twoDaysAgoStr]
  );

  // 3 — Completed appointment (yesterday) — Yonas + Dr. Solomon
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, reviewed_by, appointment_date, appointment_time, status, reason, notes, created_by_role)
     VALUES (3, 3, 3, 1, $1, '08:30', 'completed', 'Wisdom tooth extraction', 'Successful extraction of lower right wisdom tooth', 'receptionist')`,
    [yesterdayStr]
  );

  // 4 — Approved for today — Bethlehem + Dr. Abebe
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, reviewed_by, appointment_date, appointment_time, status, reason, created_by_role)
     VALUES (4, 4, 1, 2, $1, '09:30', 'approved', 'Tooth sensitivity and pain', 'patient')`,
    [todayStr]
  );

  // 5 — Approved for today — Kidus + Dr. Abebe
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, reviewed_by, appointment_date, appointment_time, status, reason, created_by_role)
     VALUES (5, 5, 1, 1, $1, '10:30', 'approved', 'Dental filling replacement', 'patient')`,
    [todayStr]
  );

  // 6 — Forwarded (waiting for dentist response) — Dawit + Dr. Tigist
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, reviewed_by, appointment_date, appointment_time, status, reason, created_by_role)
     VALUES (6, 1, 2, 1, $1, '11:00', 'forwarded', 'Follow-up orthodontic evaluation', 'patient')`,
    [tomorrowStr]
  );

  // 7 — Pending (not yet reviewed) — Sara + Dr. Solomon
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, appointment_date, appointment_time, status, reason, created_by_role)
     VALUES (7, 2, 3, $1, '09:00', 'pending', 'Jaw pain consultation', 'patient')`,
    [tomorrowStr]
  );

  // 8 — Pending — Yonas + Dr. Abebe
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, appointment_date, appointment_time, status, reason, created_by_role)
     VALUES (8, 3, 1, $1, '14:00', 'pending', 'Post-extraction follow-up', 'patient')`,
    [tomorrowStr]
  );

  // 9 — Rejected — Bethlehem + Dr. Tigist (2 days from now)
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, reviewed_by, appointment_date, appointment_time, status, reason, rejection_reason, created_by_role)
     VALUES (9, 4, 2, 2, $1, '10:00', 'rejected', 'Cosmetic teeth whitening', 'Schedule is fully booked for this date. Please choose another day.', 'patient')`,
    [twoDaysFromNowStr]
  );

  // 10 — Cancelled by patient — Kidus + Dr. Solomon
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, appointment_date, appointment_time, status, reason, created_by_role)
     VALUES (10, 5, 3, $1, '08:00', 'cancelled', 'Dental implant consultation', 'patient')`,
    [twoDaysFromNowStr]
  );

  // 11 — Walk-in today — Dawit + Dr. Abebe (emergency)
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, reviewed_by, appointment_date, appointment_time, status, is_emergency, reason, created_by_role)
     VALUES (11, 1, 1, 1, $1, '11:30', 'approved', true, 'Severe toothache — emergency walk-in', 'receptionist')`,
    [todayStr]
  );

  // 12 — Approved for today — Sara + Dr. Tigist
  await query(
    `INSERT INTO appointments (id, patient_id, dentist_id, reviewed_by, appointment_date, appointment_time, status, reason, created_by_role)
     VALUES (12, 2, 2, 2, $1, '14:00', 'approved', 'Braces tightening appointment', 'patient')`,
    [todayStr]
  );

  await query(`SELECT setval('appointments_id_seq', 12)`);
  console.log('   ✅ 12 Appointments seeded');
}

// ─── Dental Records ──────────────────────────────────────────

async function seedDentalRecords() {
  console.log('\n📝 Seeding dental records…');

  const threeDaysAgoStr = daysAgo(3);
  const twoDaysAgoStr = daysAgo(2);
  const yesterdayStr = daysAgo(1);

  // Record for appointment 1 (Dawit — routine checkup)
  await query(
    `INSERT INTO dental_records (id, appointment_id, patient_id, dentist_id, diagnosis, treatment, notes, visit_date)
     VALUES (1, 1, 1, 1,
       'Mild gingivitis and plaque buildup on lower premolars',
       'Full mouth scaling and polishing. Applied fluoride varnish. Oral hygiene instruction provided.',
       'Patient advised to use soft-bristle toothbrush and floss daily. Follow-up in 6 months.',
       $1)`,
    [threeDaysAgoStr]
  );

  // Record for appointment 2 (Sara — orthodontic consultation)
  await query(
    `INSERT INTO dental_records (id, appointment_id, patient_id, dentist_id, diagnosis, treatment, notes, visit_date)
     VALUES (2, 2, 2, 2,
       'Class II malocclusion with moderate crowding in upper arch',
       'Clinical examination and dental impressions taken. Digital X-ray series completed. Treatment plan presented for ceramic braces (18-24 months).',
       'Patient to return in 2 weeks for braces fitting. Allergic to penicillin — noted in chart.',
       $1)`,
    [twoDaysAgoStr]
  );

  // Record for appointment 3 (Yonas — wisdom tooth extraction)
  await query(
    `INSERT INTO dental_records (id, appointment_id, patient_id, dentist_id, diagnosis, treatment, notes, visit_date)
     VALUES (3, 3, 3, 3,
       'Impacted lower right third molar (tooth #48) with pericoronitis',
       'Surgical extraction of tooth #48 under local anesthesia (Lidocaine 2%). Sutures placed — 3 simple interrupted sutures with 4-0 silk.',
       'Prescribed Amoxicillin 500mg TID for 5 days and Ibuprofen 400mg PRN. Suture removal in 7 days.',
       $1)`,
    [yesterdayStr]
  );

  // Record without appointment (walk-in follow-up from previous visit — Dawit)
  await query(
    `INSERT INTO dental_records (id, patient_id, dentist_id, diagnosis, treatment, notes, visit_date)
     VALUES (4, 1, 1,
       'Cavity on upper left first molar (tooth #26) — Class I caries',
       'Amalgam filling placed after caries removal. Bite adjusted.',
       'No sensitivity reported post-procedure. Regular checkup recommended in 3 months.',
       $1)`,
    [daysAgo(10)]
  );

  // Record — Bethlehem previous visit
  await query(
    `INSERT INTO dental_records (id, patient_id, dentist_id, diagnosis, treatment, notes, visit_date)
     VALUES (5, 4, 1,
       'Dental hypersensitivity on lower anterior teeth',
       'Applied desensitizing agent (potassium nitrate). Recommended Sensodyne toothpaste.',
       'Patient to return if symptoms persist after 2 weeks.',
       $1)`,
    [daysAgo(14)]
  );

  await query(`SELECT setval('dental_records_id_seq', 5)`);
  console.log('   ✅ 5 Dental records seeded');
}

// ─── Prescriptions ───────────────────────────────────────────

async function seedPrescriptions() {
  console.log('\n💊 Seeding prescriptions…');

  // For dental record 1 (Dawit — gingivitis)
  await query(
    `INSERT INTO prescriptions (id, dental_record_id, medicine_name, dosage, duration, remarks)
     VALUES
     (1, 1, 'Chlorhexidine Mouthwash 0.12%',    'Rinse 15ml twice daily',  '2 weeks',  'Use after brushing, do not eat or drink for 30 min after rinsing'),
     (2, 1, 'Metronidazole 400mg',               '1 tablet three times daily', '5 days', 'Take with food. Avoid alcohol.')`
  );

  // For dental record 2 (Sara — orthodontic)
  await query(
    `INSERT INTO prescriptions (id, dental_record_id, medicine_name, dosage, duration, remarks)
     VALUES
     (3, 2, 'Ibuprofen 400mg',                   '1 tablet as needed',    '3 days',   'For pain after braces fitting. Max 3 tablets per day.'),
     (4, 2, 'Orthodontic Wax',                    'Apply to brackets as needed', 'Ongoing', 'Use when brackets cause irritation to cheeks/lips.')`
  );

  // For dental record 3 (Yonas — extraction)
  await query(
    `INSERT INTO prescriptions (id, dental_record_id, medicine_name, dosage, duration, remarks)
     VALUES
     (5, 3, 'Amoxicillin 500mg',                  '1 capsule three times daily', '5 days', 'Complete full course even if feeling better.'),
     (6, 3, 'Ibuprofen 400mg',                    '1 tablet every 6 hours',      '3 days', 'Take with food. Do not exceed 4 tablets daily.'),
     (7, 3, 'Paracetamol 500mg',                  '1-2 tablets every 4-6 hours', '5 days', 'Alternate with Ibuprofen if needed.')`
  );

  // For dental record 4 (Dawit — cavity filling)
  await query(
    `INSERT INTO prescriptions (id, dental_record_id, medicine_name, dosage, duration, remarks)
     VALUES
     (8, 4, 'Ibuprofen 200mg',                    '1 tablet as needed',    '2 days', 'For post-procedure sensitivity.')`
  );

  // For dental record 5 (Bethlehem — sensitivity)
  await query(
    `INSERT INTO prescriptions (id, dental_record_id, medicine_name, dosage, duration, remarks)
     VALUES
     (9,  5, 'Sensodyne Repair & Protect Toothpaste', 'Use twice daily when brushing', '3 months', 'Replace regular toothpaste.'),
     (10, 5, 'Fluoride Gel 1.1%',                      'Apply thin layer to teeth at night', '4 weeks', 'Use custom tray provided.')`
  );

  await query(`SELECT setval('prescriptions_id_seq', 10)`);
  console.log('   ✅ 10 Prescriptions seeded');
}

// ─── Notifications ───────────────────────────────────────────

async function seedNotifications() {
  console.log('\n🔔 Seeding notifications…');

  const notifications = [
    // Patient notifications
    { userId: 7, title: 'Appointment Confirmed', message: 'Your appointment with Dr. Abebe Kebede for routine checkup has been approved.', type: 'appointment', relatedAppointmentId: 1 },
    { userId: 7, title: 'Appointment Completed', message: 'Your visit with Dr. Abebe Kebede has been completed. View your dental records.', type: 'appointment', relatedAppointmentId: 1 },
    { userId: 8, title: 'Appointment Confirmed', message: 'Your orthodontic consultation with Dr. Tigist Haile has been approved.', type: 'appointment', relatedAppointmentId: 2 },
    { userId: 8, title: 'New Prescription', message: 'Dr. Tigist Haile has issued new prescriptions for your visit. Check your prescriptions.', type: 'prescription', relatedAppointmentId: 2 },
    { userId: 9, title: 'Appointment Confirmed', message: 'Your wisdom tooth extraction with Dr. Solomon Tadesse has been approved.', type: 'appointment', relatedAppointmentId: 3 },
    { userId: 10, title: 'Appointment Approved', message: 'Your appointment with Dr. Abebe Kebede today at 9:30 AM has been approved.', type: 'appointment', relatedAppointmentId: 4 },
    { userId: 11, title: 'Appointment Approved', message: 'Your appointment with Dr. Abebe Kebede today at 10:30 AM has been approved.', type: 'appointment', relatedAppointmentId: 5 },
    { userId: 10, title: 'Appointment Rejected', message: 'Your request for cosmetic teeth whitening with Dr. Tigist Haile was declined. Reason: Schedule is fully booked.', type: 'appointment', relatedAppointmentId: 9 },
    { userId: 7, title: 'Emergency Walk-in', message: 'Emergency walk-in appointment has been created for you with Dr. Abebe Kebede today.', type: 'appointment', relatedAppointmentId: 11 },

    // Dentist notifications
    { userId: 2, title: 'New Appointment Request', message: 'Bethlehem Wolde has a pending appointment today at 9:30 AM.', type: 'appointment', relatedAppointmentId: 4 },
    { userId: 2, title: 'New Appointment Request', message: 'Kidus Alemu has a pending appointment today at 10:30 AM.', type: 'appointment', relatedAppointmentId: 5 },
    { userId: 3, title: 'Forwarded Appointment', message: 'A follow-up orthodontic evaluation for Dawit Mengistu has been forwarded to you.', type: 'appointment', relatedAppointmentId: 6 },
    { userId: 2, title: 'Emergency Patient', message: 'Emergency walk-in: Dawit Mengistu — severe toothache. Approved for 11:30 AM today.', type: 'emergency', relatedAppointmentId: 11 },

    // Receptionist notifications
    { userId: 5, title: 'New Online Booking', message: 'Sara Tesfaye has requested an appointment with Dr. Solomon Tadesse for jaw pain consultation.', type: 'appointment', relatedAppointmentId: 7 },
    { userId: 5, title: 'New Online Booking', message: 'Yonas Bekele has requested a follow-up appointment with Dr. Abebe Kebede.', type: 'appointment', relatedAppointmentId: 8 },
    { userId: 6, title: 'Appointment Cancelled', message: 'Kidus Alemu cancelled their dental implant consultation with Dr. Solomon Tadesse.', type: 'appointment', relatedAppointmentId: 10 },

    // Admin notifications
    { userId: 1, title: 'System Started', message: 'DAMS system has been initialized with seed data for demonstration.', type: 'system', relatedAppointmentId: null },
    { userId: 1, title: 'New Staff Member', message: 'Dr. Abebe Kebede has been added as a dentist.', type: 'system', relatedAppointmentId: null },
    { userId: 1, title: 'Daily Summary', message: 'Today: 4 approved appointments, 2 pending requests, 1 emergency walk-in.', type: 'system', relatedAppointmentId: null },
    { userId: 1, title: 'High Queue Volume', message: 'Queue has exceeded 3 patients. Consider assigning additional staff.', type: 'system', relatedAppointmentId: null },
  ];

  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    if (n.relatedAppointmentId) {
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, related_appointment_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [i + 1, n.userId, n.title, n.message, n.type, i < 5, n.relatedAppointmentId]
      );
    } else {
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [i + 1, n.userId, n.title, n.message, n.type, false]
      );
    }
  }

  await query(`SELECT setval('notifications_id_seq', ${notifications.length})`);
  console.log(`   ✅ ${notifications.length} Notifications seeded`);
}

// ─── Queue Entries ───────────────────────────────────────────

async function seedQueueEntries() {
  console.log('\n🎫 Seeding queue entries for today…');

  const todayStr = today();

  // Entry 1 — Bethlehem (appointment 4) — waiting
  await query(
    `INSERT INTO queue_entries (id, appointment_id, patient_id, dentist_id, queue_number, status, queue_date)
     VALUES (1, 4, 4, 1, 1, 'waiting', $1)`,
    [todayStr]
  );

  // Entry 2 — Kidus (appointment 5) — waiting
  await query(
    `INSERT INTO queue_entries (id, appointment_id, patient_id, dentist_id, queue_number, status, queue_date)
     VALUES (2, 5, 5, 1, 2, 'waiting', $1)`,
    [todayStr]
  );

  // Entry 3 — Dawit emergency (appointment 11) — in_progress
  await query(
    `INSERT INTO queue_entries (id, appointment_id, patient_id, dentist_id, queue_number, status, queue_date, called_time)
     VALUES (3, 11, 1, 1, 3, 'in_progress', $1, CURRENT_TIMESTAMP)`,
    [todayStr]
  );

  // Entry 4 — Sara (appointment 12) — waiting (different dentist)
  await query(
    `INSERT INTO queue_entries (id, appointment_id, patient_id, dentist_id, queue_number, status, queue_date)
     VALUES (4, 12, 2, 2, 4, 'waiting', $1)`,
    [todayStr]
  );

  await query(`SELECT setval('queue_entries_id_seq', 4)`);
  console.log('   ✅ 4 Queue entries seeded (2 waiting, 1 in_progress, 1 for other dentist)');
}

// ─── Clinic Configuration ────────────────────────────────────

async function seedClinicConfig() {
  console.log('\n⚙️  Verifying clinic configuration defaults…');

  // The migration already inserts defaults, but let's ensure they exist
  const result = await query('SELECT COUNT(*) as count FROM clinic_configuration');
  if (parseInt(result.rows[0].count) >= 5) {
    console.log('   ✅ Clinic configuration already has defaults');
  } else {
    await query(`
      INSERT INTO clinic_configuration (config_key, config_value, description) VALUES
        ('working_days',                          '1,2,3,4,5', 'Working days (0=Sun … 6=Sat)'),
        ('opening_time',                          '08:00',      'Clinic opening time'),
        ('closing_time',                          '17:00',      'Clinic closing time'),
        ('appointment_duration_minutes',          '30',         'Default appointment slot duration in minutes'),
        ('max_appointments_per_day_per_dentist',  '16',         'Maximum appointments a dentist can have per day')
      ON CONFLICT (config_key) DO NOTHING
    `);
    console.log('   ✅ Clinic configuration defaults inserted');
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

/**
 * Check if the database already has data (users table).
 * Returns true if the database is empty and needs seeding.
 */
async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const result = await query('SELECT COUNT(*) AS count FROM users');
    return parseInt(result.rows[0].count) === 0;
  } catch {
    // Table doesn't exist yet — database is empty
    return true;
  }
}

/**
 * Seed the database with demo data.
 *
 * - On first run (empty database): seeds all demo data automatically.
 * - On subsequent runs: skips seeding to preserve existing data.
 * - To force re-seed: set FORCE_SEED=true env var, or run the script
 *   directly with --force flag, or wipe volumes with `docker compose down -v`.
 */
export async function runSeed(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   🌱 DAMS — Database Seed Script             ║');
  console.log('╚══════════════════════════════════════════════╝');

  const forceFlag = process.env.FORCE_SEED === 'true' || process.argv.includes('--force');

  // Skip seeding if data already exists (unless forced)
  if (!forceFlag) {
    const empty = await isDatabaseEmpty();
    if (!empty) {
      console.log('\n✅ Database already has data — skipping seed.');
      console.log('   To force re-seed: set FORCE_SEED=true or run with --force');
      console.log('   To start fresh:   docker compose down -v && docker compose up --build\n');
      return;
    }
  } else {
    console.log('\n⚠️  Force seed enabled — clearing existing data…');
  }

  try {
    await clearData();
    await seedUsers();
    await seedDentists();
    await seedReceptionists();
    await seedPatients();
    await seedAppointments();
    await seedDentalRecords();
    await seedPrescriptions();
    await seedNotifications();
    await seedQueueEntries();
    await seedClinicConfig();

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   ✅ Seed completed successfully!             ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║   Demo Credentials:                          ║');
    console.log('║   Admin:        admin@dams.com / admin123    ║');
    console.log('║   Dentist:      abebe@dams.com / dentist123  ║');
    console.log('║   Receptionist: meron@dams.com / reception123║');
    console.log('║   Patient:      dawit@dams.com / patient123  ║');
    console.log('╚══════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

// ─── Run directly if invoked as a script ─────────────────────
// e.g. npx tsx src/database/seeds/seed.ts
// e.g. npx tsx src/database/seeds/seed.ts --force
const isDirectRun = process.argv[1]?.includes('seed');
if (isDirectRun) {
  runSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
