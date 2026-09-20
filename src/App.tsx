import React, { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GuestSettingsModal } from './components/GuestSettingsModal';
import { HogwartsLibrary } from './components/HogwartsLibrary';
import { OptionsMenu } from './components/OptionsMenu';
import { QuillCursor } from './components/QuillCursor';
import { DiaryEntry, SoundSettings, WizardProfile } from './types';
import { soundManager } from './utils/audio';

const STORAGE_KEY_WIZARD = 'diary_of_secrets_wizard';
const STORAGE_KEY_ENTRIES = 'diary_of_secrets_entries';
const STORAGE_KEY_SOUND = 'diary_of_secrets_sound';
const STORAGE_KEY_QUILL = 'diary_of_secrets_quill';

// Sample initial entries if fresh to demonstrate Voldemort's cryptic replies
const DEFAULT_ENTRIES: DiaryEntry[] = [
  {
    id: 'entry_init_1',
    wizardId: 'sample_wiz',
    wizardName: 'Tom Riddle',
    house: 'Slytherin',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    userText: "I feel like no one in this castle understands the true depths of what I am capable of.",
    ghostReply: "Greatness is always misunderstood by the ordinary, young wizard. In patience and shadow, power ripens.",
    ghostAuthor: 'Tom Marvolo Riddle',
    isEnchantedMemory: true,
    category: 'Ambition',
    inkColor: '#22c55e',
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<'welcome' | 'guest-settings' | 'library'>('welcome');
  const [wizardProfile, setWizardProfile] = useState<WizardProfile | null>(null);
  const [savedWizard, setSavedWizard] = useState<WizardProfile | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [quillCursorEnabled, setQuillCursorEnabled] = useState(true);
  const [soundSettings, setSoundSettings] = useState<SoundSettings>({
    soundEnabled: true,
    volume: 0.7,
    hedwigsThemeEnabled: false,
    hedwigsThemeVolume: 0.65,
    ambientEnabled: true,
    ambientTrack: 'restricted-section',
    ambientVolume: 0.5,
    sfxEnabled: true,
    sfxVolume: 0.7,
  });

  // Load persisted wizard profile, entries, and sound settings on mount
  useEffect(() => {
    try {
      const storedWizard = localStorage.getItem(STORAGE_KEY_WIZARD);
      if (storedWizard) {
        const parsed = JSON.parse(storedWizard);
        setSavedWizard(parsed);
      }

      const storedEntries = localStorage.getItem(STORAGE_KEY_ENTRIES);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      } else {
        setEntries(DEFAULT_ENTRIES);
      }

      const storedSound = localStorage.getItem(STORAGE_KEY_SOUND);
      if (storedSound) {
        const parsedSound = JSON.parse(storedSound);
        setSoundSettings((prev) => ({ ...prev, ...parsedSound }));
        soundManager.setEnabled(parsedSound.soundEnabled ?? true);
        soundManager.setMasterVolume(parsedSound.volume ?? 0.7);
        soundManager.setHedwigsVolume(parsedSound.hedwigsThemeVolume ?? 0.65);
        soundManager.setAmbientVolume(parsedSound.ambientVolume ?? 0.5);
        soundManager.setSfxVolume(parsedSound.sfxVolume ?? 0.7);
        if (parsedSound.ambientTrack) {
          soundManager.setAmbientTrack(parsedSound.ambientTrack);
        }
      }

      const storedQuill = localStorage.getItem(STORAGE_KEY_QUILL);
      if (storedQuill !== null) {
        setQuillCursorEnabled(storedQuill === 'true');
      }
    } catch (err) {
      console.warn('Error loading storage:', err);
    }
  }, []);

  // Save wizard profile to storage
  const handleSaveProfile = (profile: WizardProfile) => {
    setWizardProfile(profile);
    setSavedWizard(profile);
    localStorage.setItem(STORAGE_KEY_WIZARD, JSON.stringify(profile));
    setCurrentView('library');
    soundManager.startAmbient();
  };

  // When "Join as a guest" is clicked: open Settings
  const handleJoinAsGuest = () => {
    setCurrentView('guest-settings');
    soundManager.startAmbient();
  };

  // When "or join as a wizard — if youve done this thing before" is clicked:
  // Immediately restore previous state and return to where you last were!
  const handleJoinAsWizard = () => {
    if (savedWizard) {
      setWizardProfile(savedWizard);
      setCurrentView('library');
      soundManager.startAmbient();
      soundManager.playMagicChime();
    } else {
      // If no wizard saved yet, initiate with default wizard or open settings
      const defaultWizard: WizardProfile = {
        id: `wiz_${Date.now()}`,
        name: 'The Returning Seeker',
        house: 'Slytherin',
        bloodStatus: 'Half-blood',
        grade: 'Fifth Year',
        isGuest: false,
        registeredAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      setWizardProfile(defaultWizard);
      setSavedWizard(defaultWizard);
      localStorage.setItem(STORAGE_KEY_WIZARD, JSON.stringify(defaultWizard));
      setCurrentView('library');
      soundManager.startAmbient();
      soundManager.playMagicChime();
    }
  };

  // Save entry to memory list & persist
  const handleSaveEntry = (newEntry: DiaryEntry) => {
    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(updated));

    // Also update wizard lastActive
    if (wizardProfile) {
      const updatedProfile = { ...wizardProfile, lastActive: new Date().toISOString() };
      setWizardProfile(updatedProfile);
      setSavedWizard(updatedProfile);
      localStorage.setItem(STORAGE_KEY_WIZARD, JSON.stringify(updatedProfile));
    }
  };

  // Update sound settings
  const handleUpdateSoundSettings = (newSettings: SoundSettings) => {
    setSoundSettings(newSettings);
    localStorage.setItem(STORAGE_KEY_SOUND, JSON.stringify(newSettings));
  };

  // Toggle quill cursor
  const handleToggleQuillCursor = (val: boolean) => {
    setQuillCursorEnabled(val);
    localStorage.setItem(STORAGE_KEY_QUILL, String(val));
  };

  // Reset secrets
  const handleResetSecrets = () => {
    localStorage.removeItem(STORAGE_KEY_WIZARD);
    localStorage.removeItem(STORAGE_KEY_ENTRIES);
    setWizardProfile(null);
    setSavedWizard(null);
    setEntries([]);
    setCurrentView('welcome');
    soundManager.stopAmbient();
  };

  const cursorColor = wizardProfile?.house === 'Slytherin' ? 'green' : 'gold';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-parchment relative overflow-x-hidden selection:bg-amber-900/50 selection:text-amber-100">
      {/* Enchanted Feather Quill & Glowing Ink Cursor */}
      <QuillCursor enabled={quillCursorEnabled} inkColor={cursorColor} />

      {/* Main View Router */}
      {currentView === 'welcome' && (
        <WelcomeScreen
          onJoinAsGuest={handleJoinAsGuest}
          onJoinAsWizard={handleJoinAsWizard}
          onOpenOptions={() => setIsOptionsOpen(true)}
          savedWizard={savedWizard}
        />
      )}

      {currentView === 'guest-settings' && (
        <GuestSettingsModal
          onComplete={handleSaveProfile}
          onBack={() => setCurrentView('welcome')}
          initialProfile={wizardProfile || savedWizard}
        />
      )}

      {currentView === 'library' && wizardProfile && (
        <HogwartsLibrary
          wizardProfile={wizardProfile}
          entries={entries}
          onSaveEntry={handleSaveEntry}
          onOpenOptions={() => setIsOptionsOpen(true)}
          onSignOut={() => {
            setCurrentView('welcome');
            soundManager.stopAmbient();
          }}
        />
      )}

      {/* Options & Acoustic Chamber Modal */}
      <OptionsMenu
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        soundSettings={soundSettings}
        onUpdateSoundSettings={handleUpdateSoundSettings}
        quillCursorEnabled={quillCursorEnabled}
        onToggleQuillCursor={handleToggleQuillCursor}
        onResetSecrets={handleResetSecrets}
      />
    </div>
  );
}
