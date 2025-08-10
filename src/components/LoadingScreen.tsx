import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        {/* Rotating Lunaris Fragment */}
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="w-16 h-16 border-2 border-red-400 border-b-transparent rounded-full animate-spin absolute top-4 left-1/2 transform -translate-x-1/2"></div>
          <div className="w-8 h-8 bg-blue-400 rounded-full absolute top-8 left-1/2 transform -translate-x-1/2 animate-pulse"></div>
        </div>
        
        {/* Loading text with glow effect */}
        <div className="text-xl font-orbitron text-blue-300 animate-pulse">
          Entering the Silent Prison...
        </div>
        
        {/* Progress dots */}
        <div className="flex justify-center mt-6 space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
      </div>
      
      {/* Background stars effect */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white opacity-20 rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;