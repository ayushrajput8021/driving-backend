import { Request, Response } from 'express';
import { Category, PrismaClient, Score, Type } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { strictObject, string, z } from 'zod';

const prisma = new PrismaClient();

export async function getQuestions(req: Request, res: Response) {
	try {
		const isVerified = await prisma.user.findFirst({
			where: { id: req.user.id, isVerified: true },
		});
		if (!isVerified) {
			return res
				.status(400)
				.json({ Status: 'Failed', message: 'User is not verified' });
		}
		const questions = await prisma.question.findMany({
			select: { id: true, question: true, options: true, category: true },
		});
		res.status(200).json({ Status: 'Success', data: questions });
	} catch (error: any) {
		new ApiError(500, error.message);
	}
}

export async function getResult(req: Request, res: Response) {
	try {
		const user = await prisma.user.findFirst({
			where: { id: req.user.id },
			select: { isPassed: true, photo: true },
		});
		if (user?.isPassed) {
			return res
				.status(400)
				.json({ Status: 'Success', message: 'User already passed the test' });
		}
		const userId = req.user;
		const { answers } = req.body;
		if (!answers) {
			return res
				.status(400)
				.json({ Status: 'Failed', message: 'Answers are required' });
		}
		let result = 0;
		let category_scores = {
			BASIC_UNDERSTANDING: 0,
			ROAD_KNOWLEDGE: 0,
			PUBLIC_SAFETY: 0,
			TRAFFIC_RULES: 0,
		};
		const questions = await prisma.question.findMany({
			select: { answer: true, category: true },
		});
		questions.forEach((question, index) => {
			if (question.answer === answers[index]) {
				category_scores[question.category] += 1;
				result += 1;
			}
		});
		const scoreForTest = {
			score: result,
			category: {
				BASIC_UNDERSTANDING: category_scores['BASIC_UNDERSTANDING'],
				ROAD_KNOWLEDGE: category_scores['ROAD_KNOWLEDGE'],
				PUBLIC_SAFETY: category_scores['PUBLIC_SAFETY'],
				TRAFFIC_RULES: category_scores['TRAFFIC_RULES'],
			},
		};
		await prisma.test.create({
			data: {
				userId: userId.id,
				score: scoreForTest,
			},
		});
		const isUserPassed =
			result >= 12
				? true
				: false &&
				  category_scores.BASIC_UNDERSTANDING >= 3 &&
				  category_scores.ROAD_KNOWLEDGE >= 3 &&
				  category_scores.PUBLIC_SAFETY >= 3 &&
				  category_scores.TRAFFIC_RULES >= 3;
		if (isUserPassed) {
			await prisma.user.update({
				where: { id: userId.id },
				data: { isPassed: true },
			});
			const licenseNumber = Math.floor(
				100000000000 + Math.random() * 900000000000
			).toString();
			const licenseType = (result: number): Type => {
				if (result >= 18) {
					return Type.HEAVY_VEHICLE;
				} else if (result >= 15) {
					return Type.FOUR_WHEELER;
				} else {
					return Type.TWO_WHEELER;
				}
			};
			await prisma.license.create({
				data: {
					userId: userId.id,
					licenseNo: licenseNumber,
					licensePhoto: user?.photo || '',
					type: licenseType(result),
					dateOfExpiry: new Date(
						new Date().getTime() + 20 * 365 * 24 * 60 * 60 * 1000
					),
				},
			});
		}
		res
			.status(200)
			.json({ Status: 'Success', data: { result, category_scores } });
	} catch (error: any) {
		new ApiError(500, error.message);
	}
}
