import { Request, Response } from 'express';
import { PatientModel } from '../models/patient.model';
import { logger } from '../utils/logger';
import { CreatePatientInput, UpdatePatientInput } from '../validators/patient.validator';

export class PatientController {
  static async create(req: Request, res: Response): Promise<Response | void> {
    try {
      const patientData: CreatePatientInput = req.body;
      const existingPatient = await PatientModel.findByEmail(patientData.email);
      if (existingPatient) {
        return res.status(409).json({
          error: 'Patient with this email already exists',
          code: 'DUPLICATE_EMAIL',
        });
      }

      const patient = await PatientModel.create(patientData);
      logger.info('Patient created', { patientId: patient.id });

      res.status(201).json({ data: patient });
    } catch (error: any) {
      logger.error('Error creating patient', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response | void> {
    try {
      const patient = await PatientModel.findById(req.params.id);

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found',
          code: 'PATIENT_NOT_FOUND',
        });
      }

      res.json({ data: patient });
    } catch (error: any) {
      logger.error('Error fetching patient', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async getAll(_req: Request, res: Response): Promise<Response | void> {
    try {
      const patients = await PatientModel.findAll();
      res.json({ data: patients, count: patients.length });
    } catch (error: any) {
      logger.error('Error fetching patients', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async update(req: Request, res: Response): Promise<Response | void> {
    try {
      const updateData: UpdatePatientInput = req.body;
      if (updateData.email) {
        const existingPatient = await PatientModel.findByEmail(updateData.email);
        if (existingPatient && existingPatient.id !== req.params.id) {
          return res.status(409).json({
            error: 'Email already in use by another patient',
            code: 'DUPLICATE_EMAIL',
          });
        }
      }

      const patient = await PatientModel.update(req.params.id, updateData);

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found',
          code: 'PATIENT_NOT_FOUND',
        });
      }

      logger.info('Patient updated', { patientId: patient.id });
      res.json({ data: patient });
    } catch (error: any) {
      logger.error('Error updating patient', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response | void> {
    try {
      const deleted = await PatientModel.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Patient not found',
          code: 'PATIENT_NOT_FOUND',
        });
      }

      logger.info('Patient deleted', { patientId: req.params.id });
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error deleting patient', { error: error.message });
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }
}
