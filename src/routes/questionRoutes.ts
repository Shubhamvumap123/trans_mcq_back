
// src/routes/questionRoutes.ts
import express, { Request, Response } from 'express';
import Question from '../models/Question';

const router = express.Router();

// Get questions by transcription ID
router.get('/transcription/:transcriptionId', async (req: Request, res: Response) => {
  try {
    const questions = await Question.find({ transcriptionId: req.params.transcriptionId })
      .sort({ segmentIndex: 1, createdAt: 1 });
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

// Get questions by transcription ID and segment
router.get('/transcription/:transcriptionId/segment/:segmentIndex', async (req: Request, res: Response) => {
  try {
    const segmentIndex = parseInt(req.params.segmentIndex);
    const questions = await Question.find({ 
      transcriptionId: req.params.transcriptionId,
      segmentIndex: segmentIndex
    });
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get questions for segment' });
  }
});

// Get question by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    return res.json(question);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get question' });
  }
});

// Create new question
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      transcriptionId,
      segmentIndex,
      question,
      options,
      explanation,
      difficulty
    } = req.body;

    // Validate required fields
    if (!transcriptionId || segmentIndex === undefined || !question || !options) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate options structure
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'At least 2 options are required' });
    }

    // Check if at least one option is marked as correct
    const hasCorrectOption = options.some((opt: any) => opt.isCorrect === true);
    if (!hasCorrectOption) {
      return res.status(400).json({ error: 'At least one option must be marked as correct' });
    }

    const newQuestion = new Question({
      transcriptionId,
      segmentIndex,
      question,
      options,
      explanation,
      difficulty: difficulty || 'medium'
    });

    const savedQuestion = await newQuestion.save();
    return res.status(201).json(savedQuestion);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create question' });
  }
});

// Update question
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    return res.json(updatedQuestion);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question
router.delete('/:id', async (req, res) => {
  try {
    const deletedQuestion = await Question.findByIdAndDelete(req.params.id);
    
    if (!deletedQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    return res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Get questions statistics
router.get('/stats/transcription/:transcriptionId', async (req: Request, res: Response) => {
  try {
    const stats = await Question.aggregate([
      { $match: { transcriptionId: req.params.transcriptionId } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          byDifficulty: {
            $push: "$difficulty"
          },
          bySegment: {
            $push: "$segmentIndex"
          }
        }
      }
    ]);

    const difficultyCount = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    const segmentCount: { [key: number]: number } = {};

    if (stats.length > 0) {
      stats[0].byDifficulty.forEach((diff: string) => {
        if (diff in difficultyCount) {
          difficultyCount[diff as keyof typeof difficultyCount]++;
        }
      });

      stats[0].bySegment.forEach((seg: number) => {
        segmentCount[seg] = (segmentCount[seg] || 0) + 1;
      });
    }

    res.json({
      totalQuestions: stats.length > 0 ? stats[0].totalQuestions : 0,
      difficultyBreakdown: difficultyCount,
      segmentBreakdown: segmentCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get question statistics' });
  }
});

export default router;