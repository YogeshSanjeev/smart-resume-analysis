const GEMINI_API_KEY = 'AIzaSyBco0wxfqmAIuZzIjo8trPJ6nEP64wSkDg';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const geminiService = {
  async analyzeResume(resumeText: string): Promise<any> {
    const prompt = `Analyze this resume for ATS compatibility and extract the candidate's details. Return a JSON response with the following structure:
{
  "overallScore": number (0-100),
  "sections": {
    "formatting": {"score": number, "feedback": string},
    "keywords": {"score": number, "feedback": string, "foundKeywords": string[]},
    "experience": {"score": number, "feedback": string},
    "education": {"score": number, "feedback": string},
    "skills": {"score": number, "feedback": string, "identifiedSkills": string[]}
  },
  "strengths": string[],
  "improvements": string[],
  "atsCompatibility": string,
  "candidateDetails": {
    "name": string,
    "email": string,
    "contactLinks": string[],
    "skills": string[],
    "education": string[],
    "workExperience": string[],
    "certifications": string[]
  }
}

Resume text:
${resumeText}`;

    return this.generateContent(prompt);
  },

  async compareResumeToJob(resumeText: string, jobRole: string, jobDescription: string = ''): Promise<any> {
    const prompt = `Compare this resume to the target job role and provide a detailed match analysis. ${jobDescription ? 'Focus specifically on the provided job description.' : ''} Return a JSON response with:
{
  "matchScore": number (0-100),
  "hireabilityProbability": number (0-100),
  "strengths": string[],
  "weaknesses": string[],
  "missingSkills": string[],
  "recommendations": {
    "toAdd": string[],
    "toRemove": string[],
    "toEnhance": string[]
  },
  "skillMatch": {"technical": number, "soft": number, "domain": number}
}

Target Role: ${jobRole}
${jobDescription ? `\nJob Description:\n${jobDescription}` : ''}

Resume:
${resumeText}`;

    return this.generateContent(prompt);
  },

  // generateRoadmap removed

  async chatResponse(message: string, conversationHistory: GeminiMessage[]): Promise<string> {
    const systemPrompt = `You are a professional career advisor AI assistant. you are living inside the "Resume Enhancer & Career Helper" system.  Help users with:
- Resume optimization and feedback
- Interview preparation
- Career planning and job search strategies
- Skill development and learning paths
- Professional development advice
- Formatting: Use a clean, professional font. do not use markdown formatting in your responses. instead use unicode bold font to highlight important points.

Be concise, actionable, and supportive.`;

    const messages: GeminiMessage[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...conversationHistory,
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role,
          parts: m.parts,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get chat response');
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I could not generate a response.';
  },

  async generateContent(prompt: string): Promise<any> {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Gemini API request failed');
      }

      const data = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text || '{}';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  },
};
