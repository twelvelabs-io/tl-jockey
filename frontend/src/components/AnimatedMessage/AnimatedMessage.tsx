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
            // animation: `fadeIn 0.01s ease-in-out forwards`,
            animationDelay: `${index * 0.01}s`,
            // opacity: 0,
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};