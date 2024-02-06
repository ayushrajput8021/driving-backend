import app from './app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

// Start the server
const port = process.env.PORT;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
