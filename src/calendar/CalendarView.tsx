import React from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ScheduleItem } from '../types';
import { getTodayInfo } from './utils';

interface CalendarViewProps {
  isDarkMode: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  schedules: ScheduleItem[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  isDarkMode,
  selectedDate,
  setSelectedDate,
  schedules,
}) => {
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = selectedDate.toLocaleString('zh-CN', { month: 'long' });

  // Get month summary
  const monthFestivals: { day: number; name: string }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d);
    const info = getTodayInfo(date);
    if (info.festival) monthFestivals.push({ day: d, name: info.festival });
    if (info.solarTerm) monthFestivals.push({ day: d, name: info.solarTerm });
  }
  
  const totalCount = schedules.length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-6">
        <div className="flex flex-col">
          <h3 className={`text-4xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{selectedDate.getFullYear()}年</h3>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
            <span className="text-xl font-black text-orange-500 tracking-widest">{monthName}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center mb-4">
        {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
          <span key={d} className={`text-xs font-black uppercase tracking-[0.2em] ${i === 0 || i === 6 ? 'text-orange-400' : 'text-slate-400'}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 justify-items-center mb-8">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="h-12 w-12" />)}
        {days.map(d => {
          const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d);
          const isToday = d === new Date().getDate() && selectedDate.getMonth() === new Date().getMonth() && selectedDate.getFullYear() === new Date().getFullYear();
          const isSelected = d === selectedDate.getDate();
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const dayInfo = getTodayInfo(date);
          const isHoliday = !!dayInfo.festival || !!dayInfo.solarTerm;

          return (
            <motion.button 
              key={d} 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedDate(date)}
              className={`h-12 w-12 rounded-2xl flex flex-col items-center justify-center text-lg font-black transition-all relative ${
                isToday ? 'bg-orange-500 text-white shadow-[0_10px_20px_rgba(249,115,22,0.3)] scale-110 z-10' : 
                isSelected ? (isDarkMode ? 'bg-white/20 text-white ring-2 ring-orange-500' : 'bg-slate-200 text-slate-800 ring-2 ring-orange-500') :
                (isDarkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100')
              } ${isHoliday ? 'text-red-500' : isWeekend ? 'text-orange-400' : ''}`}
            >
              <span className="relative z-10">{d}</span>
              {isHoliday && (
                <span className="text-[7px] font-bold absolute bottom-0.5 truncate max-w-[40px] z-10 leading-none">
                  {dayInfo.festival || dayInfo.solarTerm}
                </span>
              )}
              {isWeekend && !isHoliday && !isToday && !isSelected && (
                <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-orange-400/50" />
              )}
              {isToday && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white rounded-full border-2 border-orange-500 z-20"></div>}
            </motion.button>
          );
        })}
      </div>

      {/* Month Summary Section */}
      <div className={`mt-auto p-8 rounded-[3.5rem] relative overflow-hidden group ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500 text-white'}`}>
            <CalendarIcon size={20} />
          </div>
          <span className={`text-sm font-black tracking-widest uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{monthName} 概览</span>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">本月重大节日</span>
            <div className="flex flex-wrap gap-2">
              {monthFestivals.slice(0, 3).map((f, i) => (
                <span key={i} className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-500'}`}>
                  {f.day}日 {f.name}
                </span>
              ))}
              {monthFestivals.length === 0 && <span className="text-[10px] font-bold text-slate-400 italic">本月无重大节日</span>}
            </div>
          </div>
          <div className="space-y-3 border-l pl-6 border-slate-200/20">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">本月事务总览</span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className={`text-xs font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  共规划 {totalCount} 项事务
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
