import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/lib/constants";

export default function EmptyWords({ need, onBack }: { need: number; onBack: () => void }) {
  return (
    <View style={s.wrap}>
      <Text style={s.icon}>📭</Text>
      <Text style={s.txt}>Bu oyun için en az {need} kelime gerekli.</Text>
      <Pressable style={s.btn} onPress={onBack}>
        <Text style={s.btnTxt}>Geri Dön</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  icon: { fontSize: 48 },
  txt: { color: COLORS.text, fontSize: 16, textAlign: "center" },
  btn: { backgroundColor: COLORS.indigo, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnTxt: { color: "#fff", fontWeight: "700" },
});
