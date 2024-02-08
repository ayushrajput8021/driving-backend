import { Router } from 'express';
import { signup, signin } from '../controllers/authControllers';
import AuthMiddleware from '../middlewares/authMiddleware';
import {
	dashboard,
	getLicense,
	profile,
	updateProfile,
	uploadAadhar,
	uploadImage,
} from '../controllers/userControllers';
import { upload } from '../middlewares/multerMiddleware';
const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);

// Protected routes
router.get('/dashboard', AuthMiddleware, dashboard);
router.get('/license', AuthMiddleware, getLicense);
router.get('/profile', AuthMiddleware, profile);
router.put('/profile', AuthMiddleware, updateProfile);
router.post(
	'/profile/image',
	AuthMiddleware,
	upload.single('avatar'),
	uploadImage
);
router.post(
	'/profile/aadhar',
	AuthMiddleware,
	upload.single('aadhar'),
	uploadAadhar
);

export default router;
