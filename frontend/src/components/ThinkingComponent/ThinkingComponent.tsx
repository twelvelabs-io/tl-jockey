import React from 'react';
import { motion } from 'framer-motion';
import Loading from '../Loading/Loading';
import { ThinkingComponentProps } from './ThinkingComponentTypes'
import { ReactComponent as MarengoIcon } from '../../icons/marengo.svg';
import { useChat } from '../../widgets/VideoAssistant/hooks/useChat';

const ThinkingComponent: React.FC<ThinkingComponentProps> = ({ searchTerm, isLoading, lastElement }) => {
  const [state] = useChat();
  const { errorMessage } = state;

  const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const loadingDotsVariants = {
    animate: {
      opacity: [0.2, 1, 0.2],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };  
  const text = "Understanding your request";
  const words = text.split(" ");
  return (
    <div className="relative">
      {isLoading === true && lastElement && (
        <motion.div 
          className="absolute left-[8px] bottom-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loading />
        </motion.div>
      )}
      
      <motion.div 
        className="flex flex-row items-center gap-3 ml-[40px] text-gray-600 text-sm font-aeonik"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="flex flex-col"
          variants={itemVariants}
        >
          <motion.div 
            className="flex items-center"
            variants={itemVariants}
          >
            <div className="flex gap-[0.25em]">
              {words.map((word, wordIndex) => (
                <div key={wordIndex} className="flex">
                  {word.split("").map((char, charIndex) => (
                    <span key={`${wordIndex}-${charIndex}`} style={{ color: '#4B5563' }}>
                      {char}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <span 
              className="ml-[2px]"
            >...</span>
          </motion.div>
          {errorMessage && (
              <span>{errorMessage}</span>
          )}
          {typeof searchTerm === 'string' && searchTerm.length > 0 && (
            <motion.div 
              className="flex items-center gap-2"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.span variants={itemVariants}>Searching '{searchTerm}' with</motion.span>
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <MarengoIcon className="w-[96px] h-[24px] cursor-pointer"/>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ThinkingComponent;