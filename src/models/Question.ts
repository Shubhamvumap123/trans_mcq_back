import mongoose, { Document, Schema } from 'mongoose';

export interface IOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion extends Document {
  transcriptionId: mongoose.Types.ObjectId;
  segmentIndex: number;
  question: string;
  options: IOption[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
}

const OptionSchema: Schema = new Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true }
});

const QuestionSchema: Schema = new Schema({
  transcriptionId: { type: Schema.Types.ObjectId, ref: 'Transcription', required: true },
  segmentIndex: { type: Number, required: true },
  question: { type: String, required: true },
  options: [OptionSchema],
  explanation: { type: String },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IQuestion>('Question', QuestionSchema);