import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Settings, Sun, Moon, Bookmark, X, Menu } from 'lucide-react';
import { Chapter, fetchChapters } from '../utils/chaptersStorage';

type ChapterNavigation = 'prev' | 'next';

interface ChapterReaderProps {
  isAdmin?: boolean;
}

/** ---------- Pagination (text only) ---------- */
const getPaginatedContent = (content: string, targetCharsPerPage: number) => {
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  const paragraphs = normalized.split('\n\n').map(p => p.trim()).filter(Boolean);
  const pages: string[] = [];
  let currentPage = '';
  let currentPageLength = 0;
  const tolerance = 0.15;
  const maxPageLength = targetCharsPerPage * (1 + tolerance);

  for (const paragraph of paragraphs) {
    const paragraphWithBreaks = paragraph + '\n\n';
    const paragraphLength = paragraphWithBreaks.length;

    // If adding this paragraph would exceed the max page length, start a new page
    if (currentPageLength > 0 && currentPageLength + paragraphLength > maxPageLength) {
      pages.push(currentPage.trim());
      currentPage = '';
      currentPageLength = 0;
    }

    // If the paragraph is too long for a single page, split it by sentences
    if (paragraphLength > maxPageLength) {
      const sentences = paragraph
        .replace(/([.!?])\s+/g, '$1|')
        .split('|')
        .map(s => s.trim())
        .filter(Boolean);

      let currentSentenceGroup = '';

      for (const sentence of sentences) {
        const sentenceWithPunctuation = sentence.match(/[.!?]$/) ? sentence : sentence + '.';
        const sentenceLength = sentenceWithPunctuation.length + 1; // +1 for space

        if (currentSentenceGroup && (currentSentenceGroup.length + sentenceLength) > maxPageLength) {
          if (currentPageLength > 0 && (currentPageLength + currentSentenceGroup.length + 2) > maxPageLength) {
            pages.push(currentPage.trim());
            currentPage = currentSentenceGroup + '\n\n';
            currentPageLength = currentSentenceGroup.length + 2;
          } else {
            currentPage += currentSentenceGroup + '\n\n';
            currentPageLength += currentSentenceGroup.length + 2;
          }
          currentSentenceGroup = '';
        }

        currentSentenceGroup += (currentSentenceGroup ? ' ' : '') + sentenceWithPunctuation;
      }

      // Add remaining sentence group
      if (currentSentenceGroup) {
        if (currentPageLength > 0 && (currentPageLength + currentSentenceGroup.length + 2) > maxPageLength) {
          pages.push(currentPage.trim());
          currentPage = currentSentenceGroup + '\n\n';
          currentPageLength = currentSentenceGroup.length + 2;
        } else {
          currentPage += currentSentenceGroup + '\n\n';
          currentPageLength += currentSentenceGroup.length + 2;
        }
      }
    } else {
      currentPage += paragraph + '\n\n';
      currentPageLength += paragraphLength;
    }
  }

  if (currentPage.trim()) pages.push(currentPage.trim());

  return {
    pages: pages.length ? pages : [''],
    totalPages: pages.length || 1,
  };
};

/** ---------- Small helpers ---------- */
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** ---------- Component ---------- */
const ChapterReader: React.FC<ChapterReaderProps> = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('reader:darkMode') === 'true' || true;
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('reader:fontSize') || '16', 10);
  });
  const [pageContent, setPageContent] = useState<string>('');
  const [pageCache, setPageCache] = useState<Record<string, { pages: string[]; totalPages: number }>>({});

  const currentChapterData = chapters.find(ch => ch.id === currentChapter) || chapters[0] || {
    id: '1',
    title: 'No Chapter Found',
    content: 'No chapters available.',
    isPublished: false,
    memberOnly: false,
    createdAt: '',
    updatedAt: '',
    volume: ''
  };

  /** Parse chapter ID from hash */
  const applyFromHash = useCallback(() => {
    const hash = window.location.hash || '';

    const chapterMatch = hash.match(/reader\/chapter-(.+)/);
    if (chapterMatch) {
      const id = `chapter-${chapterMatch[1]}`;
      if (chapters.some(ch => ch.id === id) && id !== currentChapter) {
        setCurrentChapter(id);
      }
      return;
    }

    const idMatch = hash.match(/reader\/(.+)/);
    if (idMatch) {
      const id = idMatch[1];
      if (chapters.some(ch => ch.id === id) && id !== currentChapter) {
        setCurrentChapter(id);
      }
      return;
    }

    const qs = hash.split('?')[1];
    if (qs) {
      const params = new URLSearchParams(qs);
      const chapterId = params.get('chapter');
      if (chapterId && chapters.some(ch => ch.id === chapterId) && chapterId !== currentChapter) {
        setCurrentChapter(chapterId);
      }
    }

    if (chapters.length > 0 && !currentChapter) {
      setCurrentChapter(chapters[0].id);
    }
  }, [chapters, currentChapter]);

  /** Navigation handlers */
  const navigateHash = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  const navigateChapter = useCallback((direction: ChapterNavigation) => {
    const currentIndex = chapters.findIndex(ch => ch.id === currentChapter);
    if (direction === 'prev' && currentIndex > 0) {
      const newChapterId = chapters[currentIndex - 1].id;
      setCurrentChapter(newChapterId);
      setCurrentPage(1);
      navigateHash(`#reader/${newChapterId}`);
    } else if (direction === 'next' && currentIndex >= 0 && currentIndex < chapters.length - 1) {
      const newChapterId = chapters[currentIndex + 1].id;
      setCurrentChapter(newChapterId);
      setCurrentPage(1);
      navigateHash(`#reader/${newChapterId}`);
    }
  }, [chapters, currentChapter, navigateHash]);

  const navigatePage = useCallback((page: number) => {
    setCurrentPage(prevPage => {
      const newPage = clamp(page, 1, totalPages);
      if (newPage !== prevPage) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return newPage;
    });
  }, [totalPages]);

  /** Load chapter content (cached) */
  const loadChapterContent = useCallback(() => {
    if (!currentChapterData) return;
    const cached = pageCache[currentChapterData.id];
    if (cached) {
      const total = cached.totalPages || (cached.pages?.length ?? 1);
      setTotalPages(total);
      setPageContent(cached.pages[clamp(currentPage - 1, 0, total - 1)] || '');
      return;
    }
    const { pages, totalPages: total } = getPaginatedContent(currentChapterData.content, 3000);
    setPageCache(prev => ({
      ...prev,
      [currentChapterData.id]: { pages, totalPages: total }
    }));
    setTotalPages(total);
    setPageContent(pages[clamp(currentPage - 1, 0, total - 1)] || '');
  }, [currentChapterData, currentPage, pageCache]);

  /** Render content paragraphs */
  const renderText = useCallback((text: string) => {
    if (!text) return <p className="text-gray-400">No content available for this page.</p>;
    const paragraphs = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);
    return (
      <article
        className="max-w-none"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: '1.8',
          color: isDarkMode ? '#e5e7eb' : '#1f2937',
        }}
      >
        {paragraphs.map((paragraph, idx) => {
          const lines = paragraph.split('\n').map(l => l.trim()).filter(Boolean);
          return (
            <div key={idx} className="mb-6 last:mb-0">
              {lines.map((line, li) => (
                <p
                  key={li}
                  className={li > 0 ? 'mt-4' : ''}
                  style={{
                    textIndent: li === 0 ? '1.5em' : '0',
                    textAlign: 'justify',
                    textJustify: 'inter-word',
                    hyphens: 'auto',
                  }}
                >
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
          );
        })}
      </article>
    );
  }, [fontSize, isDarkMode]);

  /** Toggles */
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);
  const handleFontSizeChange = useCallback((size: number) => {
    setFontSize(clamp(size, 12, 24));
  }, []);

  /** Effects */
  useEffect(() => {
    const loadChapters = async () => {
      try {
        setIsLoading(true);
        const loadedChapters = await fetchChapters();
        setChapters(loadedChapters);
        if (loadedChapters.length > 0 && !loadedChapters.some(ch => ch.id === currentChapter)) {
          setCurrentChapter(loadedChapters[0].id);
        }
      } catch (error) {
        console.error('Error loading chapters:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadChapters();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    loadChapterContent();
  }, [currentChapter, currentPage, loadChapterContent]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === 'ArrowLeft') {
        if (currentPage > 1) {
          e.preventDefault();
          navigatePage(currentPage - 1);
        } else {
          navigateChapter('prev');
        }
      } else if (e.key === 'ArrowRight') {
        if (currentPage < totalPages) {
          e.preventDefault();
          navigatePage(currentPage + 1);
        } else {
          navigateChapter('next');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentPage, totalPages, navigateChapter, navigatePage]);

  useEffect(() => {
    if (chapters.length > 0) {
      applyFromHash();
    }
    const handleHashChange = () => {
      if (chapters.length > 0) {
        applyFromHash();
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [applyFromHash, chapters.length]);

  /** UI */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-lg">Loading chapter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-[4.5rem] ${
      isDarkMode ? 'text-gray-100' : 'text-gray-900'
    }`}>
      {/* Fixed Header */}
      <header className={`fixed top-0 left-0 lg:left-20 right-0 z-50 backdrop-blur-md border-b h-[4.5rem] ${
        isDarkMode ? 'border-gray-700/50 bg-gray-900/80' : 'border-gray-200/50 bg-white/80'
      } shadow-lg w-full lg:w-[calc(100%-80px)]`}>
        <div className="h-full container mx-auto px-3 md:px-4 lg:px-6">
          <div className="h-full flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Navigation Menu Button - visible on tablet/mobile when sidebar is hidden */}
              <button
                onClick={() => window.location.hash = '#chapters'}
                className={`lg:hidden p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Back to Chapters"
              >
                <Menu size={18} />
              </button>
              
              <div className="flex flex-col justify-center">
              <h1 className="text-lg md:text-xl font-bold tracking-tight truncate">{currentChapterData.title}</h1>
              
              {/* Chapter Navigation under title */}
              <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4 mt-1">
                <button
                  onClick={() => navigateChapter('prev')}
                  disabled={chapters.findIndex(c => c.id === currentChapter) <= 0}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                    chapters.findIndex(c => c.id === currentChapter) <= 0
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <ArrowLeft size={12} />
                  <span className="hidden md:inline">Previous</span>
                  <span className="md:hidden">Prev</span>
                </button>
                
                <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} whitespace-nowrap`}>
                  Chapter {Math.max(1, chapters.findIndex(c => c.id === currentChapter) + 1)} of {chapters.length}
                </p>
                
                <button
                  onClick={() => navigateChapter('next')}
                  disabled={chapters.findIndex(c => c.id === currentChapter) >= chapters.length - 1}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                    chapters.findIndex(c => c.id === currentChapter) >= chapters.length - 1
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <span className="hidden md:inline">Next</span>
                  <span className="md:hidden">Next</span>
                  <ArrowRight size={12} />
                </button>
              </div>
              </div>
            </div>
            
            <div className="flex items-center h-full space-x-1 md:space-x-1.5 lg:space-x-2">
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2 lg:p-3 rounded-lg transition-all duration-200 ${
                  isBookmarked 
                    ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-400/10' 
                    : isDarkMode 
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Bookmark size={16} className="lg:w-5 lg:h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 lg:p-3 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings size={16} className="lg:w-5 lg:h-5" />
              </button>
              
              <button
                onClick={toggleDarkMode}
                className={`p-2 lg:p-3 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {isDarkMode ? <Sun size={16} className="lg:w-5 lg:h-5" /> : <Moon size={16} className="lg:w-5 lg:h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className={`rounded-2xl p-8 md:p-12 shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800/50 border border-gray-700/30' 
              : 'bg-white/80 border border-gray-200/30'
          } backdrop-blur-sm`}>
            
            {/* Chapter content */}
            <div className="prose prose-lg max-w-none" style={{ fontSize: `${fontSize}px` }}>
              {renderText(pageContent)}
            </div>
            
            {/* Reading Progress Bar */}
            <div className="mt-8 mb-6">
              <div className={`w-full h-1 rounded-full ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'
              }`}>
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: `${totalPages > 0 ? (currentPage / totalPages) * 100 : 0}%` 
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Progress
                </span>
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0}%
                </span>
              </div>
            </div>
            
            {/* Page Navigation */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-12 pt-8 border-t border-gray-300/20">
                <button
                  onClick={() => navigatePage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage <= 1
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>
                
                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => navigatePage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage >= totalPages
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`relative rounded-2xl max-w-md w-full shadow-2xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700/50' : 'bg-white border border-gray-200/50'
          } backdrop-blur-md`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Reader Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-3">Font Size</label>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => handleFontSizeChange(fontSize - 2)}
                      className={`w-10 h-10 rounded-lg font-bold transition-all duration-200 ${
                        isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                      }`}
                    >
                      −
                    </button>
                    <div className={`px-4 py-2 rounded-lg min-w-[4rem] text-center font-mono font-bold ${
                      isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {fontSize}px
                    </div>
                    <button
                      onClick={() => handleFontSizeChange(fontSize + 2)}
                      className={`w-10 h-10 rounded-lg font-bold transition-all duration-200 ${
                        isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-3">Theme</label>
                  <button
                    onClick={toggleDarkMode}
                    className={`w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 shadow-lg'
                        : 'bg-gray-800 hover:bg-gray-700 text-white shadow-lg'
                    }`}
                  >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterReader;
