import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { db } from '../models/database';

let testPatientId: string;

describe('Patient API', () => {
  beforeAll(() => {
    // init db in index.ts
  });

  // Clean b4 and after tests
  beforeEach(() => {
    db.prepare('DELETE FROM summaries').run();
    db.prepare('DELETE FROM voice_notes').run();
    db.prepare('DELETE FROM patients').run();
  });

  afterAll(() => {
    db.prepare('DELETE FROM summaries').run();
    db.prepare('DELETE FROM voice_notes').run();
    db.prepare('DELETE FROM patients').run();
  });

  describe('POST /api/patients', () => {
    it('should create a new patient with valid data', async () => {
      // Arrange
      const patientData = {
        name: 'John Doe',
        email: 'john.doe@test.com',
        phone: '+1234567890',
        dateOfBirth: '1990-01-15',
      };

      // Act
      const response = await request(app)
        .post('/api/patients')
        .set('x-api-key', 'dev-key-123')
        .send(patientData)
        .expect(201);

      // Assert
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe(patientData.name);
      expect(response.body.data.email).toBe(patientData.email);
      expect(response.body.data.phone).toBe(patientData.phone);

      testPatientId = response.body.data.id;
    });

    it('should return 401 without API key', async () => {
      const response = await request(app)
        .post('/api/patients')
        .send({ name: 'Test', email: 'test@test.com' })
        .expect(401);

      expect(response.body.code).toBe('MISSING_API_KEY');
    });

    it('should return 403 with invalid API key', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('x-api-key', 'invalid-key')
        .send({ name: 'Test', email: 'test@test.com' })
        .expect(403);

      expect(response.body.code).toBe('INVALID_API_KEY');
    });

    it('should return 400 with invalid email', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('x-api-key', 'dev-key-123')
        .send({ name: 'Test', email: 'invalid-email' })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate email', async () => {
      const patientData = {
        name: 'soneone',
        email: 'soneone@test.com',
      };

      // Create
      await request(app)
        .post('/api/patients')
        .set('x-api-key', 'dev-key-123')
        .send(patientData)
        .expect(201);

      // Test Uniqueness
      const response = await request(app)
        .post('/api/patients')
        .set('x-api-key', 'dev-key-123')
        .send(patientData)
        .expect(409);

      expect(response.body.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('GET /api/patients/:id', () => {
    it('should retrieve a patient by ID', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/patients')
        .set('x-api-key', 'dev-key-123')
        .send({ name: 'Test Patient', email: 'test.patient@test.com' });

      const patientId = createResponse.body.data.id;

      // getAll
      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('x-api-key', 'dev-key-123')
        .expect(200);

      expect(response.body.data.id).toBe(patientId);
      expect(response.body.data.name).toBe('Test Patient');
    });

    it('should return 404 for non-existent patient', async () => {
      const response = await request(app)
        .get('/api/patients/550e8400-e29b-41d4-a716-446655440000')
        .set('x-api-key', 'dev-key-123')
        .expect(404);

      expect(response.body.code).toBe('PATIENT_NOT_FOUND');
    });
  });

  describe('GET /api/patients', () => {
    it('should retrieve all patients', async () => {
      // Arrange
      await request(app)
        .post('/api/patients')
        .set('x-api-key', 'dev-key-123')
        .send({ name: 'Patient 1', email: 'patient1@test.com' });

      await request(app)
        .post('/api/patients')
        .set('x-api-key', 'dev-key-123')
        .send({ name: 'Patient 2', email: 'patient2@test.com' });

      // Act
      const response = await request(app)
        .get('/api/patients')
        .set('x-api-key', 'dev-key-123')
        .expect(200);

      // Assert
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.count).toBeGreaterThanOrEqual(2);
    });
  });
});
