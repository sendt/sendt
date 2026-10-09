import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, TOTAL_DAYS } from "@/lib/constants";
import { W } from "@/lib/dimensions";

const CELL_SIZE = Math.floor((W - 28 - 8 * 4) / 5);

type Props = {
  lastPlayedDay: number | null;
  completedDays: Set<number>;
  selectedDay?: number | null;
  onDaySelect: (day: number) => void;
  onKarisik: () => void;
  onOgren: () => void;
  onEgzersiz: () => void;
  onSettings: () => void;
  onResume?: () => void;
};

export default function HomeScreen({
  lastPlayedDay,
  completedDays,
  selectedDay,
  onDaySelect,
  onKarisik,
  onOgren,
  onEgzersiz,
  onSettings,
  onResume,
}: Props) {
  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);
  const activeLabel =
    selectedDay === 0 ? "Karışık" : selectedDay ? `Gün ${selectedDay}` : null;

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      {/* 1. Header */}
      <View style={s.header}>
        <Text style={s.title}>YDS KELİMELERİM</Text>
        <Pressable onPress={onSettings} hitSlop={12} style={s.gear}>
          <Text style={s.gearTxt}>⚙️</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* 2. Ana butonlar */}
        <View style={s.bigRow}>
          <Pressable style={[s.big, s.bigFill]} onPress={onOgren}>
            <Text style={s.bigTxt}>📖 Öğren</Text>
          </Pressable>
          <Pressable style={[s.big, s.bigOutline]} onPress={onEgzersiz}>
            <Text style={[s.bigTxt, { color: COLORS.indigo }]}>💪 Egzersiz</Text>
          </Pressable>
        </View>
        {activeLabel && <Text style={s.selInfo}>Seçili: {activeLabel}</Text>}

        {/* 3. Devam et */}
        {lastPlayedDay !== null && (
          <Pressable style={s.resume} onPress={onResume}>
            <View>
              <Text style={s.resumeSmall}>Kaldığın yer</Text>
              <Text style={s.resumeBig}>
                {lastPlayedDay === 0 ? "Karışık" : `Gün ${lastPlayedDay}`}
              </Text>
            </View>
            <Text style={s.resumeArrow}>Devam Et →</Text>
          </Pressable>
        )}

        {/* 4. Gün seç */}
        <Text style={s.section}>GÜN SEÇ</Text>
        <View style={s.grid}>
          {days.map((d) => {
            const done = completedDays.has(d);
            const sel = selectedDay === d;
            return (
              <Pressable
                key={d}
                onPress={() => onDaySelect(d)}
                style={[s.cell, done && s.cellDone, sel && s.cellSel]}
              >
                <Text style={[s.cellTxt, sel && { color: "#fff" }]}>{d}</Text>
                {done && <Text style={[s.check, sel && { color: "#fff" }]}>✓</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* 5. Karışık */}
        <Pressable style={s.mix} onPress={onKarisik}>
          <Text style={s.mixTxt}>🔀 Karışık Çalış</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: { color: COLORS.text, fontSize: 22, fontWeight: "900", letterSpacing: 1 },
  gear: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  gearTxt: { fontSize: 20 },
  content: { paddingHorizontal: 14, paddingBottom: 24 },
  bigRow: { flexDirection: "row", gap: 12 },
  big: {
    flex: 1,
    height: 88,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bigFill: { backgroundColor: COLORS.indigo },
  bigOutline: { borderWidth: 2, borderColor: COLORS.indigo },
  bigTxt: { color: "#fff", fontSize: 19, fontWeight: "800" },
  selInfo: { color: COLORS.textDim, textAlign: "center", marginTop: 8, fontSize: 13 },
  resume: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.indigo,
  },
  resumeSmall: { color: COLORS.textDim, fontSize: 12 },
  resumeBig: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  resumeArrow: { color: COLORS.indigo, fontSize: 16, fontWeight: "800" },
  section: {
    color: COLORS.textDim,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 22,
    marginBottom: 10,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  cellDone: { borderColor: COLORS.indigo },
  cellSel: { backgroundColor: COLORS.indigo, borderColor: COLORS.indigo },
  cellTxt: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  check: { position: "absolute", top: 3, right: 6, color: COLORS.indigo, fontSize: 12, fontWeight: "900" },
  mix: {
    marginTop: 20,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  mixTxt: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
});
