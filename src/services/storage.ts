export interface StoredResume {
  id: string;
  name: string;
  text: string;
  uploadedAt: string;
  fileType: string;
}


const RESUMES_KEY = 'career_helper_resumes';
const CURRENT_RESUME_KEY = 'career_helper_current_resume';
const ANALYSES_KEY = 'career_helper_analyses';
// ROADMAPS_KEY removed
// ROADMAPS_KEY removed

export const storageService = {
  saveResume: (resume: StoredResume): void => {
    const resumes = storageService.getResumes();
    resumes.push(resume);
    localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes));
    storageService.setCurrentResume(resume);
  },
  setCurrentResume: (resume: StoredResume): void => {
    localStorage.setItem(CURRENT_RESUME_KEY, JSON.stringify(resume));
  },

  getCurrentResume: (): StoredResume | null => {
    const data = localStorage.getItem(CURRENT_RESUME_KEY);
    return data ? JSON.parse(data) : null;
  },

  clearCurrentResume: (): void => {
    localStorage.removeItem(CURRENT_RESUME_KEY);
  },

  getResumes: (): StoredResume[] => {
    const data = localStorage.getItem(RESUMES_KEY);
    return data ? JSON.parse(data) : [];
  },

  getResumeById: (id: string): StoredResume | null => {
    const resumes = storageService.getResumes();
    return resumes.find(r => r.id === id) || null;
  },

  deleteResume: (id: string): void => {
    const resumes = storageService.getResumes().filter(r => r.id !== id);
    localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes));
  },

  saveAnalysis: (resumeId: string, type: string, data: any): void => {
    const analyses = storageService.getAnalyses();
    const analysis = {
      id: crypto.randomUUID(),
      resumeId,
      type,
      data,
      createdAt: new Date().toISOString(),
    };
    analyses.push(analysis);
    localStorage.setItem(ANALYSES_KEY, JSON.stringify(analyses));
  },

  getAnalyses: (): any[] => {
    const data = localStorage.getItem(ANALYSES_KEY);
    return data ? JSON.parse(data) : [];
  },

  getAnalysisForResume: (resumeId: string, type: string): any | null => {
    const analyses = storageService.getAnalyses();
    const analysis = analyses
      .filter(a => a.resumeId === resumeId && a.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return analysis || null;
  },

  // saveRoadmap removed

  // getRoadmaps removed
};
