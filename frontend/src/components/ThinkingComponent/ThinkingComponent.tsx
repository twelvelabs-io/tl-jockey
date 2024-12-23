import React from 'react';
import { motion } from 'framer-motion';
import Loading from '../Loading/Loading';
import { ThinkingComponentProps } from './ThinkingComponentTypes';
import { ReactComponent as MarengoIcon } from '../../icons/marengo.svg';
import { useChat } from '../../widgets/VideoAssistant/hooks/useChat';
import { containerVariants, itemVariants } from './animationVariants';
import AnimatedText from './AnimatedText';

const ThinkingComponent: React.FC<ThinkingComponentProps> = ({ searchTerm, isLoading, lastElement }) => {
  const [state] = useChat();
  const { errorMessage } = state;

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
        <motion.div className="flex flex-col" variants={itemVariants}>
          <AnimatedText text="Understanding your request" />
          {errorMessage && <span>{errorMessage}</span>}
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