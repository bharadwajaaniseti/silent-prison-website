import React from 'react';
import { Crown, BookOpen, Users, Eye, ArrowRight, MessageCircle, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MemberPage: React.FC = () => {
  const { user } = useAuth();

  const memberFeatures = [
    {
      icon: BookOpen,
      title: 'Exclusive Chapters',
      description: 'Read special chapters and side stories only available to members.',
      action: 'Read Now',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Users,
      title: 'Member Community',
      description: 'Join discussions with other members and the author.',
      action: 'Join Discussions',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Eye,
      title: 'Behind the Scenes',
      description: 'Exclusive insights into the world-building and writing process.',
      action: 'Explore',
      color: 'from-green-500 to-green-600'
    }
  ];

  const memberBenefits = [
    'Early access to new chapters',
    'Exclusive content and side stories',
    'Behind-the-scenes material',
    'Member-only community access'
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 lg:ml-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-xl">
              <Crown size={48} className="text-white" />
            </div>
          </div>
          <h1 className="font-orbitron text-4xl font-bold mb-4 text-yellow-400">
            Exclusive Member Content
          </h1>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-8 mb-12 border border-yellow-500/30">
          <h2 className="font-orbitron text-2xl font-bold text-yellow-400 mb-4">
            Welcome, Valued Member!
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            Thank you for being a part of our community. Here you'll find exclusive content, early access to chapters, behind-the-scenes material, 
            and special features not available to regular visitors.
          </p>
          <div className="flex items-center space-x-2 text-yellow-400">
            <Crown size={20} />
            <span className="font-semibold">Your membership supports the continued development of The Silent Prison</span>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {memberFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-yellow-500/50 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 mx-auto`}>
                <feature.icon size={32} className="text-white" />
              </div>
              <h3 className="font-orbitron text-xl font-bold text-center mb-4 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-center mb-6 leading-relaxed">
                {feature.description}
              </p>
              <button className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 px-6 py-3 rounded-lg font-semibold transition-all duration-300">
                <span>{feature.action}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Member Benefits */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Crown className="text-yellow-400" size={24} />
            <h3 className="font-orbitron text-2xl font-bold text-yellow-400">Member Benefits</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {memberBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Crown size={12} className="text-white" />
                  </div>
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h4 className="font-orbitron font-bold text-yellow-400 mb-3">Member Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Member Since:</span>
                  <span className="text-white">{new Date(user?.joinDate || '').toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-yellow-400 font-semibold">Premium Member</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Exclusive Chapters Read:</span>
                  <span className="text-white">12</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center space-x-3 mb-4">
              <MessageCircle className="text-blue-400" size={24} />
              <h3 className="font-orbitron text-xl font-bold text-blue-400">Community Hub</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Connect with other members and participate in exclusive discussions about the story.
            </p>
            <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-semibold">
              <span>Join Community</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="text-purple-400" size={24} />
              <h3 className="font-orbitron text-xl font-bold text-purple-400">Author's Notes</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Get insights into the writing process and upcoming story developments.
            </p>
            <button className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 font-semibold">
              <span>Read Notes</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberPage;