import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { db } from '../models/database';

describe('Summary API', () => {
  let testPatientId: string;
  let testVoiceNoteId: string;

  beforeEach(async () => {
    db.prepare('DELETE FROM summaries').run();
    db.prepare('DELETE FROM voice_notes').run();
    db.prepare('DELETE FROM patients').run();

    // Create a test patient
    const patientResponse = await request(app)
      .post('/api/patients')
      .set('x-api-key', 'dev-key-123')
      .send({
        name: 'Test Patient for Summaries',
        email: 'patient.summaries@example.com',
      });

    testPatientId = patientResponse.body.data.id;

    // Arrange
    const voiceNoteResponse = await request(app)
      .post('/api/voice-notes')
      .set('x-api-key', 'dev-key-123')
      .send({
        patientId: testPatientId,
        title: 'Test Consultation',
        duration: 300,
        recordedAt: new Date().toISOString(),
      });

    testVoiceNoteId = voiceNoteResponse.body.data.id;
  });

  describe('POST /api/summaries', () => {
    it('should create a new summary with valid data', async () => {
      const summaryData = {
        voiceNoteId: testVoiceNoteId,
        content:
          'Patient reported mild headaches over the past week. No fever or other symptoms. Recommended over-the-counter pain relief and follow-up in 2 weeks.',
        keywords: ['headache', 'mild symptoms', 'follow-up'],
      };

      const response = await request(app)
        .post('/api/summaries')
        .set('x-api-key', 'dev-key-123')
        .send(summaryData)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.content).toBe(summaryData.content);
      expect(response.body.data.keywords).toEqual(summaryData.keywords);
      expect(response.body.data.voiceNoteId).toBe(testVoiceNoteId);
    });

    it('should return 404 for non-existent voice note', async () => {
      const response = await request(app)
        .post('/api/summaries')
        .set('x-api-key', 'dev-key-123')
        .send({
          voiceNoteId: '550e8400-e29b-41d4-a716-446655440000',
          content: 'meets the minimum length requirement >10',
        })
        .expect(404);

      expect(response.body.code).toBe('VOICE_NOTE_NOT_FOUND');
    });

    it('should return 409 for duplicate summary', async () => {
      const summaryData = {
        voiceNoteId: testVoiceNoteId,
        content: 'first summary attached for this voice note.',
      };

      // Create first summary
      await request(app)
        .post('/api/summaries')
        .set('x-api-key', 'dev-key-123')
        .send(summaryData)
        .expect(201);

      // Try to create second summary for the same voice note
      const response = await request(app)
        .post('/api/summaries')
        .set('x-api-key', 'dev-key-123')
        .send({
          voiceNoteId: testVoiceNoteId,
          content: 'This is a second summary for the same voice note.',
        })
        .expect(409);

      expect(response.body.code).toBe('DUPLICATE_SUMMARY');
    });

    it('should return 400 for content too short', async () => {
      const response = await request(app)
        .post('/api/summaries')
        .set('x-api-key', 'dev-key-123')
        .send({
          voiceNoteId: testVoiceNoteId,
          content: 'Short', // Less than 10 chars
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/summaries/voice-note/:voiceNoteId', () => {
    it('should retrieve summary for a voice note', async () => {
      // Create
      const summaryData = {
        voiceNoteId: testVoiceNoteId,
        content: 'Patient consultation summary withndetails',
        keywords: ['consultation', 'patient'],
      };

      await request(app).post('/api/summaries').set('x-api-key', 'dev-key-123').send(summaryData);

      // Act
      const response = await request(app)
        .get(`/api/summaries/voice-note/${testVoiceNoteId}`)
        .set('x-api-key', 'dev-key-123')
        .expect(200);

      // Assert
      expect(response.body.data.voiceNoteId).toBe(testVoiceNoteId);
      expect(response.body.data.content).toBe(summaryData.content);
    });

    it('should return 404 when no summary exists', async () => {
      const response = await request(app)
        .get(`/api/summaries/voice-note/${testVoiceNoteId}`)
        .set('x-api-key', 'dev-key-123')
        .expect(404);

      expect(response.body.code).toBe('SUMMARY_NOT_FOUND');
    });
  });
});
