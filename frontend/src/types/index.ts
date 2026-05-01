import { UserRole, AppointmentStatus, NotificationType } from '@/lib/constants';

// ─── User & Role Types ──────────────────────────────────────

export interface IUser {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string;
  profile_image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IPatient {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
  created_at: string;
  updated_at: string;
}

export interface IDentist {
  id: string;
  user_id: string;
  specialization: string;
  license_number: string;
  years_of_experience?: number;
  bio?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface IReceptionist {
  id: string;
  user_id: string;
  shift?: string;
  created_at: string;
  updated_at: string;
}

export interface IAdmin {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ─── Appointment ─────────────────────────────────────────────

export interface IAppointment {
  id: string;
  patient_id: string;
  dentist_id?: string;
  receptionist_id?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

// ─── Queue ──────────────────────────────────────────────────

export interface IQueue {
  id: string;
  patient_id: string;
  dentist_id: string;
  queue_number: number;
  status: string;
  check_in_time: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

// ─── API Response Types ─────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// ─── Auth Types ─────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: IUser;
  token: string;
}
