import React from 'react';

interface AnimatedMessageProps {
  text: string;
  className?: string;
}

export const AnimatedMessage: React.FC<AnimatedMessageProps> = ({ text, className }) => {
  return (
    <span className={className}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          style={{
            animationDelay: `${index * 0.01}s`,
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};