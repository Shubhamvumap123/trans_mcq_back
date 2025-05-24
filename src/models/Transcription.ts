// src/models/Transcription.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ITranscriptionSegment {
  startTime: number;
  endTime: number;
  text: string;
  segmentIndex: number;
}

export interface ITranscription extends Document {
  fileId: mongoose.Types.ObjectId;
  fullTranscript: string;
  segments: ITranscriptionSegment[];
  duration: number;
  language?: string;
  createdAt: Date;
  status: 'processing' | 'completed' | 'failed';
}

const TranscriptionSegmentSchema: Schema = new Schema({
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  text: { type: String, required: true },
  segmentIndex: { type: Number, required: true }
});

const TranscriptionSchema: Schema = new Schema({
  fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true },
  fullTranscript: { type: String, required: true },
  segments: [TranscriptionSegmentSchema],
  duration: { type: Number, required: true },
  language: { type: String },
  createdAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  }
});

export default mongoose.model<ITranscription>('Transcription', TranscriptionSchema);

// src/models/Question.ts
