// backend-api/src/utils/helper.ts

import crypto from 'crypto';

/**
 * 🔐 Generate a secure random alphanumeric token
 * - Use for invite codes, temp keys (non-auth-critical)
 */
export const generateToken = (length: number): string => {
  return crypto.randomBytes(length * 2).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
};

/**
 * 🗓️ Convert a date to YYYY-MM-DD format
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * ✅ Check if a value is a valid number
 */
export const isValidNumber = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * 📅 Get today's date in YYYY-MM-DD format
 */
export const getToday = (): string => {
  return formatDate(new Date());
};

/**
 * ⏳ Check if a date is in the past
 */
export const isPastDate = (date: Date): boolean => {
  return new Date(date).getTime() < Date.now();
};

/**
 * 🔢 Pad a number with leading zeros
 */
export const padNumber = (num: number, length: number): string => {
  return num.toString().padStart(length, '0');
};