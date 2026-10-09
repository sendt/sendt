import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  COLORS,
  FEEDBACK_EMAIL,
  GAMES_META,
  GameId,
  SPEEDS,
  SpeedMode,
} from "@/lib/constants";

type Props = {
  speed: SpeedMode;
  onSpeedChange: (s: SpeedMode) => void;
  gameId: GameId;
  onGameChange: (g: GameId) => void;
  onBack: () => void;
};

const LEARN_GAMES = GAMES_META.filter((g) => g.id === "pinball");
const PRACTICE_GAMES = GAMES_META.filter((g) => g.id !== "pinball");

export default function SettingsScreen({ speed, onSpeedChange, gameId, onGameChange, onBack }: Props) {
  const openFeedback = async () => {
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("YDS Kelimelerim Geri Bildirim")}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("E-posta açılamadı", `Bize ${FEEDBACK_EMAIL} adresinden ulaşabilirsin.`);
    }
  };

  const renderGame = (g: (typeof GAMES_META)[number]) => {
    const sel = g.id === gameId;
    return (
      <Pressable
        key={g.id}
        style={[s.game, sel && s.gameSel]}
        onPress={() => onGameChange(g.id)}
      >
        <Text style={s.gameIcon}>{g.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.gameTitle}>{g.title}</Text>
          <Text style={s.gameDesc}>{g.desc}</Text>
        </View>
        {sel && <Text style={s.tick}>✓</Text>}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12} style={s.back}>
          <Text style={s.backTxt}>←</Text>
        </Pressable>
        <Text style={s.title}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.section}>OYUN HIZI</Text>
        <View style={s.speedRow}>
          {(Object.keys(SPEEDS) as SpeedMode[]).map((k) => {
            const sel = k === speed;
            const c = SPEEDS[k].color;
            return (
              <Pressable
                key={k}
                onPress={() => onSpeedChange(k)}
                style={[s.speed, { borderColor: c }, sel && { backgroundColor: c }]}
              >
                <Text style={[s.speedTxt, { color: sel ? "#fff" : c }]}>{SPEEDS[k].label}</Text>
              </Pressable>
            );
          })}
        </View>
        {speed === "auto" && (
          <Text style={s.note}>Doğru bildikçe hızlanır, yanlışta yavaşlar.</Text>
        )}

        <Text style={s.section}>ÖĞRENME OYUNU</Text>
        {LEARN_GAMES.map(renderGame)}

        <Text style={s.section}>TEKRAR OYUNLARI</Text>
        {PRACTICE_GAMES.map(renderGame)}
        <Text style={s.note}>Seçili oyun "💪 Egzersiz" ile başlar.</Text>

        <Pressable style={s.feedback} onPress={openFeedback}>
          <Text style={s.feedbackTxt}>💬 Geri Bildirim</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  backTxt: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  title: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  content: { paddingHorizontal: 14, paddingBottom: 32 },
  section: {
    color: COLORS.textDim,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 10,
  },
  speedRow: { flexDirection: "row", gap: 8 },
  speed: { flex: 1, borderWidth: 2, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  speedTxt: { fontSize: 13, fontWeight: "800" },
  note: { color: COLORS.textDim, fontSize: 12, marginTop: 6 },
  game: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.card,
    padding: 14,
    marginBottom: 8,
  },
  gameSel: { borderColor: COLORS.indigo },
  gameIcon: { fontSize: 26 },
  gameTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  gameDesc: { color: COLORS.textDim, fontSize: 12, marginTop: 2 },
  tick: { color: COLORS.indigo, fontSize: 20, fontWeight: "900" },
  feedback: {
    marginTop: 28,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  feedbackTxt: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
});
