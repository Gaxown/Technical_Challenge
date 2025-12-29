import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { validateRequest } from '../middleware/validation';
import { createPatientSchema, updatePatientSchema } from '../validators/patient.validator';

const router = Router();

router.post('/', validateRequest(createPatientSchema), PatientController.create);
router.get('/', PatientController.getAll);
router.get('/:id', PatientController.getById);
router.patch('/:id', validateRequest(updatePatientSchema), PatientController.update);
router.delete('/:id', PatientController.delete);

export default router;
