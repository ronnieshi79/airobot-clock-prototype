import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListTodo, CheckSquare, Square, Clock, Plus, Calendar as CalendarIcon, Sparkles, Bot } from 'lucide-react';
import { TodoItem, ScheduleItem, MainCategory, SubCategory } from '../types';
import { SchedulePlannerOverlay } from './SchedulePlannerOverlay';
import { getTodayInfo } from './utils';

interface CalendarListViewProps {
  isDarkMode: boolean;
  todos: TodoItem[];
  schedules: ScheduleItem[];
  time: Date;
  onNavigate: (cat: MainCategory, sub: SubCategory) => void;
  onToggleTodo: (id: string) => void;
  onAddTodo: (task: string, date?: string, time?: string) => void;
  onToggleSchedule: (id: string) => void;
}

export const CalendarListView: React.FC<CalendarListViewProps> = ({ 
  isDarkMode, 
  todos, 
  schedules,
  time,
  onNavigate,
  onToggleTodo,
  onAddTodo,
  onToggleSchedule
}) => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'overdue' | 'open'>('today');
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [addType, setAddType] = useState<'todo' | 'schedule'>('todo');
  
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [activePlannerItem, setActivePlannerItem] = useState<{ id: string, type: 'schedule' | 'todo' } | undefined>(undefined);

  const openPlanner = (item: { id: string, type: 'schedule' | 'todo' }) => {
    setActivePlannerItem(item);
    setPlannerOpen(true);
  };
  
  const dayInfo = getTodayInfo(time);

  const todayStr = time.toISOString().split('T')[0];
  const nextWeekTime = time.getTime() + 7 * 86400000;
  const nextWeekStr = new Date(nextWeekTime).toISOString().split('T')[0];

  type ListItem = 
    | { type: 'todo', data: TodoItem }
    | { type: 'schedule', data: ScheduleItem };

  const allItems: ListItem[] = [];
  
  todos.forEach(t => allItems.push({ type: 'todo', data: t }));
  schedules.forEach(s => allItems.push({ type: 'schedule', data: s }));

  const filteredItems = allItems.filter(item => {
    // Determine the date string for the item
    let itemDate = '';
    let isOpen = false;
    
    if (item.type === 'todo') {
      itemDate = item.data.date || '';
      isOpen = item.data.status === 'open';
    } else {
      // Schedule item
      itemDate = item.data.date || '';
      if (!itemDate) {
        // Fallback for schedule without fixed date (derive from dayOfWeek logic)
        const dayDiff = (item.data.dayOfWeek - time.getDay() + 7) % 7;
        const d = new Date(time.getTime() + dayDiff * 86400000);
        itemDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      isOpen = itemDate ? itemDate >= todayStr : true; // Schedules are valid if today or future
    }

    switch (timeFilter) {
      case 'all-todos': return item.type === 'todo'; // Returns all todos
      case 'open': return isOpen; 
      case 'overdue': return itemDate && itemDate < todayStr && (item.type === 'todo' ? isOpen : true);
      case 'today': return itemDate === todayStr;
      case 'week': return itemDate >= todayStr && itemDate <= nextWeekStr;
      default: return true;
    }
  });

  const timeTabs = [
    { id: 'today', label: '今天' },
    { id: 'week', label: '近7天' },
    { id: 'open', label: '进行中' },
    { id: 'overdue', label: '已过期' },
    { id: 'all-todos', label: '所有待办' },
  ] as const;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* 1. Header */}
      <div className="mb-4 flex-shrink-0 pr-12">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>
            <ListTodo size={20} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            AI 事务
          </h2>
        </div>
        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          统一管理你的日程与待办
        </p>
      </div>

      {/* 2. Filters & Controls */}
      <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 flex-1">
            {timeTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id as any)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest whitespace-nowrap transition-colors ${
                  timeFilter === tab.id 
                    ? (isDarkMode ? 'bg-rose-500 text-white' : 'bg-rose-500 text-white')
                    : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>



      {/* 3. List */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 rounded-[2rem] p-4 ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
        <AnimatePresence>
          {filteredItems.length > 0 ? filteredItems.map(item => {
            if (item.type === 'todo') {
              const todo = item.data;
              return (
                <motion.div
                  onClick={() => openPlanner({ id: todo.id, type: 'todo' })}
                  key={`todo-${todo.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    isDarkMode ? 'bg-slate-800/60 border-white/5 hover:bg-slate-800' : 'bg-white border-slate-100 shadow-sm hover:bg-slate-50'
                  }`}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleTodo(todo.id); }}
                    className={`flex-shrink-0 mt-0.5 transition-colors ${
                      todo.status === 'closed' ? 'text-emerald-500' : (isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-300 hover:text-slate-400')
                    }`}
                  >
                    {todo.status === 'closed' ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-black break-words ${todo.status === 'closed' && (isDarkMode ? 'text-slate-500 line-through' : 'text-slate-400 line-through')} ${todo.status === 'open' && (isDarkMode ? 'text-slate-200' : 'text-slate-800')}`}>
                      {todo.task}
                    </h4>
                    <div className={`flex items-center gap-2 mt-2 text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className={`px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>待办</span>
                      {todo.date && (
                        <span className={`px-2 py-0.5 rounded-full ${todo.status === 'open' && todo.date < todayStr ? 'bg-red-500/10 text-red-500' : (isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100')}`}>
                          {todo.date === todayStr ? '今天' : todo.date}
                        </span>
                      )}
                      {todo.time && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {todo.time}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            } else {
              const schedule = item.data;
              return (
                <motion.div
                  onClick={() => openPlanner({ id: schedule.id, type: 'schedule' })}
                  key={`schedule-${schedule.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    isDarkMode ? 'bg-slate-800/60 border-white/5 hover:bg-slate-800' : 'bg-white border-slate-100 shadow-sm hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-500'}`}>
                    <CalendarIcon size={12} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-black break-words mt-0.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {schedule.task}
                    </h4>
                    <div className={`flex items-center gap-2 mt-2 text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className={`px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>日程安排</span>
                      {schedule.time && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {schedule.time}
                        </span>
                      )}
                      {schedule.dayOfWeek !== undefined && (
                        <span>
                          周{['日','一','二','三','四','五','六'][schedule.dayOfWeek]}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            }
          }) : (
            <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed text-center h-full ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
               <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                 当前筛选条件下没有匹配的事务
               </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Task Summary (事务概要组件) */}
      <div className={`mt-4 p-4 rounded-3xl shrink-0 flex items-center justify-between shadow-sm border ${isDarkMode ? 'bg-slate-800/60 border-white/5' : 'bg-white border-slate-100'}`}>
         <div className="flex flex-col gap-1">
           <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
             <Bot size={12} />
             Aether 事务概要
           </span>
           <span className={`text-xs font-bold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
             {(() => {
                const openTodos = todos.filter(t => t.status === 'open');
                const overdues = openTodos.filter(t => t.date && t.date < todayStr);
                const upcoming = openTodos.filter(t => t.date === todayStr);
                
                if (openTodos.length === 0) return '太棒了，所有待办均已清空！享受属于你的时间吧。';

                let summary = `目前共有 ${openTodos.length} 项待办。`;
                if (overdues.length > 0) {
                  summary += `有 ${overdues.length} 项已逾期，建议优先处理！`;
                } else if (upcoming.length > 0) {
                  summary += `其中 ${upcoming.length} 项将于今日到期，请把握进度。`;
                } else {
                   summary += `所有项均在计划内，事务流态健康。`;
                }
                return summary;
             })()}
           </span>
         </div>
      </div>
      
      <SchedulePlannerOverlay 
        isOpen={plannerOpen} 
        onClose={() => setPlannerOpen(false)} 
        isDarkMode={isDarkMode}
        schedules={schedules}
        todos={todos}
        initialItem={activePlannerItem}
        todayInfo={dayInfo}
        time={time}
      />
    </div>
  );
};
