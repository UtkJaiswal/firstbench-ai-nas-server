import { Router, Request, Response } from 'express';
import Category from '../models/Category';
import NormalQuestion, { INormalQuestion } from '../models/NormalQuestion';
import ComprehensionQuestion, { IComprehensionQuestion } from '../models/ComprehensionQuestion';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path'; 




const router = Router();

interface SubmittedAnswer {
    questionId: string;
    answer: string;
}

interface QuestionAnswer {
    id: string;
    answer: string | string[];
  }
  
  interface NormalQuestionResult {
    id: string;
    question: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    correct_answer: string;
    user_answer: string;
    explanation: string;
  }
  
  interface ComprehensionQuestionResult {
    id: string;
    comprehension: string;
    questions: string[];
    options: Array<{
      A: string;
      B: string;
      C: string;
      D: string;
    }>;
    correct_answers: string[];
    user_answers: string[];
    explanations: string[];
  }
  
  interface QuizResults {
    normal_questions: NormalQuestionResult[];
    comprehension_questions: ComprehensionQuestionResult[];
    correct_answers: number;
    total_questions: number;
  }

// Helper function to handle errors
const handleError = (error: unknown, res: Response) => {
  console.error('Error:', error);
  if (error instanceof Error) {
    return res.status(400).json({ error: error.message });
  }
  return res.status(500).json({ error: 'An unexpected error occurred' });
};

// Category routes
router.post('/fetch_quiz_results', async (req: Request, res: Response) => {
    try {
      const questionAnswers: QuestionAnswer[] = req.body.questionAnswers;
  
      if (!Array.isArray(questionAnswers)) {
        return res.status(400).json({ error: 'Invalid input format' });
      }
  
      const questionIds = questionAnswers.map(qa => new mongoose.Types.ObjectId(qa.id));
  
      // Fetch all questions
      const [normalQuestions, comprehensionQuestions] = await Promise.all([
        NormalQuestion.find({ _id: { $in: questionIds } }).lean(),
        ComprehensionQuestion.find({ _id: { $in: questionIds } }).lean()
      ]);
  
      const results: QuizResults = {
        normal_questions: [],
        comprehension_questions: [],
        correct_answers: 0,
        total_questions: 0
      };
  
      // Process normal questions
      for (const q of normalQuestions as INormalQuestion[]) {
        const userAnswer = questionAnswers.find(qa => qa.id === q._id.toString())?.answer as string;
        const isCorrect = q.correctAnswer === userAnswer;
        if (isCorrect) results.correct_answers++;
        results.total_questions++;
  
        results.normal_questions.push({
          id: q._id.toString(),
          question: q.question,
          options: q.options,
          correct_answer: q.correctAnswer,
          user_answer: userAnswer || '',
          explanation: q.explanation
        });
      }
  
      // Process comprehension questions
      for (const cq of comprehensionQuestions) {
        const userAnswers = questionAnswers.find(qa => qa.id === cq._id.toString())?.answer as string[];
        if (userAnswers && userAnswers.length === cq.questions.length) {
          const result: ComprehensionQuestionResult = {
            id: cq._id.toString(),
            comprehension: cq.comprehension,
            questions: cq.questions.map(q => q.question),
            options: cq.questions.map(q => q.options),
            correct_answers: cq.correctAnswers, // Use correctAnswers from the schema
            user_answers: userAnswers,
            explanations: cq.explanations
          };
  
          for (let i = 0; i < cq.questions.length; i++) {
            if (cq.correctAnswers[i] === userAnswers[i]) { // Compare with correctAnswers array
              results.correct_answers++;
            }
            results.total_questions++;
          }
  
          results.comprehension_questions.push(result);
        } else {
          console.error(`Mismatch in number of answers for comprehension question ${cq._id}`);
        }
      }
  
      res.json(results);
  
    } catch (error: unknown) {
      console.error('Error fetching quiz results:', error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  });



router.post('/questions', async (req: Request, res: Response) => {
    try {
      const { subject, grade } = req.body;
  
      if (!subject || !grade) {
        return res.status(400).json({ error: 'Subject and grade are required' });
      }
  
      // Find the category
      const category = await Category.findOne({ subject, grade });
  
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
  
      let questions;
  
      if (subject.toString().toLowerCase() !== 'english') {
        // For subjects other than English
        questions = await NormalQuestion.aggregate([
          { $match: { category: category._id } },
          { $sample: { size: 15 } },
          { $project: { 
            _id: 1, 
            question: 1, 
            options: 1,
            correctAnswer:1,
            explanation:1
          }}
        ]);
      } else {
        // For English
        questions = await ComprehensionQuestion.aggregate([
          { $match: { category: category._id } },
          { $sample: { size: 3 } },
          { $project: { 
            _id: 1, 
            comprehension: 1,
            correctAnswers: 1,
            explanations: 1,
            questions: {
              $map: {
                input: "$questions",
                as: "q",
                in: {
                  question: "$$q.question",
                  options: "$$q.options",
                }
              }
            }
          }}
        ]);
      }
  
      res.status(200).json(questions);
    } catch (error: unknown) {
      console.error('Error fetching questions:', error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  });

//   router.post('/fetch_quiz_results', async (req: Request, res: Response) => {
//     try {
//       const questionAnswers: QuestionAnswer[] = req.body.questionAnswers;
  
//       if (!Array.isArray(questionAnswers)) {
//         return res.status(400).json({ error: 'Invalid input format' });
//       }
  
//       const questionIds = questionAnswers.map(qa => new mongoose.Types.ObjectId(qa.id));
  
//       // Fetch all questions
//       const [normalQuestions, comprehensionQuestions] = await Promise.all([
//         NormalQuestion.find({ _id: { $in: questionIds } }).lean(),
//         ComprehensionQuestion.find({ _id: { $in: questionIds } }).lean()
//       ]);
  
//       const results: QuizResults = {
//         normal_questions: [],
//         comprehension_questions: [],
//         correct_answers: 0,
//         total_questions: 0
//       };
  
//       // Process normal questions
//       for (const q of normalQuestions) {
//         const userAnswer = questionAnswers.find(qa => qa.id === q._id.toString())?.answer as string;
//         const isCorrect = q.correctAnswer === userAnswer;
//         if (isCorrect) results.correct_answers++;
//         results.total_questions++;
  
//         results.normal_questions.push({
//           id: q._id.toString(),
//           question: q.question,
//           options: q.options,
//           correct_answer: q.correctAnswer,
//           user_answer: userAnswer || '',
//           explanation: q.explanation
//         });
//       }
  
//       // Process comprehension questions
//       for (const cq of comprehensionQuestions) {
//         const userAnswers = questionAnswers.find(qa => qa.id === cq._id.toString())?.answer as string[];
        
//         if (userAnswers && userAnswers.length === cq.questions.length) {
//           const result: ComprehensionQuestionResult = {
//             id: cq._id.toString(),
//             comprehension: cq.comprehension,
//             questions: cq.questions.map(q => q.question),
//             options: cq.questions.map(q => q.options),
//             correct_answers: cq.questions.map(q => q.correctAnswer),
//             user_answers: userAnswers,
//             explanations: cq.explanations
//           };
  
//           for (let i = 0; i < cq.questions.length; i++) {
//             if (cq.questions[i].correctAnswer === userAnswers[i]) {
//               results.correct_answers++;
//             }
//             results.total_questions++;
//           }
  
//           results.comprehension_questions.push(result);
//         } else {
//           console.error(`Mismatch in number of answers for comprehension question ${cq._id}`);
//         }
//       }
  
//       res.json(results);
  
//     } catch (error: unknown) {
//       console.error('Error fetching quiz results:', error);
//       if (error instanceof Error) {
//         res.status(500).json({ error: error.message });
//       } else {
//         res.status(500).json({ error: 'An unexpected error occurred' });
//       }
//     }
//   });

  router.post('/import-json', async (req: Request, res: Response) => {
    try {
      // Read the JSON file (You can replace this with the actual file path)
      const jsonFilePath = path.join(__dirname, '2.json');

    // Read the JSON file
    const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      
  
      // Extract subject and grade (assuming it's the same for all comprehensions in the file)
      const subject = "English";
      const grade = "3";
  
      // Check if category already exists
      let category = await Category.findOne({ subject, grade });
      if (!category) {
        // Create new category if it doesn't exist
        category = new Category({ subject, grade });
        await category.save();
      }
  
      // Loop through each comprehension and insert data into ComprehensionQuestion schema
      for (const comprehensionData of data.comprehensions) {
        const { comprehension, questions } = comprehensionData;
  
        const newQuestions = questions.map((q: any) => ({
          question: q.question,
          options: {
            A: q.options.A,
            B: q.options.B,
            C: q.options.C,
            D: q.options.D,
          },
        }));
  
        const correctAnswers = questions.map((q: any) => q.correct_answer);
        const explanations = questions.map((q: any) => q.explanation);
  
        const newComprehension = new ComprehensionQuestion({
          category: category._id,
          comprehension,
          questions: newQuestions,
          correctAnswers,
          explanations,
        });
  
        // Save the comprehension to the database
        await newComprehension.save();
      }
  
      res.status(200).json({ message: 'Data imported successfully!' });
    } catch (error) {
      console.error('Error importing data:', error);
      res.status(500).json({ message: 'Error importing data', error });
    }
});

router.post('/import-math-questions', async (req: Request, res: Response) => {
    try {
      // Use path module to resolve the JSON file path relative to the current file
      const jsonFilePath = path.join(__dirname, 'M319.json');
  
      // Read and parse the JSON file
      const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  
      // Extract subject and grade from the JSON file (static or from data)
      const subject = "Mathematics";
      const grade = "3";
  
      // Check if category already exists
      let category = await Category.findOne({ subject, grade });
      if (!category) {
        // Create new category if it doesn't exist
        category = new Category({ subject, grade });
        await category.save();
      }
  
      // Loop through each question and insert data into NormalQuestion schema
      for (const questionData of data.questions) {
        const { question, options, correct_answer, explanation } = questionData;
  
        const newQuestion = new NormalQuestion({
          category: category._id,
          question: question.en, // Use only the 'en' field
          options: {
            A: options.A.en,  // Use only the 'en' field for each option
            B: options.B.en,
            C: options.C.en,
            D: options.D.en,
          },
          correctAnswer: correct_answer.en, // Use the 'en' field for correct_answer
          explanation: explanation.en,  // Use the 'en' field for explanation
        });
  
        // Save the question to the database
        await newQuestion.save();
      }
  
      res.status(200).json({ message: 'Math questions imported successfully!' });
    } catch (error) {
      console.error('Error importing questions:', error);
      res.status(500).json({ message: 'Error importing questions', error });
    }
  });
  
export default router;