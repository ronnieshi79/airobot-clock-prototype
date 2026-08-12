import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Bot } from 'lucide-react';
import { ScheduleItem } from '../types';
import { getTodayInfo } from './utils';

interface TodayViewProps {
  isDarkMode: boolean;
  schedules: ScheduleItem[];
  selectedDate?: Date;
}

export const TodayView: React.FC<TodayViewProps> = ({
  isDarkMode,
  schedules,
  selectedDate = new Date(),
}) => {
  const targetDate = selectedDate;
  const todayInfo = getTodayInfo(targetDate);
  const todaySchedules = schedules.filter(s => {
    // If schedule has specific date, match it, otherwise fallback to dayOfWeek matching
    if (s.date) {
      return s.date === targetDate.toISOString().split('T')[0];
    }
    return s.dayOfWeek === targetDate.getDay();
  });

  return (
    <div className="flex flex-col gap-6 relative z-10 h-full">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Date Display (Desk Calendar Style) */}
        <motion.div 
          whileHover={{ rotate: -2, scale: 1.02 }}
          className="flex flex-col items-center justify-center p-6 rounded-[4rem] bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_20px_50px_rgba(249,115,22,0.4)] min-w-[200px] border-b-8 border-orange-700"
        >
          <span className="text-base font-black uppercase tracking-[0.4em] opacity-80 mb-2">
            {targetDate.toLocaleString('zh-CN', { month: 'long' })}
          </span>
          <span className="text-8xl font-black leading-none mb-2 drop-shadow-2xl">{targetDate.getDate()}</span>
          <div className="h-1 w-10 bg-white/30 rounded-full mb-2"></div>
          <span className="text-xl font-bold tracking-widest">
            {targetDate.toLocaleString('zh-CN', { weekday: 'long' })}
          </span>
        </motion.div>

        {/* Right: Summary */}
        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
              <h3 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {targetDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] ? '今日' : '当日'}概览
              </h3>
            </div>
            <div className="flex flex-wrap gap-4">
              {todayInfo.festival && (
                <motion.span 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="px-6 py-2.5 rounded-2xl bg-red-500 text-white text-sm font-black shadow-[0_10px_20px_rgba(239,68,68,0.3)] flex items-center gap-2"
                >
                  <Sparkles size={16} /> {todayInfo.festival}
                </motion.span>
              )}
              {todayInfo.solarTerm && (
                <motion.span 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-500 text-white text-sm font-black shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
                >
                  <Brain size={16} /> {todayInfo.solarTerm}
                </motion.span>
              )}
              <motion.span 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`px-6 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 shadow-sm ${isDarkMode ? 'bg-sky-500/20 text-sky-400 border border-sky-500/20' : 'bg-sky-50 text-sky-600 border border-sky-100'}`}
              >
                <span className="text-xl">{todayInfo.weather.icon}</span> {todayInfo.weather.condition} {todayInfo.weather.temp}
              </motion.span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {targetDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] ? '今日' : '当日'}重点事项
              </h4>
            </div>
            
            {todaySchedules.length > 0 ? (
              <div className="space-y-3">
                {todaySchedules.slice(0, 3).map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 rounded-3xl flex items-center gap-4 transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-50'}`}
                  >
                    <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                    <span className={`text-base font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.task}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={`p-8 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-2 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                <Sparkles className="text-slate-300" size={24} />
                <span className="text-xs font-bold text-slate-400">今日暂无特殊安排</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Today Summary Section */}
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`mt-auto p-8 rounded-[3.5rem] relative overflow-hidden group ${isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}
      >
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Bot size={120} />
        </div>
        <div className="relative z-10 flex gap-6 items-start">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${isDarkMode ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-500'}`}>
            <Bot size={28} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>AETHER 今日提醒</span>
              <div className="flex gap-1">
                {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
              </div>
            </div>
            <p className={`text-lg font-black leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              {todayInfo.festival ? `今天是${todayInfo.festival}，` : ''}
              {todayInfo.solarTerm ? `正值${todayInfo.solarTerm}节气，` : ''}
              天气{todayInfo.weather.condition}，气温{todayInfo.weather.temp}。
              {todaySchedules.length > 0 ? `今天你有“${todaySchedules[0].task}”等 ${todaySchedules.length} 项重要安排。记得按时完成哦！` : '今天没有特别的安排，享受轻松的一天吧。'}
              {todayInfo.aiAdvice}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
