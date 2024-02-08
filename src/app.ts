import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import userRouter from './routes/userRoutes';
import testRouter from './routes/testRoutes';

const app = express();

//middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV?.trim() === 'dev') {
	app.use(morgan('dev'));
}

//routes
app.use('/api/v1', userRouter);
app.use('/api/v1', testRouter);

app.use('*', (req, res) => {
	res.status(404).json({ Status: 'Failed', message: 'Route not found' });
});
export default app;
