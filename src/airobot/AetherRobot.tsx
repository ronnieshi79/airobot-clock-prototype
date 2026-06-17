import React from 'react';
import { motion } from 'motion/react';

import { RobotState } from './useAether';

interface AetherRobotProps {
  isSpeaking: boolean;
  isBlinking: boolean;
  isChatOpen: boolean;
  robotState?: RobotState;
  layoutId?: string;
  onClick: () => void;
}

export const AetherRobot: React.FC<AetherRobotProps> = ({
  isSpeaking,
  isBlinking,
  isChatOpen,
  robotState = 'ready',
  layoutId,
  onClick,
}) => {
  // Override state if actively speaking
  const currentState = isSpeaking ? 'talking' : robotState;

  // Container motion paths depending on state
  const containerVariants = {
    ready: { y: [0, -15, 0], x: 0, rotate: [0, 3, -3, 0], scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 3.5, ease: "easeInOut" } },
    talking: { y: [0, -18, 0], x: 0, rotate: [0, -6, 6, 0], scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" } },
    sleeping: { y: [10, 20, 10], x: 0, rotate: [0, -2, 2, 0], transition: { repeat: Infinity, duration: 4.5, ease: "easeInOut" } },
    dozing: { y: [5, 15, 5], x: 0, rotate: [0, 10, -8, 0], transition: { repeat: Infinity, duration: 3.5, ease: "easeInOut" } },
    bored: { y: [0, -8, 0], x: [-20, 20, -20], rotate: [-12, 12, -12], transition: { repeat: Infinity, duration: 4.5, ease: "easeInOut" } },
    dazing: { 
      y: [0, -35, -15, -45, 0], 
      x: [0, 45, -45, 25, 0], 
      rotate: [0, 15, -15, 8, 0], 
      transition: { repeat: Infinity, duration: 8, ease: "easeInOut" } 
    },
    working: { y: [0, -6, 0], x: 0, rotate: [0, 2, -2, 0], scale: [1, 1.04, 1], transition: { repeat: Infinity, duration: 0.6, ease: "easeInOut" } }
  };

  const getEyeHeight = () => {
    if (isBlinking && (currentState === 'ready' || currentState === 'bored' || currentState === 'dazing')) return 2;
    switch(currentState) {
      case 'sleeping': return 2;
      case 'dozing': return 6;
      case 'talking': return 20;
      case 'working': return 12;
      case 'bored': return 12;
      default: return 24;
    }
  };

  const eyeHeight = getEyeHeight();

  const eyeVariants = {
    ready: { height: eyeHeight, y: 0, borderRadius: '50%', scaleX: 1 },
    talking: { height: eyeHeight, y: [0, -2, 0], borderRadius: '50%', scaleX: [1, 1.1, 1], transition: { repeat: Infinity, duration: 0.6 } },
    sleeping: { height: eyeHeight, y: 8, borderRadius: '10px', scaleX: 1.2 },
    dozing: { height: eyeHeight, y: 4, borderRadius: '10px', scaleX: 1 },
    bored: { height: eyeHeight, y: -2, borderRadius: '50%', scaleX: 1, x: [-4, 4, -4], transition: { repeat: Infinity, duration: 4 } },
    dazing: { height: eyeHeight, y: 0, borderRadius: '50%', scaleX: 1, x: [0, 8, -8, 0], transition: { repeat: Infinity, duration: 3 } },
    working: { height: eyeHeight, y: 0, borderRadius: '10px', rotate: 0, scaleX: 1.4 }
  };

  return (
    <motion.div 
      layoutId={layoutId}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1.3 }}
      className="relative flex flex-col items-center select-none"
    >
      {/* State effect particles (Zzz for sleeping) */}
      {currentState === 'sleeping' && (
        <motion.div 
          animate={{ y: [-10, -40], opacity: [0, 1, 0], x: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute -top-6 right-0 text-orange-300 font-black text-xl z-20 pointer-events-none"
        >
          z
        </motion.div>
      )}
      {currentState === 'sleeping' && (
        <motion.div 
          animate={{ y: [-10, -50], opacity: [0, 1, 0], x: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, delay: 1 }}
          className="absolute -top-10 -right-4 text-orange-400 font-black text-2xl z-20 pointer-events-none"
        >
          Z
        </motion.div>
      )}

      {/* Main Robot Body */}
      <motion.button 
        variants={containerVariants}
        animate={currentState}
        onClick={onClick}
        className={`relative z-10 w-28 h-28 rounded-[2.5rem] border-4 border-white transition-all duration-700
          ${currentState === 'working' ? 'bg-gradient-to-tr from-blue-100 via-cyan-100 to-indigo-100 shadow-[0_0_40px_rgba(56,189,248,0.5)]' : 'bg-gradient-to-tr from-orange-100 via-amber-50 to-rose-100 shadow-[0_15px_35px_rgba(251,146,60,0.3)]'}
          hover:shadow-[0_10px_40px_rgba(251,146,60,0.5)] hover:scale-105 active:scale-95`}
      >
        {/* Cat-like Ears / Antenna */}
        <motion.div 
          animate={
            currentState === 'sleeping' ? { rotate: -40, y: 10 } :
            currentState === 'bored' ? { rotate: -20, y: 5 } :
            currentState === 'talking' ? { rotate: [0, -15, 0], y: [0, -2, 0] } :
            { rotate: [0, -10, 0], y: 0 }
          }
          transition={{ repeat: Infinity, duration: currentState === 'talking' ? 0.8 : 4 }}
          className="absolute -top-4 left-2 w-8 h-12 bg-gradient-to-br from-white to-rose-50 rounded-[50%_50%_10%_10%] -rotate-12 border-4 border-white shadow-sm origin-bottom"
        />
        <motion.div 
          animate={
            currentState === 'sleeping' ? { rotate: 40, y: 10 } :
            currentState === 'bored' ? { rotate: 20, y: 5 } :
            currentState === 'talking' ? { rotate: [0, 15, 0], y: [0, -2, 0] } :
            { rotate: [0, 10, 0], y: 0 }
          }
          transition={{ repeat: Infinity, duration: currentState === 'talking' ? 0.8 : 4, delay: 0.2 }}
          className="absolute -top-4 right-2 w-8 h-12 bg-gradient-to-bl from-white to-rose-50 rounded-[50%_50%_10%_10%] rotate-12 border-4 border-white shadow-sm origin-bottom"
        />

        {/* Anime Character Face Plate */}
        <div className={`absolute inset-1.5 rounded-[2rem] flex flex-col items-center justify-center shadow-[inset_0_-8px_15px_rgba(0,0,0,0.03)] overflow-hidden transition-colors duration-700 ${currentState === 'working' ? 'bg-gradient-to-b from-white to-blue-50' : 'bg-gradient-to-b from-white to-orange-50/50'}`}>
           
           {/* Eyes Container */}
           <div className="flex gap-5 items-center relative mt-3">
             {/* Left Eye */}
             <motion.div 
                variants={eyeVariants}
                animate={currentState}
                className={`w-5 overflow-hidden relative shadow-inner ${currentState === 'working' ? 'bg-indigo-500' : 'bg-slate-700'}`}
             >
                <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-90 shadow-[0_0_4px_white]" />
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-full opacity-70" />
             </motion.div>

             {/* Right Eye */}
             <motion.div 
                variants={eyeVariants}
                animate={currentState}
                className={`w-5 overflow-hidden relative shadow-inner ${currentState === 'working' ? 'bg-indigo-500' : 'bg-slate-700'}`}
             >
                <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-90 shadow-[0_0_4px_white]" />
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-full opacity-70" />
             </motion.div>
           </div>

           {/* Blush details */}
           {(currentState === 'ready' || currentState === 'talking' || currentState === 'dazing') && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 0.6 }}
               className="flex gap-10 mt-1 absolute top-14"
             >
               <div className="w-4 h-2 rounded-full bg-pink-400 blur-[2px]" />
               <div className="w-4 h-2 rounded-full bg-pink-400 blur-[2px]" />
             </motion.div>
           )}

           {/* Mouth */}
           {currentState === 'talking' && (
             <motion.div 
               animate={{ 
                 height: [2, 10, 4, 12, 2],
                 width: [8, 12, 8, 14, 8],
                 borderRadius: ['10px', '50%', '10px', '40%', '10px']
               }}
               transition={{ repeat: Infinity, duration: 0.4 }}
               className="bg-pink-300 absolute top-16"
             />
           )}
           {currentState !== 'talking' && currentState !== 'sleeping' && currentState !== 'dozing' && (
             <motion.div 
               animate={{ width: 6, height: 2, borderRadius: '10px' }}
               className="bg-slate-700 absolute top-16 opacity-50"
             />
           )}
           {(currentState === 'sleeping' || currentState === 'dozing') && (
             <motion.div 
               animate={{ width: 8, height: 4, borderRadius: '50% 50% 10px 10px' }}
               className="bg-slate-700 absolute top-16 opacity-80"
             >
               <div className="w-2 h-2 bg-blue-300 absolute -right-2 -top-1 rounded-full opacity-40 blur-[1px]"></div>
             </motion.div>
           )}
           
           {/* Working/Scanning Laser */}
           {currentState === 'working' && (
             <motion.div 
               animate={{ y: [-30, 30, -30], opacity: [0.2, 0.8, 0.2] }}
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               className="absolute left-0 right-0 h-1 bg-cyan-400 blur-[2px] shadow-[0_0_10px_cyan]"
             />
           )}

        </div>
        
        {/* Floating Paws/Hands */}
        <motion.div 
          animate={
            currentState === 'working' ? { y: [-2, 2, -2], rotate: [0, -20, 20, 0] } :
            currentState === 'sleeping' ? { y: 15, x: -10, rotate: -15 } :
            currentState === 'dazing' ? { y: [-5, 5, -5], rotate: [0, -40, 40, 0] } :
            { y: [0, 5, 0], rotate: 0 }
          }
          transition={currentState === 'working' ? { repeat: Infinity, duration: 0.3 } : { repeat: Infinity, duration: 3 }}
          className="absolute -left-2 top-14 w-6 h-6 rounded-full bg-white border-2 border-rose-100 shadow-md"
        />
        <motion.div 
          animate={
            currentState === 'working' ? { y: [2, -2, 2], rotate: [0, 20, -20, 0] } :
            currentState === 'sleeping' ? { y: 15, x: 10, rotate: 15 } :
            currentState === 'dazing' ? { y: [5, -5, 5], rotate: [0, 40, -40, 0] } :
            { y: [0, 5, 0], rotate: 0 }
          }
          transition={currentState === 'working' ? { repeat: Infinity, duration: 0.3, delay: 0.15 } : { repeat: Infinity, duration: 3, delay: 0.5 }}
          className="absolute -right-2 top-14 w-6 h-6 rounded-full bg-white border-2 border-rose-100 shadow-md"
        />
      </motion.button>
      
      {/* Floating Shadow */}
      <motion.div 
        animate={
          currentState === 'dazing' ? { scale: [0.5, 0.2, 0.8, 0.5], opacity: [0.2, 0.1, 0.3, 0.2] } :
          currentState === 'sleeping' ? { scale: 0.6, opacity: 0.4 } :
          { scale: [1, 0.8, 1], opacity: [0.4, 0.2, 0.4] }
        }
        transition={
          currentState === 'dazing' ? { repeat: Infinity, duration: 10, ease: "easeInOut" } :
          { repeat: Infinity, duration: 4, ease: "easeInOut" }
        }
        className="w-20 h-4 mt-6 rounded-[100%] bg-orange-900/10 blur-sm pointer-events-none"
      />
    </motion.div>
  );
};
