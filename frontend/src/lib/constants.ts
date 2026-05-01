/**
 * User roles — mirrors backend/src/utils/constants.ts
 */
export enum UserRole {
  PATIENT = 'patient',
  DENTIST = 'dentist',
  RECEPTIONIST = 'receptionist',
  ADMIN = 'admin',
}

/**
 * Appointment lifecycle statuses — mirrors backend.
 */
export enum AppointmentStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  FORWARDED = 'forwarded',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

/**
 * Notification types — mirrors backend.
 */
export enum NotificationType {
  APPOINTMENT_REQUEST = 'appointment_request',
  APPOINTMENT_APPROVED = 'appointment_approved',
  APPOINTMENT_REJECTED = 'appointment_rejected',
  APPOINTMENT_FORWARDED = 'appointment_forwarded',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  GENERAL = 'general',
}

/**
 * Human-readable labels for display.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.PATIENT]: 'Patient',
  [UserRole.DENTIST]: 'Dentist',
  [UserRole.RECEPTIONIST]: 'Receptionist',
  [UserRole.ADMIN]: 'Admin',
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'Pending',
  [AppointmentStatus.REVIEWED]: 'Reviewed',
  [AppointmentStatus.FORWARDED]: 'Forwarded',
  [AppointmentStatus.APPROVED]: 'Approved',
  [AppointmentStatus.COMPLETED]: 'Completed',
  [AppointmentStatus.REJECTED]: 'Rejected',
  [AppointmentStatus.CANCELLED]: 'Cancelled',
  [AppointmentStatus.RESCHEDULED]: 'Rescheduled',
};
