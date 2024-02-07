import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { Request, Response } from 'express';
import { updateProfileSchema, aadharSchema } from '../utils/zodSchemas';
import { uploadOnCloudinary } from '../utils/cloudinary';
import axios from 'axios';
import fs from 'fs';
import pdfDocument from 'pdfkit';
import path from 'path';

const prisma = new PrismaClient();

export async function profile(req: Request, res: Response) {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				photo: true,
				aadharNumber: true,
				aadharPhoto: true,
				address: true,
				contactNo: true,
			},
		});
		return res.status(200).json({ Status: 'Success', data: user });
	} catch (error: any) {
		new ApiError(500, 'Error while getting user information', error.message);
	}
}

export async function updateProfile(req: Request, res: Response) {
	try {
		const { success } = updateProfileSchema.safeParse(req.body);
		if (!success) {
			return res.status(400).json({
				Status: 'Error',
				Message: 'Invalid inputs',
			});
		}
		const user = await prisma.user.update({
			where: { id: req.user.id },
			data: {
				firstName: req.body.firstName || undefined,
				lastName: req.body.lastName || undefined,
				address: req.body.address || undefined,
				contactNo: req.body.contactNo || undefined,
			},
		});
		res.status(200).json({
			Status: 'Success',
			Message: 'User information updated successfully',
		});
	} catch (error: any) {
		new ApiError(500, 'Error while updating user information', error.message);
	}
}

export async function uploadImage(req: Request, res: Response) {
	try {
		const avatarLocalPath = req.file?.path;
		if (!avatarLocalPath) {
			return res
				.status(400)
				.json({ Status: 'Error', Message: 'No file uploaded' });
		}

		//upload the file on cloudinary
		const avatar = await uploadOnCloudinary(avatarLocalPath);
		if (!avatar) {
			throw new ApiError(400, 'Error while uploading on avatar');
		}
		//update the user profile image
		const user = await prisma.user.update({
			where: { id: req.user.id },
			data: { photo: avatar.secure_url },
		});
		isVerified(req, res);
		res
			.status(200)
			.json({ Status: 'Success', Message: 'Image uploaded successfully' });
	} catch (error: any) {
		new ApiError(500, 'Error while uploading image', error.message);
	}
}

export async function uploadAadhar(req: Request, res: Response) {
	try {
		const { success } = aadharSchema.safeParse(req.body);
		if (!success) {
			return res.status(400).json({
				Status: 'Error',
				Message: 'Invalid Aadhar number',
			});
		}
		const aadharLocalPath = req.file?.path;
		if (!aadharLocalPath) {
			return res
				.status(400)
				.json({ Status: 'Error', Message: 'No file uploaded' });
		}

		//upload the file on cloudinary
		const aadhar = await uploadOnCloudinary(aadharLocalPath);
		if (!aadhar) {
			throw new ApiError(400, 'Error while uploading on aadhar');
		}
		//update the user aadhar image
		const user = await prisma.user.update({
			where: { id: req.user.id },
			data: {
				aadharPhoto: aadhar.secure_url,
				aadharNumber: req.body.aadharNumber,
			},
		});
		isVerified(req, res);
		res
			.status(200)
			.json({ Status: 'Success', Message: 'Aadhar uploaded successfully' });
	} catch (error: any) {
		new ApiError(500, 'Error while uploading aadhar', error.message);
	}
}

const isVerified = async (req: Request, res: Response) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
		});
		if (!user) {
			throw new ApiError(404, 'User not found');
		}
		if (user.aadharPhoto && user.photo && user.aadharNumber) {
			await prisma.user.update({
				where: { id: req.user.id },
				data: { isVerified: true },
			});
		}
	} catch (error: any) {
		new ApiError(500, 'Error while verifying user', error.message);
	}
};

export async function getLicense(req: Request, res: Response) {
	try {
		const doc = new pdfDocument();
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
		});

		const userLicense = await prisma.license.findUnique({
			where: { userId: req.user.id },
		});

		// Set response headers
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=license.pdf');

		const imageUrl = user?.photo || '';
		const imageResponse = await axios.get(imageUrl, {
			responseType: 'arraybuffer',
		});
		const imagePath = path.join('./', 'public', 'temp', 'avatar.jpg');
		fs.writeFileSync(imagePath, Buffer.from(imageResponse.data, 'binary'));

		// Add content to the PDF
		doc.fontSize(14).text('Driving license', { align: 'center' });
		doc.moveDown();
		
		const fields = [
			{ label: 'Name:', value: `${user?.firstName} ${user?.lastName}` },
			{ label: 'License No:', value: userLicense?.licenseNo || 'N/A' },
			{ label: 'Type of License:', value: userLicense?.type || 'N/A' },
			{ label: 'Contact No:', value: user?.contactNo || 'N/A' },
			{ label: 'Date of Issue:', value: userLicense?.dateOfIssue.toISOString().split('T')[0] || 'N/A' },
			{ label: 'Date of Expiry:', value: userLicense?.dateOfExpiry.toISOString().split('T')[0] || 'N/A' },
			{
				label: 'Address:',
				value:
					`${user?.address?.houseNo} ${user?.address?.street} ${user?.address?.area} ${user?.address?.city} ${user?.address?.pincode} ${user?.address?.state} ${user?.address?.country}` ||
					'N/A',
			},
		];

		// Add fields to the PDF
		fields.forEach((field) => {
			doc.fontSize(12).text(`${field.label} ${field.value}`, { align: 'left' });
			doc.moveDown();
		});
		doc.fontSize(12).text('Image', { align: 'left' });
		doc.image('./public/temp/avatar.jpg', {
			width: 100,
			height: 100,
			align: 'right',
		});
		const pdfPath = path.join('./', 'public', 'temp', 'license.pdf');
		// Finalize the PDF
		const writeStream = fs.createWriteStream(pdfPath);
		writeStream.on('finish', () => {
			// Check if the file exists before sending
			if (fs.existsSync(pdfPath)) {
				// Send the file to the frontend
				res.sendFile(
					pdfPath,
					{
						root: './',
					},
					(error: any) => {
						if (error) {
							console.log('Error while sending file', error.message);
						}
						// Delete the file after sending
						fs.unlinkSync(pdfPath);
						fs.unlinkSync(imagePath);
					}
				);
			} else {
				console.log('Error: The file does not exist at', pdfPath);
				res
					.status(500)
					.json({ success: false, message: 'Error while getting license' });
			}
		});

		// Pipe the PDF content to the write stream
		doc.pipe(writeStream);
		// Finalize the PDF
		doc.end();
	} catch (error: any) {
		throw new ApiError(500, 'Error while getting license', error.message);
	}
}
