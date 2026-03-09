import { Router } from 'express';
import { generateDeliveryChallan, getChallans, downloadChallan, updateChallan } from '../controllers/pdf.controller';

const router = Router();

router.post('/generate-challan', generateDeliveryChallan);
router.get('/challans', getChallans);
router.get('/challans/:filename', downloadChallan);
router.put('/challans/:id', updateChallan);

export default router;
