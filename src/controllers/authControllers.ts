import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt, { hash } from 'bcrypt';
import { ApiError } from '../utils/ApiError';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { UserSchema } from '../utils/zodSchemas';

const prisma = new PrismaClient();

type User = z.infer<typeof UserSchema>;

const hashPassword = async (password: string) => {
	const saltRounds: number = Number(process.env.SALT_ROUNDS || 10);
	const hashedPassword = await bcrypt.hash(password, saltRounds);
	return hashedPassword;
};

export async function signup(req: Request, res: Response) {
	try {
		const { success } = UserSchema.safeParse(req.body);
		if (!success) {
			return res
				.status(400)
				.json({ Status: 'Failed', message: 'All fields are required' });
		}
		const { firstName, lastName, email, password }: User = req.body;
		const isUserExist = await prisma.user.findUnique({
			where: { email },
		});
		if (isUserExist) {
			return res
				.status(400)
				.json({ Status: 'Failed', message: 'User already exist' });
		}
		const user = await prisma.user.create({
			data: {
				firstName,
				lastName,
				email,
				password: await hashPassword(password),
				photo: null,
				aadharNumber: null,
				aadharPhoto: null,
				address: null,
				contactNo: null,
			},
		});
		return res.status(201).json({
			Status: 'Success',
			message: 'User created successfully',
		});
	} catch (error: any) {
		new ApiError(500, 'Internal Server Error', error.message);
	}
}

export async function signin(req: Request, res: Response) {
	try {
		const { email, password }: User = req.body;
		const user = await prisma.user.findUnique({
			where: { email },
		});
		if (!user) {
			return res
				.status(404)
				.json({ Status: 'Failed', message: 'User not found' });
		}
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res
				.status(400)
				.json({ Status: 'Failed', message: 'Invalid password' });
		}
		const secret: string = process.env.JWT_SECRET || 'default-secret';
		const token: string = jwt.sign({ id: user.id, email: user.email }, secret);
		
		return res.status(200).json({
			Status: 'Success',
			message: 'User signed in successfully',
			token,
		});
	} catch (error: any) {
		new ApiError(500, 'Internal Server Error', error.message);
	}
}
