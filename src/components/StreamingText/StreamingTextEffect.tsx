import React, { useState, useEffect } from 'react';

interface StreamingTextEffectProps {
    text: string
}


export const StreamingTextEffect:React.FC<StreamingTextEffectProps> = ({ text }) => {
  const [displayText, setDisplayText] = useState('');
  const delay = 50; // milliseconds between each character

  useEffect(() => {
    let currentText = '';
    const intervalId = setInterval(() => {
      if (currentText.length < text.length) {
        currentText += text[currentText.length];
        setDisplayText(currentText);
      } else {
        clearInterval(intervalId);
      }
    }, delay);

    return () => clearInterval(intervalId);
  }, [text]);

  return <span>{displayText}</span>;
};

export default StreamingTextEffect;