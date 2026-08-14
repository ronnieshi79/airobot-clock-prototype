import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Clock, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Bell, 
  BellOff, 
  Sparkles, 
  Gift, 
  CheckSquare, 
  Sun, 
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { ScheduleItem, TodoItem, ScheduleType } from '../types';

interface CalendarReminderOverlayProps {
  show: boolean;
  isDarkMode: boolean;
  reminderItem: { type: 'schedule' | 'todo' | ScheduleType; item: ScheduleItem | TodoItem } | null;
  onClose: () => void;
  onComplete: (id: string, type: 'schedule' | 'todo') => void;
  onUpdateItem?: (id: string, type: 'schedule' | 'todo', updates: Partial<ScheduleItem>) => void;
  isAlertMode?: boolean;
}

const SCHEDULE_TYPES = [
  { id: 'regular' as ScheduleType, label: '默认日程', dotColor: 'bg-blue-500', icon: Clock },
  { id: 'birthday' as ScheduleType, label: '生日', dotColor: 'bg-teal-500', icon: Gift },
  { id: 'festival' as ScheduleType, label: '节日', dotColor: 'bg-rose-500', icon: Sparkles },
  { id: 'todo' as ScheduleType, label: '待办任务', dotColor: 'bg-emerald-500', icon: CheckSquare },
];

const LEAD_TIME_OPTIONS = [
  { label: '日程发生时 (准时)', value: '0min' },
  { label: '提前 5 分钟', value: '5min' },
  { label: '提前 15 分钟', value: '15min' },
  { label: '提前 30 分钟', value: '30min' },
  { label: '提前 1 小时', value: '1hour' },
  { label: '日程当天 (09:00)', value: 'day_0900' },
  { label: '提前 1 天 (09:00)', value: '1day' },
  { label: '提前 3 天', value: '3days' },
];

const REPEAT_OPTIONS = [
  { label: '不重复', value: 'none' as const },
  { label: '每天', value: 'daily' as const },
  { label: '每周', value: 'weekly' as const },
  { label: '每月', value: 'monthly' as const },
  { label: '每年', value: 'yearly' as const },
];

export const CalendarReminderOverlay: React.FC<CalendarReminderOverlayProps> = ({
  show,
  isDarkMode,
  reminderItem,
  onClose,
  onComplete,
  onUpdateItem,
  isAlertMode = false,
}) => {
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [completeSuccess, setCompleteSuccess] = useState(false);

  // Form State
  const [taskName, setTaskName] = useState('');
  const [itemType, setItemType] = useState<ScheduleType>('regular');
  const [startTime, setStartTime] = useState('07:45');
  const [endTime, setEndTime] = useState('08:45');
  const [isAllDay, setIsAllDay] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'yearly' | 'daily' | 'weekly' | 'monthly' | 'none'>('none');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [leadTime, setLeadTime] = useState('0min');
  const [itemDateStr, setItemDateStr] = useState('');

  // Dropdown Popovers
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [isLeadTimePickerOpen, setIsLeadTimePickerOpen] = useState(false);
  const [isRepeatPickerOpen, setIsRepeatPickerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Weather Text
  const [weatherInfo, setWeatherInfo] = useState({ text: '晴朗 26°C', tip: '适合户外', icon: 'sun' });

  // Sync Item on Open
  useEffect(() => {
    if (show && reminderItem) {
      setIsSnoozing(false);
      setCompleteSuccess(false);
      setIsTypePickerOpen(false);
      setIsLeadTimePickerOpen(false);
      setIsRepeatPickerOpen(false);

      const rawItem = reminderItem.item || (reminderItem as any).data;
      if (rawItem) {
        setTaskName(rawItem.task || (rawItem as any).title || '日程事项');

        let detectedType: ScheduleType = (rawItem as ScheduleItem).type || (reminderItem.type === 'todo' ? 'todo' : 'regular');
        if (rawItem.type) detectedType = rawItem.type;
        setItemType(detectedType);

        const allDayDefault = (detectedType === 'festival' || detectedType === 'birthday') ? true : !!(rawItem as ScheduleItem).isAllDay;
        setIsAllDay(allDayDefault);

        const repeatDefault = (detectedType === 'festival' || detectedType === 'birthday') ? 'yearly' : ((rawItem as ScheduleItem).repeat || 'none');
        setRepeatMode(repeatDefault);

        const startT = rawItem.time || '07:45';
        setStartTime(startT);

        if ((rawItem as ScheduleItem).endTime) {
          setEndTime((rawItem as ScheduleItem).endTime!);
        } else {
          const [h, m] = startT.split(':').map(Number);
          const totalMin = (h || 7) * 60 + (m || 45) + 60;
          const endH = Math.floor(totalMin / 60) % 24;
          const endM = totalMin % 60;
          setEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
        }

        setReminderEnabled(rawItem.reminderEnabled !== undefined ? rawItem.reminderEnabled : true);
        setLeadTime(rawItem.leadTime || (detectedType === 'birthday' ? 'day_0900' : '0min'));

        // Format Date string: e.g. "8月15日 周六"
        let d = new Date();
        if ((rawItem as any).date) {
          const parsed = new Date((rawItem as any).date);
          if (!isNaN(parsed.getTime())) d = parsed;
        }
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
        setItemDateStr(`${m}月${day}日 ${week}`);
      }

      // Weather mapping
      const hour = parseInt((rawItem?.time || '08:00').split(':')[0], 10);
      if (hour >= 6 && hour < 12) {
        setWeatherInfo({ text: '晴朗 24°C', tip: '适合户外活动', icon: 'sun' });
      } else if (hour >= 12 && hour < 18) {
        setWeatherInfo({ text: '晴 28°C', tip: '天气晴好', icon: 'sun' });
      } else if (hour >= 18 && hour < 22) {
        setWeatherInfo({ text: '多云 22°C', tip: '清爽舒适', icon: 'cloud' });
      } else {
        setWeatherInfo({ text: '清凉 19°C', tip: '夜间微凉', icon: 'cloud' });
      }
    }
  }, [show, reminderItem]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsTypePickerOpen(false);
        setIsLeadTimePickerOpen(false);
        setIsRepeatPickerOpen(false);
      }
    };
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show]);

  if (!reminderItem) return null;
  const item = reminderItem.item || (reminderItem as any).data;
  if (!item) return null;

  const currentTypeConfig = SCHEDULE_TYPES.find(t => t.id === itemType) || SCHEDULE_TYPES[0];
  const currentLeadTimeLabel = LEAD_TIME_OPTIONS.find(o => o.value === leadTime)?.label || '日程发生时';
  const currentRepeatLabel = REPEAT_OPTIONS.find(o => o.value === repeatMode)?.label || '不重复';

  // Handle Type Change
  const handleSelectType = (newType: ScheduleType) => {
    setItemType(newType);
    setIsTypePickerOpen(false);

    if (newType === 'festival' || newType === 'birthday') {
      setIsAllDay(true);
      setRepeatMode('yearly');
      setLeadTime('day_0900');
    } else {
      setIsAllDay(false);
      setRepeatMode('none');
      setLeadTime('0min');
    }
  };

  const handleSaveAndAction = (actionType: 'complete' | 'snooze' | 'save') => {
    if (onUpdateItem) {
      onUpdateItem(item.id, itemType === 'todo' ? 'todo' : 'schedule', {
        task: taskName.trim() || '未命名日程',
        type: itemType,
        time: isAllDay ? undefined : startTime,
        endTime: isAllDay ? undefined : endTime,
        isAllDay,
        repeat: repeatMode,
        reminderEnabled,
        leadTime,
      });
    }

    if (actionType === 'complete') {
      if (completeSuccess) return;
      setCompleteSuccess(true);
      setTimeout(() => {
        onComplete(item.id, itemType === 'todo' ? 'todo' : 'schedule');
        onClose();
      }, 450);
    } else if (actionType === 'snooze') {
      setIsSnoozing(true);
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center p-3 rounded-[3rem] overflow-hidden"
          id="calendar-reminder-overlay-bg"
        >
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 backdrop-blur-md ${isDarkMode ? 'bg-black/80' : 'bg-slate-900/40'}`} 
            onClick={onClose}
          />

          <div className="relative w-full h-full flex items-center justify-center pointer-events-auto" ref={containerRef}>
            
            {/* Skeuomorphic Assembly */}
            <motion.div 
              initial={{ scale: 0.94, y: 15 }}
              animate={{ 
                scale: 1, 
                y: 0,
                rotate: isAlertMode ? [0, -1.2, 1.2, -1, 1, 0] : 0 
              }}
              exit={{ scale: 0.94, y: 15 }}
              transition={isAlertMode ? { rotate: { repeat: Infinity, duration: 1.2, repeatDelay: 1 } } : { duration: 0.2 }}
              className="relative group flex items-center justify-center"
            >
              
              {/* ===== RIGHT-SIDE PHYSICAL MECHANICAL CONTROL LEVERS ===== */}
              <div className="absolute -right-11 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
                {itemType === 'todo' ? (
                  <>
                    {/* Complete Button Lever */}
                    <motion.button
                      whileHover={{ x: -3, scale: 1.02 }}
                      whileTap={{ x: 2, scale: 0.96 }}
                      onClick={() => handleSaveAndAction('complete')}
                      disabled={completeSuccess}
                      className={`w-12 h-20 rounded-tr-2xl border-t-2 border-r-2 border-b-2 shadow-[6px_4px_16px_rgba(0,0,0,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center cursor-pointer transition-all ${
                        completeSuccess
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-300 text-white shadow-inner'
                          : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 border-emerald-300 text-white hover:brightness-105'
                      }`}
                      title="完成待办"
                    >
                      <div className="w-8 h-12 rounded-xl bg-black/10 border border-white/20 flex items-center justify-center shadow-inner">
                        <Check size={20} className="stroke-[3] drop-shadow-sm" />
                      </div>
                    </motion.button>

                    {/* Exit Button Lever */}
                    <motion.button
                      whileHover={{ x: -3, scale: 1.02 }}
                      whileTap={{ x: 2, scale: 0.96 }}
                      onClick={onClose}
                      className={`w-12 h-16 rounded-br-2xl border-b-2 border-r-2 border-t shadow-[6px_4px_14px_rgba(0,0,0,0.25),inset_0_1px_3px_rgba(255,255,255,0.3)] flex items-center justify-center cursor-pointer transition-all ${
                        isDarkMode 
                          ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-slate-300 hover:text-white' 
                          : 'bg-gradient-to-br from-slate-200 to-slate-300 border-slate-400 text-slate-700 hover:text-slate-900'
                      }`}
                      title="退出"
                    >
                      <div className="w-8 h-10 rounded-xl bg-black/10 border border-white/20 flex items-center justify-center shadow-inner">
                        <X size={18} strokeWidth={2.8} className="drop-shadow-sm" />
                      </div>
                    </motion.button>
                  </>
                ) : (
                  <>
                    {/* Save Button Lever */}
                    <motion.button
                      whileHover={{ x: -3, scale: 1.02 }}
                      whileTap={{ x: 2, scale: 0.96 }}
                      onClick={() => handleSaveAndAction('save')}
                      className="w-12 h-20 rounded-tr-2xl border-t-2 border-r-2 border-b-2 shadow-[6px_4px_16px_rgba(0,0,0,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center cursor-pointer transition-all bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 border-blue-300 text-white hover:brightness-105"
                      title="保存日程"
                    >
                      <div className="w-8 h-12 rounded-xl bg-black/10 border border-white/20 flex items-center justify-center shadow-inner">
                        <Check size={20} className="stroke-[3] drop-shadow-sm" />
                      </div>
                    </motion.button>

                    {/* Exit Button Lever */}
                    <motion.button
                      whileHover={{ x: -3, scale: 1.02 }}
                      whileTap={{ x: 2, scale: 0.96 }}
                      onClick={onClose}
                      className={`w-12 h-16 rounded-br-2xl border-b-2 border-r-2 border-t shadow-[6px_4px_14px_rgba(0,0,0,0.25),inset_0_1px_3px_rgba(255,255,255,0.3)] flex items-center justify-center cursor-pointer transition-all ${
                        isDarkMode 
                          ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-slate-300 hover:text-white' 
                          : 'bg-gradient-to-br from-slate-200 to-slate-300 border-slate-400 text-slate-700 hover:text-slate-900'
                      }`}
                      title="退出"
                    >
                      <div className="w-8 h-10 rounded-xl bg-black/10 border border-white/20 flex items-center justify-center shadow-inner">
                        <X size={18} strokeWidth={2.8} className="drop-shadow-sm" />
                      </div>
                    </motion.button>
                  </>
                )}
              </div>

              {/* ===== MAIN SKEUOMORPHIC CARD SHELL ===== */}
              <motion.div 
                animate={isSnoozing ? { y: 240, opacity: 0 } : {}}
                transition={{ duration: 0.3 }}
                className={`relative w-[23.5rem] sm:w-[25.5rem] min-h-[32rem] max-h-[37rem] rounded-[2.2rem] p-5 shadow-[0_25px_60px_rgba(0,0,0,0.45),inset_0_2px_6px_rgba(255,255,255,0.4)] z-10 overflow-y-auto border flex flex-col justify-between scrollbar-none ${
                  isDarkMode 
                    ? 'bg-[#181a20] border-slate-700/80 text-slate-100' 
                    : 'bg-[#f4f4f6] border-slate-300/80 text-slate-800'
                }`}
              >
                
                {/* Top Metallic Rivet Clip */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-3.5 bg-gradient-to-b from-slate-300 via-slate-100 to-slate-400 rounded-b-lg border-x border-b border-slate-400/80 shadow-xs flex items-center justify-between px-3 z-20">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-inner" />
                  <div className="w-12 h-1 bg-slate-700/30 rounded-full" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-inner" />
                </div>

                {/* Left Hole Punches */}
                <div className="absolute left-2.5 top-0 bottom-0 flex flex-col justify-around py-8 pointer-events-none opacity-25 z-10">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full shadow-inner border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-400 border-slate-500'}`} />
                  ))}
                </div>

                {/* Content Interior Area */}
                <div className="pl-3.5 pr-1 pt-2 flex-1 flex flex-col gap-3.5">
                  
                  {/* ============================================================== */}
                  {/* CARD 1: 核心信息与时间设置块 (Hero Info & Time Card) */}
                  {/* ============================================================== */}
                  <div className={`rounded-2xl p-4 transition-all relative border shadow-xs ${
                    isDarkMode 
                      ? 'bg-[#222630] border-slate-700/60' 
                      : 'bg-white border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
                  }`}>
                    
                    {/* 1. 事项名称 (大标题，最醒目) */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        {completeSuccess && (
                          <span className="text-[11px] font-bold text-emerald-500 animate-pulse flex items-center gap-1">
                            <CheckCircle2 size={12} /> 已标记完成
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        placeholder="输入日程内容..."
                        className={`w-full text-xl sm:text-2xl font-black bg-transparent outline-none tracking-tight leading-snug placeholder:text-slate-400 ${
                          completeSuccess ? 'line-through opacity-50' : ''
                        } ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                      />
                    </div>

                    {/* 2. 时间与日期设置 (结合图2/图3/图4：日期是时间的一部分，并包含天气) */}
                    {isAllDay ? (
                      /* 全天日程模式 (节日/生日/全天事件) */
                      <div className="py-2">
                        <div className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <span>{itemDateStr}</span>
                          <span className="text-xs font-semibold text-slate-400">全天</span>
                        </div>
                        {/* 天气与情境建议融合 */}
                        <div className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                          <Sun size={13} className="text-amber-500 inline-block shrink-0" />
                          <span>天气{weatherInfo.text}，{weatherInfo.tip}</span>
                        </div>
                      </div>
                    ) : (
                      /* 时段型日程模式 (开始与结束并排) */
                      <div className="py-1">
                        <div className="grid grid-cols-2 gap-4">
                          {/* 开始时间 */}
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-400 mb-0.5">开始</span>
                            <div className="flex items-baseline gap-1">
                              <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className={`text-xl sm:text-2xl font-black font-mono bg-transparent outline-none cursor-pointer -ml-0.5 ${
                                  isDarkMode ? 'text-white' : 'text-slate-900'
                                }`}
                              />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              {itemDateStr}
                            </span>
                          </div>

                          {/* 结束时间 */}
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-400 mb-0.5">结束</span>
                            <div className="flex items-baseline gap-1">
                              <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className={`text-xl sm:text-2xl font-black font-mono bg-transparent outline-none cursor-pointer -ml-0.5 ${
                                  isDarkMode ? 'text-white' : 'text-slate-900'
                                }`}
                              />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              {itemDateStr}
                            </span>
                          </div>
                        </div>

                        {/* 天气情境条目 (8/14，天气晴朗，适合户外？) */}
                        <div className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
                          <Sun size={13} className="text-amber-500 inline-block shrink-0" />
                          <span>天气{weatherInfo.text}，{weatherInfo.tip}</span>
                        </div>
                      </div>
                    )}

                    {/* 3. 卡片底部：分类点标与全天开关 (参考图2/3/4中的点标式类型) */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      {/* 类型选择触发点 */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsTypePickerOpen(!isTypePickerOpen);
                            setIsLeadTimePickerOpen(false);
                            setIsRepeatPickerOpen(false);
                          }}
                          className="flex items-center gap-2 py-0.5 px-1 -ml-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${currentTypeConfig.dotColor}`} />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {currentTypeConfig.label}
                          </span>
                          <ChevronDown size={13} className="text-slate-400 opacity-80" />
                        </button>

                        {/* 类型 Popover */}
                        <AnimatePresence>
                          {isTypePickerOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.96 }}
                              className={`absolute top-full left-0 mt-1.5 p-1.5 rounded-xl border shadow-xl z-50 min-w-[9.5rem] backdrop-blur-md ${
                                isDarkMode 
                                  ? 'bg-[#292e3b] border-slate-700 shadow-black/60' 
                                  : 'bg-white border-slate-200 shadow-slate-300/50'
                              }`}
                            >
                              <div className="flex flex-col gap-0.5">
                                {SCHEDULE_TYPES.map((t) => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleSelectType(t.id)}
                                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                                      itemType === t.id 
                                        ? 'bg-blue-500 text-white' 
                                        : isDarkMode ? 'hover:bg-white/5 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${t.dotColor}`} />
                                      <span>{t.label}</span>
                                    </div>
                                    {itemType === t.id && <Check size={13} className="stroke-[3]" />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* 全天 / 时段 快速切换 */}
                      <button
                        type="button"
                        onClick={() => setIsAllDay(!isAllDay)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          isAllDay 
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        {isAllDay ? '全天事件' : '时段日程'}
                      </button>
                    </div>

                  </div>


                  {/* ============================================================== */}
                  {/* CARD 2: 设置与规则列表块 (Settings & Notification List) */}
                  {/* ============================================================== */}
                  <div className={`rounded-2xl transition-all relative border overflow-hidden shadow-xs ${
                    isDarkMode 
                      ? 'bg-[#222630] border-slate-700/60' 
                      : 'bg-white border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
                  }`}>
                    
                    {/* 1. 提醒时间 (Row 1) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLeadTimePickerOpen(!isLeadTimePickerOpen);
                          setIsTypePickerOpen(false);
                          setIsRepeatPickerOpen(false);
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer text-left"
                      >
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">提醒</span>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <span className="text-xs font-semibold">{currentLeadTimeLabel}</span>
                          <ChevronDown size={14} className="opacity-70" />
                        </div>
                      </button>

                      {/* 提醒时间 Popover */}
                      <AnimatePresence>
                        {isLeadTimePickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                            className={`absolute top-full left-3 right-3 mt-1 p-1.5 rounded-xl border shadow-xl z-50 backdrop-blur-md max-h-48 overflow-y-auto ${
                              isDarkMode 
                                ? 'bg-[#292e3b] border-slate-700 shadow-black/60' 
                                : 'bg-white border-slate-200 shadow-slate-300/50'
                            }`}
                          >
                            <div className="flex flex-col gap-0.5">
                              {LEAD_TIME_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setLeadTime(opt.value);
                                    setIsLeadTimePickerOpen(false);
                                  }}
                                  className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                                    leadTime === opt.value 
                                      ? 'bg-blue-500 text-white' 
                                      : isDarkMode ? 'hover:bg-white/5 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {leadTime === opt.value && <Check size={13} className="stroke-[3]" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 分割线 */}
                    <div className="border-t border-slate-100 dark:border-slate-800/80 mx-4" />

                    {/* 2. 响铃提醒 (Row 2) */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">响铃提醒</span>
                      
                      {/* iOS风格/拟物极简开关 */}
                      <button
                        type="button"
                        onClick={() => setReminderEnabled(!reminderEnabled)}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer relative shadow-inner ${
                          reminderEnabled 
                            ? 'bg-blue-500' 
                            : isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
                        }`}
                      >
                        <motion.div
                          animate={{ x: reminderEnabled ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          className="w-5 h-5 rounded-full bg-white shadow-md"
                        />
                      </button>
                    </div>

                    {/* 分割线 */}
                    <div className="border-t border-slate-100 dark:border-slate-800/80 mx-4" />

                    {/* 3. 重复规则 (Row 3) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRepeatPickerOpen(!isRepeatPickerOpen);
                          setIsTypePickerOpen(false);
                          setIsLeadTimePickerOpen(false);
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer text-left"
                      >
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">重复</span>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <span className="text-xs font-semibold">{currentRepeatLabel}</span>
                          <ChevronRight size={14} className="opacity-70" />
                        </div>
                      </button>

                      {/* 重复规则 Popover */}
                      <AnimatePresence>
                        {isRepeatPickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                            className={`absolute bottom-full left-3 right-3 mb-1 p-1.5 rounded-xl border shadow-xl z-50 backdrop-blur-md ${
                              isDarkMode 
                                ? 'bg-[#292e3b] border-slate-700 shadow-black/60' 
                                : 'bg-white border-slate-200 shadow-slate-300/50'
                            }`}
                          >
                            <div className="flex flex-col gap-0.5">
                              {REPEAT_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setRepeatMode(opt.value);
                                    setIsRepeatPickerOpen(false);
                                  }}
                                  className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                                    repeatMode === opt.value 
                                      ? 'bg-blue-500 text-white' 
                                      : isDarkMode ? 'hover:bg-white/5 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {repeatMode === opt.value && <Check size={13} className="stroke-[3]" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>

                </div>

                {/* ===== SKEUOMORPHIC BOTTOM SUBTLE LOGO ===== */}
                <div className="pl-3.5 pr-1 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-bold text-slate-400/80">
                  <span className="tracking-wider uppercase font-mono">
                    AETHER · SCHEDULE DETAIL
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70" />
                </div>

              </motion.div>

            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
