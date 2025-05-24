// src/routes/fileRoutes.ts
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import File from '../models/File';
import { transcribeAudioFile } from '../services/transcriptionService';
import { IFile } from '../models/File';
const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
    'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio and video files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload file endpoint
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Save file info to database
    const fileDoc = new File({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      status: 'uploaded'
    });

    const savedFile = await fileDoc.save() as IFile;

    // Start transcription process in background
    const fileId: string = typeof (savedFile._id as any) === 'string' ? (savedFile._id as any) : (savedFile._id as any).toString();
    transcribeAudioFile(fileId).catch(error => {
      console.error('Transcription error:', error);
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: savedFile._id,
        originalName: savedFile.originalName,
        filename: savedFile.filename,
        size: savedFile.size,
        mimeType: savedFile.mimeType,
        status: savedFile.status,
        uploadedAt: savedFile.uploadedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get file by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Get all files
router.get('/', async (req: Request, res: Response) => {
  try {
    const files = await File.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get files' });
  }
});

// Update file status
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const validStatuses = ['uploaded', 'processing', 'completed', 'failed'];
    
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const file = await File.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update file status' });
  }
});

// Delete file
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    // Delete physical file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;