import React from 'react';
import { motion } from 'framer-motion';
import Loading from '../Loading/Loading';
import { ThinkingComponentProps } from './ThinkingComponentTypes'
import { ReactComponent as MarengoIcon } from '../../icons/marengo.svg';

const ThinkingComponent: React.FC<ThinkingComponentProps> = ({ searchTerm, isLoading }) => {
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
    <motion.div 
      className="flex flex-row items-center gap-3 ml-[40px] text-gray-600 text-sm font-aeonik"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {isLoading === true && (
        <motion.div 
          className="absolute left-0 bottom-0"
          variants={itemVariants}
        >
          <Loading />
        </motion.div>
      )}
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
              <motion.div 
                key={wordIndex} 
                className="flex"
                variants={itemVariants}
              >
                {word.split("").map((char, charIndex) => (
                  <motion.span
                    key={`${wordIndex}-${charIndex}`}
                    initial={{ color: '#4B5563' }}
                    animate={{
                      color: ['#4B5563', '#4B5563', '#4B5563', '#ffffff', '#4B5563', '#4B5563', '#4B5563'],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      repeatDelay: 0.01,
                      delay: (wordIndex * word.length + charIndex) * 0.05,
                      times: [0, 0.45, 0.48, 0.5, 0.52, 0.55, 1],
                      ease: "easeInOut"
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>
            ))}
          </div>
          <motion.span 
            variants={loadingDotsVariants}
            animate="animate"
            className="ml-[2px]"
          >...</motion.span>
        </motion.div>
        
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
  );
};

export default ThinkingComponent;