import { Router } from 'express';
import { signup, signin } from '../controllers/authControllers';
import AuthMiddleware from '../middlewares/authMiddleware';
import { getLicense, profile, updateProfile,uploadAadhar,uploadImage } from '../controllers/userControllers';
import { upload } from '../middlewares/multerMiddleware';
const router = Router();

// Public routes
router.post('/signup', signup);
router.get('/signin', signin);

// Protected routes
router.get('/license', AuthMiddleware, getLicense);
router.get('/profile', AuthMiddleware, profile);
router.put('/profile', AuthMiddleware,updateProfile);
router.post('/profile/image',AuthMiddleware,upload.single('avatar'),uploadImage);
router.post('/profile/aadhar',AuthMiddleware,upload.single('aadhar'),uploadAadhar);

export default router;
