"use client";

import { useState, useEffect } from 'react';

type TypingAnimationProps = {
  text: string;
  speed?: number;
  onComplete?: () => void;
};

const TypingAnimation = ({ text, speed = 50, onComplete }: TypingAnimationProps) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    if (text.length > 0) {
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(prev => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
          if (onComplete) {
            onComplete();
          }
        }
      }, speed);
      return () => clearInterval(typingInterval);
    }
  }, [text, speed, onComplete]);

  return <span>{displayedText}<span className="inline-block w-2 h-4 bg-accent animate-blink ml-1" /></span>;
};

export default TypingAnimation;
