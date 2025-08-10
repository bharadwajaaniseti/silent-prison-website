import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import MouseParticles from './components/MouseParticles';
import HomePage from './components/HomePage';
import ChapterReader from './components/ChapterReader';
import ChaptersPage from './components/ChaptersPage';
import LoreArchive from './components/LoreArchive';
import CharacterHub from './components/CharacterHub';
import InteractiveMap from './components/InteractiveMap';
import Timeline from './components/Timeline';
import LoadingScreen from './components/LoadingScreen';
import Navigation from './components/Navigation';
import AdminDashboard from './components/AdminDashboard';
import MemberPage from './components/MemberPage';
import UserSettings from './components/UserSettings';
import AuthModal from './components/AuthModal';

function App() {
  // Get initial section from URL hash or default to 'home'
  const getInitialSection = () => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  };

  const [currentSection, setCurrentSection] = useState(getInitialSection());
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const newSection = window.location.hash.replace('#', '') || 'home';
      if (newSection !== currentSection) {
        setCurrentSection(newSection);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentSection]);

  // Simulate loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderCurrentSection = () => {
    // Handle reader routes with chapter IDs
    if (currentSection.startsWith('reader')) {
      return <ChapterReader />;
    }
    
    switch (currentSection) {
      case 'home':
        return <HomePage onNavigate={(section) => window.location.hash = section} />;
      case 'chapters':
        return <ChaptersPage />;
      case 'lore':
        return <LoreArchive />;
      case 'characters':
        return <CharacterHub />;
      case 'map':
        return <InteractiveMap />;
      case 'timeline':
        return <Timeline />;
      case 'admin':
        return <AdminDashboard />;
      case 'member':
        return <MemberPage />;
      case 'settings':
        return <UserSettings />;
      default:
        window.location.hash = 'home';
        return null;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-inter overflow-x-hidden">
        <Navigation 
          currentSection={currentSection}
          onNavigate={(section) => window.location.hash = section}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onAuthModalOpen={() => setAuthModalOpen(true)}
        />
        
        <main className="relative">
          {renderCurrentSection()}
        </main>

        {/* Mouse Particles */}
        <MouseParticles />

        {/* Auth Modal */}
        <AuthModal 
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />

        {/* Floating particles effect */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 opacity-30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;