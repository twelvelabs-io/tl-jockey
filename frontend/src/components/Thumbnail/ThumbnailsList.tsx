import React from 'react';
import { motion } from 'framer-motion';
import VideoThumbnail from '../ChatMessagesList/VideoThumbnail';
import { QuestionMessage } from '../../types/messageTypes';

interface ThumbnailsListProps {
  videos: QuestionMessage['toolsData'];
  showAllVideos: boolean;
  loadedThumbnails: boolean[];
  playerRefs: Array<any>;
  handleThumbnailClick: (index: number) => void;
}

const ThumbnailsList: React.FC<ThumbnailsListProps> = ({
  videos,
  showAllVideos,
  loadedThumbnails,
  playerRefs,
  handleThumbnailClick,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className="grid grid-cols-3 gap-2 w-full pr-[2px]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {videos.slice(0, showAllVideos ? undefined : 3).map((video, displayIndex) => {
        const actualIndex = showAllVideos ? displayIndex : Math.min(displayIndex, 2);
        return (
          <VideoThumbnail
            key={actualIndex}
            video={video}
            index={displayIndex}
            actualIndex={actualIndex}
            loadedThumbnails={loadedThumbnails}
            playerRef={playerRefs[displayIndex]}
            handleThumbnailClick={handleThumbnailClick}
          />
        );
      })}
    </motion.div>
  );
};

export default ThumbnailsList;