import { query } from '../config/database.js';
import { sendAppointmentReminderEmail } from './emailService.js';

/**
 * Send reminder emails for all approved appointments scheduled for tomorrow.
 * This function is called by a cron job daily.
 */
export async function sendDailyReminders(): Promise<void> {
  try {
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    // Find all approved appointments for tomorrow
    const result = await query(
      `SELECT a.id, a.appointment_date, a.appointment_time, a.reason,
              u_p.email AS patient_email, u_p.full_name AS patient_name,
              u_d.full_name AS dentist_name
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN users u_p ON u_p.id = p.user_id
       INNER JOIN dentists d ON d.id = a.dentist_id
       INNER JOIN users u_d ON u_d.id = d.user_id
       WHERE a.appointment_date = $1
         AND a.status = 'approved'
         AND u_p.is_active = true
         AND u_p.is_email_verified = true`,
      [tomorrowStr]
    );

    console.log(`📧 Sending ${result.rows.length} appointment reminder(s) for ${tomorrowStr}`);

    for (const row of result.rows) {
      sendAppointmentReminderEmail(
        row.patient_email,
        row.patient_name,
        row.dentist_name,
        row.appointment_date,
        row.appointment_time,
        row.reason
      ).catch((err) => {
        console.error(`❌ Failed to send reminder to ${row.patient_email}:`, err);
      });
    }
  } catch (error) {
    console.error('❌ Error in sendDailyReminders:', error);
  }
}
