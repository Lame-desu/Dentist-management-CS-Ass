/**
 * User roles within the DAMS system.
 */
export enum UserRole {
  PATIENT = 'patient',
  DENTIST = 'dentist',
  RECEPTIONIST = 'receptionist',
  ADMIN = 'admin',
}

/**
 * Appointment lifecycle statuses.
 * Flow: PENDING → REVIEWED → FORWARDED → APPROVED → COMPLETED
 *       (can be REJECTED, CANCELLED, or RESCHEDULED at various stages)
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
 * Types of notifications sent to users.
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
 * Days of the week for dentist availability scheduling.
 */
export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

/**
 * Queue entry statuses for walk-in / same-day management.
 */
export enum QueueStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}
