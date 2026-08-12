import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ScheduleItem } from '../types';
import { getTodayInfo, WEATHER_MOCKS } from './utils';

interface ScheduleViewProps {
  schedules: ScheduleItem[];
  isDarkMode: boolean;
  selectedDate?: Date;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  isDarkMode,
  selectedDate = new Date(),
}) => {
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const today = selectedDate;
  const currentDay = today.getDay();
  const weeklyTotal = schedules.length;

  // Calculate week number
  const getWeekNumber = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };
  const weekNumber = getWeekNumber(today);

  // Get important items for the current week
  const weeklyImportantItems: { type: 'festival' | 'task', title: string, day?: string }[] = [];
  
  // Add festivals for the week
  for (let i = 0; i < 7; i++) {
    const date = new Date(today.getTime());
    date.setDate(date.getDate() - currentDay + i);
    const info = getTodayInfo(date);
    if (info.festival) weeklyImportantItems.push({ type: 'festival', title: info.festival, day: weekDays[i] });
    if (info.solarTerm) weeklyImportantItems.push({ type: 'festival', title: info.solarTerm, day: weekDays[i] });
  }

  // Add key tasks (first 2-3 tasks of the week)
  schedules.slice(0, 3).forEach(s => {
    weeklyImportantItems.push({ type: 'task', title: s.task, day: weekDays[s.dayOfWeek] });
  });

  return (
    <div className="flex flex-col gap-8 relative z-10 h-full">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Week Number Display (Desk Calendar Style) */}
        <motion.div 
          whileHover={{ rotate: -2, scale: 1.02 }}
          className="flex flex-col items-center justify-center p-6 rounded-[4rem] bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_20px_50px_rgba(249,115,22,0.4)] min-w-[200px] border-b-8 border-orange-700"
        >
          <span className="text-base font-black uppercase tracking-[0.4em] opacity-80 mb-2">
            {today.getFullYear()}年
          </span>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-black opacity-70">第</span>
            <span className="text-8xl font-black leading-none drop-shadow-2xl">{weekNumber}</span>
            <span className="text-2xl font-black opacity-70">周</span>
          </div>
          <div className="h-1 w-10 bg-white/30 rounded-full"></div>
        </motion.div>

        {/* Right: Title and Summary */}
        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
              <h3 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>本周日程</h3>
            </div>
            <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              本周共有 {weeklyImportantItems.filter(i => i.type === 'festival').length} 个节日和 {weeklyTotal} 项事务安排。
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>本周重点事项</h4>
            </div>
            
            <div className="space-y-3">
              {weeklyImportantItems.slice(0, 3).map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-3xl flex items-center gap-4 transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-50'}`}
                >
                  <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)] ${item.type === 'festival' ? 'bg-red-500' : 'bg-orange-500'}`} />
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      周{item.day} · {item.type === 'festival' ? '节日' : '任务'}
                    </span>
                    <span className={`text-base font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.title}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly AI Summary Section at the bottom */}
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`mt-auto p-8 rounded-[3.5rem] relative overflow-hidden group ${isDarkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-100'}`}
      >
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10 flex gap-6 items-start">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${isDarkMode ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'}`}>
            <Sparkles size={28} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>AETHER 本周概要</span>
              <div className="flex gap-1">
                {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
              </div>
            </div>
            <p className={`text-lg font-black leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              本周天气整体以{WEATHER_MOCKS[0].condition}为主。
              {weeklyImportantItems.filter(i => i.type === 'festival').length > 0 ? `本周有${weeklyImportantItems.filter(i => i.type === 'festival').map(f => f.title).join('、')}等重要日子，` : ''}
              建议优先关注“{weeklyImportantItems.find(i => i.type === 'task')?.title || '各项安排'}”。祝你度过充实的一周！
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
