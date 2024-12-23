import { useState, useEffect } from 'react';

interface TypingEffectResult {
  text: string;
  isAnimating: boolean;
}

export const useTypingEffect = (value: string): TypingEffectResult => {
  const [text, setText] = useState('');
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    let i = 0;
    setText(''); // Reset text when value changes

    const intervalId = setInterval(() => {
      setIsAnimating(true);
      setText(prev => {
        if (i === value.length) {
          clearInterval(intervalId);
          setTimeout(() => {
            setIsAnimating(false);
          }, 1000);
          return prev;
        }
        return prev + value[i++];
      });
    }, 5);

    return () => {
      clearInterval(intervalId);
    };
  }, [value]);

  return { text, isAnimating };
}; 