import { Router } from 'express';
import { SummaryController } from '../controllers/summary.controller';
import { validateRequest } from '../middleware/validation';
import { createSummarySchema, updateSummarySchema } from '../validators/summary.validator';

const router = Router();

router.post('/', validateRequest(createSummarySchema), SummaryController.create);
router.get('/', SummaryController.getAll);
router.get('/voice-note/:voiceNoteId', SummaryController.getByVoiceNoteId);
router.get('/:id', SummaryController.getById);
router.patch('/:id', validateRequest(updateSummarySchema), SummaryController.update);
router.delete('/:id', SummaryController.delete);

export default router;
