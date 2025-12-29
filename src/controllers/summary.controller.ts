import { Request, Response } from 'express';
import { SummaryModel } from '../models/summary.model';
import { VoiceNoteModel } from '../models/voiceNote.model';
import { logger } from '../utils/logger';
import { CreateSummaryInput, UpdateSummaryInput } from '../validators/summary.validator';

export class SummaryController {
  static async create(req: Request, res: Response): Promise<Response | void> {
    try {
      const summaryData: CreateSummaryInput = req.body;
      // Verify voice note exists
      const voiceNote = await VoiceNoteModel.findById(summaryData.voiceNoteId);
      if (!voiceNote) {
        return res.status(404).json({
          error: 'Voice note not found',
          code: 'VOICE_NOTE_NOT_FOUND',
        });
      }

      // Check if summary already exists for this voice note
      const existingSummary = await SummaryModel.findByVoiceNoteId(summaryData.voiceNoteId);
      if (existingSummary) {
        return res.status(409).json({
          error: 'Summary already exists for this voice note',
          code: 'DUPLICATE_SUMMARY',
          existingSummary,
        });
      }

      const summary = await SummaryModel.create(summaryData);
      logger.info('Summary created', { summaryId: summary.id, voiceNoteId: summary.voiceNoteId });

      res.status(201).json({ data: summary });
    } catch (error: any) {
      logger.error('Error creating summary', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response | void> {
    try {
      const summary = await SummaryModel.findById(req.params.id);

      if (!summary) {
        return res.status(404).json({
          error: 'Summary not found',
          code: 'SUMMARY_NOT_FOUND',
        });
      }

      res.json({ data: summary });
    } catch (error: any) {
      logger.error('Error fetching summary', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async getByVoiceNoteId(req: Request, res: Response): Promise<Response | void> {
    try {
      const voiceNote = VoiceNoteModel.findById(req.params.voiceNoteId);
      if (!voiceNote) {
        return res.status(404).json({
          error: 'Voice note not found',
          code: 'VOICE_NOTE_NOT_FOUND',
        });
      }

      const summary = SummaryModel.findByVoiceNoteId(req.params.voiceNoteId);

      if (!summary) {
        return res.status(404).json({
          error: 'Summary not found for this voice note',
          code: 'SUMMARY_NOT_FOUND',
        });
      }

      res.json({ data: summary });
    } catch (error: any) {
      logger.error('Error fetching summary', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async getAll(_req: Request, res: Response): Promise<Response | void> {
    try {
      const summaries = await SummaryModel.findAll();
      res.json({ data: summaries, count: summaries.length });
    } catch (error: any) {
      logger.error('Error fetching summaries', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async update(req: Request, res: Response): Promise<Response | void> {
    try {
      const updateData: UpdateSummaryInput = req.body;
      const summary = await SummaryModel.update(req.params.id, updateData);

      if (!summary) {
        return res.status(404).json({
          error: 'Summary not found',
          code: 'SUMMARY_NOT_FOUND',
        });
      }

      logger.info('Summary updated', { summaryId: summary.id });
      res.json({ data: summary });
    } catch (error: any) {
      logger.error('Error updating summary', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response | void> {
    try {
      const deleted = await SummaryModel.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Summary not found',
          code: 'SUMMARY_NOT_FOUND',
        });
      }

      logger.info('Summary deleted', { summaryId: req.params.id });
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error deleting summary', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }
}
