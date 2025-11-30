export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface GeneratedImage {
  imageUrl: string;
  prompt: string;
}

export type ThemeMode = '24' | 'ELF';
