import { Router } from 'express';
import { PeriodController } from '../controllers/period.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  createPeriodSchema,
  updatePeriodSchema,
  paginationSchema,
  dateRangeSchema,
} from '../validators/schemas';

const router = Router();
const periodController = new PeriodController();

// All routes require authentication
router.use(authenticate);

router.post('/', validate(createPeriodSchema), periodController.createPeriod);
router.put('/:id', validate(updatePeriodSchema), periodController.updatePeriod);
router.delete('/:id', periodController.deletePeriod);
router.get('/', validate(paginationSchema), validate(dateRangeSchema), periodController.getPeriods);
router.get('/current', periodController.getCurrentPeriod);

export default router;