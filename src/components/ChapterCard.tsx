import React from 'react';
import { Book, ArrowRight, Clock } from 'lucide-react';

interface Chapter {
  id: string | number;
  title: string;
  volume: string;
  content: string;
  pdfFile?: string;
  createdAt?: string;
  updatedAt?: string;
  isNew?: boolean;
}

interface ChapterCardProps {
  chapter: Chapter;
  onClick: (id: string | number) => void;
}

const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, onClick }) => {
  const chapterNumber = chapter.title.split(':')[0].match(/\d+/)?.[0] || '';
  const chapterTitle = chapter.title.split(':')[1]?.trim() || chapter.title;
  
  return (
    <div 
      onClick={() => onClick(chapter.id)}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 
                transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 
                group hover:-translate-y-1"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/10 rounded-lg p-2">
                <Book className="h-5 w-5 text-blue-400 flex-shrink-0" />
              </div>
              <div>
                <span className="text-sm font-medium text-blue-400 block">
                  Chapter {chapterNumber}
                </span>
                {chapter.updatedAt && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">
                      {new Date(chapter.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              {chapter.isNew && (
                <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-full">
                  New
                </span>
              )}
              {chapter.pdfFile && (
                <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded-full">
                  PDF
                </span>
              )}
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors line-clamp-2">
            {chapterTitle}
          </h3>
          <div className="h-1 w-full bg-gray-700/30 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-blue-500/50 group-hover:w-full transition-all duration-500"></div>
          </div>
        </div>
        <div className="ml-4">
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default ChapterCard;
