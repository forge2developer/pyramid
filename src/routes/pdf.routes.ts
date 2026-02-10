import { Router } from 'express';
import { generateDeliveryChallan, getChallans, downloadChallan } from '../controllers/pdf.controller';

const router = Router();

router.post('/generate-challan', generateDeliveryChallan);
router.get('/challans', getChallans);
router.get('/challans/:filename', downloadChallan);

export default router;
