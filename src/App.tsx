import { useState, useEffect } from 'react';
import { FileText, Target, MessageSquare, LogOut, Upload, History } from 'lucide-react';
import Auth from './components/Auth';
import ATSScore from './components/ATSScore';
import JobMatch from './components/JobMatch';
// ...existing code...
import AIAssistant from './components/AIAssistant';
import HistoryTab from './components/HistoryTab';
import ResumeUploadModal from './components/ResumeUploadModal';
import { authService } from './services/firebaseAuth';
import { storageService } from './services/firebaseStorage';

type Tab = 'ats' | 'match' | 'assistant' | 'history';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('ats');
  const [user, setUser] = useState<any>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [currentResumeName, setCurrentResumeName] = useState<string>('');

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setUser(user);
      if (user) {
        checkResume();
      }
    });

    return () => unsubscribe();
  }, []);

  const checkResume = async () => {
    const resume = await storageService.getCurrentResume();
    setHasResume(!!resume);
    setCurrentResumeName(resume?.name || '');
  };

  const handleAuthSuccess = () => {
    // Auth state is handled by the onAuthStateChange listener
    checkResume();
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('ats');
  };

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const tabs = [
    { id: 'ats' as Tab, icon: FileText, label: 'ATS Score' },
    { id: 'match' as Tab, icon: Target, label: 'Job Match' },
  // Roadmap tab removed
    { id: 'history' as Tab, icon: History, label: 'Best Candidates' },
    { id: 'assistant' as Tab, icon: MessageSquare, label: 'Assistant' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
          <h1 className="text-xl font-bold text-gray-900">Smart Resume Analyzer</h1>
              <p className="text-xs text-gray-600">Hi, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Show current resume name if available */}
            {hasResume && currentResumeName && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold max-w-xs truncate" title={currentResumeName}>
                <FileText className="w-4 h-4 text-emerald-500" />
                <span className="truncate max-w-[120px]">{currentResumeName}</span>
              </div>
            )}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              aria-label={hasResume ? 'Change Resume' : 'Upload Resume'}
            >
              <Upload className="w-4 h-4" />
              {/* Desktop: show text, Mobile: icon only */}
              <span className="hidden sm:inline">{hasResume ? 'Change Resume' : 'Upload Resume'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pb-20">
        {activeTab === 'ats' && <ATSScore hasResume={hasResume} />}
        {activeTab === 'match' && <JobMatch hasResume={hasResume} />}
  {/* Roadmap tab removed */}
  {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'assistant' && <AIAssistant hasResume={hasResume} />}
      </main>

      <ResumeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={checkResume}
      />

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 py-3 px-4 transition-all ${
                    isActive
                      ? 'text-emerald-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className="text-xs font-medium">{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-600 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default App;
