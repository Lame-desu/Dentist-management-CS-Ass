import axios from 'axios';

/**
 * Pre-configured Axios instance for DAMS API calls.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request interceptor — attaches JWT token from localStorage (if available).
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('dams_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor — handles common error scenarios.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // Redirect to login on 401 Unauthorized
      if (status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('dams_token');
        localStorage.removeItem('dams_user');
        // Only redirect if not already on an auth page
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Auth API ────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
}

export interface ProfileUpdatePayload {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  login: (data: LoginPayload) =>
    api.post('/auth/login', data),

  register: (data: RegisterPayload) =>
    api.post('/auth/register', data),

  getProfile: () =>
    api.get('/auth/profile'),

  updateProfile: (data: ProfileUpdatePayload) =>
    api.put('/auth/profile', data),

  changePassword: (data: ChangePasswordPayload) =>
    api.put('/auth/password', data),
};

// ─── Dentist API ─────────────────────────────────────────────────

export const dentistApi = {
  getAll: (params?: { specialization?: string; page?: number; limit?: number }) =>
    api.get('/dentists', { params }),

  getAvailability: (dentistId: number | string) =>
    api.get(`/availability/dentist/${dentistId}`),

  getSlots: (dentistId: number | string, date: string) =>
    api.get(`/availability/dentist/${dentistId}/slots`, { params: { date } }),
};

// ─── Appointment API ─────────────────────────────────────────────

export interface CreateAppointmentPayload {
  dentistId: number;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  isEmergency?: boolean;
}

export interface ReviewAppointmentPayload {
  action: 'forward' | 'reject' | 'reassign';
  rejectionReason?: string;
  newDentistId?: number;
}

export interface WalkInAppointmentPayload {
  patientId: number;
  dentistId: number;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  isEmergency?: boolean;
}

export const appointmentApi = {
  /** Patient books an appointment */
  create: (data: CreateAppointmentPayload) =>
    api.post('/appointments', data),

  /** Patient views own appointments */
  getMyAppointments: (params?: Record<string, unknown>) =>
    api.get('/appointments/my', { params }),

  /** Get appointment by ID (any authenticated user, role-filtered) */
  getById: (id: number | string) =>
    api.get(`/appointments/${id}`),

  /** Patient or receptionist cancels appointment */
  cancel: (id: number | string, reason?: string) =>
    api.patch(`/appointments/${id}/cancel`, { reason }),

  /** Get available time slots for a dentist on a date */
  getSlots: (params: { dentistId: number | string; date: string }) =>
    api.get('/appointments/slots', { params }),

  // ─── Receptionist-specific ─────────────────────────────────

  /** Receptionist views pending appointments */
  getPending: () =>
    api.get('/appointments/pending'),

  /** Receptionist reviews appointment (forward/reject/reassign) */
  review: (id: number | string, data: ReviewAppointmentPayload) =>
    api.post(`/appointments/${id}/review`, data),

  /** Receptionist views forwarded appointments */
  getForwarded: () =>
    api.get('/appointments/forwarded'),

  /** Receptionist/Admin views all appointments */
  getAll: (params?: Record<string, unknown>) =>
    api.get('/appointments', { params }),

  /** Receptionist creates walk-in appointment */
  createWalkIn: (data: WalkInAppointmentPayload) =>
    api.post('/appointments/walk-in', data),
};

// ─── Notification API ────────────────────────────────────────────

export const notificationApi = {
  getAll: (params?: { page?: number; limit?: number; isRead?: boolean }) =>
    api.get('/notifications', { params }),

  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  markRead: (id: number | string) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch('/notifications/read-all'),

  delete: (id: number | string) =>
    api.delete(`/notifications/${id}`),
};

// ─── User API ────────────────────────────────────────────────────

export const userApi = {
  getStaff: (params?: Record<string, unknown>) =>
    api.get('/users/staff', { params }),

  createStaff: (data: Record<string, unknown>) =>
    api.post('/users/staff', data),

  updateStaff: (id: number | string, data: Record<string, unknown>) =>
    api.put(`/users/staff/${id}`, data),

  toggleActive: (id: number | string) =>
    api.patch(`/users/staff/${id}/toggle-active`),

  /** Search users (admin endpoint, used by receptionist for patient search) */
  getAll: (params?: Record<string, unknown>) =>
    api.get('/users', { params }),

  /** Get a single user by ID */
  getById: (id: number | string) =>
    api.get(`/users/${id}`),
};

// ─── Admin API ───────────────────────────────────────────────────

export const adminApi = {
  getDashboard: () =>
    api.get('/admin/dashboard'),

  getAppointmentReport: (params?: { from?: string; to?: string }) =>
    api.get('/admin/reports/appointments', { params }),

  getPatientReport: () =>
    api.get('/admin/reports/patients'),
};

// ─── Queue API ───────────────────────────────────────────────────

export const queueApi = {
  addToQueue: (appointmentId: number | string) =>
    api.post('/queue', { appointmentId }),

  getTodayQueue: (params?: { dentistId?: number | string }) =>
    api.get('/queue/today', { params }),

  callPatient: (queueId: number | string) =>
    api.patch(`/queue/${queueId}/call`),

  completeQueue: (queueId: number | string) =>
    api.patch(`/queue/${queueId}/complete`),

  cancelQueue: (queueId: number | string) =>
    api.patch(`/queue/${queueId}/cancel`),

  getStats: () =>
    api.get('/queue/stats'),
};

// ─── Clinical API ────────────────────────────────────────────────

export const clinicalApi = {
  getRecords: (params?: Record<string, unknown>) =>
    api.get('/dental-records', { params }),

  getRecordById: (id: number | string) =>
    api.get(`/dental-records/${id}`),

  createRecord: (data: Record<string, unknown>) =>
    api.post('/dental-records', data),

  getPrescriptions: (params?: Record<string, unknown>) =>
    api.get('/prescriptions', { params }),

  createPrescription: (data: Record<string, unknown>) =>
    api.post('/prescriptions', data),
};
