import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rss, Plus, Clock, Check, Bell, Book, Newspaper, BookOpen, 
  Folder, FolderOpen, Upload, Edit3, Trash2, Video, Volume2, 
  Settings, Loader2, Sparkles, X, ChevronRight, HelpCircle
} from 'lucide-react';
import { MainCategory, SubCategory, ScheduleItem } from '../types';

interface PodcastSubscribeViewProps {
  isDarkMode: boolean;
  time: Date;
  schedules: ScheduleItem[];
  onNavigate: (cat: MainCategory, sub: SubCategory) => void;
  onAddCustomEpisode?: (
    title: string, 
    summary: string, 
    content: string, 
    channelName: string, 
    type: 'video' | 'audio' | 'text'
  ) => void;
}

interface Subscription {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'text';
  time: string;
  description: string;
  isSubscribed: boolean;
  isDIY?: boolean;
  sourceDir?: string;
  filesCount?: number;
}

const defaultSubscriptions: Subscription[] = [
  { id: '1', title: '每日科技速递', type: 'text', time: '每天 08:00', description: '每天早上8点，为你播报最新科技圈动态与深度解析。', isSubscribed: true },
  { id: '2', title: '睡前奇幻故事', type: 'text', time: '每天 22:00', description: '伴随轻柔音乐，讲述奇幻睡前故事，助你安然入眠。', isSubscribed: false },
  { id: '3', title: '历史上的今天', type: 'text', time: '每天 09:00', description: '回顾历史长河中今天发生的重大事件与人物故事。', isSubscribed: false },
  { id: '4', title: '商业思维日课', type: 'text', time: '工作日 18:00', description: '下班通勤路上的商业认知升级，解析最新商业案例。', isSubscribed: false },
];

export const PodcastSubscribeView: React.FC<PodcastSubscribeViewProps> = ({ 
  isDarkMode, 
  time,
  schedules,
  onNavigate,
  onAddCustomEpisode
}) => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showDiyModal, setShowDiyModal] = useState(false);
  
  // DIY Form States
  const [diyTitle, setDiyTitle] = useState('我的DIY学术讲座');
  const [diyType, setDiyType] = useState<'video' | 'audio' | 'text'>('text');
  const [diyDir, setDiyDir] = useState('D:/Documents/AudioLectures');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0: idle, 1: scanning, 2: scan complete
  const [scannedFiles, setScannedFiles] = useState<{ name: string; size: string; type: 'audio' | 'video' }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [genProgress, setGenProgress] = useState(0);

  // Edit Subscription state
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');

  // Load subscriptions on mount
  useEffect(() => {
    const saved = localStorage.getItem('aether_podcast_subscriptions_v3');
    if (saved) {
      try {
        setSubs(JSON.parse(saved));
      } catch (e) {
        setSubs(defaultSubscriptions);
      }
    } else {
      setSubs(defaultSubscriptions);
    }
  }, []);

  const saveSubs = (updatedSubs: Subscription[]) => {
    setSubs(updatedSubs);
    localStorage.setItem('aether_podcast_subscriptions_v3', JSON.stringify(updatedSubs));
  };

  const toggleSub = (id: string) => {
    const updated = subs.map(s => {
      if (s.id === id) {
        return { ...s, isSubscribed: !s.isSubscribed };
      }
      return s;
    });
    saveSubs(updated);
  };

  const deleteDiySub = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = subs.filter(s => s.id !== id);
    saveSubs(updated);
  };

  const startScan = () => {
    if (!diyDir.trim()) return;
    setIsScanning(true);
    setScanStep(1);
    
    // Simulate scan steps
    setTimeout(() => {
      setScannedFiles([
        { name: '01_生成式人工智能大模型介绍.mp3', size: '15.4 MB', type: 'audio' },
        { name: '02_强化学习与推荐系统前沿.mp4', size: '42.8 MB', type: 'video' },
        { name: '03_硅谷创业访谈录.wav', size: '28.1 MB', type: 'audio' },
      ]);
      setScanStep(2);
      setIsScanning(false);
    }, 1800);
  };

  const handleCreateDiy = () => {
    if (!diyTitle.trim()) return;
    setIsGenerating(true);
    setGenProgress(5);
    setGenerationStep('正在上传并加载导入的媒体内容...');

    // Simulate multi-step AI creation process
    const steps = [
      { progress: 20, text: '提取音轨中，过滤环境环境背景杂音...' },
      { progress: 45, text: 'Whisper 语音自动转换为高度精确的文字，提炼文本摘要...' },
      { progress: 70, text: '运用 Gemini 大模型进行关键要点提炼、情感角色分工与播客大纲逻辑化重构...' },
      { progress: 90, text: '双人互动主持 (AETHER 和 AI助手小艾) 的音频脚本对话编排成型...' },
      { progress: 100, text: '完成！双人高解析音轨无缝合成，生成可完美快进与追溯的节目章节。' }
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        const next = steps[currentStepIdx];
        setGenProgress(next.progress);
        setGenerationStep(next.text);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        
        // Finalize state
        const newSub: Subscription = {
          id: 'diy_' + Date.now().toString(),
          title: diyTitle,
          type: diyType,
          time: '自动更新',
          description: `基于本地目录 [${diyDir}] 导入的音频、视频自动生成的AI交互播客节目栏目。`,
          isSubscribed: true,
          isDIY: true,
          sourceDir: diyDir,
          filesCount: scannedFiles.length || 3
        };

        const updated = [newSub, ...subs];
        saveSubs(updated);

        // Generate matching detailed episode content
        if (onAddCustomEpisode) {
          const filesString = scannedFiles.map(f => f.name).join(' 和 ');
          const title = `${diyTitle}：智能体媒体重构研讨会`;
          const summary = `本期播客由您导入的本地文件夹媒体资源智能生成，主要提炼了 ${diyTitle} 中的核心理念，解答大模型背景下的常见疑问。`;
          const content = `[主持人: AETHER] 欢迎收听本期专属定制的 AI 播客节目！今天非常有意思，我们的幕后是由听众导入的本地媒体文件，包含了《${filesString}》。小艾，你对这些资料有什么看法？\n\n[AI助手: 小艾] AETHER好，各位听众好！这批导入的音视频非常有深度，分别从大模型原理、强化学习和创业视角给予了解答。特别是第二章中提到的‘微调（Fine-tuning）对特定垂直领域的赋能’，我认为是未来中小企业的关键破局点。\n\n[主持人: AETHER] 确实如此。以往普通人面对几十甚至几百兆的专业音视频课程或者会议记录，往往没有时间反复看。现在通过我们的 DIY AI 播客技术，你可以把这些‘被遗忘在硬盘里的内容’一键转化为轻松、充满互动的主持人对谈电台。下班路上、做家务、冥想的时候就能一键获取知识摘要！\n\n[AI助手: 小艾] 没错！我们也为听众准备了详细的交互问答服务。你在听的过程中，随时可以暂停，通过下方的‘问答气泡’直接问我关于这几篇音视频里面的细节，我会提供秒级精准溯源！这就是 AI + 个人私域知识库带给我们的革命性高效体验。`;

          onAddCustomEpisode(title, summary, content, diyTitle, diyType);
        }

        // Reset & Close
        setIsGenerating(false);
        setShowDiyModal(false);
        setScanStep(0);
        setScannedFiles([]);
        setDiyTitle('我的DIY学术讲座');
        setDiyDir('D:/Documents/AudioLectures');
      }
    }, 1800);
  };

  const handleEditTitle = (id: string, currentTitle: string) => {
    setEditingSubId(id);
    setEditedTitle(currentTitle);
  };

  const saveEditedTitle = (id: string) => {
    if (!editedTitle.trim()) return;
    const updated = subs.map(s => {
      if (s.id === id) {
        return { ...s, title: editedTitle };
      }
      return s;
    });
    saveSubs(updated);
    setEditingSubId(null);
  };

  const mySubs = subs.filter(s => s.isSubscribed);
  const recommendedSubs = subs.filter(s => !s.isSubscribed);

  const typeIcons = {
    video: <Video size={14} className="text-pink-500" />,
    audio: <Volume2 size={14} className="text-sky-500" />,
    text: <Book size={14} className="text-emerald-500" />
  };

  const typeLabels = {
    video: '视频',
    audio: '音频',
    text: '图文'
  };

  const renderSubCard = (sub: Subscription) => {
    const isEditing = editingSubId === sub.id;
    return (
      <motion.div 
        key={sub.id}
        layout
        whileHover={{ scale: 1.01 }}
        className={`relative p-5 rounded-[2rem] border-2 transition-all flex flex-col justify-between ${
          isDarkMode ? 'bg-slate-800/60 border-white/5' : 'bg-white border-slate-100 shadow-sm'
        }`}
      >
        <div>
          {/* Tag Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {typeIcons[sub.type]}
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                sub.type === 'video' ? 'text-pink-500' : 
                sub.type === 'audio' ? 'text-sky-500' : 'text-emerald-500'
              }`}>
                {typeLabels[sub.type]}
              </span>
              
              {sub.isDIY && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  DIY 栏目
                </span>
              )}
            </div>
            
            {sub.isDIY ? (
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => handleEditTitle(sub.id, sub.title)}
                  className={`p-1.5 rounded-lg hover:bg-slate-200/50 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                  title="修改名称"
                >
                  <Edit3 size={12} />
                </button>
                <button 
                  onClick={(e) => deleteDiySub(sub.id, e)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                  title="彻底删除"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                isDarkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                <Clock size={10} />
                {sub.time}
              </div>
            )}
          </div>
          
          {/* Card Title & Description */}
          {isEditing ? (
            <div className="mb-2 flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEditedTitle(sub.id)}
                className={`text-sm font-black rounded-lg px-2 py-1 flex-1 border ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
                autoFocus
              />
              <button 
                onClick={() => saveEditedTitle(sub.id)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
              >
                保存
              </button>
            </div>
          ) : (
            <h4 className={`text-sm font-black mb-1.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {sub.title}
            </h4>
          )}

          {sub.isDIY && sub.sourceDir && (
            <div className="flex items-center gap-1 mb-2 text-[10px] font-black text-indigo-500/90 truncate">
              <Folder size={11} className="shrink-0" />
              <span className="truncate">{sub.sourceDir}</span>
              <span className="shrink-0 bg-indigo-500/15 text-indigo-500 px-1 py-0.2 rounded text-[8px]">
                {sub.filesCount}文件
              </span>
            </div>
          )}
          
          <p className={`text-xs font-bold leading-relaxed mb-4 flex-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {sub.description}
          </p>
        </div>
        
        {/* Actions Button */}
        <button 
          onClick={() => toggleSub(sub.id)}
          className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-colors ${
            sub.isSubscribed 
              ? (isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
              : (isDarkMode ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-indigo-600 text-white hover:bg-indigo-500')
          }`}
        >
          {sub.isSubscribed ? (
            <>
              <Check size={14} />
              已订阅
            </>
          ) : (
            <>
              <Plus size={14} />
              订阅栏目
            </>
          )}
        </button>
      </motion.div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* 1. Top Header */}
      <div className="mb-5 flex-shrink-0 pr-12">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <Rss size={20} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            播客订阅
          </h2>
        </div>
        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          订阅专属频道，定制听你想听
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6 mb-4">
        
        {/* My Subscriptions */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Bell size={16} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
              <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                我的订阅 
              </h3>
            </div>
            <span className={`text-[10px] font-bold ${mySubs.length >= 8 ? 'text-red-500' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {mySubs.length} / 8已订阅
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {mySubs.map(renderSubCard)}
            </AnimatePresence>
            
            {/* Custom Subscription DIY Button */}
            {mySubs.length < 8 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDiyModal(true)}
                className={`relative p-5 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2.5 min-h-[180px] ${
                  isDarkMode 
                    ? 'border-indigo-500/30 bg-indigo-950/10 text-indigo-400 hover:bg-slate-800/50 hover:text-indigo-300 shadow-inner' 
                    : 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 shadow-sm'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' : 'bg-indigo-50 text-indigo-600 shadow-md'}`}>
                  <Plus size={22} className="stroke-[3px]" />
                </div>
                <div className="text-center">
                  <span className={`text-xs font-black block ${isDarkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
                    自定义新栏目
                  </span>
                  <span className={`text-[10px] font-bold mt-1 block opacity-70 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                     导入音视频自动多媒体创作
                  </span>
                </div>
              </motion.button>
            )}
          </div>
        </div>

        {/* Recommended Subscriptions */}
        {recommendedSubs.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <h3 className={`text-xs font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              推荐栏目
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {recommendedSubs.map(renderSubCard)}
            </div>
          </div>
        )}
      </div>

      {/* DIY Program Modal / Overlay */}
      <AnimatePresence>
        {showDiyModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 rounded-[3rem] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className={`w-full max-w-[500px] h-[92%] flex flex-col rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden border-2 ${
                isDarkMode ? 'bg-slate-900 border-indigo-500/20 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {/* Background gradient flare */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button 
                onClick={() => {
                  if (!isGenerating && !isScanning) setShowDiyModal(false);
                }}
                disabled={isGenerating || isScanning}
                className={`absolute top-5 right-5 p-2 rounded-full border transition-all ${
                  isDarkMode 
                    ? 'border-white/10 hover:bg-white/5 text-slate-400' 
                    : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                }`}
              >
                <X size={16} />
              </button>

              {/* Header Title */}
              <div className="flex items-center gap-2.5 mb-5 flex-shrink-0">
                <Sparkles className="text-indigo-500" size={18} />
                <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  创建 / DIY节目 栏目
                </h3>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4 space-y-4">
                
                {/* 1. Folder Directory Configuration */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                     1. 第一步：设置媒体导入路径
                  </label>
                  <p className={`text-[10px] leading-relaxed block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                     系统将自动搜寻所选路径中存储的视频会议录音、培训课程和音频文件，一键转写成主持对话格式。
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Folder className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} size={16} />
                      <input 
                        type="text"
                        value={diyDir}
                        disabled={isScanning || isGenerating}
                        onChange={(e) => {
                          setDiyDir(e.target.value);
                          setScanStep(0);
                        }}
                        placeholder="请输入本地视频或音频保存的完整目录..."
                        className={`text-xs font-black rounded-2xl pl-10 pr-4 py-3.5 w-full border outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                    
                    <button
                      onClick={startScan}
                      disabled={isScanning || isGenerating || !diyDir.trim()}
                      className={`px-4 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black shadow-md transition-colors ${
                        isScanning 
                          ? 'bg-slate-400 text-slate-200 cursor-not-allowed' 
                          : (isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white')
                      }`}
                    >
                      {isScanning ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        '扫描扫描'
                      )}
                    </button>
                  </div>
                </div>

                {/* Scanning Progress & Scanned Files results */}
                {isScanning && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 ${
                      isDarkMode ? 'bg-slate-950/40 border-indigo-500/10' : 'bg-indigo-50/50 border-indigo-200/50'
                    }`}
                  >
                    <Loader2 size={20} className="text-indigo-500 animate-spin" />
                    <p className="text-[11px] font-bold text-indigo-500 animate-pulse">正在精细检索目录下的多媒体音视频文件...</p>
                  </motion.div>
                )}

                {scanStep === 2 && scannedFiles.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border ${
                      isDarkMode ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        已发现可导入的多媒体列表 ({scannedFiles.length})
                      </span>
                      <span className="text-[9px] font-black text-emerald-500 flex items-center gap-1">
                        <Check size={10} />
                        解析成功
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                      {scannedFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between py-1 text-[11px] font-bold">
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            {file.type === 'video' ? <Video size={12} className="text-pink-500 flex-shrink-0" /> : <Volume2 size={12} className="text-sky-500 flex-shrink-0" />}
                            <span className={`truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{file.name}</span>
                          </div>
                          <span className={`text-[9px] flex-shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{file.size}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 2. Configure Program Name */}
                <div className="space-y-1">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                     2. 第二步：设置或修改栏目名称 (可编辑)
                  </label>
                  <input 
                    type="text"
                    value={diyTitle}
                    disabled={isGenerating}
                    onChange={(e) => setDiyTitle(e.target.value)}
                    placeholder="例如：高级系统架构设计分享"
                    className={`text-xs font-black rounded-2xl px-4 py-3.5 w-full border outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-600'
                    }`}
                  />
                </div>

                {/* 3. Style Selector */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                     3. 第三步：选择您偏好的创作播客风格
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'text', label: '📝 国风图文', desc: '以富有深度的图文提炼解析' },
                      { type: 'audio', label: '🎙️ 专业音频', desc: '合成双人自然互动说话声' },
                      { type: 'video', label: '🎥 高清视频', desc: '匹配大纲与可视化章节视频' },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setDiyType(item.type as any)}
                        disabled={isGenerating}
                        className={`p-3 rounded-2xl text-left border-2 flex flex-col gap-1 transition-all ${
                          diyType === item.type
                            ? (isDarkMode ? 'bg-indigo-950/20 border-indigo-500/80' : 'bg-indigo-50 border-indigo-600')
                            : (isDarkMode ? 'bg-slate-950 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')
                        }`}
                      >
                        <span className={`text-[11px] font-black block ${diyType === item.type ? 'text-indigo-500' : isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {item.label}
                        </span>
                        <span className={`text-[9px] font-bold block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} leading-snug`}>
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Playback parameters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                       主持配置
                    </span>
                    <select 
                      disabled={isGenerating}
                      className={`text-xs font-black rounded-xl p-2.5 w-full border ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <option value="dual">AETHER & 小艾 (双人对谈)</option>
                      <option value="solo">AETHER 独白 (专家解读模式)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                       环境背景音
                    </span>
                    <select 
                      disabled={isGenerating}
                      className={`text-xs font-black rounded-xl p-2.5 w-full border ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <option value="none">安静无底噪</option>
                      <option value="jazz">Lofi 爵士乐 (推荐)</option>
                      <option value="coffee">咖啡厅白噪音</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Progress and status loading when generating */}
              {isGenerating && (
                <div className={`p-4 rounded-3xl border mb-3 flex flex-col gap-2 flex-shrink-0 animate-pulse ${
                  isDarkMode ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
                }`}>
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-indigo-500 flex items-center gap-1.5">
                      <Loader2 className="animate-spin" size={12} />
                      AI 智能体专属创作中...
                    </span>
                    <span className="text-indigo-600">{genProgress}%</span>
                  </div>
                  
                  {/* Real progress bar */}
                  <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${genProgress}%` }} />
                  </div>

                  <p className={`text-[10px] font-bold leading-normal ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {generationStep}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200/10 flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  disabled={isGenerating || isScanning}
                  onClick={() => setShowDiyModal(false)}
                  className={`flex-1 py-3.5 rounded-2xl text-xs font-black transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={isGenerating || isScanning || scanStep !== 2 || !diyTitle.trim()}
                  onClick={handleCreateDiy}
                  className={`flex-[1.5] py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 font-black shadow-md transition-all ${
                    scanStep !== 2 
                      ? 'bg-slate-400 text-slate-200 cursor-not-allowed opacity-50 shadow-none'
                      : (isDarkMode 
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white' 
                          : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:opacity-90 text-white')
                  }`}
                >
                  <Sparkles size={14} />
                  一键创作播客栏目
                </button>
              </div>

              {/* Tips */}
              {scanStep !== 2 && (
                <p className={`text-[9.5px] font-bold text-center mt-3 animate-pulse ${isDarkMode ? 'text-amber-500/80' : 'text-amber-600'}`}>
                  ⚠️ 提示：请先设置好文件夹目录，并点击 [扫描] 解析成功后方可开始创作
                </p>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
