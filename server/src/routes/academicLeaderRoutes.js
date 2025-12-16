import express from 'express';
import { getAcademicLeaders } from '../controllers/academicLeaderController.js';

const router = express.Router();

router.get('/', getAcademicLeaders);

export default router;
