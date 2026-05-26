import nodemailer from 'nodemailer';
import env from '../config/env.js';

// ─── SMTP Transporter ────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_APP_PASSWORD,
  },
});

// ─── Shared Styles ───────────────────────────────────────────

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DAMS Clinic</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#2563eb;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">🦷 DAMS Clinic</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:13px;">© ${new Date().getFullYear()} DAMS Clinic. All rights reserved.</p>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">This is an automated message. Please do not reply directly to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const ctaButton = (url: string, label: string) =>
  `<div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:600;letter-spacing:0.3px;">${label}</a>
  </div>`;

// ─── Email Functions ─────────────────────────────────────────

/**
 * Send a verification email after patient self-registration.
 */
export async function sendVerificationEmail(email: string, fullName: string, token: string): Promise<void> {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Welcome, ${fullName}!</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Thank you for registering with <strong>DAMS Clinic</strong>. To complete your registration, please verify your email address by clicking the button below.
    </p>
    ${ctaButton(verifyUrl, 'Verify My Email')}
    <p style="color:#64748b;font-size:13px;line-height:1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${verifyUrl}" style="color:#2563eb;word-break:break-all;">${verifyUrl}</a>
    </p>
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">⏰ This link expires in 24 hours.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email — DAMS Clinic',
      html,
    });
    console.log(`📧 Verification email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${email}:`, error);
  }
}

/**
 * Send an invitation email when admin creates a staff member or receptionist creates a walk-in patient.
 */
export async function sendInvitationEmail(email: string, fullName: string, role: string, token: string): Promise<void> {
  const setPasswordUrl = `${env.FRONTEND_URL}/set-password?token=${token}`;
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Welcome to DAMS Clinic, ${fullName}!</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      You've been added as a <strong>${displayRole}</strong> at <strong>DAMS Clinic</strong>. To get started, please set your password by clicking the button below.
    </p>
    ${ctaButton(setPasswordUrl, 'Set My Password')}
    <p style="color:#64748b;font-size:13px;line-height:1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${setPasswordUrl}" style="color:#2563eb;word-break:break-all;">${setPasswordUrl}</a>
    </p>
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">⏰ This link expires in 24 hours.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: "You've Been Invited — DAMS Clinic",
      html,
    });
    console.log(`📧 Invitation email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send invitation email to ${email}:`, error);
  }
}

/**
 * Send a generic "set your password" email (for resend scenarios).
 */
export async function sendPasswordSetEmail(email: string, fullName: string, token: string): Promise<void> {
  const setPasswordUrl = `${env.FRONTEND_URL}/set-password?token=${token}`;

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Set Your Password, ${fullName}</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      You requested to set your password for your <strong>DAMS Clinic</strong> account. Click the button below to choose a password and activate your account.
    </p>
    ${ctaButton(setPasswordUrl, 'Set My Password')}
    <p style="color:#64748b;font-size:13px;line-height:1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${setPasswordUrl}" style="color:#2563eb;word-break:break-all;">${setPasswordUrl}</a>
    </p>
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">⏰ This link expires in 24 hours.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: 'Set Your Password — DAMS Clinic',
      html,
    });
    console.log(`📧 Password-set email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send password-set email to ${email}:`, error);
  }
}

// ─── Appointment Lifecycle Emails ────────────────────────────

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/**
 * Email 1: Notify dentist that an appointment has been forwarded to them.
 */
export async function sendAppointmentForwardedEmail(
  email: string,
  dentistName: string,
  patientName: string,
  appointmentDate: string | Date,
  appointmentTime: string,
  reason?: string,
  isEmergency?: boolean
): Promise<void> {
  const emergencyBadge = isEmergency
    ? `<span style="display:inline-block;background-color:#dc2626;color:#ffffff;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:700;margin-bottom:12px;">🚨 EMERGENCY</span><br>`
    : '';

  const reasonBlock = reason
    ? `<p style="color:#475569;font-size:15px;line-height:1.6;"><strong>Reason:</strong> ${reason}</p>`
    : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">New Appointment Forwarded</h2>
    ${emergencyBadge}
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Hello Dr. ${dentistName}, a new appointment has been forwarded to you for review.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;"><strong>Patient:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${patientName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Date:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${formatDate(appointmentDate)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Time:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${appointmentTime}</td>
      </tr>
    </table>
    ${reasonBlock}
    ${ctaButton(`${env.FRONTEND_URL}/dashboard/dentist/appointments`, 'View Appointments')}
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">Please review and respond to this appointment at your earliest convenience.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: '📋 New Appointment Forwarded — DAMS Clinic',
      html,
    });
    console.log(`📧 Appointment-forwarded email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send appointment-forwarded email to ${email}:`, error);
  }
}

/**
 * Email 2a: Notify new dentist that an appointment has been assigned to them.
 */
export async function sendAppointmentAssignedEmail(
  email: string,
  dentistName: string,
  patientName: string,
  appointmentDate: string | Date,
  appointmentTime: string,
  reason?: string
): Promise<void> {
  const reasonBlock = reason
    ? `<p style="color:#475569;font-size:15px;line-height:1.6;"><strong>Reason:</strong> ${reason}</p>`
    : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">New Appointment Assigned</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Hello Dr. ${dentistName}, a new appointment has been assigned to you.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;"><strong>Patient:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${patientName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Date:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${formatDate(appointmentDate)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Time:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${appointmentTime}</td>
      </tr>
    </table>
    ${reasonBlock}
    ${ctaButton(`${env.FRONTEND_URL}/dashboard/dentist/appointments`, 'View Appointments')}
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">Please review this appointment and respond accordingly.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: '📌 New Appointment Assigned — DAMS Clinic',
      html,
    });
    console.log(`📧 Appointment-assigned email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send appointment-assigned email to ${email}:`, error);
  }
}

/**
 * Email 2b: Notify patient that their appointment has been reassigned to a different dentist.
 */
export async function sendAppointmentReassignedEmail(
  email: string,
  patientName: string,
  oldDentistName: string,
  newDentistName: string,
  appointmentDate: string | Date,
  appointmentTime: string
): Promise<void> {
  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Appointment Reassigned</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Hello ${patientName}, your appointment has been reassigned to a different dentist. Here are the updated details:
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:140px;"><strong>Previous Dentist:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">Dr. ${oldDentistName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>New Dentist:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">Dr. ${newDentistName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Date:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${formatDate(appointmentDate)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Time:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${appointmentTime}</td>
      </tr>
    </table>
    ${ctaButton(`${env.FRONTEND_URL}/dashboard/patient/appointments`, 'View My Appointments')}
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">If you have any questions, please contact the clinic.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: '🔄 Appointment Reassigned — DAMS Clinic',
      html,
    });
    console.log(`📧 Appointment-reassigned email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send appointment-reassigned email to ${email}:`, error);
  }
}

/**
 * Email 3 & 5 (patient side): Notify patient that their appointment was rejected.
 */
export async function sendAppointmentRejectedEmail(
  email: string,
  patientName: string,
  appointmentDate: string | Date,
  appointmentTime: string,
  rejectionReason: string,
  rejectedBy: 'receptionist' | 'dentist'
): Promise<void> {
  const rejectedByLabel = rejectedBy === 'dentist' ? 'your dentist' : 'the clinic receptionist';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Appointment Not Approved</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Hello ${patientName}, unfortunately your appointment request has been declined by ${rejectedByLabel}.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;"><strong>Date:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${formatDate(appointmentDate)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Time:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${appointmentTime}</td>
      </tr>
    </table>
    <div style="background-color:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:4px;margin:16px 0;">
      <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Reason:</strong> ${rejectionReason}</p>
    </div>
    ${ctaButton(`${env.FRONTEND_URL}/dashboard/patient/appointments`, 'Book a New Appointment')}
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">You may request a new appointment at a different time or with a different dentist.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: '❌ Appointment Declined — DAMS Clinic',
      html,
    });
    console.log(`📧 Appointment-rejected email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send appointment-rejected email to ${email}:`, error);
  }
}

/**
 * Email 4: Notify patient that their appointment has been approved by the dentist.
 */
export async function sendAppointmentApprovedEmail(
  email: string,
  patientName: string,
  dentistName: string,
  appointmentDate: string | Date,
  appointmentTime: string
): Promise<void> {
  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">🎉 Appointment Confirmed!</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Great news, ${patientName}! Your appointment has been approved and confirmed.
    </p>
    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:16px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;"><strong>Dentist:</strong></td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">Dr. ${dentistName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Date:</strong></td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${formatDate(appointmentDate)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Time:</strong></td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${appointmentTime}</td>
        </tr>
      </table>
    </div>
    ${ctaButton(`${env.FRONTEND_URL}/dashboard/patient/appointments`, 'View My Appointments')}
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">Please arrive 10 minutes before your scheduled time. If you need to cancel, please do so at least 24 hours in advance.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: '✅ Appointment Confirmed — DAMS Clinic',
      html,
    });
    console.log(`📧 Appointment-approved email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send appointment-approved email to ${email}:`, error);
  }
}

/**
 * Email 5 (receptionist side): Notify receptionists that a dentist rejected an appointment.
 */
export async function sendDentistRejectedNotificationEmail(
  email: string,
  receptionistName: string,
  dentistName: string,
  patientName: string,
  appointmentDate: string | Date,
  rejectionReason: string
): Promise<void> {
  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Dentist Rejected Appointment</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Hello ${receptionistName}, Dr. ${dentistName} has rejected the following appointment. Action is required — you may need to reassign this appointment or inform the patient.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;"><strong>Patient:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${patientName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Dentist:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">Dr. ${dentistName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Date:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${formatDate(appointmentDate)}</td>
      </tr>
    </table>
    <div style="background-color:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:4px;margin:16px 0;">
      <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Rejection Reason:</strong> ${rejectionReason}</p>
    </div>
    ${ctaButton(`${env.FRONTEND_URL}/dashboard/receptionist/appointments`, 'Manage Appointments')}
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">Please take action on this appointment as soon as possible.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: '⚠️ Dentist Rejected Appointment — DAMS Clinic',
      html,
    });
    console.log(`📧 Dentist-rejected notification email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send dentist-rejected notification email to ${email}:`, error);
  }
}

/**
 * Email 6: Notify patient/receptionist that a dentist has requested a reschedule.
 */
export async function sendAppointmentRescheduleEmail(
  email: string,
  recipientName: string,
  dentistName: string,
  patientName: string,
  originalDate: string | Date,
  originalTime: string,
  suggestedDate?: string,
  suggestedTime?: string,
  notes?: string
): Promise<void> {
  const suggestedBlock = suggestedDate && suggestedTime
    ? `
      <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;color:#1e40af;font-size:14px;font-weight:600;">Suggested New Time:</p>
        <p style="margin:0;color:#1e293b;font-size:14px;">${formatDate(suggestedDate)} at ${suggestedTime}</p>
      </div>`
    : '';

  const notesBlock = notes
    ? `<p style="color:#475569;font-size:14px;line-height:1.6;"><strong>Notes:</strong> ${notes}</p>`
    : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Reschedule Requested</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Hello ${recipientName}, Dr. ${dentistName} has requested to reschedule the appointment for ${patientName}.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:140px;"><strong>Original Date:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${formatDate(originalDate)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Original Time:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${originalTime}</td>
      </tr>
    </table>
    ${suggestedBlock}
    ${notesBlock}
    ${ctaButton(`${env.FRONTEND_URL}/dashboard/patient/appointments`, 'View Appointments')}
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">Please contact the clinic to confirm a new appointment time.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: '🔄 Reschedule Requested — DAMS Clinic',
      html,
    });
    console.log(`📧 Appointment-reschedule email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send appointment-reschedule email to ${email}:`, error);
  }
}

/**
 * Email 7: Notify relevant parties that an appointment has been cancelled.
 */
export async function sendAppointmentCancelledEmail(
  email: string,
  recipientName: string,
  cancellerRole: string,
  patientName: string,
  dentistName: string,
  appointmentDate: string | Date,
  appointmentTime: string
): Promise<void> {
  const cancelledBy = cancellerRole === 'patient' ? patientName : 'the clinic receptionist';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Appointment Cancelled</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Hello ${recipientName}, the following appointment has been cancelled by ${cancelledBy}.
    </p>
    <div style="background-color:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:16px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;"><strong>Patient:</strong></td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${patientName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Dentist:</strong></td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">Dr. ${dentistName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Date:</strong></td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${formatDate(appointmentDate)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Time:</strong></td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${appointmentTime}</td>
        </tr>
      </table>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">This appointment slot is now available for other bookings.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: '🚫 Appointment Cancelled — DAMS Clinic',
      html,
    });
    console.log(`📧 Appointment-cancelled email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send appointment-cancelled email to ${email}:`, error);
  }
}

/**
 * Email 8: Notify dentist about a walk-in appointment assigned to them.
 */
export async function sendWalkInAppointmentEmail(
  email: string,
  dentistName: string,
  patientName: string,
  appointmentDate: string | Date,
  appointmentTime: string,
  isEmergency?: boolean
): Promise<void> {
  const emergencyBadge = isEmergency
    ? `<span style="display:inline-block;background-color:#dc2626;color:#ffffff;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:700;margin-bottom:12px;">🚨 EMERGENCY</span><br>`
    : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Walk-in Appointment Assigned</h2>
    ${emergencyBadge}
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Hello Dr. ${dentistName}, a walk-in patient has been assigned to you.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;"><strong>Patient:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${patientName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Date:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${formatDate(appointmentDate)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Time:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${appointmentTime}</td>
      </tr>
    </table>
    ${ctaButton(`${env.FRONTEND_URL}/dashboard/dentist/appointments`, 'View Appointments')}
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">The patient is already at the clinic. Please prepare for the appointment.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: '🏥 Walk-in Appointment Assigned — DAMS Clinic',
      html,
    });
    console.log(`📧 Walk-in appointment email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send walk-in appointment email to ${email}:`, error);
  }
}

/**
 * Email 9 (Bonus): Notify receptionists about a new appointment request from a patient.
 */
export async function sendNewAppointmentRequestEmail(
  email: string,
  receptionistName: string,
  patientName: string,
  dentistName: string,
  appointmentDate: string | Date,
  appointmentTime: string,
  isEmergency?: boolean,
  reason?: string
): Promise<void> {
  const emergencyBadge = isEmergency
    ? `<span style="display:inline-block;background-color:#dc2626;color:#ffffff;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:700;margin-bottom:12px;">🚨 EMERGENCY</span><br>`
    : '';

  const reasonBlock = reason
    ? `<p style="color:#475569;font-size:14px;line-height:1.6;"><strong>Reason:</strong> ${reason}</p>`
    : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">New Appointment Request</h2>
    ${emergencyBadge}
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      Hello ${receptionistName}, a new appointment request has been submitted and requires your review.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;"><strong>Patient:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${patientName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Dentist:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">Dr. ${dentistName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Date:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${formatDate(appointmentDate)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;"><strong>Time:</strong></td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;">${appointmentTime}</td>
      </tr>
    </table>
    ${reasonBlock}
    ${ctaButton(`${env.FRONTEND_URL}/dashboard/receptionist/appointments`, 'Review Appointment')}
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">Please review and take action on this appointment request.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"DAMS Clinic" <${env.SMTP_USER}>`,
      to: email,
      subject: `${isEmergency ? '🚨' : '🦷'} New Appointment Request — DAMS Clinic`,
      html,
    });
    console.log(`📧 New appointment request email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send new appointment request email to ${email}:`, error);
  }
}
