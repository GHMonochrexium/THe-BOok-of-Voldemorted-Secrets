import React, { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GuestSettingsModal } from './components/GuestSettingsModal';
import { HogwartsLibrary } from './components/HogwartsLibrary';
import { OptionsMenu } from './components/OptionsMenu';
import { QuillCursor } from './components/QuillCursor';
import { HarryPotterMusicPlayer } from './components/HarryPotterMusicPlayer';
import { DiaryEntry, SoundSettings, WizardProfile } from './types';
import { soundManager } from './utils/audio';
import { 
  signInWithGoogle, 
  signOutWizard, 
  subscribeToAuth, 
  saveDiaryEntryToCloud, 
  subscribeToUserDiaryEntries, 
  saveUserProfileToCloud, 
  getUserProfileFromCloud 
} from './utils/firebase';
import { User } from 'firebase/auth';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wizardProfile, setWizardProfile] = useState<WizardProfile | null>(null);
  const [savedWizard, setSavedWizard] = useState<WizardProfile | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [quillCursorEnabled, setQuillCursorEnabled] = useState(true);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [soundSettings, setSoundSettings] = useState<SoundSettings>({
    soundEnabled: true,
    volume: 0.75,
    hedwigsThemeEnabled: true,
    hedwigsThemeVolume: 0.75,
    musicTrack: 'hedwigs-theme',
    musicStyle: 'celesta-strings',
    ambientEnabled: true,
    ambientTrack: 'restricted-section',
    ambientVolume: 0.45,
    sfxEnabled: true,
    sfxVolume: 0.7,
  });

  // Global user interaction listener to unlock Web Audio context seamlessly
  useEffect(() => {
    const handleFirstUserGesture = () => {
      soundManager.unlockAudio();
    };
    window.addEventListener('click', handleFirstUserGesture, { once: true });
    window.addEventListener('keydown', handleFirstUserGesture, { once: true });
    window.addEventListener('touchstart', handleFirstUserGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstUserGesture);
      window.removeEventListener('keydown', handleFirstUserGesture);
      window.removeEventListener('touchstart', handleFirstUserGesture);
    };
  }, []);

  // Subscribe to Firebase Authentication & cloud conversations
  useEffect(() => {
    let unsubscribeEntries: (() => void) | null = null;

    const unsubscribeAuth = subscribeToAuth(async (user) => {
      setCurrentUser(user);

      if (user) {
        setIsSyncingCloud(true);
        try {
          // Fetch existing wizard profile from Firestore
          const cloudData = await getUserProfileFromCloud(user.uid);
          const activeProfile: WizardProfile = {
            id: user.uid,
            uid: user.uid,
            name: user.displayName || cloudData?.name || 'Hogwarts Student',
            email: user.email || undefined,
            photoURL: user.photoURL || undefined,
            house: cloudData?.house || 'Slytherin',
            bloodStatus: cloudData?.bloodStatus || 'Half-blood',
            grade: cloudData?.grade || 'Fifth Year',
            isGuest: false,
            registeredAt: cloudData?.registeredAt || new Date().toISOString(),
            lastActive: new Date().toISOString(),
          };

          setWizardProfile(activeProfile);
          setSavedWizard(activeProfile);
          localStorage.setItem(STORAGE_KEY_WIZARD, JSON.stringify(activeProfile));

          // Save/Update in Firestore
          await saveUserProfileToCloud(user, activeProfile);

          // Subscribe in real-time to this user's conversations with Tom Riddle from Firestore
          if (unsubscribeEntries) unsubscribeEntries();
          unsubscribeEntries = subscribeToUserDiaryEntries(user.uid, (cloudEntries) => {
            if (cloudEntries && cloudEntries.length > 0) {
              setEntries(cloudEntries);
              localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(cloudEntries));
            }
            setIsSyncingCloud(false);
          });
        } catch (err) {
          console.error('Error synchronizing with Firebase on auth:', err);
          setIsSyncingCloud(false);
        }
      } else {
        if (unsubscribeEntries) {
          unsubscribeEntries();
          unsubscribeEntries = null;
        }
        setIsSyncingCloud(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeEntries) unsubscribeEntries();
    };
  }, []);

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
        soundManager.setMasterVolume(parsedSound.volume ?? 0.75);
        soundManager.setMusicVolume(parsedSound.hedwigsThemeVolume ?? 0.75);
        soundManager.setAmbientVolume(parsedSound.ambientVolume ?? 0.45);
        soundManager.setSfxVolume(parsedSound.sfxVolume ?? 0.7);
        if (parsedSound.musicTrack) {
          soundManager.setTrack(parsedSound.musicTrack);
        }
        if (parsedSound.musicStyle) {
          soundManager.setInstrumentStyle(parsedSound.musicStyle);
        }
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

  // Save wizard profile to storage & Firestore
  const handleSaveProfile = async (profile: WizardProfile) => {
    soundManager.unlockAudio();
    setWizardProfile(profile);
    setSavedWizard(profile);
    localStorage.setItem(STORAGE_KEY_WIZARD, JSON.stringify(profile));
    setCurrentView('library');
    soundManager.startAmbient();

    if (currentUser) {
      try {
        await saveUserProfileToCloud(currentUser, profile);
      } catch (err) {
        console.error('Error saving profile to Firestore:', err);
      }
    }
  };

  // Google Sign-In handler
  const handleSignInWithGoogle = async () => {
    soundManager.unlockAudio();
    soundManager.playMagicChime();
    setIsSyncingCloud(true);
    try {
      const user = await signInWithGoogle();
      const cloudData = await getUserProfileFromCloud(user.uid);
      const profile: WizardProfile = {
        id: user.uid,
        uid: user.uid,
        name: user.displayName || cloudData?.name || 'Hogwarts Student',
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        house: cloudData?.house || savedWizard?.house || 'Slytherin',
        bloodStatus: cloudData?.bloodStatus || savedWizard?.bloodStatus || 'Half-blood',
        grade: cloudData?.grade || savedWizard?.grade || 'Fifth Year',
        isGuest: false,
        registeredAt: cloudData?.registeredAt || new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      await saveUserProfileToCloud(user, profile);
      setWizardProfile(profile);
      setSavedWizard(profile);
      localStorage.setItem(STORAGE_KEY_WIZARD, JSON.stringify(profile));
      setCurrentView('library');
      soundManager.startAmbient();
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Google Sign-Out handler
  const handleSignOut = async () => {
    soundManager.playPageTurn();
    try {
      await signOutWizard();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setCurrentUser(null);
    setCurrentView('welcome');
    soundManager.stopAmbient();
  };

  // When "Join as a guest" is clicked: open Settings
  const handleJoinAsGuest = () => {
    soundManager.unlockAudio();
    setCurrentView('guest-settings');
    soundManager.startAmbient();
  };

  // When "or join as a wizard" is clicked:
  const handleJoinAsWizard = () => {
    soundManager.unlockAudio();
    if (savedWizard) {
      setWizardProfile(savedWizard);
      setCurrentView('library');
      soundManager.startAmbient();
      soundManager.playMagicChime();
    } else {
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

  // Save entry to memory list & persist to Firestore database!
  const handleSaveEntry = async (newEntry: DiaryEntry) => {
    const updated = [newEntry, ...entries.filter(e => e.id !== newEntry.id)];
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(updated));

    // Save to Firestore cloud database so it's permanently stored and retrieved on next login
    if (currentUser) {
      try {
        await saveDiaryEntryToCloud(currentUser.uid, newEntry);
      } catch (err) {
        console.error('Failed to sync secret to Firestore:', err);
      }
    }

    // Also update wizard lastActive
    if (wizardProfile) {
      const updatedProfile = { ...wizardProfile, lastActive: new Date().toISOString() };
      setWizardProfile(updatedProfile);
      setSavedWizard(updatedProfile);
      localStorage.setItem(STORAGE_KEY_WIZARD, JSON.stringify(updatedProfile));
      if (currentUser) {
        saveUserProfileToCloud(currentUser, updatedProfile).catch(console.error);
      }
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
          currentUser={currentUser}
          isSyncingCloud={isSyncingCloud}
          onSignInWithGoogle={handleSignInWithGoogle}
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
          currentUser={currentUser}
          isSyncingCloud={isSyncingCloud}
          onSignInWithGoogle={handleSignInWithGoogle}
          wizardProfile={wizardProfile}
          entries={entries}
          onSaveEntry={handleSaveEntry}
          onOpenOptions={() => setIsOptionsOpen(true)}
          onSignOut={handleSignOut}
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

      {/* Persistent Floating Harry Potter Music Soundtrack Player */}
      <HarryPotterMusicPlayer onOpenOptions={() => setIsOptionsOpen(true)} />
    </div>
  );
}

