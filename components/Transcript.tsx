
import React, { useRef, useEffect } from 'react';
import { TranscriptMessage } from '../types';
import { Message } from './Message';

interface TranscriptProps {
  transcript: TranscriptMessage[];
}

export const Transcript: React.FC<TranscriptProps> = ({ transcript }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div ref={scrollRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
      {transcript.map((msg, index) => (
        <Message key={index} message={msg} />
      ))}
    </div>
  );
};
