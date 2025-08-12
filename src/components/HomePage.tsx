import React from 'react';
import { Play, BookOpen, Zap, Users, Map } from 'lucide-react';

interface HomePageProps {
  onNavigate: (section: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Section with Video Background Simulation */}
      <section className="relative min-h-screen flex items-center justify-center w-full">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-gray-900 to-red-900/30 w-full"></div>
          <div className="absolute inset-0 opacity-20">
            {/* Simulated video background with animated elements */}
            <div className="w-full h-full relative overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-red-500/20 rounded-full animate-bounce"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-blue-400/30 rounded-full animate-spin"></div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <h1 className="font-orbitron text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent">
            THE SILENT PRISON
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 italic">
            "There are no heroes and villains in this story..."
          </p>
          
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            In a world where the moon's destruction unleashed nightmares upon reality, 
            follow the journey through the Silent Prison where power comes at the ultimate cost.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => onNavigate('reader')}
              className="group flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              <BookOpen size={24} />
              <span>Start Reading</span>
              <div className="w-0 group-hover:w-6 transition-all duration-300 overflow-hidden">
                <Play size={16} className="ml-2" />
              </div>
            </button>
            
            <button
              onClick={() => onNavigate('lore')}
              className="flex items-center space-x-3 border-2 border-gray-500 hover:border-blue-400 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:bg-blue-400/10"
            >
              <Zap size={24} />
              <span>Explore the Lore</span>
            </button>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full p-1">
            <div className="w-1 h-3 bg-gray-400 rounded-full mx-auto animate-ping"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-orbitron text-4xl font-bold text-center mb-16 text-blue-300">
            Enter the World of Tenjiku
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Immersive Reading",
                description: "Experience chapters with customizable settings, progress tracking, and seamless navigation.",
                action: () => onNavigate('reader')
              },
              {
                icon: Users,
                title: "Character Codex",
                description: "Discover detailed profiles, power systems, and the complex relationships between characters.",
                action: () => onNavigate('characters')
              },
              {
                icon: Map,
                title: "Interactive Map",
                description: "Explore the continents of Tenjiku with detailed lore and hidden secrets waiting to be discovered.",
                action: () => onNavigate('map')
              }
            ].map((feature, index) => (
              <div
                key={index}
                onClick={feature.action}
                className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-blue-500/50 rounded-xl p-8 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mb-6 mx-auto group-hover:from-blue-400 group-hover:to-blue-500 transition-all duration-300">
                  <feature.icon size={32} className="text-white" />
                </div>
                <h3 className="font-orbitron text-xl font-bold text-center mb-4 text-blue-300">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-900/20 to-red-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <blockquote className="text-2xl md:text-3xl font-light text-gray-300 italic mb-8">
            "In the Silent Prison, every choice echoes through the void, 
            and every power awakened carries the weight of a thousand souls."
          </blockquote>
          <cite className="text-blue-400 font-orbitron">— The Chronicles of Tenjiku</cite>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-orbitron text-3xl font-bold mb-6 text-white">
            Ready to Escape the Silent Prison?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of readers discovering the mysteries of Tenjiku
          </p>
          <button
            onClick={() => onNavigate('reader')}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-12 py-4 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/30"
          >
            Begin Your Journey
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;