import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Clock, Calendar, X, Tag, AlertCircle } from 'lucide-react';
import { ScheduleItem, TodoItem } from '../types';

interface CalendarReminderOverlayProps {
  show: boolean;
  isDarkMode: boolean;
  reminderItem: { type: 'schedule' | 'todo'; item: ScheduleItem | TodoItem } | null;
  onClose: () => void;
  onComplete: (id: string, type: 'schedule' | 'todo') => void;
}

export const CalendarReminderOverlay: React.FC<CalendarReminderOverlayProps> = ({
  show,
  isDarkMode,
  reminderItem,
  onClose,
  onComplete,
}) => {
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [completeSuccess, setCompleteSuccess] = useState(false);

  useEffect(() => {
    if (show) {
      setIsSnoozing(false);
      setCompleteSuccess(false);
    }
  }, [show]);

  if (!reminderItem) return null;

  const type = reminderItem.type;
  const item = reminderItem.item || (reminderItem as any).data;

  if (!item) return null;

  const taskName = item.task || (item as any).title || '无标题事项';
  const taskTime = item.time || '全天';

  const handleCompleteClick = () => {
    if (completeSuccess) return;
    setCompleteSuccess(true);
    setTimeout(() => {
      onComplete(item.id, type);
      onClose();
    }, 800);
  };

  const handleSnoozeClick = () => {
    setIsSnoozing(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center p-6 rounded-[3rem] overflow-hidden"
          id="calendar-reminder-overlay-bg"
        >
          {/* Background Backdrop */}
          <div 
            className={`absolute inset-0 backdrop-blur-md ${isDarkMode ? 'bg-black/60' : 'bg-slate-900/35'}`} 
            onClick={onClose}
          />

          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* Skeuomorphic Horizontal Memo Assembly */}
            <motion.div 
              initial={{ scale: 0.88, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 20 }}
              className="relative group flex items-center justify-center"
            >
              
              {/* ===== RIGHT-SIDE 2 UNIFIED METAPHORIC BUTTONS (右侧仅保留 2 个隐喻式按键) ===== */}
              <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
                {type === 'todo' ? (
                  <>
                    {/* Todo Action 1: "完成" Button */}
                    <motion.button
                      whileHover={{ x: -3 }}
                      whileTap={{ x: 2 }}
                      onClick={handleCompleteClick}
                      disabled={completeSuccess}
                      className={`w-12 h-20 rounded-tr-2xl border-t-2 border-r-2 border-b shadow-[6px_0_18px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        completeSuccess
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400 text-white'
                          : isDarkMode 
                            ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white' 
                            : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-300 text-white'
                      }`}
                      title="完成打卡"
                    >
                      <Check size={18} className="stroke-[3]" />
                      <span className="text-[10px] font-black tracking-wider">完成</span>
                    </motion.button>

                    {/* Todo Action 2: "退出" Button */}
                    <motion.button
                      whileHover={{ x: -3 }}
                      whileTap={{ x: 2 }}
                      onClick={onClose}
                      className={`w-12 h-16 rounded-br-2xl border-b-2 border-r-2 border-t shadow-[6px_0_15px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        isDarkMode 
                          ? 'bg-slate-750 hover:bg-slate-700 border-white/10 text-slate-300' 
                          : 'bg-slate-200 hover:bg-slate-100 border-black/10 text-slate-700'
                      }`}
                      title="退出"
                    >
                      <X size={18} strokeWidth={2.5} />
                      <span className="text-[10px] font-black tracking-wider">退出</span>
                    </motion.button>
                  </>
                ) : (
                  <>
                    {/* Schedule Action 1: "推迟" Button */}
                    <motion.button
                      whileHover={{ x: -3 }}
                      whileTap={{ x: 2 }}
                      onClick={handleSnoozeClick}
                      className={`w-12 h-20 rounded-tr-2xl border-t-2 border-r-2 border-b shadow-[6px_0_18px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        isDarkMode 
                          ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white' 
                          : 'bg-amber-500 hover:bg-amber-400 border-amber-300 text-white'
                      }`}
                      title="推迟提醒"
                    >
                      <Clock size={18} />
                      <span className="text-[10px] font-black tracking-wider">推迟</span>
                    </motion.button>

                    {/* Schedule Action 2: "退出" Button */}
                    <motion.button
                      whileHover={{ x: -3 }}
                      whileTap={{ x: 2 }}
                      onClick={onClose}
                      className={`w-12 h-16 rounded-br-2xl border-b-2 border-r-2 border-t shadow-[6px_0_15px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        isDarkMode 
                          ? 'bg-slate-750 hover:bg-slate-700 border-white/10 text-slate-300' 
                          : 'bg-slate-200 hover:bg-slate-100 border-black/10 text-slate-700'
                      }`}
                      title="退出"
                    >
                      <X size={18} strokeWidth={2.5} />
                      <span className="text-[10px] font-black tracking-wider">退出</span>
                    </motion.button>
                  </>
                )}
              </div>

              {/* ===== MAIN SKEUOMORPHIC HORIZONTAL MEMO CARD (长条形便签纸) ===== */}
              <motion.div 
                animate={isSnoozing ? { y: 180, opacity: 0 } : {}}
                transition={{ duration: 0.35 }}
                className={`relative w-[28rem] rounded-[2rem] p-5 shadow-[0_25px_50px_rgba(0,0,0,0.4),inset_0_2px_8px_rgba(255,255,255,0.4)] z-10 overflow-hidden border-2 flex flex-col justify-between ${
                  isDarkMode 
                    ? 'bg-gradient-to-b from-slate-800 to-slate-850 border-slate-700' 
                    : 'bg-gradient-to-b from-[#fbf8ee] to-[#f4eee0] border-[#e5dcbe]'
                }`}
              >
                
                {/* Top Metallic Clip Holder (顶部的金属夹持块) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 rounded-b-md border-x border-b border-slate-600 shadow-sm flex items-center justify-center">
                  <div className="w-12 h-1 bg-slate-700/50 rounded-full" />
                </div>

                {/* Left Side Pin Hole Binder Punch (便签纸装订孔) */}
                <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-around py-3 pointer-events-none opacity-40">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full shadow-inner border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-400 border-slate-500'}`} />
                  ))}
                </div>

                {/* Main Content Paper Sheet (纸张主体) */}
                <div className="pl-4 pr-1 pt-1">
                  
                  {/* Category & Time Header Tag */}
                  <div className="flex items-center justify-between border-b pb-2.5 mb-3 border-dashed border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Tag size={12} className={type === 'schedule' ? 'text-amber-600' : 'text-emerald-600'} />
                      <span className={`text-xs font-black tracking-widest uppercase ${
                        type === 'schedule'
                          ? (isDarkMode ? 'text-amber-400' : 'text-amber-700')
                          : (isDarkMode ? 'text-emerald-400' : 'text-emerald-700')
                      }`}>
                        {type === 'schedule' ? '日程提醒' : '待办事项'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Clock size={12} />
                      <span className="text-xs font-extrabold tabular-nums">{taskTime}</span>
                    </div>
                  </div>

                  {/* Task Title Box */}
                  <div className="flex items-start gap-3 my-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border shadow-sm ${
                      completeSuccess
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : type === 'schedule'
                          ? 'bg-amber-500 text-white border-amber-400'
                          : 'bg-emerald-600 text-white border-emerald-500'
                    }`}>
                      {completeSuccess ? <Check size={18} className="stroke-[3]" /> : <AlertCircle size={18} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-black tracking-tight leading-snug break-words ${
                        completeSuccess
                          ? 'line-through opacity-60 text-emerald-600'
                          : isDarkMode ? 'text-slate-100' : 'text-slate-850'
                      }`}>
                        {taskName}
                      </h3>
                      <p className={`text-[11px] mt-1 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {type === 'schedule' ? '设定时间：' : '截止时间：'}
                        <span className="font-extrabold text-amber-600 dark:text-amber-400">{taskTime}</span>
                      </p>
                    </div>
                  </div>

                </div>

                {/* Footer Minimal Tip */}
                <div className="pl-4 pr-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {type === 'todo' ? '点击右侧按键标记完成或退出' : '点击右侧按键推迟提醒或退出'}
                  </span>
                </div>

              </motion.div>

            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
