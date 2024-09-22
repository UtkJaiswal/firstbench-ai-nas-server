import mongoose, { Document, Schema } from 'mongoose';

export interface INormalQuestion extends Document {
    _id: mongoose.Types.ObjectId;
    question: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    correctAnswer: string;
    explanation: string;
}

const NormalQuestionSchema: Schema = new Schema({
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  question: { type: String, required: true },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true },
  },
  correctAnswer: { type: String, required: true },
  explanation: { type: String, required: true },
});

export default mongoose.model<INormalQuestion>('NormalQuestion', NormalQuestionSchema);