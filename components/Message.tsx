import React from 'react';
import { TranscriptMessage } from '../types';
import { UserIcon, SparklesIcon, InformationCircleIcon, CheckCircleIcon, PlayCircleIcon } from './Icons';

interface MessageProps {
  message: TranscriptMessage;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const handlePlayAudio = () => {
    if (message.audio) {
      const audioUrl = URL.createObjectURL(message.audio);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    }
  };

  if (message.role === 'system') {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <InformationCircleIcon className="h-5 w-5" />
        <span>{message.content}</span>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 items-start ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
          <SparklesIcon className="h-6 w-6 text-white" />
        </div>
      )}

      <div className={`max-w-xl flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
           <div
            className={`px-5 py-3 rounded-2xl ${isUser ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}
          >
            <p className="text-white leading-relaxed">{message.content}</p>
          </div>
          {isUser && message.audio && (
            <button
              onClick={handlePlayAudio}
              className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors"
              aria-label="Play user audio"
            >
              <PlayCircleIcon className="w-8 h-8" />
            </button>
          )}
        </div>
        
        {message.feedback && (
          <div className="mt-2 p-4 max-w-xl w-full bg-green-900/50 border border-green-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-green-400 font-semibold">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Feedback</span>
            </div>
            <p className="text-green-200 text-sm leading-relaxed">{message.feedback}</p>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
          <UserIcon className="h-6 w-6 text-white" />
        </div>
      )}
    </div>
  );
};