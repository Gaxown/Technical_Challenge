import { Router } from 'express';
import { VoiceNoteController } from '../controllers/voiceNote.controller';
import { validateRequest } from '../middleware/validation';
import { createVoiceNoteSchema, updateVoiceNoteSchema } from '../validators/voiceNote.validator';

const router = Router();

router.post('/', validateRequest(createVoiceNoteSchema), VoiceNoteController.create);
router.get('/', VoiceNoteController.getAll);
router.get('/:id', VoiceNoteController.getById);
router.get('/patient/:patientId', VoiceNoteController.getByPatientId);
router.patch('/:id', validateRequest(updateVoiceNoteSchema), VoiceNoteController.update);
router.delete('/:id', VoiceNoteController.delete);

export default router;
