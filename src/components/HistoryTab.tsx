import { useState } from 'react';
import { History, Search, Loader, Mail, Award, Briefcase, FileText } from 'lucide-react';
import { storageService } from '../services/firebaseStorage';

export default function BestCandidatesTab() {
  const [jobDescription, setJobDescription] = useState('');
  const [candidateCount, setCandidateCount] = useState(5);
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!jobDescription.trim() && candidates.length === 0) {
      // Just load all candidates if no job description
      setSearching(true);
      setError('');
      
      try {
        const results = await storageService.searchCandidatesByJob('', candidateCount);
        setCandidates(results);
        
        if (results.length === 0) {
          setError('No analyzed resumes found. Please analyze some resumes first.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load candidates');
      } finally {
        setSearching(false);
      }
      return;
    }

    setSearching(true);
    setError('');

    try {
      const results = await storageService.searchCandidatesByJob(jobDescription, candidateCount);
      setCandidates(results);

      if (results.length === 0) {
        setError('No matching candidates found. Try analyzing more resumes.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search candidates');
    } finally {
      setSearching(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-24">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <History className="w-6 h-6 text-white" />
          </div>
      <h2 className="text-3xl font-bold text-gray-900">Best Candidates</h2>
        </div>
  <p className="text-gray-600">Find the best candidates for your job description using AI-powered matching</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Find Best Candidates</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Job Description (Optional)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description to find the most suitable candidates..."
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900 placeholder:text-gray-400 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Candidates
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={candidateCount}
              onChange={(e) => setCandidateCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 5)))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={searching}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 px-6 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                {candidates.length > 0 ? 'Refresh Results' : 'Load Candidates'}
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {candidates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {candidates.length} Candidate{candidates.length !== 1 ? 's' : ''} Found
            </h3>
          </div>

          {candidates.map((candidate, index) => (
            <div
              key={candidate.analysisId}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-gray-900">{candidate.name}</h4>
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getScoreColor(candidate.score)}`}>
                        Score: {candidate.score}/100
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-600" />
                        <span>{candidate.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>{candidate.resumeName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {candidate.skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <h5 className="font-semibold text-gray-900 text-sm">Skills</h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 8).map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-lg border border-emerald-200"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 8 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{candidate.skills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Experience */}
              {candidate.experience.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <h5 className="font-semibold text-gray-900 text-sm">Experience</h5>
                  </div>
                  <div className="space-y-1">
                    {candidate.experience.slice(0, 2).map((exp: string, i: number) => (
                      <div key={i} className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                        {exp}
                      </div>
                    ))}
                    {candidate.experience.length > 2 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{candidate.experience.length - 2} more positions
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                Analyzed on {new Date(candidate.analyzedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && candidates.length === 0 && !error && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-12 text-center border border-emerald-200">
          <History className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Candidates Yet</h3>
          <p className="text-gray-600">
            Click "Load Candidates" to view all analyzed resumes, or paste a job description to find the best matches.
          </p>
        </div>
      )}
    </div>
  );
}
