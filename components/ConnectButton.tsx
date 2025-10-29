
import React from 'react';
import { ConnectionState } from '../types';
import { MicrophoneIcon, StopCircleIcon, ArrowPathIcon } from './Icons';

interface ConnectButtonProps {
  connectionState: ConnectionState;
  onClick: () => void;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ connectionState, onClick }) => {
  const getButtonContent = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTING:
        return {
          text: 'Connecting...',
          icon: <ArrowPathIcon className="h-8 w-8 animate-spin" />,
          bgColor: 'bg-yellow-500',
          disabled: true,
        };
      case ConnectionState.CONNECTED:
        return {
          text: 'Stop Session',
          icon: <StopCircleIcon className="h-8 w-8" />,
          bgColor: 'bg-red-600 hover:bg-red-700',
          disabled: false,
        };
      case ConnectionState.ERROR:
        return {
          text: 'Retry Connection',
          icon: <MicrophoneIcon className="h-8 w-8" />,
          bgColor: 'bg-blue-600 hover:bg-blue-700',
          disabled: false,
        };
      case ConnectionState.IDLE:
      default:
        return {
          text: 'Start Talking',
          icon: <MicrophoneIcon className="h-8 w-8" />,
          bgColor: 'bg-green-600 hover:bg-green-700',
          disabled: false,
        };
    }
  };

  const { text, icon, bgColor, disabled } = getButtonContent();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-4 py-4 px-6 rounded-full text-white text-2xl font-bold transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 ${bgColor} ${disabled ? 'opacity-70 cursor-not-allowed' : 'shadow-lg transform hover:scale-105'}`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};
