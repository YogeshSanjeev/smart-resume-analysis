import { useState, useEffect } from 'react';
import { FileText, Loader, TrendingUp, AlertCircle, BarChart3, CheckCircle2, Check, ArrowRight, RefreshCw, User, Mail, Link as LinkIcon, Award, Briefcase, GraduationCap } from 'lucide-react';
import { geminiService } from '../services/gemini';
import { storageService } from '../services/firebaseStorage';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface ATSScoreProps {
  hasResume: boolean;
}

export default function ATSScore({ hasResume }: ATSScoreProps) {
  const [resumeText, setResumeText] = useState<string | null>(null);
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
        // Try to load last analysis for this resume from localStorage
        const lastAnalysis = localStorage.getItem('ats_last_analysis');
        if (lastAnalysis) {
          try {
            const parsed = JSON.parse(lastAnalysis);
            if (parsed && parsed.resumeId === stored.id) {
              setResult(parsed.result);
            } else {
              setResult(null);
            }
          } catch {
            setResult(null);
          }
        } else {
          setResult(null);
        }
      } else {
        setResumeText(null);
        setResult(null);
      }
    };
    
    loadResume();
  }, [hasResume]);

  const handleAnalyze = async () => {
    if (!resumeText) return;

    setAnalyzing(true);
    setError('');
    setStatusMessage('Analyzing resume with AI...');

    try {
      if (resumeText.length < 100) {
        throw new Error('Resume text is too short. Please upload a valid resume.');
      }

      // Remove any previous analysis before saving new one
      const stored = await storageService.getCurrentResume();
      
      const analysis = await geminiService.analyzeResume(resumeText);

      // Save analysis for current resume
      if (stored) {
        await storageService.saveAnalysis(stored.id, 'ats', analysis);
      }

      setResult(analysis);
      // Persist the result so it stays after refresh
      if (stored) {
        localStorage.setItem('ats_last_analysis', JSON.stringify({ resumeId: stored.id, result: analysis }));
      }
      setStatusMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume');
      setStatusMessage('');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ATS Resume Score</h2>
        <p className="text-gray-600">Upload your resume to get an instant ATS compatibility score</p>
      </div>

      {!hasResume && !resumeText && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">No Resume Uploaded</h3>
            <p className="text-yellow-700 text-sm">Please upload your resume using the "Upload Resume" button in the top navigation bar to use this feature.</p>
          </div>
        </div>
      )}

      {!result ? (
        <div className="space-y-6">
          {/* What is ATS Info Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">What is ATS Scoring?</h3>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  Applicant Tracking Systems (ATS) are used by 98% of Fortune 500 companies to filter resumes. 
                  Our AI analyzes your resume like an ATS would, checking formatting, keywords, and structure.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                    <div className="text-2xl font-bold text-emerald-600">98%</div>
                    <div className="text-xs text-gray-600 mt-1">Companies use ATS</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                    <div className="text-2xl font-bold text-emerald-600">75%</div>
                    <div className="text-xs text-gray-600 mt-1">Resumes rejected</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                    <div className="text-2xl font-bold text-emerald-600">6 sec</div>
                    <div className="text-xs text-gray-600 mt-1">Average review time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Keyword Optimization</h4>
              <p className="text-sm text-gray-600">Identifies missing industry keywords and suggests improvements</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Format Compatibility</h4>
              <p className="text-sm text-gray-600">Checks if your resume format is ATS-friendly</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                <AlertCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Error Detection</h4>
              <p className="text-sm text-gray-600">Finds formatting issues that may cause parsing errors</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Actionable Insights</h4>
              <p className="text-sm text-gray-600">Get specific recommendations to improve your score</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resumeText && !analyzing && (
            <button
              onClick={handleAnalyze}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <TrendingUp className="w-5 h-5" />
              Analyze My Resume Now
            </button>
          )}

          {analyzing && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl flex items-center gap-4">
              <Loader className="w-6 h-6 animate-spin" />
              <div className="flex-1">
                <span className="font-semibold text-lg">{statusMessage || 'Processing...'}</span>
                {statusMessage.includes('OCR') && (
                  <p className="text-sm text-emerald-600 mt-1">This may take a moment for scanned PDFs...</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Score Card */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Your ATS Score</h3>
                </div>
                <p className="text-emerald-100 text-sm">Resume compatibility rating</p>
              </div>
              <div className="text-center">
                <div className="text-6xl font-bold mb-1">{result.overallScore}</div>
                <div className="text-emerald-100 text-sm font-medium">out of 100</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-emerald-100">
                <span>Progress</span>
                <span>{result.overallScore}%</span>
              </div>
              <div className="w-full bg-emerald-700/30 rounded-full h-4">
                <div
                  className="bg-white rounded-full h-4 transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${result.overallScore}%` }}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-100">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>{result.overallScore >= 80 ? 'Excellent!' : result.overallScore >= 60 ? 'Good, but can improve' : 'Needs improvement'}</span>
            </div>
          </div>

          {/* Candidate Details Card */}
          {result.candidateDetails && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Candidate Profile</h3>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {result.candidateDetails.name && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-0.5">Full Name</div>
                        <div className="font-semibold text-gray-900">{result.candidateDetails.name}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {result.candidateDetails.email && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs text-gray-600 mb-0.5">Email Address</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">{result.candidateDetails.email}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Links */}
              {result.candidateDetails.contactLinks?.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <LinkIcon className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Contact Links</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.candidateDetails.contactLinks.map((link: string, i: number) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-emerald-600 text-xs font-medium px-3 py-2 rounded-lg border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center gap-1.5"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span className="max-w-[200px] truncate">{link}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {result.candidateDetails.skills?.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Technical Skills</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.candidateDetails.skills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-emerald-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {result.candidateDetails.education?.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Education</h4>
                  </div>
                  <div className="space-y-2">
                    {result.candidateDetails.education.map((edu: string, i: number) => (
                      <div
                        key={i}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-700"
                      >
                        {edu}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {result.candidateDetails.workExperience?.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Work Experience</h4>
                  </div>
                  <div className="space-y-2">
                    {result.candidateDetails.workExperience.map((exp: string, i: number) => (
                      <div
                        key={i}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-700"
                      >
                        {exp}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {result.candidateDetails.certifications?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Certifications</h4>
                  </div>
                  <div className="space-y-2">
                    {result.candidateDetails.certifications.map((cert: string, i: number) => (
                      <div
                        key={i}
                        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200 text-sm text-gray-700 flex items-start gap-2"
                      >
                        <Award className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Section Breakdown</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(result.sections).map(([key, value]: any) => ({
                name: key.charAt(0).toUpperCase() + key.slice(1),
                score: value.score,
              }))}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #10b981', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Bar dataKey="score" fill="url(#emeraldGradient)" radius={[12, 12, 0, 0]} />
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(result.sections).map(([key, value]: any) => (
              <div key={key} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900 capitalize text-lg">{key}</h4>
                  <div className="flex flex-col items-end">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: getScoreColor(value.score) }}
                    >
                      {value.score}
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-1.5 rounded-full"
                        style={{ width: `${value.score}%` }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{value.feedback}</p>
                {value.identifiedSkills && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {value.identifiedSkills.slice(0, 5).map((skill: string, i: number) => (
                      <span key={i} className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-emerald-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Key Strengths</h3>
            </div>
            <ul className="space-y-3">
              {result.strengths.map((strength: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 bg-white/60 backdrop-blur rounded-xl p-3 border border-emerald-100">
                  <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
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
              <h3 className="text-xl font-bold text-gray-900">Growth Opportunities</h3>
            </div>
            <ul className="space-y-3">
              {result.improvements.map((improvement: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 bg-white/60 backdrop-blur rounded-xl p-3 border border-amber-100">
                  <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm leading-relaxed">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => {
              setResult(null);
              setStatusMessage('');
              localStorage.removeItem('ats_last_analysis');
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Analyze Another Resume
          </button>
        </div>
      )}
    </div>
  );
}
