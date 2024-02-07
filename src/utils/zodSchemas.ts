import { z } from 'zod';

export const UserSchema = z.object({
	firstName: z.string().toLowerCase().trim(),
	lastName: z.string().toLowerCase().trim(),
	email: z.string().email().toLowerCase().trim(),
	password: z.string().min(6).trim(),
});

export const updateProfileSchema = z.object({
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	address: z
		.object({
			houseNo: z.string(),
			street: z.string(),
			area: z.string(),
			city: z.string(),
			state: z.string(),
			pincode: z.string(),
			country: z.string(),
		})
		.optional(),
	contactNo: z.string().optional(),
});

export const aadharSchema = z.object({
	aadharNumber: z.string().length(12),
});
