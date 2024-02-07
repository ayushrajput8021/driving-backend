import { Category, PrismaClient } from '@prisma/client';
import { questions } from '../devData/questions.json';
const prisma = new PrismaClient();

async function dataLoader() {
  try {
    for (const question of questions) {
      await prisma.question.create({
        data: {
          question: question.question,
          answer: question.answer,
          options: question.options,
          category: Category[question.category as keyof typeof Category],
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
}
dataLoader();
