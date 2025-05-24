// src/routes/transcriptionRoutes.ts
import { Router, Request, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import Transcription from '../models/Transcription';
import File from '../models/File';

const router = Router();

// Get transcription by file ID
router.get('/file/:fileId', async (req: Request, res: Response) => {
  try {
    const transcription = await Transcription.findOne({ fileId: req.params.fileId })
      .populate('fileId');
    
    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }
    
    return res.json(transcription);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get transcription' });
  }
});

// Get transcription by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const transcription = await Transcription.findById(req.params.id)
      .populate('fileId');
    
    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }
    
    return res.json(transcription);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get transcription' });
  }
});

// Get all transcriptions
router.get('/', async (req: Request, res: Response) => {
  try {
    const transcriptions = await Transcription.find()
      .populate('fileId')
      .sort({ createdAt: -1 });
    
    res.json(transcriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get transcriptions' });
  }
});

// Get transcription segments
router.get('/:id/segments', async (req: Request, res: Response) => {
  try {
    const transcription = await Transcription.findById(req.params.id);
    
    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }
    
    return res.json({
      transcriptionId: transcription._id,
      segments: transcription.segments,
      totalSegments: transcription.segments.length
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get transcription segments' });
  }
});

router.get('/:id/segments/:segmentIndex', async (req, res) => {
  try {
    const transcription = await Transcription.findById(req.params.id);
    
    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }
    
    const segmentIndex = parseInt(req.params.segmentIndex);
    const segment = transcription.segments.find((s: any) => s.segmentIndex === segmentIndex);
    
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    
    return res.json(segment);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get segment' });
  }
});

export default router;
