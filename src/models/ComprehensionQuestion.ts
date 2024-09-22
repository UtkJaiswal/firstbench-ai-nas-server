import mongoose, { Document, Schema } from 'mongoose';

interface IQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

export interface IComprehensionQuestion extends Document {
    _id: mongoose.Types.ObjectId;
    comprehension: string;
    questions: Array<{
      question: string;
      options: {
        A: string;
        B: string;
        C: string;
        D: string;
      };
    }>;
    correctAnswers: string[];
    explanations: string[];
}

const ComprehensionQuestionSchema: Schema = new Schema({
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  comprehension: { type: String, required: true },
  questions: [{
    question: { type: String, required: true },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
  }],
  correctAnswers: [{ type: String, required: true }],
  explanations: [{ type: String, required: true }],
});

export default mongoose.model<IComprehensionQuestion>('ComprehensionQuestion', ComprehensionQuestionSchema);