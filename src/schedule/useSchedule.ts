import { useState } from 'react';
import { ScheduleItem, TodoItem } from '../types';

const getLocalDateString = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedScheduleDay, setSelectedScheduleDay] = useState(new Date().getDay());
  
  // Date formatting helper for current day strings
  const todayStr = getLocalDateString(new Date());
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000));

  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { id: '1', time: '08:00', task: '晨读时光', completed: true, dayOfWeek: new Date().getDay(), date: todayStr },
    { id: '2', time: '14:00', task: 'AI 编程学习', completed: false, dayOfWeek: new Date().getDay(), date: todayStr },
    { id: '3', time: '19:00', task: '体能锻炼', completed: false, dayOfWeek: new Date().getDay(), date: todayStr },
    { id: '4', time: '10:00', task: '周一例会', completed: false, dayOfWeek: 1 },
    { id: '5', time: '15:00', task: '图书馆自习', completed: false, dayOfWeek: 3 },
    { id: '6', time: '09:00', task: '周末大扫除', completed: false, dayOfWeek: 6 },
  ]);

  const [todos, setTodos] = useState<TodoItem[]>([
    { id: 't1', task: '回复客户邮件', status: 'open', date: todayStr, time: '10:00', createdAt: Date.now() },
    { id: 't2', task: '购买办公用品', status: 'closed', date: todayStr, time: '', createdAt: Date.now() - 3600000 },
    { id: 't3', task: '准备下周PPT', status: 'open', date: yesterdayStr, time: '15:00', createdAt: Date.now() - 86400000 }, // Overdue
  ]);

  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newTime, setNewTime] = useState("09:00");

  const checkDailyLimit = (date?: string, dow?: number) => {
    let count = 0;
    schedules.forEach(s => {
      if (date && s.date === date) count++;
      else if (!date && !s.date && dow !== undefined && s.dayOfWeek === dow) count++;
      else if (date && !s.date && s.dayOfWeek !== undefined) {
        // approximate check: if the schedule recurs on this day of the week
        const d = new Date(date);
        if (d.getDay() === s.dayOfWeek) count++;
      }
    });
    todos.forEach(t => {
      if (date && t.date === date) count++;
    });
    
    if (count >= 5) {
      alert('每日的日程事务、代办总数不能超过5条');
      return false;
    }
    return true;
  };

  const addSchedule = (task: string, time: string, dayOfWeek: number, date?: string) => {
    if (!checkDailyLimit(date, dayOfWeek)) return false;
    const newSchedule: ScheduleItem = {
      id: Math.random().toString(36).substr(2, 9),
      task,
      time,
      completed: false,
      dayOfWeek,
      date
    };
    setSchedules(prev => [...prev, newSchedule]);
    return true;
  };

  const toggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const addTodo = (task: string, date?: string, time?: string) => {
    if (!checkDailyLimit(date)) return false;
    const newTodo: TodoItem = {
      id: Math.random().toString(36).substr(2, 9),
      task,
      status: 'open',
      date,
      time,
      createdAt: Date.now()
    };
    setTodos(prev => [newTodo, ...prev]);
    return true;
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'open' ? 'closed' : 'open' } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
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
    addTodo,
    toggleTodo,
    deleteTodo
  };
};
