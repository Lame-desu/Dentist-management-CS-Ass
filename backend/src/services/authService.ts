import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import env from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { UserRole } from '../utils/constants.js';
import { JwtPayload } from '../types/index.js';

// ─── Interfaces ──────────────────────────────────────────────

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  allergies?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface ProfileUpdateInput {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  allergies?: string;
  // Dentist-specific
  specialization?: string;
  bio?: string;
  yearsOfExperience?: number;
  // Receptionist-specific
  shift?: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
}

function sanitizeUser(user: Record<string, unknown>): Record<string, unknown> {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// ─── Service Functions ───────────────────────────────────────

/**
 * Register a new patient account (public registration).
 */
export async function register(data: RegisterInput) {
  // Check email uniqueness
  const existing = await query('SELECT id FROM users WHERE email = $1', [data.email]);
  if (existing.rows.length > 0) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user record
  const userResult = await query(
    `INSERT INTO users (full_name, email, phone_number, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, full_name, email, phone_number, role, profile_photo, is_active, created_at, updated_at`,
    [data.fullName, data.email, data.phoneNumber || null, passwordHash, UserRole.PATIENT]
  );

  const user = userResult.rows[0];

  // Create patient profile record
  await query(
    `INSERT INTO patients (user_id, date_of_birth, gender, address, emergency_contact, blood_group, allergies)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      user.id,
      data.dateOfBirth || null,
      data.gender || null,
      data.address || null,
      data.emergencyContact || null,
      data.bloodGroup || null,
      data.allergies || null,
    ]
  );

  // Generate JWT
  const token = generateToken({
    userId: user.id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
}

/**
 * Login with email and password.
 */
export async function login(data: LoginInput) {
  // Find user by email
  const result = await query('SELECT * FROM users WHERE email = $1', [data.email]);

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password.', 401);
  }

  const user = result.rows[0];

  // Check if account is active
  if (!user.is_active) {
    throw new AppError('Your account has been deactivated. Please contact the clinic.', 403);
  }

  // Verify password
  const isMatch = await bcrypt.compare(data.password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Generate JWT
  const token = generateToken({
    userId: user.id.toString(),
    email: user.email,
    role: user.role,
  });

  // Enrich with role-specific profile_id
  const safeUser = sanitizeUser(user);
  const profileId = await resolveProfileId(user.id, user.role);
  if (profileId !== null) {
    safeUser.profile_id = profileId;
  }

  return {
    user: safeUser,
    token,
  };
}

/**
 * Get full user profile including role-specific data.
 */
export async function getProfile(userId: string) {
  const userResult = await query(
    `SELECT id, full_name, email, phone_number, role, profile_photo, is_active, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  const user = userResult.rows[0];
  let roleProfile = null;

  switch (user.role) {
    case UserRole.PATIENT: {
      const res = await query('SELECT * FROM patients WHERE user_id = $1', [userId]);
      roleProfile = res.rows[0] || null;
      break;
    }
    case UserRole.DENTIST: {
      const res = await query(
        `SELECT d.*, json_agg(
           json_build_object(
             'id', da.id,
             'day_of_week', da.day_of_week,
             'start_time', da.start_time,
             'end_time', da.end_time,
             'is_available', da.is_available
           )
         ) FILTER (WHERE da.id IS NOT NULL) AS availability
         FROM dentists d
         LEFT JOIN dentist_availability da ON da.dentist_id = d.id
         WHERE d.user_id = $1
         GROUP BY d.id`,
        [userId]
      );
      roleProfile = res.rows[0] || null;
      break;
    }
    case UserRole.RECEPTIONIST: {
      const res = await query('SELECT * FROM receptionists WHERE user_id = $1', [userId]);
      roleProfile = res.rows[0] || null;
      break;
    }
    case UserRole.ADMIN: {
      // Admins don't have a separate profile table in the schema
      break;
    }
  }

  // Attach profile_id as top-level field for frontend convenience
  const profile_id = roleProfile?.id ?? null;

  return {
    ...user,
    profile_id,
    profile: roleProfile,
  };
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(userId: string, data: ProfileUpdateInput) {
  // Update base user fields if provided
  const userUpdates: string[] = [];
  const userParams: unknown[] = [];
  let paramIdx = 1;

  if (data.fullName) {
    userUpdates.push(`full_name = $${paramIdx++}`);
    userParams.push(data.fullName);
  }
  if (data.phoneNumber !== undefined) {
    userUpdates.push(`phone_number = $${paramIdx++}`);
    userParams.push(data.phoneNumber);
  }

  if (userUpdates.length > 0) {
    userParams.push(userId);
    await query(
      `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${paramIdx}`,
      userParams
    );
  }

  // Get user role to update role-specific fields
  const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  const role = userResult.rows[0].role;

  if (role === UserRole.PATIENT) {
    const patientUpdates: string[] = [];
    const patientParams: unknown[] = [];
    let pIdx = 1;

    if (data.dateOfBirth !== undefined) {
      patientUpdates.push(`date_of_birth = $${pIdx++}`);
      patientParams.push(data.dateOfBirth || null);
    }
    if (data.gender !== undefined) {
      patientUpdates.push(`gender = $${pIdx++}`);
      patientParams.push(data.gender || null);
    }
    if (data.address !== undefined) {
      patientUpdates.push(`address = $${pIdx++}`);
      patientParams.push(data.address || null);
    }
    if (data.emergencyContact !== undefined) {
      patientUpdates.push(`emergency_contact = $${pIdx++}`);
      patientParams.push(data.emergencyContact || null);
    }
    if (data.bloodGroup !== undefined) {
      patientUpdates.push(`blood_group = $${pIdx++}`);
      patientParams.push(data.bloodGroup || null);
    }
    if (data.allergies !== undefined) {
      patientUpdates.push(`allergies = $${pIdx++}`);
      patientParams.push(data.allergies || null);
    }

    if (patientUpdates.length > 0) {
      patientParams.push(userId);
      await query(
        `UPDATE patients SET ${patientUpdates.join(', ')} WHERE user_id = $${pIdx}`,
        patientParams
      );
    }
  } else if (role === UserRole.DENTIST) {
    const dentistUpdates: string[] = [];
    const dentistParams: unknown[] = [];
    let dIdx = 1;

    if (data.specialization !== undefined) {
      dentistUpdates.push(`specialization = $${dIdx++}`);
      dentistParams.push(data.specialization);
    }
    if (data.bio !== undefined) {
      dentistUpdates.push(`bio = $${dIdx++}`);
      dentistParams.push(data.bio);
    }
    if (data.yearsOfExperience !== undefined) {
      dentistUpdates.push(`years_of_experience = $${dIdx++}`);
      dentistParams.push(data.yearsOfExperience);
    }

    if (dentistUpdates.length > 0) {
      dentistParams.push(userId);
      await query(
        `UPDATE dentists SET ${dentistUpdates.join(', ')} WHERE user_id = $${dIdx}`,
        dentistParams
      );
    }
  } else if (role === UserRole.RECEPTIONIST) {
    if (data.shift !== undefined) {
      await query('UPDATE receptionists SET shift = $1 WHERE user_id = $2', [data.shift, userId]);
    }
  }

  // Return updated profile
  return getProfile(userId);
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Resolve the role-specific profile ID for a user.
 * Returns null if the role has no profile table or no record exists.
 */
async function resolveProfileId(userId: number, role: string): Promise<number | null> {
  const tableMap: Record<string, string> = {
    [UserRole.PATIENT]: 'patients',
    [UserRole.DENTIST]: 'dentists',
    [UserRole.RECEPTIONIST]: 'receptionists',
  };

  const table = tableMap[role];
  if (!table) return null;

  const result = await query(`SELECT id FROM ${table} WHERE user_id = $1`, [userId]);
  return result.rows.length > 0 ? result.rows[0].id : null;
}
