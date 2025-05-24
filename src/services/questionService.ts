// src/services/questionService.ts
import Question from '../models/Question';

export interface MCQOption {
  text: string;
  isCorrect: boolean;
}

export interface GeneratedMCQ {
  question: string;
  options: MCQOption[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export async function generateQuestionsForSegments(
  transcriptionId: string, 
  segments: Array<{ startTime: number; endTime: number; text: string; segmentIndex: number }>
): Promise<void> {
  try {
    for (const segment of segments) {
      // Generate questions for this segment
      const questions = await generateMCQsFromText(segment.text);
      
      // Save questions to database
      for (const mcq of questions) {
        const question = new Question({
          transcriptionId,
          segmentIndex: segment.segmentIndex,
          question: mcq.question,
          options: mcq.options,
          explanation: mcq.explanation,
          difficulty: mcq.difficulty
        });
        
        await question.save();
      }
    }
    
    console.log(`Generated questions for transcription: ${transcriptionId}`);
  } catch (error) {
    console.error('Question generation error:', error);
    throw error;
  }
}

async function generateMCQsFromText(text: string): Promise<GeneratedMCQ[]> {
  // Mock implementation - Replace with actual LLM integration
  // This would typically call a local LLM like Ollama, or use OpenAI API
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockQuestions: GeneratedMCQ[] = [
        {
          question: `Based on the content "${text.substring(0, 50)}...", what is the main topic discussed?`,
          options: [
            { text: "Technology and innovation", isCorrect: true },
            { text: "Sports and recreation", isCorrect: false },
            { text: "Cooking and recipes", isCorrect: false },
            { text: "Travel and tourism", isCorrect: false }
          ],
          explanation: "The main topic is determined by analyzing the key themes and concepts mentioned in the segment.",
          difficulty: 'medium'
        },
        {
          question: "Which of the following best summarizes this segment?",
          options: [
            { text: "A detailed explanation of the subject matter", isCorrect: true },
            { text: "A brief introduction only", isCorrect: false },
            { text: "A conclusion and summary", isCorrect: false },
            { text: "A list of references", isCorrect: false }
          ],
          explanation: "This question tests comprehension of the segment's structure and content.",
          difficulty: 'easy'
        }
      ];
      resolve(mockQuestions);
    }, 1000);
  });

  // Uncomment and modify for actual LLM integration:
  /*
  const prompt = `Generate 2-3 multiple choice questions based on the following text:
  
  "${text}"
  
  For each question, provide:
  1. A clear question
  2. 4 multiple choice options (A, B, C, D)
  3. Mark which option is correct
  4. Provide a brief explanation
  5. Set difficulty level (easy, medium, hard)
  
  Return as JSON format.`;
  
  // Call your LLM service here (Ollama, OpenAI, etc.)
  const response = await callLLMService(prompt);
  return parseQuestionsFromLLMResponse(response);
  */
}