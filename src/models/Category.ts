import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  subject: string;
  grade: string;
}

const CategorySchema: Schema = new Schema({
  subject: { type: String, required: true },
  grade: { type: String, required: true },
});

export default mongoose.model<ICategory>('Category', CategorySchema);