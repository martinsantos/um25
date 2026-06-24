/**
 * Tests for src/utils/auth.js
 * Tests the actual exported functions: getStaticToken, getAuthHeaders, generateSlug
 */

import { describe, test, expect } from '@jest/globals';
import { getStaticToken, getAuthHeaders, generateSlug } from '../auth';

describe('Auth Utils', () => {
  describe('getStaticToken', () => {
    test('returns token from env with fallback', () => {
      const token = getStaticToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });
  });

  describe('getAuthHeaders', () => {
    test('returns Authorization header with Bearer token', () => {
      const headers = getAuthHeaders();
      expect(headers).toHaveProperty('Authorization');
      expect(headers.Authorization).toContain('Bearer ');
    });
  });

  describe('generateSlug', () => {
    test('converts title to URL-friendly slug', () => {
      const slug = generateSlug('Servicio de Ciberseguridad');
      expect(slug).toBe('servicio-de-ciberseguridad');
    });

    test('removes accents', () => {
      const slug = generateSlug('Gestión de Operación');
      expect(slug).toBe('gestion-de-operacion');
    });

    test('handles empty string', () => {
      expect(generateSlug('')).toBe('');
      expect(generateSlug(null)).toBe('');
      expect(generateSlug(undefined)).toBe('');
    });

    test('removes special characters', () => {
      const slug = generateSlug('Test @#$ Page');
      expect(slug).toBe('test-page');
    });

    test('collapses multiple dashes', () => {
      const slug = generateSlug('Test   Page---Name');
      expect(slug).toBe('test-page-name');
    });

    test('trims leading/trailing dashes', () => {
      const slug = generateSlug('--Hello World--');
      expect(slug).toBe('hello-world');
    });
  });
});
