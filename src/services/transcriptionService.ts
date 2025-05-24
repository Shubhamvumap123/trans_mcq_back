// src/services/transcriptionService.ts
import { spawn } from 'child_process';
import path from 'path';
import File from '../models/File';
import Transcription from '../models/Transcription';
import { generateQuestionsForSegments } from './questionService';

export interface WhisperOutput {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export async function transcribeAudioFile(fileId: string): Promise<void> {
  try {
    // Update file status to processing
    await File.findByIdAndUpdate(fileId, { status: 'processing' });

    const file = await File.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    console.log(`Starting transcription for file: ${file.originalName}`);

    // Run Whisper transcription (mock implementation)
    const transcriptionResult = await runWhisperTranscription(file.path);

    // Create 5-minute segments
    const segments = createFiveMinuteSegments(transcriptionResult.segments);

    // Save transcription to database
    const transcription = new Transcription({
      fileId: file._id,
      fullTranscript: transcriptionResult.text,
      segments: segments,
      duration: segments.length > 0 ? segments[segments.length - 1].endTime : 0,
      status: 'completed'
    });

    const savedTranscription = await transcription.save();

    // Generate questions for each segment
    // await generateQuestionsForSegments(savedTranscription._id.toString(), segments);

    // Update file status to completed
    await File.findByIdAndUpdate(fileId, { status: 'completed' });

    console.log(`Transcription completed for file: ${file.originalName}`);
  } catch (error) {
    console.error('Transcription error:', error);
    await File.findByIdAndUpdate(fileId, { status: 'failed' });
    throw error;
  }
}

async function runWhisperTranscription(filePath: string): Promise<WhisperOutput> {
  return new Promise((resolve, reject) => {
    // Mock Whisper implementation - Replace with actual Whisper call
    // Example: whisper --model base --output_format json --output_dir ./output file.mp3
    
    // For now, we'll simulate the transcription with mock data
    setTimeout(() => {
      const mockTranscription: WhisperOutput = {
        text: "This is a mock transcription of the audio file. In a real implementation, this would be the actual transcribed text from Whisper AI. The content would include the full transcript of the uploaded audio or video file.",
        segments: [
          { start: 0, end: 120, text: "This is the first segment of the transcription covering the first two minutes." },
          { start: 120, end: 240, text: "This is the second segment covering minutes two to four of the audio." },
          { start: 240, end: 360, text: "This is the third segment covering minutes four to six of the transcription." },
          { start: 360, end: 480, text: "This is the fourth segment covering the next two minutes of content." },
          { start: 480, end: 600, text: "This is the final segment covering the last portion of the audio file." }
        ]
      };
      resolve(mockTranscription);
    }, 3000); // Simulate processing time

    // Uncomment and modify this for actual Whisper integration:
    /*
    const whisperProcess = spawn('whisper', [
      filePath,
      '--model', 'base',
      '--output_format', 'json',
      '--output_dir', './temp'
    ]);

    let output = '';
    let error = '';

    whisperProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    whisperProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    whisperProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Whisper process failed: ${error}`));
      } else {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (parseError) {
          reject(new Error('Failed to parse Whisper output'));
        }
      }
    });
    */
  });
}

function createFiveMinuteSegments(originalSegments: Array<{ start: number; end: number; text: string }>) {
  const fiveMinuteSegments: Array<{ startTime: number; endTime: number; text: string; segmentIndex: number }> = [];
  const segmentDuration = 300; // 5 minutes in seconds
  let currentSegmentIndex = 0;
  let currentStartTime = 0;

  while (true) {
    const currentEndTime = currentStartTime + segmentDuration;
    const segmentTexts: string[] = [];

    // Collect all original segments that fall within this 5-minute window
    for (const segment of originalSegments) {
      if (segment.start >= currentStartTime && segment.start < currentEndTime) {
        segmentTexts.push(segment.text);
      }
    }

    if (segmentTexts.length === 0) {
      break; // No more content
    }

    fiveMinuteSegments.push({
      startTime: currentStartTime,
      endTime: Math.min(currentEndTime, originalSegments[originalSegments.length - 1].end),
      text: segmentTexts.join(' '),
      segmentIndex: currentSegmentIndex
    });

    currentStartTime = currentEndTime;
    currentSegmentIndex++;

    // Check if we've covered all original segments
    if (currentStartTime >= originalSegments[originalSegments.length - 1].end) {
      break;
    }
  }

  return fiveMinuteSegments;
}

