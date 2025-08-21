import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Archive, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  Calendar,
  Activity,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoreEntry, SiteStats } from '../types/auth';
import { 
  Chapter, 
  fetchChapters, 
  addChapter, 
  updateChapter, 
  deleteChapter,
  migrateFromLocalStorage 
} from '../utils/chaptersStorage';
import { fetchSiteStats, fetchRecentActivity } from '../api/stats';
import { apiFetchLoreEntries, apiAddLoreEntry, apiDeleteLoreEntry, apiUpdateLoreEntry } from '../api/lore-entries';
import { safeLocalStorage } from '../utils/apiUtils';
import CharacterAdmin from './CharacterAdmin';
import MapAdmin from './MapAdmin';
import TimelineAdmin from './TimelineAdmin';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>([]);
  const [stats, setStats] = useState<SiteStats>({
    totalViews: 0,
    dailyViews: 0,
    totalUsers: 0,
    totalChapters: 0,
    totalLore: 0,
    memberCount: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [showLoreForm, setShowLoreForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingLore, setEditingLore] = useState<LoreEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoadingLore, setIsLoadingLore] = useState(true);


  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingStats(true);
        setIsLoadingLore(true);
        
        // Migrate from localStorage if needed
        await migrateFromLocalStorage();
        
        // Load chapters from JSON file
        const loadedChapters = await fetchChapters();
        setChapters(loadedChapters);
        
        // Load lore entries from API (with localStorage fallback)
        const loreData = await apiFetchLoreEntries();
        setLoreEntries(loreData);
        setIsLoadingLore(false);
        
        // Fetch live site statistics
        const liveStats = await fetchSiteStats();
        setStats(liveStats);
        
        // Fetch recent activity
        const activities = await fetchRecentActivity();
        setRecentActivity(activities);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load some data. Using cached data where available.');
        
        // Fallback to basic stats if live data fails
        const loadedChapters = await fetchChapters().catch(() => []);
        const fallbackLore = safeLocalStorage.getItem('loreEntries', []);
        setLoreEntries(fallbackLore);
        setIsLoadingLore(false);
        setStats(prev => ({
          ...prev,
          totalChapters: loadedChapters.length,
          totalLore: fallbackLore.length
        }));
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    loadData();
  }, []);

  // Remove old saveChapters function - now handled by storage utils



  const handleChapterSubmit = async (chapterData: Partial<Chapter>) => {
    try {
      setError(null);
      if (editingChapter) {
        // Update existing chapter
        const updatedChapter = await updateChapter(editingChapter.id, chapterData);
        if (updatedChapter) {
          const updatedChapters = chapters.map(ch => 
            ch.id === editingChapter.id ? updatedChapter : ch
          );
          setChapters(updatedChapters);
          setStats(prev => ({ ...prev, totalChapters: updatedChapters.length }));
          setSuccess('Chapter updated successfully!');
        }
        setEditingChapter(null);
      } else {
        // Add new chapter
        const newChapter = await addChapter({
          title: chapterData.title || '',
          volume: chapterData.volume || '',
          content: chapterData.content || '',
          isPublished: chapterData.isPublished || false,
          memberOnly: chapterData.memberOnly || false
        });
        const updatedChapters = [...chapters, newChapter];
        setChapters(updatedChapters);
        setStats(prev => ({ ...prev, totalChapters: updatedChapters.length }));
        setSuccess('Chapter created successfully!');
      }
      setShowChapterForm(false);
    } catch (error) {
      console.error('Error saving chapter:', error);
      setError('Failed to save chapter. Please try again.');
    }
  };

  const handleLoreSubmit = async (loreData: Partial<LoreEntry>) => {
    try {
      setError(null);
      const newLore = await apiAddLoreEntry({
        ...loreData,
        tags: Array.isArray(loreData.tags) ? loreData.tags : (loreData.tags || '').split(',').map((t: string) => t.trim()).filter((t: string) => t),
        publishDate: new Date().toISOString(),
        isPublished: loreData.isPublished || false
      });
      setLoreEntries(prev => [...prev, newLore]);
      setShowLoreForm(false);
      setSuccess('Lore entry created successfully!');
      
      // Refresh stats
      try {
        const updatedStats = await fetchSiteStats();
        setStats(updatedStats);
      } catch (error) {
        console.error('Error refreshing stats:', error);
      }
    } catch (error) {
      console.error('Error saving lore entry:', error);
      setError('Failed to save lore entry. Please try again.');
    }
  };

  const handleLoreEdit = async (loreData: Partial<LoreEntry>) => {
    if (!editingLore) return;
    try {
      setError(null);
      const updatedLore = await apiUpdateLoreEntry(editingLore.id, {
        ...loreData,
        tags: Array.isArray(loreData.tags) ? loreData.tags : (loreData.tags || '').split(',').map((t: string) => t.trim()).filter((t: string) => t),
      });
      setLoreEntries(prev => prev.map(entry => entry.id === editingLore.id ? updatedLore : entry));
      setEditingLore(null);
      setShowLoreForm(false);
      setSuccess('Lore entry updated successfully!');
    } catch (error) {
      console.error('Error updating lore entry:', error);
      setError('Failed to update lore entry. Please try again.');
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      try {
        setError(null);
        const success = await deleteChapter(id);
        if (success) {
          const updatedChapters = chapters.filter(chapter => chapter.id !== id);
          setChapters(updatedChapters);
          setStats(prev => ({
            ...prev,
            totalChapters: updatedChapters.length
          }));
          setSuccess('Chapter deleted successfully!');
        } else {
          setError('Chapter not found or could not be deleted.');
        }
      } catch (error) {
        console.error('Error deleting chapter:', error);
        setError('Failed to delete chapter. Please try again.');
      }
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setShowChapterForm(true);
  };

  const deleteLore = async (id: string) => {
    try {
      setError(null);
      const success = await apiDeleteLoreEntry(id);
      if (success) {
        setLoreEntries(prev => prev.filter(entry => entry.id !== id));
        setSuccess('Lore entry deleted successfully!');
        
        // Refresh stats
        try {
          const updatedStats = await fetchSiteStats();
          setStats(updatedStats);
        } catch (error) {
          console.error('Error refreshing stats:', error);
        }
      } else {
        setError('Failed to delete lore entry.');
      }
    } catch (error) {
      console.error('Error deleting lore entry:', error);
      setError('Failed to delete lore entry. Please try again.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 lg:ml-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-orbitron font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  // Add new tabs for Characters, Map, Timeline
  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'chapters', name: 'Chapters', icon: BookOpen },
    { id: 'lore', name: 'Lore', icon: Archive },
    { id: 'characters', name: 'Characters', icon: Users },
    { id: 'map', name: 'Map', icon: Archive },
    { id: 'timeline', name: 'Timeline', icon: Calendar },
    { id: 'users', name: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 lg:ml-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-[4.5rem] pb-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="font-orbitron text-2xl md:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Welcome back, {user?.username}</p>
        </div>

        {/* Error/Success Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg flex items-center space-x-2">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-200">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500 rounded-lg flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-green-200">{success}</span>
            <button 
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-400 hover:text-green-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap gap-1 mb-6 md:mb-8 bg-gray-800 p-1 rounded-lg overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-sm sm:text-base">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Views</p>
                    {isLoadingStats ? (
                      <div className="text-3xl font-bold text-blue-400 animate-pulse">Loading...</div>
                    ) : (
                      <p className="text-3xl font-bold text-blue-400">{stats.totalViews.toLocaleString()}</p>
                    )}
                  </div>
                  <Eye className="text-blue-400" size={32} />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Daily Views</p>
                    {isLoadingStats ? (
                      <div className="text-3xl font-bold text-green-400 animate-pulse">Loading...</div>
                    ) : (
                      <p className="text-3xl font-bold text-green-400">{stats.dailyViews.toLocaleString()}</p>
                    )}
                  </div>
                  <TrendingUp className="text-green-400" size={32} />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    {isLoadingStats ? (
                      <div className="text-3xl font-bold text-purple-400 animate-pulse">Loading...</div>
                    ) : (
                      <p className="text-3xl font-bold text-purple-400">{stats.totalUsers.toLocaleString()}</p>
                    )}
                  </div>
                  <Users className="text-purple-400" size={32} />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Chapters</p>
                    <p className="text-3xl font-bold text-yellow-400">{stats.totalChapters}</p>
                  </div>
                  <BookOpen className="text-yellow-400" size={32} />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Lore Entries</p>
                    <p className="text-3xl font-bold text-red-400">{stats.totalLore}</p>
                  </div>
                  <Archive className="text-red-400" size={32} />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Members</p>
                    {isLoadingStats ? (
                      <div className="text-3xl font-bold text-indigo-400 animate-pulse">Loading...</div>
                    ) : (
                      <p className="text-3xl font-bold text-indigo-400">{stats.memberCount.toLocaleString()}</p>
                    )}
                  </div>
                  <Activity className="text-indigo-400" size={32} />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="font-orbitron text-xl font-bold mb-4 text-blue-300">Recent Activity</h3>
              <div className="space-y-3">
                {isLoadingStats ? (
                  <div className="space-y-3">
                    <div className="animate-pulse flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-600 rounded flex-1"></div>
                      <div className="h-3 bg-gray-600 rounded w-16"></div>
                    </div>
                    <div className="animate-pulse flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-600 rounded flex-1"></div>
                      <div className="h-3 bg-gray-600 rounded w-16"></div>
                    </div>
                    <div className="animate-pulse flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-600 rounded flex-1"></div>
                      <div className="h-3 bg-gray-600 rounded w-16"></div>
                    </div>
                  </div>
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => {
                    const IconComponent = activity.icon === 'calendar' ? Calendar : 
                                        activity.icon === 'users' ? Users : Archive;
                    const iconColor = activity.icon === 'calendar' ? 'text-blue-400' : 
                                    activity.icon === 'users' ? 'text-green-400' : 'text-purple-400';
                    
                    return (
                      <div key={index} className="flex items-center space-x-3 text-gray-300">
                        <IconComponent size={16} className={iconColor} />
                        <span>{activity.message}</span>
                        <span className="text-gray-500 text-sm">{activity.time}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-400 text-center py-4">
                    No recent activity to display
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chapters' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="font-orbitron text-xl sm:text-2xl font-bold text-blue-300">Chapter Management</h2>
              <button
                onClick={() => setShowChapterForm(true)}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="text-sm sm:text-base">Add Chapter</span>
              </button>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left p-2 sm:p-4 font-orbitron text-sm sm:text-base">Title</th>
                      <th className="text-left p-2 sm:p-4 font-orbitron text-sm sm:text-base hidden sm:table-cell">Volume</th>
                      <th className="text-left p-2 sm:p-4 font-orbitron text-sm sm:text-base">Status</th>
                      <th className="text-left p-2 sm:p-4 font-orbitron text-sm sm:text-base hidden md:table-cell">Views</th>
                      <th className="text-left p-2 sm:p-4 font-orbitron text-sm sm:text-base">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapters.map(chapter => (
                      <tr key={chapter.id} className="border-t border-gray-700">
                        <td className="p-2 sm:p-4">
                          <div>
                            <p className="font-semibold text-blue-300 text-sm sm:text-base">{chapter.title}</p>
                            <div className="sm:hidden text-xs text-gray-400 mt-1">
                              {chapter.volume && <span>Vol: {chapter.volume}</span>}
                              {chapter.volume && <span className="mx-2">•</span>}
                              <span>Views: {chapter.views}</span>
                            </div>

                            {chapter.memberOnly && (
                              <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded-full mt-1 inline-block">
                                Member Only
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 text-gray-400 text-sm hidden sm:table-cell">{chapter.volume}</td>
                        <td className="p-2 sm:p-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            chapter.isPublished 
                              ? 'bg-green-600 text-green-100' 
                              : 'bg-gray-600 text-gray-100'
                          }`}>
                            {chapter.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="p-2 sm:p-4 text-gray-400 text-sm hidden md:table-cell">{chapter.views}</td>
                        <td className="p-2 sm:p-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditChapter(chapter)}
                              className="p-1 text-blue-400 hover:text-blue-300"
                              title="Edit Chapter"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteChapter(chapter.id)}
                              className="p-1 text-red-400 hover:text-red-300"
                              title="Delete Chapter"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lore' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-orbitron text-2xl font-bold text-blue-300">Lore Management</h2>
              <button
                onClick={() => setShowLoreForm(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={18} />
                <span>Add Lore Entry</span>
              </button>
            </div>

            <div className="grid gap-6">
              {isLoadingLore ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="h-6 bg-gray-600 rounded w-48 mb-2"></div>
                          <div className="h-4 bg-gray-600 rounded w-24"></div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-8 h-8 bg-gray-600 rounded"></div>
                          <div className="w-8 h-8 bg-gray-600 rounded"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-600 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-600 rounded w-3/4 mb-4"></div>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <div className="h-6 bg-gray-600 rounded w-16"></div>
                          <div className="h-6 bg-gray-600 rounded w-20"></div>
                        </div>
                        <div className="h-6 bg-gray-600 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : loreEntries.length > 0 ? (
                loreEntries.map(entry => (
                  <div key={entry.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-orbitron text-xl font-bold text-blue-300">{entry.title}</h3>
                        <p className="text-gray-400 text-sm">{entry.category}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingLore(entry);
                            setShowLoreForm(true);
                          }}
                          className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteLore(entry.id)}
                          className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">{entry.summary}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        entry.isPublished 
                          ? 'bg-green-600 text-green-100' 
                          : 'bg-gray-600 text-gray-100'
                      }`}>
                        {entry.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                  <p className="text-gray-400">No lore entries found. Create your first entry to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'characters' && (
          <CharacterAdmin />
        )}

        {activeTab === 'map' && (
          <MapAdmin />
        )}

        {activeTab === 'timeline' && (
          <TimelineAdmin />
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="font-orbitron text-2xl font-bold text-blue-300">User Management</h2>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <p className="text-gray-400">User management features coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {/* Chapter Form Modal */}
      {showChapterForm && (
        <ChapterForm
          chapter={editingChapter}
          onSubmit={handleChapterSubmit}
          onClose={() => {
            setShowChapterForm(false);
            setEditingChapter(null);
          }}
        />
      )}

      {/* Lore Form Modal */}
      {showLoreForm && (
        <LoreForm
          loreEntry={editingLore}
          onSubmit={editingLore ? handleLoreEdit : handleLoreSubmit}
          onClose={() => {
            setShowLoreForm(false);
            setEditingLore(null);
          }}
        />
      )}
    </div>
  );
};



// Chapter Form Component
const ChapterForm: React.FC<{
  chapter: Chapter | null;
  onSubmit: (data: Partial<Chapter>) => void;
  onClose: () => void;
}> = ({ chapter, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: chapter?.title || '',
    volume: chapter?.volume || '',
    content: chapter?.content || '',
    isPublished: chapter?.isPublished || false,
    memberOnly: chapter?.memberOnly || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="font-orbitron text-2xl font-bold text-blue-300">
            {chapter ? 'Edit Chapter' : 'Add New Chapter'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Volume</label>
              <input
                type="text"
                value={formData.volume}
                onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 h-64"
              placeholder="Chapter content"
            />
          </div>



          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-300">Published</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.memberOnly}
                onChange={(e) => setFormData(prev => ({ ...prev, memberOnly: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-300">Member Only</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
            >
              <Save size={18} />
              <span>{chapter ? 'Update' : 'Create'} Chapter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Lore Form Component
const LoreForm: React.FC<{
  loreEntry: LoreEntry | null;
  onSubmit: (data: Partial<LoreEntry>) => void;
  onClose: () => void;
}> = ({ loreEntry, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: loreEntry?.title || '',
    category: loreEntry?.category || '',
    summary: loreEntry?.summary || '',
    content: loreEntry?.content || '',
    tags: loreEntry?.tags?.join(', ') || '',
    isPublished: loreEntry?.isPublished || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="font-orbitron text-2xl font-bold text-blue-300">
            {loreEntry ? 'Edit Lore Entry' : 'Add New Lore Entry'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select Category</option>
                <option value="factions">Factions</option>
                <option value="powers">Power Systems</option>
                <option value="continents">Continents</option>
                <option value="events">Historical Events</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Summary</label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 h-64"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="mysterious, powerful, antagonists"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-300">Published</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
            >
              <Save size={18} />
              <span>{loreEntry ? 'Update' : 'Create'} Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;