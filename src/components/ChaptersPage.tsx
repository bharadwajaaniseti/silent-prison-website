import React, { useState, useEffect } from 'react';
import { Book, ArrowRight, Search } from 'lucide-react';
import { fetchChapters } from '../utils/chaptersStorage';

interface Chapter {
  id: string | number;
  title: string;
  volume: string;
  content: string;
  pdfFile?: string;
  createdAt?: string;
  updatedAt?: string;
}

const ChaptersPage: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load chapters from backend API
  useEffect(() => {
    const loadChapters = async () => {
      try {
        setIsLoading(true);
        const loadedChapters = await fetchChapters();
        setChapters(loadedChapters);
      } catch (error) {
        console.error('Error loading chapters:', error);
        // Fallback to localStorage if backend is unavailable
        try {
          const savedChapters = localStorage.getItem('chapters');
          if (savedChapters) {
            setChapters(JSON.parse(savedChapters));
          }
        } catch (fallbackError) {
          console.error('Error loading chapters from localStorage:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadChapters();
  }, []);

  // Filter chapters based on search query
  const filteredChapters = chapters.filter(chapter => {
    const query = searchQuery.toLowerCase();
    const title = chapter.title?.toLowerCase() || '';
    const volume = chapter.volume?.toLowerCase() || '';
    return title.includes(query) || volume.includes(query);
  });

  const handleChapterClick = (chapterId: string | number) => {
    try {
      console.log('Navigating to reader with chapter:', chapterId);
      
      // Navigate directly to the reader with the chapter ID in the hash
      window.location.hash = `reader/${chapterId}`;
    } catch (error) {
      console.error('Error navigating to chapter:', error);
      // Fallback navigation
      window.location.hash = 'reader';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    if (filteredChapters.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map((chapter) => (
            <div 
              key={chapter.id}
              onClick={() => handleChapterClick(chapter.id)}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 group hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Book className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-blue-400">
                      Chapter {chapter.title.split(':')[0].match(/\d+/)?.[0] || ''}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {chapter.title.split(':')[1]?.trim() || chapter.title}
                  </h3>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
              {chapter.pdfFile && (
                <div className="mt-4 flex items-center text-xs text-gray-400">
                  <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded-full">
                    PDF
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (chapters.length > 0) {
      return (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-medium text-gray-300">No chapters found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search query</p>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <Book className="h-12 w-12 mx-auto text-gray-500 mb-4" />
        <h3 className="text-xl font-medium text-gray-300">No chapters available</h3>
        <p className="text-gray-500 mt-2">Check back later for updates</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white pt-[4.5rem] lg:ml-20">
      <div className="w-full max-w-[2000px] mx-auto px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold font-orbitron mb-2">Chapters</h1>
          <p className="text-gray-400">Browse all available chapters</p>
        </header>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search chapters..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Chapters List */}
        {renderContent()}
      </div>
    </div>
  );
};

export default ChaptersPage;
