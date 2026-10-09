import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Alert, BackHandler, Platform } from "react-native";
import { GameId, SpeedMode, TOTAL_DAYS } from "@/lib/constants";
import type { GameProps } from "@/lib/game-types";
import { SREngine } from "@/lib/sr-engine";
import { YDS_DAYS } from "@/words-yds";
import FallingGame from "./games/FallingGame";
import MatchGame from "./games/MatchGame";
import PairsGame from "./games/PairsGame";
import PinballGame from "./games/PinballGame";
import WordRushGame from "./games/WordRushGame";
import HomeScreen from "./screens/HomeScreen";
import SettingsScreen from "./screens/SettingsScreen";

type Screen = "home" | "game" | "settings";

const K_LAST_DAY = "wv_last_day";
const K_COMPLETED = "wv_completed_days";
const K_GAME = "wv_game_id";
const K_SPEED = "wv_speed";

const GAME_IDS: GameId[] = ["pinball", "rush", "falling", "match", "pairs"];
const SPEED_IDS: SpeedMode[] = ["yavas", "normal", "hizli", "auto"];

const GAMES: Record<GameId, (p: GameProps) => React.ReactElement> = {
  pinball: PinballGame,
  rush: WordRushGame,
  falling: FallingGame,
  match: MatchGame,
  pairs: PairsGame,
};

// expo-navigation-bar sadece Android'de var; iOS'ta hiç yüklenmez.
async function setNavBarHidden(hidden: boolean) {
  if (Platform.OS !== "android") return;
  try {
    const NavigationBar = await import("expo-navigation-bar");
    await NavigationBar.setVisibilityAsync(hidden ? "hidden" : "visible");
    await NavigationBar.setButtonStyleAsync("light");
  } catch {
    // Navigasyon çubuğu ayarlanamazsa oyunu engelleme
  }
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [lastPlayedDay, setLastPlayedDay] = useState<number | null>(null);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [gameId, setGameId] = useState<GameId>("pinball");
  const [speed, setSpeed] = useState<SpeedMode>("normal");
  const [sr, setSr] = useState<SREngine | null>(null);
  // Şu an oynanan oyun. "Öğren" kayıtlı gameId'yi değiştirmeden Pinball açar.
  const [activeGame, setActiveGame] = useState<GameId>("pinball");
  const [activeDay, setActiveDay] = useState<number>(1);
  const [gameKey, setGameKey] = useState(0);

  // Kayıtlı ayarları yükle
  useEffect(() => {
    (async () => {
      try {
        const [[, last], [, done], [, g], [, sp]] = await AsyncStorage.multiGet([
          K_LAST_DAY,
          K_COMPLETED,
          K_GAME,
          K_SPEED,
        ]);
        if (last !== null && !Number.isNaN(Number(last))) setLastPlayedDay(Number(last));
        if (done) setCompletedDays(new Set<number>(JSON.parse(done)));
        if (g && GAME_IDS.includes(g as GameId)) setGameId(g as GameId);
        if (sp && SPEED_IDS.includes(sp as SpeedMode)) setSpeed(sp as SpeedMode);
      } catch {
        // Bozuk veri: varsayılanlarla devam
      }
    })();
  }, []);

  useEffect(() => {
    setNavBarHidden(screen === "game");
  }, [screen]);

  const goHome = useCallback(() => {
    setScreen("home");
    setSr(null);
  }, []);

  // Android geri tuşu: oyundan / ayarlardan ana ekrana dön
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen === "home") return false;
      goHome();
      return true;
    });
    return () => sub.remove();
  }, [screen, goHome]);

  const loadDay = useCallback(async (day: number): Promise<SREngine | null> => {
    const words =
      day === 0
        ? YDS_DAYS.flatMap((d) => d.words)
        : YDS_DAYS.find((d) => d.day === day)?.words ?? [];
    if (words.length === 0) {
      Alert.alert(
        "Kelime bulunamadı",
        day === 0 ? "Henüz hiç kelime eklenmemiş." : `Gün ${day} için kelime eklenmemiş.`,
      );
      return null;
    }
    const key = day === 0 ? "wv_sr_mix" : `wv_sr_day_${day}`;
    const engine = new SREngine(words, key);
    await engine.load();

    setLastPlayedDay(day);
    AsyncStorage.setItem(K_LAST_DAY, String(day)).catch(() => {});
    if (day > 0) {
      setCompletedDays((prev) => {
        if (prev.has(day)) return prev;
        const next = new Set(prev);
        next.add(day);
        AsyncStorage.setItem(K_COMPLETED, JSON.stringify([...next])).catch(() => {});
        return next;
      });
    }
    setSr(engine);
    return engine;
  }, []);

  const startGame = useCallback(
    async (game: GameId, day: number) => {
      const engine = await loadDay(day);
      if (!engine) return;
      setActiveGame(game);
      setActiveDay(day);
      setGameKey((k) => k + 1);
      setScreen("game");
    },
    [loadDay],
  );

  const currentDay = () => selectedDay ?? lastPlayedDay ?? 1;

  const changeGame = (g: GameId) => {
    setGameId(g);
    AsyncStorage.setItem(K_GAME, g).catch(() => {});
  };
  const changeSpeed = (sp: SpeedMode) => {
    setSpeed(sp);
    AsyncStorage.setItem(K_SPEED, sp).catch(() => {});
  };

  if (screen === "settings") {
    return (
      <SettingsScreen
        speed={speed}
        onSpeedChange={changeSpeed}
        gameId={gameId}
        onGameChange={changeGame}
        onBack={goHome}
      />
    );
  }

  if (screen === "game" && sr) {
    const Game = GAMES[activeGame];
    return (
      <Game
        key={gameKey}
        sr={sr}
        speed={speed}
        level={activeDay === 0 ? "Karışık" : `Gün ${activeDay}`}
        onBack={goHome}
      />
    );
  }

  return (
    <HomeScreen
      lastPlayedDay={lastPlayedDay}
      completedDays={completedDays}
      selectedDay={selectedDay}
      onDaySelect={(d) => setSelectedDay((cur) => (cur === d ? null : d))}
      onKarisik={() => {
        setSelectedDay(0);
        startGame(gameId, 0);
      }}
      onOgren={() => startGame("pinball", currentDay())}
      onEgzersiz={() => startGame(gameId, currentDay())}
      onSettings={() => setScreen("settings")}
      onResume={
        lastPlayedDay !== null && lastPlayedDay <= TOTAL_DAYS
          ? () => startGame(gameId, lastPlayedDay)
          : undefined
      }
    />
  );
}
