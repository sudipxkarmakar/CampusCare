import express from 'express';
import { handleChat } from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', handleChat);

export default router;
