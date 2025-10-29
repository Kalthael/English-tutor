export enum ConnectionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface TranscriptMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  feedback?: string;
  audio?: Blob;
}