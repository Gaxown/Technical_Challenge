export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceNote {
  id: string;
  patientId: string;
  title: string;
  duration: number; // in seconds
  recordedAt: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  id: string;
  voiceNoteId: string;
  content: string;
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyRateLimit {
  apiKey: string;
  requests: number;
  resetAt: number;
}
