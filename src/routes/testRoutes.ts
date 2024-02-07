import { Router } from 'express';
import AuthMiddleware from '../middlewares/authMiddleware';
import { getQuestions, getResult } from '../controllers/testControllers';

const router = Router();

router.get('/test', AuthMiddleware, getQuestions);
router.post('/test', AuthMiddleware, getResult);

export default router;
