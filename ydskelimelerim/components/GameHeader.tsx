import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/lib/constants";

type Props = {
  title: string;
  level: string;
  score: number;
  lives?: number;
  onBack: () => void;
};

export default function GameHeader({ title, level, score, lives, onBack }: Props) {
  return (
    <View style={s.row}>
      <Pressable onPress={onBack} hitSlop={12} style={s.back}>
        <Text style={s.backTxt}>←</Text>
      </Pressable>
      <Text style={s.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={s.badge}>
        <Text style={s.badgeTxt}>{level}</Text>
      </View>
      <View style={s.right}>
        {lives !== undefined && (
          <Text style={s.lives}>{"❤️".repeat(Math.max(0, lives))}</Text>
        )}
        <Text style={s.score}>⭐ {score}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  backTxt: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  title: { color: COLORS.text, fontSize: 16, fontWeight: "700", flexShrink: 1 },
  badge: {
    backgroundColor: COLORS.indigo,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  right: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 8 },
  lives: { fontSize: 13 },
  score: { color: COLORS.amber, fontSize: 15, fontWeight: "800" },
});
