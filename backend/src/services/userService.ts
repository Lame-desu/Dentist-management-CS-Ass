import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { UserRole } from '../utils/constants.js';

// ─── Interfaces ──────────────────────────────────────────────

interface UserFilters {
  role?: string;
  page?: number;
  limit?: number;
}

interface StaffUserInput {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: 'dentist' | 'receptionist';
  // Dentist-specific
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  bio?: string;
  availability?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
  }>;
  // Receptionist-specific
  shift?: string;
}

interface UserUpdateInput {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  // Dentist-specific
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  bio?: string;
  // Receptionist-specific
  shift?: string;
}

// ─── Helper ──────────────────────────────────────────────────

function sanitizeUser(user: Record<string, unknown>): Record<string, unknown> {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// ─── Service Functions ───────────────────────────────────────

/**
 * List all users with optional role filter and pagination.
 */
export async function getAllUsers(filters: UserFilters = {}) {
  const { role, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = '';
  const params: unknown[] = [];
  let paramIdx = 1;

  if (role) {
    whereClause = `WHERE role = $${paramIdx++}`;
    params.push(role);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get paginated users
  const usersResult = await query(
    `SELECT id, full_name, email, phone_number, role, profile_photo, is_active, created_at, updated_at
     FROM users ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    [...params, limit, offset]
  );

  return {
    users: usersResult.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single user by ID with role-specific details.
 */
export async function getUserById(id: string) {
  const userResult = await query(
    `SELECT id, full_name, email, phone_number, role, profile_photo, is_active, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  const user = userResult.rows[0];
  let roleProfile = null;

  switch (user.role) {
    case UserRole.PATIENT: {
      const res = await query('SELECT * FROM patients WHERE user_id = $1', [id]);
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
        [id]
      );
      roleProfile = res.rows[0] || null;
      break;
    }
    case UserRole.RECEPTIONIST: {
      const res = await query('SELECT * FROM receptionists WHERE user_id = $1', [id]);
      roleProfile = res.rows[0] || null;
      break;
    }
  }

  return {
    ...user,
    profile: roleProfile,
  };
}

/**
 * Admin creates a dentist or receptionist account.
 */
export async function createStaffUser(data: StaffUserInput) {
  // Validate role
  if (data.role !== UserRole.DENTIST && data.role !== UserRole.RECEPTIONIST) {
    throw new AppError('Staff role must be either "dentist" or "receptionist".', 400);
  }

  // Dentist must have availability data
  if (data.role === UserRole.DENTIST && (!data.availability || data.availability.length === 0)) {
    throw new AppError('Availability schedule is required when creating a dentist.', 400);
  }

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
    [data.fullName, data.email, data.phoneNumber || null, passwordHash, data.role]
  );

  const user = userResult.rows[0];

  if (data.role === UserRole.DENTIST) {
    // Create dentist profile
    const dentistResult = await query(
      `INSERT INTO dentists (user_id, specialization, license_number, years_of_experience, bio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        user.id,
        data.specialization || null,
        data.licenseNumber || null,
        data.yearsOfExperience || 0,
        data.bio || null,
      ]
    );

    const dentistId = dentistResult.rows[0].id;

    // Create availability records
    if (data.availability) {
      for (const slot of data.availability) {
        await query(
          `INSERT INTO dentist_availability (dentist_id, day_of_week, start_time, end_time, is_available)
           VALUES ($1, $2, $3, $4, $5)`,
          [dentistId, slot.dayOfWeek, slot.startTime, slot.endTime, slot.isAvailable ?? true]
        );
      }
    }
  } else if (data.role === UserRole.RECEPTIONIST) {
    // Create receptionist profile
    await query(
      `INSERT INTO receptionists (user_id, shift)
       VALUES ($1, $2)`,
      [user.id, data.shift || null]
    );
  }

  return getUserById(user.id.toString());
}

/**
 * Admin updates any user.
 */
export async function updateUser(id: string, data: UserUpdateInput) {
  // Check user exists
  const existingResult = await query('SELECT role FROM users WHERE id = $1', [id]);
  if (existingResult.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  const role = existingResult.rows[0].role;

  // Build user update query
  const userUpdates: string[] = [];
  const userParams: unknown[] = [];
  let paramIdx = 1;

  if (data.fullName) {
    userUpdates.push(`full_name = $${paramIdx++}`);
    userParams.push(data.fullName);
  }
  if (data.email) {
    // Check email uniqueness if changing email
    const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [data.email, id]);
    if (emailCheck.rows.length > 0) {
      throw new AppError('Email already in use by another account.', 409);
    }
    userUpdates.push(`email = $${paramIdx++}`);
    userParams.push(data.email);
  }
  if (data.phoneNumber !== undefined) {
    userUpdates.push(`phone_number = $${paramIdx++}`);
    userParams.push(data.phoneNumber);
  }
  if (data.password) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    userUpdates.push(`password_hash = $${paramIdx++}`);
    userParams.push(passwordHash);
  }

  if (userUpdates.length > 0) {
    userParams.push(id);
    await query(
      `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${paramIdx}`,
      userParams
    );
  }

  // Update role-specific profile
  if (role === UserRole.DENTIST) {
    const dentistUpdates: string[] = [];
    const dentistParams: unknown[] = [];
    let dIdx = 1;

    if (data.specialization !== undefined) {
      dentistUpdates.push(`specialization = $${dIdx++}`);
      dentistParams.push(data.specialization);
    }
    if (data.licenseNumber !== undefined) {
      dentistUpdates.push(`license_number = $${dIdx++}`);
      dentistParams.push(data.licenseNumber);
    }
    if (data.yearsOfExperience !== undefined) {
      dentistUpdates.push(`years_of_experience = $${dIdx++}`);
      dentistParams.push(data.yearsOfExperience);
    }
    if (data.bio !== undefined) {
      dentistUpdates.push(`bio = $${dIdx++}`);
      dentistParams.push(data.bio);
    }

    if (dentistUpdates.length > 0) {
      dentistParams.push(id);
      await query(
        `UPDATE dentists SET ${dentistUpdates.join(', ')} WHERE user_id = $${dIdx}`,
        dentistParams
      );
    }
  } else if (role === UserRole.RECEPTIONIST) {
    if (data.shift !== undefined) {
      await query('UPDATE receptionists SET shift = $1 WHERE user_id = $2', [data.shift, id]);
    }
  }

  return getUserById(id);
}

/**
 * Activate or deactivate a user account.
 */
export async function toggleUserActive(id: string) {
  const result = await query(
    `UPDATE users SET is_active = NOT is_active WHERE id = $1
     RETURNING id, full_name, email, role, is_active`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  return result.rows[0];
}

/**
 * Public list of dentists with specialization, experience, and availability.
 */
export async function getDentistsPublic() {
  const result = await query(
    `SELECT 
       u.id AS user_id,
       u.full_name,
       u.email,
       u.phone_number,
       u.profile_photo,
       d.id AS dentist_id,
       d.specialization,
       d.license_number,
       d.years_of_experience,
       d.bio,
       json_agg(
         json_build_object(
           'id', da.id,
           'day_of_week', da.day_of_week,
           'start_time', da.start_time,
           'end_time', da.end_time,
           'is_available', da.is_available
         )
       ) FILTER (WHERE da.id IS NOT NULL) AS availability
     FROM users u
     INNER JOIN dentists d ON d.user_id = u.id
     LEFT JOIN dentist_availability da ON da.dentist_id = d.id
     WHERE u.is_active = true AND u.role = 'dentist'
     GROUP BY u.id, d.id
     ORDER BY u.full_name ASC`
  );

  return result.rows;
}

/**
 * Get a specific dentist's availability schedule.
 */
export async function getDentistAvailability(dentistUserId: string) {
  // First find the dentist record by user_id or dentist id
  const dentistResult = await query(
    `SELECT d.id, d.user_id, u.full_name, d.specialization
     FROM dentists d
     INNER JOIN users u ON u.id = d.user_id
     WHERE d.id = $1 OR d.user_id = $1`,
    [dentistUserId]
  );

  if (dentistResult.rows.length === 0) {
    throw new AppError('Dentist not found.', 404);
  }

  const dentist = dentistResult.rows[0];

  const availabilityResult = await query(
    `SELECT id, day_of_week, start_time, end_time, is_available
     FROM dentist_availability
     WHERE dentist_id = $1
     ORDER BY day_of_week ASC`,
    [dentist.id]
  );

  return {
    dentist: {
      id: dentist.id,
      userId: dentist.user_id,
      fullName: dentist.full_name,
      specialization: dentist.specialization,
    },
    availability: availabilityResult.rows,
  };
}
