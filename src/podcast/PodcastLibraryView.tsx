import React, { useState } from 'react';
import { motion } from 'motion/react';
import { History, Play, Video, Volume2, FileText, CheckCircle2, Clock, Filter, Plus, Star, Rss, MessageSquare } from 'lucide-react';
import { PodcastEpisode } from './usePodcast';
import { MainCategory, SubCategory, ScheduleItem } from '../types';

interface PodcastLibraryViewProps {
  isDarkMode: boolean;
  episodes: PodcastEpisode[];
  onSelectEpisode: (episode: PodcastEpisode) => void;
  onGenerate: (type: 'video' | 'audio' | 'text') => void;
  time: Date;
  schedules: ScheduleItem[];
  onNavigate: (cat: MainCategory, sub: SubCategory) => void;
}

export const PodcastLibraryView: React.FC<PodcastLibraryViewProps> = ({ 
  isDarkMode, 
  episodes, 
  onSelectEpisode,
  onGenerate,
  time,
  schedules,
  onNavigate
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const typeIcons = {
    video: <Video size={16} className="text-pink-500" />,
    audio: <Volume2 size={16} className="text-sky-500" />,
    text: <FileText size={16} className="text-emerald-500" />
  };

  const typeLabels = {
    video: '视频',
    audio: '音频',
    text: '图文'
  };

  const unplayedEpisodes = episodes.filter(e => !e.played);
  
  // Extract unique channels
  const channels = Array.from(new Set(episodes.map(e => e.channelName))).filter(Boolean) as string[];
  
  // Filter episodes for "All Programs" section
  let filteredEpisodes = [...episodes];
  if (activeFilter === 'favorite') {
    filteredEpisodes = filteredEpisodes.filter(e => e.favorite);
  } else if (['video', 'audio', 'text'].includes(activeFilter)) {
    filteredEpisodes = filteredEpisodes.filter(e => e.type === activeFilter);
  } else if (activeFilter !== 'all') {
    filteredEpisodes = filteredEpisodes.filter(e => e.channelName === activeFilter);
  }

  const renderEpisodeCard = (episode: PodcastEpisode, showChannel: boolean = false, index?: number) => (
    <motion.div 
      key={episode.id || `ep-${index}-${Math.random()}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelectEpisode(episode)}
      className={`relative p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col h-full ${
        isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {typeIcons[episode.type]}
          <span className={`text-[10px] font-black uppercase tracking-wider ${
            episode.type === 'video' ? 'text-pink-500' : 
            episode.type === 'audio' ? 'text-sky-500' : 'text-emerald-500'
          }`}>
            {typeLabels[episode.type]}
          </span>
        </div>
        {episode.played ? (
          <CheckCircle2 size={14} className="text-emerald-500" />
        ) : episode.progress && episode.progress > 0 ? (
          <div className="flex items-center gap-1 text-blue-500">
            <Clock size={12} />
            <span className="text-[10px] font-bold">{Math.round(episode.progress)}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-bold text-blue-500">未播放</span>
          </div>
        )}
      </div>
      
      {showChannel && episode.channelName && (
        <div className={`text-[10px] font-bold mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
          {episode.channelName}
        </div>
      )}
      
      <h4 className={`text-sm font-black mb-2 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
        {episode.title}
      </h4>
      <p className={`text-xs font-bold leading-relaxed line-clamp-2 mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        {episode.summary}
      </p>
      
      {/* Progress Bar */}
      {episode.progress !== undefined && episode.progress > 0 && !episode.played && (
        <div className="w-full h-1 bg-slate-200/50 rounded-full overflow-hidden mb-2 mt-auto">
          <div className="h-full bg-blue-500" style={{ width: `${episode.progress}%` }} />
        </div>
      )}
      
      <div className={`flex items-center justify-between pt-2 border-t border-slate-200/10 ${episode.progress && episode.progress > 0 && !episode.played ? '' : 'mt-auto'}`}>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {episode.date}
          </span>
          {episode.qnaHistory && episode.qnaHistory.length > 0 && (
            <div className="flex items-center gap-1 text-indigo-500">
              <MessageSquare size={10} />
              <span className="text-[10px] font-bold">{episode.qnaHistory.length}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {episode.favorite && <Star size={12} className="text-yellow-500" fill="currentColor" />}
          <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Play size={12} fill="currentColor" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* 1. Top Header */}
      <div className="mb-4 flex-shrink-0 pr-12">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <History size={20} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            播客库
          </h2>
        </div>
        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          定制生成的播客记录与收藏
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6 pb-6">
        
        {/* Latest Podcasts Section */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Rss size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
            <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              最新播客
            </h3>
          </div>
          {unplayedEpisodes.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
              {unplayedEpisodes.map((episode, index) => (
                <div key={episode.id || `unplayed-${index}`} className="w-64 flex-shrink-0">
                  {renderEpisodeCard(episode, true, index)}
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-6 rounded-3xl border border-dashed text-center flex flex-col items-center justify-center ${isDarkMode ? 'bg-slate-800/30 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                暂无未播放的最新播客
              </p>
            </div>
          )}
        </div>

        {/* All Programs with Filter Bar */}
        <div className="flex flex-col gap-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-1">
              <Rss size={16} className={isDarkMode ? 'text-indigo-400' : 'text-indigo-500'} />
              <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                全部节目
              </h3>
            </div>
          </div>
          
          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
            <Filter size={14} className={`flex-shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
                  activeFilter === 'all' 
                    ? (isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white')
                    : (isDarkMode ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setActiveFilter('favorite')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeFilter === 'favorite' 
                    ? (isDarkMode ? 'bg-yellow-500 text-slate-900' : 'bg-yellow-400 text-yellow-900')
                    : (isDarkMode ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                }`}
              >
                <Star size={10} fill={activeFilter === 'favorite' ? 'currentColor' : 'none'} />
                收藏
              </button>
              
              <div className={`w-px h-4 mx-1 self-center ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />
              
              {['video', 'audio', 'text'].map(type => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
                    activeFilter === type 
                      ? (isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white')
                      : (isDarkMode ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                  }`}
                >
                  {typeLabels[type as keyof typeof typeLabels]}
                </button>
              ))}
              
              <div className={`w-px h-4 mx-1 self-center ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />
              
              {channels.map(channel => (
                <button
                  key={channel}
                  onClick={() => setActiveFilter(channel)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
                    activeFilter === channel 
                      ? (isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white')
                      : (isDarkMode ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>
          
          {/* Filtered Grid */}
          {filteredEpisodes.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredEpisodes.map((ep, index) => renderEpisodeCard(ep, true, index))}
            </div>
          ) : (
            <div className={`p-8 rounded-3xl border border-dashed text-center flex flex-col items-center justify-center h-full ${isDarkMode ? 'bg-slate-800/30 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <History size={32} className={`mb-4 opacity-20 ${isDarkMode ? 'text-white' : 'text-slate-800'}`} />
              <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                没有找到符合条件的播客
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
