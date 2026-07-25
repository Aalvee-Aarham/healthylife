import React, { useState } from 'react';
import { SocialPost, Challenge } from '../../types';
import { 
  Users, 
  Trophy, 
  Flame, 
  Heart, 
  MessageSquare, 
  Share2, 
  Plus, 
  Check, 
  Sparkles, 
  Award,
  SlidersHorizontal
} from 'lucide-react';

interface CommunityViewProps {
  posts: SocialPost[];
  challenges: Challenge[];
  onToggleLike: (postId: string) => void;
  onJoinChallenge: (challengeId: string) => void;
  onAddPost: (content: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  posts,
  challenges,
  onToggleLike,
  onJoinChallenge,
  onAddPost
}) => {
  const [newPostContent, setNewPostContent] = useState('');
  const [transformationSlider, setTransformationSlider] = useState(50);
  const [leaderboardTab, setLeaderboardTab] = useState<'friends' | 'global'>('friends');

  const leaderboards = {
    friends: [
      { rank: 1, name: 'Elena Rostova', points: 4850, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', badge: '🔥 28d Streak' },
      { rank: 2, name: 'Maya Lin (You)', points: 4420, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', badge: '⚡ 18d Streak' },
      { rank: 3, name: 'Sarah Jenkins', points: 3910, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', badge: '✨ Top Contributor' }
    ],
    global: [
      { rank: 1, name: 'Chloe Zhang', points: 9420, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', badge: '🏆 Legend' },
      { rank: 2, name: 'Marcus Vance', points: 8890, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', badge: '⭐ Pro Coach' },
      { rank: 3, name: 'Elena Rostova', points: 7850, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', badge: '🔥 28d Streak' }
    ]
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    onAddPost(newPostContent);
    setNewPostContent('');
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-800/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950 text-teal-300 text-xs font-bold border border-teal-800">
              <Users className="w-3.5 h-3.5" />
              <span>VitaFlow Organic Community</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Social Vitality & Group Challenges
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Connect with thousands of health enthusiasts, share personal PRs, and tackle community streak challenges.
            </p>
          </div>
        </div>
      </div>

      {/* Active Challenges Carousel/Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Active Community Challenges</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {challenges.map((c) => (
            <div key={c.id} className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="relative h-32 rounded-2xl overflow-hidden">
                  <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-slate-950/80 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                    {c.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100">{c.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>{c.participantsCount} Joined</span>
                  <span>{c.daysRemaining} Days Left</span>
                </div>
                {c.isJoined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-emerald-400">
                      <span>Progress</span>
                      <span>{c.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: `${c.progressPercent}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => onJoinChallenge(c.id)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors ${
                  c.isJoined
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {c.isJoined ? '✓ Joined Challenge' : 'Join Challenge'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Feed vs Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Social Feed (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Post Creation Card */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Share an Update or Victory</h3>
            <form onSubmit={handlePostSubmit} className="space-y-3">
              <textarea
                rows={2}
                placeholder="Logged a new PR or completed a streak? Inspire the community..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
              />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500">✨ Automatic CycleSync badge added</span>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Post Update
                </button>
              </div>
            </form>
          </div>

          {/* Social Posts */}
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-400/80" />
                    <div>
                      <p className="text-sm font-bold text-slate-100">{post.author}</p>
                      <p className="text-[10px] text-slate-400">{post.timeAgo}</p>
                    </div>
                  </div>
                  {post.badge && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 text-[10px] font-bold border border-amber-800">
                      {post.badge}
                    </span>
                  )}
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{post.content}</p>

                {/* Standard Image if any */}
                {post.image && (
                  <img src={post.image} alt="Post asset" className="w-full h-64 object-cover rounded-2xl border border-slate-800" />
                )}

                {/* Interactive Before / After Transformation Slider */}
                {post.beforeAfterImages && (
                  <div className="space-y-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Before</span>
                      <span className="text-emerald-400">{post.beforeAfterImages.timeSpan}</span>
                      <span>After</span>
                    </div>

                    <div className="relative h-64 rounded-xl overflow-hidden">
                      <img
                        src={post.beforeAfterImages.after}
                        alt="After"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-y-0 left-0 overflow-hidden"
                        style={{ width: `${transformationSlider}%` }}
                      >
                        <img
                          src={post.beforeAfterImages.before}
                          alt="Before"
                          className="w-full h-full object-cover max-w-none"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={transformationSlider}
                        onChange={(e) => setTransformationSlider(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                      />
                    </div>
                    <p className="text-[10px] text-center text-slate-400 font-medium">Drag slider left/right to compare</p>
                  </div>
                )}

                {/* Reactions Footer */}
                <div className="flex items-center gap-6 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <button
                    onClick={() => onToggleLike(post.id)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      post.isLiked ? 'text-pink-400 font-bold' : 'hover:text-slate-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-pink-400' : ''}`} />
                    <span>{post.likes} Likes</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-slate-200">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments} Comments</span>
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* Sidebar: Leaderboard & Tribes */}
        <div className="space-y-6">
          
          {/* Leaderboard Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Vitality Leaderboard</span>
              </h3>
              <div className="flex bg-slate-950 p-1 rounded-full border border-slate-800">
                <button
                  onClick={() => setLeaderboardTab('friends')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    leaderboardTab === 'friends' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Friends
                </button>
                <button
                  onClick={() => setLeaderboardTab('global')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    leaderboardTab === 'global' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Global
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {leaderboards[leaderboardTab].map((u) => (
                <div key={u.rank} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center">
                      #{u.rank}
                    </span>
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-slate-100">{u.name}</p>
                      <p className="text-[10px] text-slate-400">{u.badge}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-400">{u.points} pts</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
