export const containerVariants = {
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

export const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5
    }
  }
};

export const loadingDotsVariants = {
  animate: {
    opacity: [0.2, 1, 0.2],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: "linear"
    }
  }
}; 