
export interface JournalEntry {
  id: string;
  content: string;
  date: string; // ISO string format
  ticketNumber?: string;
  imageUrl?: string; // base64 data URL
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  groundingChunks?: GroundingChunk[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}
