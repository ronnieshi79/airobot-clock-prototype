import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Minimize2, Power, Disc, Radio, MessageCircle } from 'lucide-react';
import { PodcastEpisode } from './usePodcast';

interface PodcastOverlayProps {
  show: boolean;
  isDarkMode: boolean;
  episode: PodcastEpisode | null;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
  onClose: () => void;
  onAskAether: (topic: string) => void;
}

export const PodcastOverlay: React.FC<PodcastOverlayProps> = ({
  show,
  isDarkMode,
  episode,
  isPlaying,
  progress,
  onTogglePlay,
  onClose,
  onAskAether,
}) => {
  if (!episode) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center pt-6 pb-8 overflow-hidden rounded-[3rem]"
        >
          <div className={`absolute inset-0 backdrop-blur-md ${isDarkMode ? 'bg-black/60' : 'bg-slate-900/40'}`} onClick={onClose} />
          
          {/* Container tuned to cover maximum functional area without spilling over the right knobs */}
          <div className="relative w-full h-full max-w-[560px] mx-auto flex items-center justify-center pl-4 pr-16">
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="relative group flex w-full max-h-[792px] h-[98%]"
            >
              
              {/* Right-Side External Knobs / Buttons */}
              <div className="absolute -right-14 top-[40%] -translate-y-1/2 flex flex-col gap-10 z-0">
                {/* Play/Pause Knob */}
                <motion.button
                  whileHover={{ x: -2 }}
                  whileTap={{ x: 2 }}
                  onClick={onTogglePlay}
                  className={`relative w-16 h-40 rounded-r-3xl border-y border-r shadow-[8px_0_20px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center gap-4 group transition-colors ${
                    isDarkMode ? 'bg-slate-700 border-white/20' : 'bg-slate-300 border-white/50'
                  }`}
                  title="播放/暂停"
                >
                  <div className={`w-2 h-20 rounded-full absolute left-1 flex-shrink-0 ${isDarkMode ? 'bg-black/30' : 'bg-black/10'}`} />
                  <div className={`w-12 h-12 ml-2 rounded-full shadow-inner flex items-center justify-center flex-shrink-0 ${isPlaying ? 'bg-indigo-500 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')}`}>
                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
                  </div>
                  {/* Texture lines */}
                  <div className="flex flex-col gap-1.5 w-full pl-5 pr-2">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-[2px] w-full rounded-full ${isDarkMode ? 'bg-slate-600' : 'bg-slate-400'}`} />
                    ))}
                  </div>
                </motion.button>

                {/* Combined Background Run / Minmize Knob */}
                <motion.button
                  whileHover={{ x: -2 }}
                  whileTap={{ x: 2 }}
                  onClick={onClose}
                  className={`relative w-14 h-24 rounded-r-3xl border-y border-r shadow-[6px_0_15px_rgba(0,0,0,0.3)] flex items-center justify-center transition-colors ${
                    isDarkMode ? 'bg-slate-800 border-white/10 text-slate-400 hover:text-indigo-400' : 'bg-slate-200 border-white/40 text-slate-500 hover:text-indigo-500'
                  }`}
                  title="收起至后台"
                >
                  <div className={`w-2 h-12 rounded-full absolute left-1 ${isDarkMode ? 'bg-black/30' : 'bg-black/10'}`} />
                  <Minimize2 size={24} className="ml-2" />
                </motion.button>
              </div>

              {/* Main Vertical Body */}
              <div className={`relative z-10 w-full h-full rounded-[3rem] p-8 flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.6),inset_0_2px_15px_rgba(255,255,255,0.3)] ${
                isDarkMode 
                  ? 'bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900 border-2 border-slate-600' 
                  : 'bg-gradient-to-b from-[#E2DCC8] via-[#F1F0E8] to-[#D5CEA3] border-2 border-white'
              }`}>
                
                {/* Turntable Platter (Top) */}
                <div className="w-full flex-1 flex items-center justify-center relative mb-8 min-h-[300px]">
                   {/* Platter Base Ring */}
                   <div className={`w-full aspect-square max-w-[320px] max-h-[320px] rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_5px_10px_rgba(255,255,255,0.1)] ${
                     isDarkMode ? 'bg-slate-900 border-4 border-slate-800' : 'bg-slate-800 border-4 border-slate-700'
                   }`}>
                      {/* Vinyl Record */}
                      <motion.div 
                        animate={isPlaying ? { rotate: 360 } : {}}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="w-[92%] h-[92%] rounded-full bg-[#111] flex items-center justify-center relative overflow-hidden shadow-[inset_0_4px_15px_rgba(255,255,255,0.15)]"
                      >
                         {/* Retro Grooves */}
                         <div className="absolute inset-[4%] rounded-full border border-white/5" />
                         <div className="absolute inset-[8%] rounded-full border border-white/10" />
                         <div className="absolute inset-[13%] rounded-full border border-white/5" />
                         <div className="absolute inset-[18%] rounded-full border border-white/10" />
                         <div className="absolute inset-[24%] rounded-full border border-white/5" />
                         <div className="absolute inset-[30%] rounded-full border border-white/10" />
                         <div className="absolute inset-[36%] rounded-full border border-white/5" />
                         
                         {/* Center Label (Cover Art) */}
                         <div className="relative w-[35%] h-[35%] rounded-full border-[6px] border-[#111] shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-hidden bg-slate-200">
                           <img 
                             src={episode.bgImage} 
                             alt="Album Art" 
                             className="absolute inset-0 w-full h-full object-cover opacity-90"
                             referrerPolicy="no-referrer"
                           />
                           {/* Spindle hole */}
                           <div className="absolute top-1/2 left-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-slate-300 border border-slate-500 shadow-inner" />
                         </div>
                      </motion.div>
                   </div>

                   {/* Tone Arm Base */}
                   <div className="absolute top-0 right-2 w-16 h-16 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-500 border border-slate-400">
                     <div className="w-8 h-8 rounded-full shadow-inner bg-gradient-to-br from-slate-400 to-slate-600" />
                   </div>

                   {/* Tone Arm Stick */}
                   <motion.div 
                     animate={{ rotate: isPlaying ? 25 : 0 }}
                     transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                     className="absolute top-8 right-9 w-2.5 h-[65%] shadow-[2px_10px_15px_rgba(0,0,0,0.5)] origin-top z-10"
                     style={{ transformOrigin: 'top center' }}
                   >
                     {/* The Arm Line */}
                     <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-400 rounded-full border border-white/20" />
                     {/* The Stylus/Head */}
                     <div className="absolute bottom-0 -left-2.5 w-7 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-sm shadow-xl flex items-center justify-center border-t border-slate-400">
                        <div className="w-1/2 h-1/2 bg-red-500/20 rounded-full" />
                     </div>
                   </motion.div>
                </div>

                {/* Details & Info Area (Bottom) */}
                <div className={`w-full flex-grow-0 flex flex-col pt-6 pb-2 border-t-2 ${isDarkMode ? 'border-slate-600' : 'border-slate-300/50'}`}>
                  
                  {/* Brand / Tag & Chat History */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Radio size={18} className={isDarkMode ? 'text-indigo-400' : 'text-orange-500'} />
                      <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-indigo-400' : 'text-orange-600'}`}>
                        Retro Player
                      </span>
                    </div>
                    
                    {/* Chat History Icon */}
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onAskAether(episode.title)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${
                        isDarkMode ? 'bg-slate-800 border-slate-600 text-indigo-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-indigo-600 hover:bg-slate-50'
                      }`}
                      title="与 Airobot 讨论此播客"
                    >
                      <MessageCircle size={14} />
                      <span className="text-[10px] font-black">0 条对话</span>
                    </motion.button>
                  </div>

                  {/* Progress (Analog meter style) */}
                  <div className="mb-5">
                    <div className="flex justify-between text-[11px] font-black uppercase mb-3 tracking-wider">
                       <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                         {Math.floor(((progress || 0) / 100) * 15)}:{(Math.floor((((progress || 0) / 100) * 15 * 60) % 60)).toString().padStart(2, '0')}
                       </span>
                       <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>
                         15:00
                       </span>
                    </div>
                    {/* Metal Slider Track */}
                    <div className={`h-2.5 rounded-full overflow-hidden shadow-inner relative ${
                      isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-300 border border-slate-400'
                    }`}>
                       <motion.div 
                         className={`absolute top-0 left-0 h-full ${
                           isDarkMode ? 'bg-indigo-500' : 'bg-orange-500'
                         }`} 
                         style={{ width: `${progress || 0}%` }} 
                       />
                       {/* Knob Indicator on slider */}
                       <motion.div
                         className="absolute top-1/2 -mt-2.5 w-5 h-5 rounded-full bg-slate-200 border border-slate-400 shadow-md flex items-center justify-center transform -translate-x-1/2"
                         style={{ left: `${progress || 0}%` }}
                       >
                         <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                       </motion.div>
                    </div>
                  </div>

                  {/* Episode Title & Summary */}
                  <div className="flex-1 mt-2">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded mb-3 ${
                      isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-300/50 text-slate-700'
                    }`}>
                      {episode.type === 'story' ? '故事' : episode.type === 'news' ? '资讯' : '知识'}
                    </span>
                    <h2 className={`text-2xl font-black mb-3 leading-tight line-clamp-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      {episode.title}
                    </h2>
                    <p className={`text-sm font-bold leading-relaxed line-clamp-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {episode.summary}
                    </p>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
