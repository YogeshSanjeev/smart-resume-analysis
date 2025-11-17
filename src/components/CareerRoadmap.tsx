import { useState } from 'react';
import { Target, Plus, X, Loader, TrendingUp, BookOpen, Award, Briefcase, AlertCircle } from 'lucide-react';
import { geminiService } from '../services/gemini';
import { storageService } from '../services/storage';

const popularRoles = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'UX Designer',
  'DevOps Engineer',
  'Full Stack Developer',
  'Machine Learning Engineer',
  'Cloud Architect',
];

const commonSkills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS',
  'Docker', 'Git', 'Agile', 'Communication', 'Leadership', 'Problem Solving',
];

interface CareerRoadmapProps {
  hasResume: boolean;
}

export default function CareerRoadmap({ hasResume }: CareerRoadmapProps) {
  const [targetRole, setTargetRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
  const [generating, setGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);

  const addSkill = (skill: string) => {
    if (skill && !currentSkills.includes(skill)) {
      setCurrentSkills([...currentSkills, skill]);
      setSkillLevels({ ...skillLevels, [skill]: 50 });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setCurrentSkills(currentSkills.filter(s => s !== skill));
    const newLevels = { ...skillLevels };
    delete newLevels[skill];
    setSkillLevels(newLevels);
  };

  const handleGenerate = async () => {
    if (!targetRole || currentSkills.length === 0) return;

    setGenerating(true);

    try {
      const result = await geminiService.generateRoadmap(targetRole, currentSkills, skillLevels);
      setRoadmap(result);
      storageService.saveRoadmap({ targetRole, currentSkills, skillLevels, roadmap: result });
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Career Roadmap Creator</h2>
        <p className="text-gray-600">Build your personalized learning path to your dream role</p>
      </div>

      {!hasResume && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">No Resume Uploaded</h3>
            <p className="text-yellow-700 text-sm">For better personalized recommendations, please upload your resume using the "Upload Resume" button in the top navigation bar.</p>
          </div>
        </div>
      )}

      {!roadmap ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="w-5 h-5 inline mr-2" />
              Target Job Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {popularRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => setTargetRole(role)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-5 h-5 inline mr-2" />
              Your Current Skills
            </label>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill(newSkill)}
                placeholder="Add a skill"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => addSkill(newSkill)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {commonSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  disabled={currentSkills.includes(skill)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {skill}
                </button>
              ))}
            </div>

            {currentSkills.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="font-medium text-gray-900">Rate Your Skill Levels</h3>
                {currentSkills.map((skill) => (
                  <div key={skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{skill}</span>
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-sm text-gray-600">
                        {skillLevels[skill] < 30 ? 'Beginner' :
                         skillLevels[skill] < 70 ? 'Intermediate' : 'Advanced'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skillLevels[skill] || 50}
                      onChange={(e) => setSkillLevels({
                        ...skillLevels,
                        [skill]: parseInt(e.target.value)
                      })}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {targetRole && currentSkills.length > 0 && !generating && (
            <button
              onClick={handleGenerate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Generate Roadmap
            </button>
          )}

          {generating && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Generating your personalized career roadmap...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Your Roadmap to {targetRole}</h3>
                <p className="text-blue-100">Estimated Timeline: {roadmap.estimatedTimeToRole}</p>
              </div>
              <Target className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="space-y-4">
            {roadmap.phases.map((phase: any, index: number) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">
                      Phase {index + 1}: {phase.phase}
                    </h3>
                    <span className="bg-blue-400 px-3 py-1 rounded-full text-sm">
                      {phase.duration}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Skills to Learn
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {phase.skills.map((skill: string, i: number) => (
                        <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-600" />
                      Recommended Certifications
                    </h4>
                    <ul className="space-y-1">
                      {phase.certifications.map((cert: string, i: number) => (
                        <li key={i} className="text-gray-700 text-sm">• {cert}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-orange-600" />
                      Practice Projects
                    </h4>
                    <ul className="space-y-1">
                      {phase.projects.map((project: string, i: number) => (
                        <li key={i} className="text-gray-700 text-sm">• {project}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Learning Resources</h4>
                    <ul className="space-y-1">
                      {phase.resources.map((resource: string, i: number) => (
                        <li key={i} className="text-gray-700 text-sm">• {resource}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Key Milestones</h3>
            <ul className="space-y-2">
              {roadmap.keyMilestones.map((milestone: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{milestone}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => {
              setRoadmap(null);
              setTargetRole('');
              setCurrentSkills([]);
              setSkillLevels({});
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Create New Roadmap
          </button>
        </div>
      )}
    </div>
  );
}
