export type HogwartsHouse = 'Gryffindor' | 'Slytherin' | 'Ravenclaw' | 'Hufflepuff';

export type BloodStatus = 'Pure-blood' | 'Half-blood' | 'Muggle-born';

export type HogwartsYear = 
  | 'First Year' 
  | 'Second Year' 
  | 'Third Year' 
  | 'Fourth Year' 
  | 'Fifth Year' 
  | 'Sixth Year' 
  | 'Seventh Year';

export interface WizardProfile {
  id: string;
  name: string;
  house: HogwartsHouse;
  bloodStatus: BloodStatus;
  grade: HogwartsYear;
  isGuest: boolean;
  registeredAt: string;
  lastActive: string;
  uid?: string;
  email?: string;
  photoURL?: string;
  patronus?: string;
  wandDetails?: string;
}

export interface DiaryEntry {
  id: string;
  wizardId: string;
  wizardName: string;
  house: HogwartsHouse;
  timestamp: string;
  userText: string;
  ghostReply: string;
  ghostAuthor: string;
  isEnchantedMemory: boolean;
  category: 'Confession' | 'Dark Magic' | 'Memory' | 'Ambition' | 'Fear';
  inkColor?: string;
  drawingData?: string; // Base64 data URL for hand-drawn quill calligraphy
  isAI?: boolean;
}

export type AmbientTrack = 'restricted-section' | 'astronomy-thunder' | 'chamber-whispers';

export type HarryPotterTrack = 'hedwigs-theme' | 'leaving-hogwarts' | 'chamber-of-secrets';
export type MusicInstrumentStyle = 'celesta-strings' | 'music-box' | 'harp-bells';

export interface SoundSettings {
  soundEnabled: boolean;
  volume: number; // Master volume 0 to 1
  hedwigsThemeEnabled: boolean;
  hedwigsThemeVolume: number; // 0 to 1
  musicTrack?: HarryPotterTrack;
  musicStyle?: MusicInstrumentStyle;
  ambientEnabled: boolean;
  ambientTrack: AmbientTrack;
  ambientVolume: number; // 0 to 1
  sfxEnabled: boolean;
  sfxVolume: number; // 0 to 1
}

export type MainTab = 'journal' | 'memories' | 'archive' | 'profile';
