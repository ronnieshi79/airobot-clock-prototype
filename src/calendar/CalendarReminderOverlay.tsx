import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Clock, Calendar, X, Sparkles, Bell, Volume2, Minimize2, Power, CheckSquare, Tag, AlertCircle } from 'lucide-react';
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

  // Dynamic witty Aether advice
  const getAetherInsight = (task: string, isSchedule: boolean) => {
    const t = task.toLowerCase();
    if (t.includes('会') || t.includes('meet') || t.includes('ppt')) {
      return '重要会议时刻到了！理清思路，整理好讲稿。AETHER 已为您准备好专注波段，祝您汇报顺利！';
    }
    if (t.includes('写') || t.includes('编') || t.includes('代码') || t.includes('学')) {
      return '深度思考时间开启。AI 智能大脑已将干扰阻隔在门外，心无旁骛，效率翻倍！';
    }
    if (t.includes('跑') || t.includes('锻') || t.includes('练') || t.includes('健身') || t.includes('运')) {
      return '运动健康提醒！暂别屏幕，伸展筋骨，让多巴胺迸发，激活满满的新能量！';
    }
    if (t.includes('吃') || t.includes('餐') || t.includes('饭') || t.includes('茶')) {
      return '美食补给时间！工作再忙也请按时享用美味，营养充沛才有无限可能！';
    }
    if (isSchedule) {
      return `主人的预定日程《${task}》提醒时刻到了。按照规划稳步推进，一切尽在掌握！`;
    }
    return `代办事项《${task}》正在等待打卡。完成它，收获满满的成就感吧！`;
  };

  const handleCompleteClick = () => {
    if (completeSuccess) return;
    setCompleteSuccess(true);
    setTimeout(() => {
      onComplete(item.id, type);
      onClose();
    }, 1100);
  };

  const handleSnoozeClick = () => {
    setIsSnoozing(true);
    setTimeout(() => {
      onClose();
    }, 600);
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
          {/* Backdrop Blur */}
          <div 
            className={`absolute inset-0 backdrop-blur-md ${isDarkMode ? 'bg-black/55' : 'bg-slate-900/35'}`} 
            onClick={onClose}
          />

          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* Skeuomorphic Main Assembly */}
            <motion.div 
              initial={{ scale: 0.85, y: 25 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 25 }}
              className="relative group flex items-center justify-center"
            >
              
              {/* ===== 1. RIGHT-SIDE UNIFIED METAPHORIC MECHANICAL CONTROL PANEL (右侧统一的隐喻式按钮) ===== */}
              <div className="absolute -right-14 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
                
                {/* Top Right: "完成/打卡" Mechanical Lever */}
                <motion.button
                  whileHover={{ x: -4 }}
                  whileTap={{ x: 2 }}
                  onClick={handleCompleteClick}
                  disabled={completeSuccess}
                  className={`w-14 h-28 rounded-tr-2xl border-t-2 border-r-2 shadow-[6px_0_18px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all relative ${
                    completeSuccess
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400 text-white'
                      : isDarkMode 
                        ? 'bg-slate-700 hover:bg-slate-650 border-white/15 text-emerald-400' 
                        : 'bg-slate-200 hover:bg-slate-100 border-black/10 text-emerald-600'
                  }`}
                  title="标记完成 / 盖章打卡"
                >
                  <div className={`p-2 rounded-xl shadow-inner ${completeSuccess ? 'bg-white/20' : isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <Check size={20} className="stroke-[3]" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest uppercase writing-mode-vertical">
                    {completeSuccess ? '已打卡' : '完成'}
                  </span>
                  {/* Tactile Grooves */}
                  <div className="flex flex-col gap-1 mt-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`w-8 h-[2px] rounded-full ${completeSuccess ? 'bg-white/40' : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
                    ))}
                  </div>
                </motion.button>

                {/* Middle Right: "稍后提醒 / SNOOZE" Mechanical Switch */}
                <motion.button
                  whileHover={{ x: -4 }}
                  whileTap={{ x: 2 }}
                  onClick={handleSnoozeClick}
                  className={`w-14 h-20 border-r-2 shadow-[6px_0_15px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    isDarkMode 
                      ? 'bg-slate-750 hover:bg-slate-700 border-white/10 text-amber-400' 
                      : 'bg-slate-150 hover:bg-white border-black/10 text-amber-600'
                  }`}
                  title="稍后提醒 / Snooze"
                >
                  <Clock size={18} />
                  <span className="text-[9px] font-black tracking-widest uppercase">稍后</span>
                  <div className="flex flex-col gap-1">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className={`w-7 h-[2px] rounded-full ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
                    ))}
                  </div>
                </motion.button>

                {/* Bottom Right: "关闭/最小化" Tab */}
                <motion.button
                  whileHover={{ x: -4 }}
                  whileTap={{ x: 2 }}
                  onClick={onClose}
                  className={`w-14 h-16 rounded-br-2xl border-b-2 border-r-2 shadow-[6px_0_15px_rgba(0,0,0,0.3)] flex items-center justify-center cursor-pointer ${
                    isDarkMode ? 'bg-slate-800 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-black/10 text-slate-500 hover:text-slate-800'
                  }`}
                  title="关闭/最小化"
                >
                  <Minimize2 size={20} />
                </motion.button>
              </div>

              {/* ===== 2. TOP MECHANICAL POWER / RESET BUTTON (顶部物理关机/复位按键) ===== */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
                <motion.button
                  whileHover={{ y: 3 }}
                  whileTap={{ y: 6 }}
                  onClick={onClose}
                  className={`w-16 h-10 rounded-t-2xl border-x-2 border-t-2 shadow-lg flex items-center justify-center cursor-pointer ${
                    isDarkMode ? 'bg-slate-800 border-white/10 text-red-400' : 'bg-slate-100 border-black/10 text-red-500'
                  }`}
                  title="关机/复位"
                >
                  <Power size={18} strokeWidth={3} />
                </motion.button>
              </div>

              {/* ===== 3. MAIN SKEUOMORPHIC CARD CASING (拟物提醒卡架主体) ===== */}
              <motion.div 
                animate={isSnoozing ? { y: 220, opacity: 0 } : {}}
                transition={{ duration: 0.4 }}
                className={`relative w-[34rem] h-[32rem] rounded-[2.5rem] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.45),inset_0_2px_10px_rgba(255,255,255,0.4)] z-10 flex flex-col justify-between overflow-hidden border-4 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-slate-750 via-slate-800 to-slate-900 border-slate-650' 
                    : 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 border-slate-350'
                }`}
              >
                
                {/* Embedded Metallic Rivets on Corner Frames */}
                <div className="absolute top-3 left-3 w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-br from-slate-300 to-slate-600 shadow-inner" />
                <div className="absolute top-3 right-3 w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-br from-slate-300 to-slate-600 shadow-inner" />
                <div className="absolute bottom-3 left-3 w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-br from-slate-300 to-slate-600 shadow-inner" />
                <div className="absolute bottom-3 right-3 w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-br from-slate-300 to-slate-600 shadow-inner" />

                {/* Top Physical Metallic Clips Holding the Reminder Memo Card */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-12 z-20 pointer-events-none">
                  <div className="w-10 h-6 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-b-lg border-x border-b border-slate-600 shadow-md flex items-center justify-center">
                    <div className="w-6 h-1 bg-slate-700/60 rounded-full" />
                  </div>
                  <div className="w-10 h-6 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-b-lg border-x border-b border-slate-600 shadow-md flex items-center justify-center">
                    <div className="w-6 h-1 bg-slate-700/60 rounded-full" />
                  </div>
                </div>

                {/* Floating AETHER Robot Avatar + Speech Bubble */}
                <div className="relative pt-2 px-2 flex items-center justify-between z-20">
                  <div className="flex items-center gap-3">
                    {/* Cute Robot Bezel */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-md border-2 border-white dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="w-8 h-6 rounded-lg bg-slate-950 flex flex-col items-center justify-center gap-0.5 relative shadow-inner">
                        <div className="flex gap-1.5">
                          <motion.div 
                            animate={{ scaleY: [1, 1, 0.1, 1] }} 
                            transition={{ repeat: Infinity, duration: 3.5 }}
                            className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.8)]" 
                          />
                          <motion.div 
                            animate={{ scaleY: [1, 1, 0.1, 1] }} 
                            transition={{ repeat: Infinity, duration: 3.5 }}
                            className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.8)]" 
                          />
                        </div>
                        <div className="w-3 h-0.5 bg-emerald-400/80 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-400 animate-spin" />
                        <span className={`text-xs font-black tracking-wider uppercase ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                          AETHER 智脑告警卡
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {type === 'schedule' ? '情境日程预警服务' : '拟物代办打卡任务'}
                      </span>
                    </div>
                  </div>

                  {/* Physical Bell Indicator */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-sm">
                    <motion.div
                      animate={{ rotate: [-12, 12, -12] }}
                      transition={{ repeat: Infinity, duration: 0.4 }}
                    >
                      <Bell size={15} fill="currentColor" />
                    </motion.div>
                    <span className="text-xs font-black tracking-wider">{taskTime}</span>
                  </div>
                </div>

                {/* ===== 4. TRADITIONAL SKEUOMORPHIC REMINDER CARD INNER (传统拟物提醒卡卡面) ===== */}
                <div className={`mt-3 mb-1 flex-1 rounded-2xl border-2 p-5 shadow-inner relative overflow-hidden flex flex-col justify-between ${
                  type === 'schedule'
                    ? (isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-[#faf8f2] border-[#e2d9c5]')
                    : (isDarkMode ? 'bg-slate-850 border-slate-700' : 'bg-[#f4f7f6] border-[#cbd8d6]')
                }`}>
                  
                  {/* Left Binder Punch Holes for Todo Card */}
                  {type === 'todo' && (
                    <div className="absolute left-2.5 top-0 bottom-0 flex flex-col justify-around py-3 pointer-events-none z-10">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`w-3.5 h-3.5 rounded-full shadow-inner border ${isDarkMode ? 'bg-slate-950 border-slate-750' : 'bg-slate-300 border-slate-400'}`} />
                      ))}
                    </div>
                  )}

                  {/* STAMP EFFECT WHEN COMPLETED (盖章打卡视觉效果) */}
                  <AnimatePresence>
                    {completeSuccess && (
                      <motion.div
                        initial={{ scale: 2, opacity: 0, rotate: -25 }}
                        animate={{ scale: 1, opacity: 1, rotate: -15 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="absolute right-6 top-6 z-30 pointer-events-none"
                      >
                        <div className="px-4 py-2 rounded-2xl border-4 border-emerald-500 text-emerald-500 bg-emerald-500/10 backdrop-blur-xs font-black tracking-widest text-lg uppercase shadow-xl flex items-center gap-2 transform rotate-[-12deg]">
                          <CheckSquare size={22} className="stroke-[3]" />
                          已盖章打卡
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Header Badge */}
                  <div className={`flex items-center justify-between pb-2 border-b border-dashed ${type === 'todo' ? 'pl-6' : ''} ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>
                    <div className="flex items-center gap-2">
                      <Tag size={13} className={type === 'schedule' ? 'text-indigo-500' : 'text-emerald-500'} />
                      <span className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {type === 'schedule' ? '传统的日程规划卡' : '传统打孔代办签片'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        type === 'schedule'
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {type === 'schedule' ? 'SCHEDULE' : 'TODO TASK'}
                      </span>
                    </div>
                  </div>

                  {/* Main Task Title Area */}
                  <div className={`my-auto py-2 ${type === 'todo' ? 'pl-6' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border shadow-sm ${
                        completeSuccess 
                          ? 'bg-emerald-500 text-white border-emerald-400' 
                          : type === 'schedule' 
                            ? 'bg-indigo-500 text-white border-indigo-400'
                            : 'bg-emerald-600 text-white border-emerald-500'
                      }`}>
                        {completeSuccess ? <Check size={18} className="stroke-[3]" /> : <AlertCircle size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xl font-black tracking-tight leading-snug break-words ${
                          completeSuccess
                            ? 'line-through opacity-60 text-emerald-500'
                            : isDarkMode ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                          {taskName}
                        </h3>
                        <p className={`text-xs mt-1 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          约定时刻：<span className="font-extrabold text-amber-500">{taskTime}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Aether Speech / Voice wave Card Box */}
                  <div className={`p-3.5 rounded-xl border relative ${type === 'todo' ? 'ml-6' : ''} ${
                    isDarkMode 
                      ? 'bg-slate-900/80 border-slate-700 text-slate-300' 
                      : 'bg-white/80 border-slate-200 text-slate-700 shadow-xs'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1 text-indigo-500">
                      <Volume2 size={13} />
                      <span className="text-[10px] font-black tracking-widest uppercase">AETHER 提示助手:</span>
                    </div>
                    <p className="text-xs font-bold leading-relaxed">
                      {getAetherInsight(taskName, type === 'schedule')}
                    </p>
                  </div>

                </div>

                {/* Footer Status Bar */}
                <div className="flex items-center justify-between text-[11px] font-black tracking-wider pt-2 px-2 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>点击右侧拉杆按键打卡或稍后提醒</span>
                  </div>
                  <button 
                    onClick={onClose}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X size={12} />
                    <span>关闭提示</span>
                  </button>
                </div>

              </motion.div>

            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
