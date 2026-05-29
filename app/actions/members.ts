'use server';

import { revalidatePath } from 'next/cache';

interface CreateMemberInput {
  firstName: string;
  lastName: string;
  email?: string;
  age?: number;
  role: string;
  schoolId: number;
  password: string;
  certificateUrl?: string;
}

interface CreateMemberResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Create a new member with auto-generated Member ID
 * Member ID is generated on the server using the algorithm:
 * ICPEPSE-NCR-{SCHOOL_CODE}-{PADDED_COUNTER}
 */
export async function createMember(input: CreateMemberInput): Promise<CreateMemberResponse> {
  try {
    // Note: memberId is NOT included in the payload
    // It will be auto-generated on the server
    const payload = {
      firstName: input.firstName,
      lastName: input.lastName,
      age: input.age,
      role: input.role,
      schoolId: input.schoolId,
      password: input.password,
      certificateUrl: input.certificateUrl,
      // memberId is intentionally NOT sent - server will generate it
    };

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to create member',
      };
    }

    const result = await response.json();
    
    // Revalidate the members list
    revalidatePath('/admin/members');

    return {
      success: result.success,
      data: result.data,
    };
  } catch (error) {
    console.error('Error in createMember action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while creating the member',
    };
  }
}

/**
 * Update an existing member
 * Member ID cannot be changed (it's immutable)
 */
export async function updateMember(
  id: string,
  input: Partial<Omit<CreateMemberInput, 'password'>> & { password?: string }
): Promise<CreateMemberResponse> {
  try {
    const response = await fetch(`/api/users?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: input.firstName,
        lastName: input.lastName,
        age: input.age,
        role: input.role,
        schoolId: input.schoolId,
        password: input.password,
        certificateUrl: input.certificateUrl,
        // memberId is NEVER sent in updates - it's immutable
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to update member',
      };
    }

    const result = await response.json();

    revalidatePath('/admin/members');

    return {
      success: result.success,
      data: result.data,
    };
  } catch (error) {
    console.error('Error in updateMember action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while updating the member',
    };
  }
}

/**
 * Delete a member
 */
export async function deleteMember(id: string): Promise<CreateMemberResponse> {
  try {
    const response = await fetch(`/api/users?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to delete member',
      };
    }

    const result = await response.json();

    revalidatePath('/admin/members');

    return {
      success: result.success,
      data: result.data,
    };
  } catch (error) {
    console.error('Error in deleteMember action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while deleting the member',
    };
  }
}

/**
 * Import members from CSV file
 * CSV format: firstName,lastName,email,role,schoolId,age,certificateUrl
 * Password is auto-generated as: Aysipep.se@2026
 */
export async function importMembersFromCSV(
  csvContent: string
): Promise<{
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: Record<string, unknown>;
  }>;
  warnings?: string[];
}> {
  try {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
    
    // Validate headers
    const requiredHeaders = ['firstname', 'lastname', 'email', 'role', 'schoolid'];
    const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
    
    if (!hasRequiredHeaders) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [{
          row: 1,
          error: `CSV must have headers: ${requiredHeaders.join(', ')}`,
        }],
      };
    }

    const errors: Array<{
      row: number;
      error: string;
      data?: Record<string, unknown>;
    }> = [];
    let importedCount = 0;
    const tempPassword = 'Aysipep.se@2026';

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]?.trim()) continue; // Skip empty rows

      const values = lines[i]!.split(',').map(v => v.trim());
      const row: Record<string, unknown> = {};

      headers.forEach((header, idx) => {
        row[header] = values[idx] || null;
      });

      // Validate and parse row
      const validation = validateCSVRow(row, i + 1);
      if (!validation.valid) {
        errors.push({
          row: i + 1,
          error: validation.error!,
          data: row,
        });
        continue;
      }

      // Create member with auto-generated password
      try {
        const result = await createMember({
          firstName: String(row['firstname']),
          lastName: String(row['lastname']),
          email: String(row['email']),
          role: String(row['role']).toUpperCase(),
          schoolId: Number(row['schoolid']),
          age: row['age'] ? Number(row['age']) : undefined,
          password: tempPassword,
          certificateUrl: row['certificateurl'] ? String(row['certificateurl']) : undefined,
        });

        if (result.success) {
          importedCount++;
        } else {
          errors.push({
            row: i + 1,
            error: result.error || 'Failed to create member',
            data: row,
          });
        }
      } catch (err) {
        errors.push({
          row: i + 1,
          error: err instanceof Error ? err.message : 'Unknown error',
          data: row,
        });
      }
    }

    return {
      success: errors.length === 0,
      imported: importedCount,
      failed: errors.length,
      errors,
      warnings: importedCount > 0 ? [
        `${importedCount} member(s) imported successfully`,
        `Temporary password set to: ${tempPassword}`,
      ] : undefined,
    };
  } catch (error) {
    console.error('CSV import error:', error);
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [{
        row: 0,
        error: error instanceof Error ? error.message : 'Failed to process CSV',
      }],
    };
  }
}

/**
 * Validate a single CSV row
 */
function validateCSVRow(
  row: Record<string, unknown>,
  rowNumber: number
): { valid: boolean; error?: string } {
  const firstName = String(row['firstname'] || '').trim();
  const lastName = String(row['lastname'] || '').trim();
  const email = String(row['email'] || '').trim();
  const role = String(row['role'] || '').toUpperCase();
  const schoolId = row['schoolid'];

  // Required fields
  if (!firstName) {
    return { valid: false, error: 'firstName is required' };
  }
  if (!lastName) {
    return { valid: false, error: 'lastName is required' };
  }
  if (!email) {
    return { valid: false, error: 'email is required' };
  }
  if (!role) {
    return { valid: false, error: 'role is required' };
  }
  if (!schoolId) {
    return { valid: false, error: 'schoolId is required' };
  }

  // Format validation
  if (firstName.length < 2) {
    return { valid: false, error: 'firstName must be at least 2 characters' };
  }
  if (lastName.length < 2) {
    return { valid: false, error: 'lastName must be at least 2 characters' };
  }
  if (!isValidEmail(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  if (!['ADMIN', 'SCANNER', 'MEMBER'].includes(role)) {
    return { valid: false, error: 'role must be ADMIN, SCANNER, or MEMBER' };
  }

  const schoolIdNum = Number(schoolId);
  if (isNaN(schoolIdNum) || schoolIdNum <= 0) {
    return { valid: false, error: 'schoolId must be a valid positive number' };
  }

  // Optional: age validation
  if (row['age']) {
    const age = Number(row['age']);
    if (isNaN(age) || age < 1 || age > 120) {
      return { valid: false, error: 'age must be between 1 and 120' };
    }
  }

  // Optional: certificate URL validation
  if (row['certificateurl']) {
    const url = String(row['certificateurl']).trim();
    if (url && !isValidURL(url)) {
      return { valid: false, error: 'certificateUrl must be a valid URL' };
    }
  }

  return { valid: true };
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate URL format
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
