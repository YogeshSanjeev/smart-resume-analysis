import { useState, useEffect } from 'react';
import { Loader, Target, AlertCircle, Briefcase } from 'lucide-react';
import { geminiService } from '../services/gemini';
import { storageService } from '../services/firebaseStorage';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const popularRoles = [
  'yogesh kumar',
  'Product Manager',
  'Data Scientist',
  'UX Designer',
  'Marketing Manager',
  'Business Analyst',
  'DevOps Engineer',
  'Sales Executive',
];

interface JobMatchProps {
  hasResume: boolean;
}

export default function JobMatch({ hasResume }: JobMatchProps) {
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Load resume from local storage on mount
  useEffect(() => {
    const loadResume = async () => {
      const stored = await storageService.getCurrentResume();
      if (stored) {
        setResumeText(stored.text);
      }
    };
    
    loadResume();
  }, [hasResume]);

  const handleAnalyze = async () => {
    if (!resumeText || !jobRole.trim()) {
      setError('Please upload a resume and enter a job role');
      return;
    }

    setAnalyzing(true);
    setError('');
    setStatusMessage('Comparing resume to job role with AI...');

    try {
      if (resumeText.length < 100) {
        throw new Error('Resume text is too short. Please upload a valid resume.');
      }

      const analysis = await geminiService.compareResumeToJob(resumeText, jobRole, jobDescription);

      // Save analysis for current resume
      const stored = await storageService.getCurrentResume();
      if (stored) {
        await storageService.saveAnalysis(stored.id, 'job-match', { ...analysis, jobRole, jobDescription });
      }

      setResult(analysis);
      setStatusMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume');
      setStatusMessage('');
    } finally {
      setAnalyzing(false);
    }
  };

  const radarData = result ? [
    { skill: 'Technical', value: result.skillMatch.technical },
    { skill: 'Soft Skills', value: result.skillMatch.soft },
    { skill: 'Domain', value: result.skillMatch.domain },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Job Match Analysis</h2>
        <p className="text-gray-600">Discover how well your resume aligns with your dream role</p>
      </div>

      {!hasResume && !resumeText && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-lg">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 mb-2 text-lg">No Resume Uploaded</h3>
            <p className="text-amber-700 leading-relaxed">Please upload your resume using the "Upload Resume" button in the top navigation bar to unlock this powerful matching feature.</p>
          </div>
        </div>
      )}

      {!result ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200 shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">What is Job Matching?</h3>
                <p className="text-gray-700 leading-relaxed">Our AI-powered system compares your resume against job requirements to identify strengths, gaps, and improvement opportunities. Get actionable insights to increase your chances of landing interviews.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">85%</div>
                <div className="text-sm text-gray-600">Average Match Score</div>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">3x</div>
                <div className="text-sm text-gray-600">More Interview Calls</div>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">15min</div>
                <div className="text-sm text-gray-600">Average Analysis Time</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <label className="block text-lg font-bold text-gray-900">
                Target Job Role
              </label>
            </div>
            <input
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all mb-4 text-gray-900 placeholder:text-gray-400"
            />
            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium text-gray-600">Popular Roles:</p>
              <div className="flex flex-wrap gap-2">
                {popularRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setJobRole(role)}
                    className="bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-700 text-sm font-medium px-4 py-2 rounded-xl transition-all border border-emerald-200 hover:border-emerald-300 hover:shadow-md"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-lg font-bold text-gray-900 mb-3">
                Job Description (Optional)
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Paste the job description for a more focused analysis and tailored recommendations.
              </p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here including requirements, responsibilities, and qualifications..."
                rows={8}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900 placeholder:text-gray-400 resize-y"
              />
            </div>
          </div>

          {error && (
            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-start gap-3 shadow-lg">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm leading-relaxed mt-1.5">{error}</span>
            </div>
          )}

          {resumeText && jobRole && !analyzing && (
            <button
              onClick={handleAnalyze}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-5 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 group"
            >
              <Target className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Analyze Job Match
            </button>
          )}

          {analyzing && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 px-6 py-5 rounded-2xl flex items-center gap-4 shadow-lg">
              <Loader className="w-6 h-6 animate-spin text-emerald-600" />
              <div className="flex-1">
                <span className="font-bold text-emerald-900 text-lg">{statusMessage || 'Processing...'}</span>
                {statusMessage.includes('OCR') && (
                  <p className="text-sm text-emerald-700 mt-1">This may take a moment for scanned PDFs...</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <div className="text-sm text-emerald-100 font-medium">Match Score</div>
              </div>
              <div className="text-6xl font-bold mb-4">{result.matchScore}%</div>
              <div className="w-full bg-emerald-700/30 rounded-full h-4">
                <div
                  className="bg-white rounded-full h-4 transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${result.matchScore}%` }}
                />
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-100">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span>{result.matchScore >= 80 ? 'Excellent Match!' : result.matchScore >= 60 ? 'Good Match' : 'Needs Work'}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="text-sm text-teal-100 font-medium">Hire Probability</div>
              </div>
              <div className="text-6xl font-bold mb-4">{result.hireabilityProbability}%</div>
              <div className="w-full bg-teal-700/30 rounded-full h-4">
                <div
                  className="bg-white rounded-full h-4 transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${result.hireabilityProbability}%` }}
                />
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-teal-100">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span>{result.hireabilityProbability >= 70 ? 'High Chance!' : result.hireabilityProbability >= 50 ? 'Moderate Chance' : 'Low Chance'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Skill Match Breakdown</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#d1d5db" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Radar name="Match" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.5} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-3 mt-6">
              {radarData.map((item, i) => (
                <div key={i} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 text-center border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">{item.value}%</div>
                  <div className="text-xs text-gray-600 font-medium">{item.skill}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Your Strengths</h3>
              </div>
              <ul className="space-y-3">
                {result.strengths.map((strength: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 bg-white/60 backdrop-blur rounded-xl p-3 border border-emerald-100">
                    <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="text-sm leading-relaxed">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Areas to Improve</h3>
              </div>
              <ul className="space-y-3">
                {result.weaknesses.map((weakness: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 bg-white/60 backdrop-blur rounded-xl p-3 border border-amber-100">
                    <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <span className="text-sm leading-relaxed">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-8 border border-rose-200 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Missing Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.missingSkills.map((skill: string, i: number) => (
                <span key={i} className="bg-white/60 backdrop-blur text-rose-700 px-4 py-2 rounded-xl text-sm font-medium border border-rose-300 shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Action Plan</h3>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <h4 className="font-bold text-emerald-700 mb-4 text-lg flex items-center gap-2">
                  <span className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm">+</span>
                  Add to Resume
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.toAdd.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 text-sm leading-relaxed">
                      <span className="text-emerald-600 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <h4 className="font-bold text-amber-700 mb-4 text-lg flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white text-sm">↑</span>
                  Enhance
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.toEnhance.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 text-sm leading-relaxed">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {result.recommendations.toRemove.length > 0 && (
                <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-xl p-6 border border-rose-200">
                  <h4 className="font-bold text-rose-700 mb-4 text-lg flex items-center gap-2">
                    <span className="w-6 h-6 bg-rose-500 rounded-lg flex items-center justify-center text-white text-sm">−</span>
                    Consider Removing
                  </h4>
                  <ul className="space-y-2">
                    {result.recommendations.toRemove.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 text-sm leading-relaxed">
                        <span className="text-rose-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setResult(null);
              setJobRole('');
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Target className="w-5 h-5" />
            Analyze Another Role
          </button>
        </div>
      )}
    </div>
  );
}
