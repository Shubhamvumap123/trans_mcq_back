// src/models/File.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
}

const FileSchema: Schema = new Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  }
});

export default mongoose.model<IFile>('File', FileSchema);

