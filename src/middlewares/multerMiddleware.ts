import multer from 'multer';

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/temp');
	},
	filename: function (req, file, cb) {
		const name = file.fieldname === 'aadhar' ? 'aadhar' : 'profile_image';
		const filename = `${req.user.id}_${name}`;
		cb(null, filename);
	},
});

export const upload = multer({
	storage,
});
