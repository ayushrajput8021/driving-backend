import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
const prisma = new PrismaClient();

export default async function AuthMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		if (
			!req.headers.authorization ||
			!req.headers.authorization.startsWith('Bearer')
		) {
			return res.status(401).json({ Status: 'Failed', message: 'Unauthorized' });
		}
		const secret: string = process.env.JWT_SECRET || 'default-secret';
		const token: string = req.headers.authorization.split(' ')[1];
		const isTokenValid = jwt.verify(token, secret);
		if (!isTokenValid) {
			return res
				.status(401)
				.json({ Status: 'Failed', message: 'Not Valid Token' });
		}
		(req as any).user = jwt.decode(token);
		const isUserExist = await prisma.user.findUnique({
			where: { id: req.user.id },
		});
		if (!isUserExist) {
			return res.status(404).json({
				Status: 'Failed',
				message: 'User with this token is not existed !',
			});
		}
		next();
	} catch (error: any) {
		new ApiError(500, 'Error while getting authenticating user', error.message);
	}
	
}
