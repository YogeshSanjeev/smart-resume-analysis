import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  addDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase";

export interface StoredResume {
  id: string;
  userId: string;
  name: string;
  text: string;
  uploadedAt: string;
  fileType: string;
}

export interface AnalysisResult {
  id: string;
  userId: string;
  resumeId: string;
  type: 'ats' | 'job-match';
  data: any;
  createdAt: string;
}

class FirebaseStorageService {
  private getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  // Resume operations
  async saveResume(resume: Omit<StoredResume, 'id' | 'userId'>): Promise<string> {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const resumeData = {
      ...resume,
      userId,
      uploadedAt: resume.uploadedAt || new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'resumes'), resumeData);
    await this.setCurrentResume(docRef.id);
    return docRef.id;
  }

  async setCurrentResume(resumeId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    localStorage.setItem(`current_resume_${userId}`, resumeId);
  }

  async getCurrentResume(): Promise<StoredResume | null> {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    const currentResumeId = localStorage.getItem(`current_resume_${userId}`);
    if (!currentResumeId) return null;

    return this.getResumeById(currentResumeId);
  }

  async clearCurrentResume(): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    localStorage.removeItem(`current_resume_${userId}`);
  }

  async getResumes(): Promise<StoredResume[]> {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', userId),
        orderBy('uploadedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StoredResume));
    } catch (error) {
      console.error('Error getting resumes:', error);
      return [];
    }
  }

  async getResumeById(id: string): Promise<StoredResume | null> {
    try {
      const docRef = doc(db, 'resumes', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as StoredResume;
      }
      return null;
    } catch (error) {
      console.error('Error getting resume:', error);
      return null;
    }
  }

  async deleteResume(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'resumes', id));
    } catch (error) {
      console.error('Error deleting resume:', error);
    }
  }

  // Analysis operations
  async saveAnalysis(resumeId: string, type: 'ats' | 'job-match', data: any): Promise<string> {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Remove old analyses for the same candidate (by email) and type
    if (data?.candidateDetails?.email) {
      const email = data.candidateDetails.email;
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', userId),
        where('type', '==', type),
        where('data.candidateDetails.email', '==', email)
      );
      const querySnapshot = await getDocs(q);
      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
    }

    const analysisData = {
      userId,
      resumeId,
      type,
      data,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'analyses'), analysisData);
    return docRef.id;
  }

  async getAnalyses(): Promise<AnalysisResult[]> {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AnalysisResult));
    } catch (error) {
      console.error('Error getting analyses:', error);
      return [];
    }
  }

  async getAnalysisForResume(resumeId: string, type: string): Promise<AnalysisResult | null> {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    try {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', userId),
        where('resumeId', '==', resumeId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as AnalysisResult;
      }
      return null;
    } catch (error) {
      console.error('Error getting analysis:', error);
      return null;
    }
  }

  async searchCandidatesByJob(jobDescription: string, limit: number = 10): Promise<any[]> {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      // Get all ATS analyses for the current user
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', userId),
        where('type', '==', 'ats'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const candidates: any[] = [];

      for (const analysisDoc of querySnapshot.docs) {
        const analysis = analysisDoc.data();
        const resume = await this.getResumeById(analysis.resumeId);

        if (resume && analysis.data.candidateDetails) {
          candidates.push({
            analysisId: analysisDoc.id,
            resumeId: resume.id,
            name: analysis.data.candidateDetails.name || 'Unknown',
            email: analysis.data.candidateDetails.email || 'N/A',
            score: analysis.data.overallScore || 0,
            skills: analysis.data.candidateDetails.skills || [],
            experience: analysis.data.candidateDetails.workExperience || [],
            education: analysis.data.candidateDetails.education || [],
            analyzedAt: analysis.createdAt,
            resumeName: resume.name,
            resumeText: resume.text,
          });
        }
      }

      // If job description is provided, use AI to rank candidates by job fit
      if (jobDescription && candidates.length > 0) {
        // Use OpenAI/Gemini or similar to rank candidates by job fit
        // For now, sort by keyword match as a placeholder
        const jd = jobDescription.toLowerCase();
        candidates.forEach(c => {
          let matchScore = 0;
          if (c.resumeText) {
            const text = c.resumeText.toLowerCase();
            jd.split(/\W+/).forEach(word => {
              if (word && text.includes(word)) matchScore++;
            });
          }
          c.matchScore = matchScore;
        });
        candidates.sort((a, b) => b.matchScore - a.matchScore || b.score - a.score);
      } else {
        // Sort by ATS score descending
        candidates.sort((a, b) => b.score - a.score);
      }

      return candidates.slice(0, limit).map(({ resumeText, ...rest }) => rest);
    } catch (error) {
      console.error('Error searching candidates:', error);
      return [];
    }
  }
}

export const storageService = new FirebaseStorageService();
