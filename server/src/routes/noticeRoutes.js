import express from 'express';
import { getPublicNotices, createNotice } from '../controllers/noticeController.js';

const router = express.Router();

router.get('/public', getPublicNotices);
router.post('/', createNotice);

export default router;
