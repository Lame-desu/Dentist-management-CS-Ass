import { UserRole, AppointmentStatus, NotificationType, QueueStatus } from '../utils/constants.js';

// ─── User & Role Entities ────────────────────────────────────

export interface IUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string;
  profile_image?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IPatient {
  id: string;
  user_id: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IDentist {
  id: string;
  user_id: string;
  specialization: string;
  license_number: string;
  years_of_experience?: number;
  bio?: string;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IReceptionist {
  id: string;
  user_id: string;
  shift?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IAdmin {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

// ─── Appointment ─────────────────────────────────────────────

export interface IAppointment {
  id: string;
  patient_id: string;
  dentist_id?: string;
  receptionist_id?: string;
  appointment_date: Date;
  appointment_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

// ─── Dental Records & Prescriptions ─────────────────────────

export interface IDentalRecord {
  id: string;
  patient_id: string;
  dentist_id: string;
  appointment_id?: string;
  diagnosis: string;
  treatment: string;
  tooth_number?: string;
  notes?: string;
  attachments?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface IPrescription {
  id: string;
  dental_record_id: string;
  patient_id: string;
  dentist_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  created_at: Date;
  updated_at: Date;
}

// ─── Notifications ──────────────────────────────────────────

export interface INotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  reference_id?: string;
  reference_type?: string;
  created_at: Date;
}

// ─── Queue Management ───────────────────────────────────────

export interface IQueue {
  id: string;
  patient_id: string;
  dentist_id: string;
  queue_number: number;
  status: QueueStatus;
  check_in_time: Date;
  start_time?: Date;
  end_time?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// ─── Clinic Configuration ───────────────────────────────────

export interface IClinicConfiguration {
  id: string;
  clinic_name: string;
  address: string;
  phone: string;
  email: string;
  opening_time: string;
  closing_time: string;
  working_days: string[];
  appointment_slot_duration: number;
  max_appointments_per_slot: number;
  created_at: Date;
  updated_at: Date;
}

// ─── Dentist Availability ───────────────────────────────────

export interface IDentistAvailability {
  id: string;
  dentist_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─── Request & Auth Types ───────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: JwtPayload;
}
