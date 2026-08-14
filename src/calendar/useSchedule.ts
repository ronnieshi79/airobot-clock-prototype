import { useState, useMemo } from 'react';
import { ScheduleItem, TodoItem, ScheduleType } from '../types';

export const getLocalDateString = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const isScheduleOnDate = (schedule: ScheduleItem, targetDate: Date) => {
  const targetStr = getLocalDateString(targetDate);
  const targetMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
  const targetDay = String(targetDate.getDate()).padStart(2, '0');
  const targetMonthDay = `${targetMonth}-${targetDay}`;

  // For annual festivals and birthdays
  if (schedule.repeat === 'yearly' || schedule.type === 'festival' || schedule.type === 'birthday') {
    if (schedule.date) {
      const parts = schedule.date.split('-');
      if (parts.length === 3) {
        return `${parts[1]}-${parts[2]}` === targetMonthDay;
      } else if (parts.length === 2) {
        return schedule.date === targetMonthDay;
      }
    }
  }

  // Exact date match
  if (schedule.date) {
    return schedule.date === targetStr;
  }

  // Day of week match
  if (schedule.dayOfWeek !== undefined) {
    return schedule.dayOfWeek === targetDate.getDay();
  }

  return false;
};

export const useSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedScheduleDay, setSelectedScheduleDay] = useState(new Date().getDay());
  
  const today = new Date();
  const todayStr = getLocalDateString(today);
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000));
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const nextMonthStr = getLocalDateString(nextMonthDate);

  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    // 1. 重要节日 (默认全天，每年重复)
    {
      id: 'fest-1',
      task: '劳动节',
      type: 'festival',
      isAllDay: true,
      repeat: 'yearly',
      date: `${today.getFullYear()}-05-01`,
      completed: false,
      reminderEnabled: true,
      leadTime: '1day',
      createdAt: Date.now() - 1000000,
    },
    {
      id: 'fest-2',
      task: '国庆节',
      type: 'festival',
      isAllDay: true,
      repeat: 'yearly',
      date: `${today.getFullYear()}-10-01`,
      completed: false,
      reminderEnabled: true,
      leadTime: '1day',
      createdAt: Date.now() - 900000,
    },
    // 2. 生日 (默认全天，每年重复)
    {
      id: 'birth-1',
      task: '妈妈生日',
      type: 'birthday',
      isAllDay: true,
      repeat: 'yearly',
      date: todayStr, // Occurs today for instant visibility
      completed: false,
      reminderEnabled: true,
      leadTime: '1day',
      createdAt: Date.now() - 800000,
    },
    {
      id: 'birth-2',
      task: '好友小林生日',
      type: 'birthday',
      isAllDay: true,
      repeat: 'yearly',
      date: nextMonthStr,
      completed: false,
      reminderEnabled: true,
      leadTime: '1day',
      createdAt: Date.now() - 700000,
    },
    // 3. 普通日程
    {
      id: 'sched-1',
      time: '08:00',
      task: '晨读时光',
      type: 'regular',
      completed: true,
      dayOfWeek: today.getDay(),
      date: todayStr,
      reminderEnabled: true,
      leadTime: '15min',
      createdAt: Date.now() - 600000,
    },
    {
      id: 'sched-2',
      time: '14:00',
      task: 'AI 编程学习',
      type: 'regular',
      completed: false,
      dayOfWeek: today.getDay(),
      date: todayStr,
      reminderEnabled: true,
      leadTime: '15min',
      createdAt: Date.now() - 500000,
    },
    {
      id: 'sched-3',
      time: '19:00',
      task: '体能锻炼',
      type: 'regular',
      completed: false,
      dayOfWeek: today.getDay(),
      date: todayStr,
      reminderEnabled: true,
      leadTime: '30min',
      createdAt: Date.now() - 400000,
    },
    {
      id: 'sched-4',
      time: '10:00',
      task: '周一例会',
      type: 'regular',
      completed: false,
      dayOfWeek: 1,
      reminderEnabled: true,
      leadTime: '15min',
      createdAt: Date.now() - 300000,
    },
    // 4. 待办 (作为日程的一种特殊类型)
    {
      id: 'todo-1',
      task: '回复客户邮件',
      type: 'todo',
      status: 'open',
      completed: false,
      date: todayStr,
      time: '10:00',
      reminderEnabled: true,
      leadTime: '15min',
      createdAt: Date.now() - 200000,
    },
    {
      id: 'todo-2',
      task: '购买办公用品',
      type: 'todo',
      status: 'closed',
      completed: true,
      date: todayStr,
      time: '',
      reminderEnabled: false,
      createdAt: Date.now() - 100000,
    },
    {
      id: 'todo-3',
      task: '准备下周PPT',
      type: 'todo',
      status: 'open',
      completed: false,
      date: yesterdayStr, // Overdue
      time: '15:00',
      reminderEnabled: true,
      leadTime: '30min',
      createdAt: Date.now() - 86400000,
    },
  ]);

  // Derived todos array for seamless backward compatibility
  const todos = useMemo<TodoItem[]>(() => {
    return schedules
      .filter(s => s.type === 'todo')
      .map(s => ({
        id: s.id,
        task: s.task,
        status: s.status || (s.completed ? 'closed' : 'open'),
        type: 'todo',
        date: s.date,
        time: s.time,
        isAllDay: s.isAllDay,
        repeat: s.repeat,
        reminderEnabled: s.reminderEnabled,
        leadTime: s.leadTime,
        createdAt: s.createdAt || Date.now(),
      }));
  }, [schedules]);

  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newTime, setNewTime] = useState("09:00");

  const checkDailyLimit = (date?: string, dow?: number) => {
    let count = 0;
    schedules.forEach(s => {
      if (date && s.date === date) count++;
      else if (!date && !s.date && dow !== undefined && s.dayOfWeek === dow) count++;
      else if (date && !s.date && s.dayOfWeek !== undefined) {
        const d = new Date(date);
        if (d.getDay() === s.dayOfWeek) count++;
      }
    });
    
    if (count >= 10) {
      alert('每日的日程事务、代办总数不能超过10条');
      return false;
    }
    return true;
  };

  const addSchedule = (
    task: string,
    time: string = '09:00',
    dayOfWeek: number = new Date().getDay(),
    date?: string,
    type: ScheduleType = 'regular',
    isAllDay: boolean = false,
    repeat: 'yearly' | 'daily' | 'weekly' | 'monthly' | 'none' = 'none'
  ) => {
    if (!checkDailyLimit(date, dayOfWeek)) return false;
    
    // Festivals and Birthdays default to all-day & yearly repeat
    const actualIsAllDay = (type === 'festival' || type === 'birthday') ? true : isAllDay;
    const actualRepeat = (type === 'festival' || type === 'birthday') ? 'yearly' : repeat;

    const newSchedule: ScheduleItem = {
      id: Math.random().toString(36).substr(2, 9),
      task,
      type,
      time: actualIsAllDay ? undefined : time,
      isAllDay: actualIsAllDay,
      repeat: actualRepeat,
      completed: false,
      status: type === 'todo' ? 'open' : undefined,
      dayOfWeek,
      date: date || getLocalDateString(new Date()),
      reminderEnabled: true,
      leadTime: type === 'festival' || type === 'birthday' ? '1day' : '15min',
      createdAt: Date.now()
    };
    setSchedules(prev => [...prev, newSchedule]);
    return true;
  };

  const toggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(s => {
      if (s.id === id) {
        const newCompleted = !s.completed;
        return { 
          ...s, 
          completed: newCompleted,
          status: s.type === 'todo' ? (newCompleted ? 'closed' : 'open') : s.status
        };
      }
      return s;
    }));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const updateSchedule = (id: string, updates: Partial<ScheduleItem>) => {
    setSchedules(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          ...updates,
          status: updates.status || (updates.completed !== undefined ? (updates.completed ? 'closed' : 'open') : s.status),
          completed: updates.completed !== undefined ? updates.completed : (updates.status ? updates.status === 'closed' : s.completed),
        };
      }
      return s;
    }));
  };

  const addTodo = (task: string, date?: string, time?: string) => {
    if (!checkDailyLimit(date)) return false;
    const newTodo: ScheduleItem = {
      id: Math.random().toString(36).substr(2, 9),
      task,
      type: 'todo',
      status: 'open',
      completed: false,
      date: date || getLocalDateString(new Date()),
      time,
      reminderEnabled: true,
      leadTime: '15min',
      createdAt: Date.now()
    };
    setSchedules(prev => [newTodo, ...prev]);
    return true;
  };

  const toggleTodo = (id: string) => {
    toggleSchedule(id);
  };

  const deleteTodo = (id: string) => {
    deleteSchedule(id);
  };

  const setTodos = (setter: TodoItem[] | ((prev: TodoItem[]) => TodoItem[])) => {
    if (typeof setter === 'function') {
      setSchedules(prev => {
        const currentTodos = prev.filter(s => s.type === 'todo').map(s => ({
          id: s.id,
          task: s.task,
          status: s.status || 'open',
          type: 'todo' as const,
          date: s.date,
          time: s.time,
          createdAt: s.createdAt || Date.now()
        }));
        const newTodos = setter(currentTodos);
        const nonTodos = prev.filter(s => s.type !== 'todo');
        const converted = newTodos.map(t => ({
          ...t,
          type: 'todo' as const,
          completed: t.status === 'closed',
        }));
        return [...nonTodos, ...converted];
      });
    } else {
      const nonTodos = schedules.filter(s => s.type !== 'todo');
      const converted = setter.map(t => ({
        ...t,
        type: 'todo' as const,
        completed: t.status === 'closed',
      }));
      setSchedules([...nonTodos, ...converted]);
    }
  };

  return {
    selectedDate,
    setSelectedDate,
    selectedScheduleDay,
    setSelectedScheduleDay,
    schedules,
    setSchedules,
    todos,
    setTodos,
    isAddingSchedule,
    setIsAddingSchedule,
    newTask,
    setNewTask,
    newTime,
    setNewTime,
    addSchedule,
    toggleSchedule,
    deleteSchedule,
    updateSchedule,
    addTodo,
    toggleTodo,
    deleteTodo
  };
};
