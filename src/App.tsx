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
  signInGuestAnonymously,
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

// Sample initial entries to demonstrate Voldemort's cryptic replies and archive
const DEFAULT_ENTRIES: DiaryEntry[] = [
  {
    id: 'entry_init_1',
    wizardId: 'sample_wiz_1',
    wizardName: 'Student Seeker',
    house: 'Slytherin',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    userText: "I feel like no one in this castle understands the true depths of what I am capable of.",
    ghostReply: "Greatness is always misunderstood by the ordinary, young seeker. In patience and shadow, power ripens. Lay your burdens here; we shall cultivate what they fear to comprehend.",
    ghostAuthor: 'Tom Marvolo Riddle',
    isEnchantedMemory: true,
    category: 'Ambition',
    inkColor: '#22c55e',
    isAI: true,
  },
  {
    id: 'entry_init_2',
    wizardId: 'sample_wiz_2',
    wizardName: 'Student Seeker',
    house: 'Slytherin',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    userText: "The professors demand obedience, but their rules feel hollow and arbitrary.",
    ghostReply: "They demand submission because they dread anything they cannot predict. Keep your polite composure before them in the corridors, and reserve your unvarnished intellect for our private discourse.",
    ghostAuthor: 'Tom Marvolo Riddle',
    isEnchantedMemory: true,
    category: 'Confession',
    inkColor: '#22c55e',
    isAI: true,
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<'welcome' | 'guest-settings' | 'library'>('welcome');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
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
          const storedWizard = localStorage.getItem(STORAGE_KEY_WIZARD);
          const parsedStored = storedWizard ? JSON.parse(storedWizard) : null;

          const resolvedName = 
            user.displayName || 
            cloudData?.name || 
            parsedStored?.name || 
            wizardProfile?.name || 
            savedWizard?.name || 
            'Hogwarts Student';

          const activeProfile: WizardProfile = {
            id: user.uid,
            uid: user.uid,
            name: resolvedName,
            email: user.email || undefined,
            photoURL: user.photoURL || undefined,
            house: cloudData?.house || parsedStored?.house || wizardProfile?.house || savedWizard?.house || 'Slytherin',
            bloodStatus: cloudData?.bloodStatus || parsedStored?.bloodStatus || wizardProfile?.bloodStatus || savedWizard?.bloodStatus || 'Half-blood',
            grade: cloudData?.grade || parsedStored?.grade || wizardProfile?.grade || savedWizard?.grade || 'Fifth Year',
            isGuest: Boolean(user.isAnonymous),
            registeredAt: cloudData?.registeredAt || parsedStored?.registeredAt || new Date().toISOString(),
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
            // Guarantee isolated entries per account
            const userEntries = cloudEntries || [];
            setEntries(userEntries);
            localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(userEntries));
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

    // If user is not yet logged in with Google, silently connect via Firebase Anonymous Auth
    // so guests enjoy real Firestore database persistence just like Google users!
    if (!currentUser) {
      try {
        const anonUser = await signInGuestAnonymously();
        if (anonUser) {
          setCurrentUser(anonUser);
          await saveUserProfileToCloud(anonUser, profile);
        }
      } catch (err) {
        console.warn('Anonymous cloud sync notice (local backup active):', err);
      }
    } else {
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
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err?.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'thebookofvoldmortedsecrets.netlify.app';
        setAuthErrorMessage(
          `Domain Authorization Note: The current domain (${domain}) has not been added to your Firebase project's authorized domains list yet.\n\nTo enable Google Sign-In on this domain, open Firebase Console -> Authentication -> Settings -> Authorized Domains and add "${domain}".\n\nIn the meantime, you can explore freely using Guest Mode!`
        );
      } else if (err?.code === 'auth/popup-blocked') {
        setAuthErrorMessage('The Google Sign-In pop-up was blocked by your browser. Please allow pop-ups for this chamber to proceed.');
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthErrorMessage(err?.message || 'Google sign-in could not be completed. You may continue in Guest Mode.');
      }
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
    setWizardProfile(null);
    setSavedWizard(null);
    setEntries([]); // Reset entries cleanly so another account doesn't see them!
    localStorage.removeItem(STORAGE_KEY_WIZARD);
    localStorage.removeItem(STORAGE_KEY_ENTRIES);
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
          onQuickGuestEnter={handleSaveProfile}
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

      {/* Firebase Domain / Auth Guidance Modal */}
      {authErrorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#160e08] border-2 border-amber-500/80 rounded-2xl p-6 shadow-[0_0_40px_rgba(245,158,11,0.4)] text-amber-100 space-y-4">
            <div className="flex items-center gap-3 border-b border-amber-900/50 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600/50 flex items-center justify-center text-amber-400">
                ⚡
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-amber-200">
                  Authentication Dispatch
                </h3>
                <p className="text-xs text-amber-300/60 font-parchment">
                  Firebase Cloud Communication
                </p>
              </div>
            </div>

            <p className="text-sm font-parchment text-amber-200/90 whitespace-pre-line leading-relaxed">
              {authErrorMessage}
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAuthErrorMessage(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-black font-cinzel text-xs font-bold hover:brightness-110 cursor-pointer shadow transition"
              >
                Understood
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthErrorMessage(null);
                  handleJoinAsGuest();
                }}
                className="py-2.5 px-4 rounded-xl border border-amber-700/60 bg-black/40 text-amber-300 font-cinzel text-xs font-semibold hover:bg-amber-900/30 cursor-pointer transition"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

