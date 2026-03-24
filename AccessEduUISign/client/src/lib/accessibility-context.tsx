import { createContext, useContext, useState, useEffect } from "react";

type FontSize = "100" | "125" | "150";

type AccessibilitySettings = {
  fontSize: FontSize;
  highContrast: boolean;
  screenReaderMode: boolean;
  reducedMotion: boolean;
  signLanguageMode: boolean;
  visualMode: boolean;
  simplifiedMode: boolean;
};

type AccessibilityContextType = {
  settings: AccessibilitySettings;
  setFontSize: (size: FontSize) => void;
  toggleHighContrast: () => void;
  toggleScreenReaderMode: () => void;
  toggleReducedMotion: () => void;
  toggleSignLanguageMode: () => void;
  toggleVisualMode: () => void;
  toggleSimplifiedMode: () => void;
};

const defaultSettings: AccessibilitySettings = {
  fontSize: "100",
  highContrast: false,
  screenReaderMode: false,
  reducedMotion: false,
  signLanguageMode: true,
  visualMode: true,
  simplifiedMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem("accessedu-accessibility");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("accessedu-accessibility", JSON.stringify(settings));
    
    const root = document.documentElement;
    root.style.fontSize = `${parseInt(settings.fontSize)}%`;
    
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
    
    if (settings.reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
  }, [settings]);

  const setFontSize = (size: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize: size }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleScreenReaderMode = () => {
    setSettings(prev => ({ ...prev, screenReaderMode: !prev.screenReaderMode }));
  };

  const toggleReducedMotion = () => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const toggleSignLanguageMode = () => {
    setSettings(prev => ({ ...prev, signLanguageMode: !prev.signLanguageMode }));
  };

  const toggleVisualMode = () => {
    setSettings(prev => ({ ...prev, visualMode: !prev.visualMode }));
  };

  const toggleSimplifiedMode = () => {
    setSettings(prev => ({ ...prev, simplifiedMode: !prev.simplifiedMode }));
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        setFontSize,
        toggleHighContrast,
        toggleScreenReaderMode,
        toggleReducedMotion,
        toggleSignLanguageMode,
        toggleVisualMode,
        toggleSimplifiedMode,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
