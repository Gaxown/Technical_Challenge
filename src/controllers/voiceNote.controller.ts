import { Request, Response } from 'express';
import { VoiceNoteModel } from '../models/voiceNote.model';
import { PatientModel } from '../models/patient.model';
import { logger } from '../utils/logger';
import { CreateVoiceNoteInput, UpdateVoiceNoteInput } from '../validators/voiceNote.validator';

export class VoiceNoteController {
  static async create(req: Request, res: Response): Promise<Response | void> {
    try {
      const voiceNoteData: CreateVoiceNoteInput = req.body;
      // Verify patient exists
      const patient = await PatientModel.findById(voiceNoteData.patientId);
      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found',
          code: 'PATIENT_NOT_FOUND',
        });
      }

      const voiceNote = await VoiceNoteModel.create(voiceNoteData);
      logger.info('Voice note created', {
        voiceNoteId: voiceNote.id,
        patientId: voiceNote.patientId,
      });

      res.status(201).json({ data: voiceNote });
    } catch (error: any) {
      logger.error('Error creating voice note', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response | void> {
    try {
      const voiceNote = await VoiceNoteModel.findById(req.params.id);

      if (!voiceNote) {
        return res.status(404).json({
          error: 'Voice note not found',
          code: 'VOICE_NOTE_NOT_FOUND',
        });
      }

      res.json({ data: voiceNote });
    } catch (error: any) {
      logger.error('Error fetching voice note', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async getByPatientId(req: Request, res: Response): Promise<Response | void> {
    try {
      const patient = await PatientModel.findById(req.params.patientId);
      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found',
          code: 'PATIENT_NOT_FOUND',
        });
      }

      const voiceNotes = await VoiceNoteModel.findByPatientId(req.params.patientId);
      res.json({ data: voiceNotes, count: voiceNotes.length });
    } catch (error: any) {
      logger.error('Error fetching voice notes', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async getAll(_req: Request, res: Response): Promise<Response | void> {
    try {
      const voiceNotes = await VoiceNoteModel.findAll();
      res.json({ data: voiceNotes, count: voiceNotes.length });
    } catch (error: any) {
      logger.error('Error fetching voice notes', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async update(req: Request, res: Response): Promise<Response | void> {
    try {
      const updateData: UpdateVoiceNoteInput = req.body;
      const voiceNote = await VoiceNoteModel.update(req.params.id, updateData);

      if (!voiceNote) {
        return res.status(404).json({
          error: 'Voice note not found',
          code: 'VOICE_NOTE_NOT_FOUND',
        });
      }

      logger.info('Voice note updated', { voiceNoteId: voiceNote.id });
      res.json({ data: voiceNote });
    } catch (error: any) {
      logger.error('Error updating voice note', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response | void> {
    try {
      const deleted = await VoiceNoteModel.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Voice note not found',
          code: 'VOICE_NOTE_NOT_FOUND',
        });
      }

      logger.info('Voice note deleted', { voiceNoteId: req.params.id });
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error deleting voice note', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }
}
