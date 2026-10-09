import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/lib/constants";

type Props = {
  title?: string;
  score: number;
  onRestart: () => void;
  onBack: () => void;
};

export default function GameOver({ title = "Oyun Bitti", score, onRestart, onBack }: Props) {
  return (
    <View style={s.overlay}>
      <View style={s.box}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.score}>⭐ {score}</Text>
        <Pressable style={[s.btn, s.primary]} onPress={onRestart}>
          <Text style={s.btnTxt}>🔁 Tekrar Oyna</Text>
        </Pressable>
        <Pressable style={[s.btn, s.outline]} onPress={onBack}>
          <Text style={[s.btnTxt, { color: COLORS.indigo }]}>🏠 Ana Sayfa</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.8)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  box: {
    width: "80%",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  score: { color: COLORS.amber, fontSize: 32, fontWeight: "800", marginBottom: 8 },
  btn: { width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  primary: { backgroundColor: COLORS.indigo },
  outline: { borderWidth: 2, borderColor: COLORS.indigo },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
