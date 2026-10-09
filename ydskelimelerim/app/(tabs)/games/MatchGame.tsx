import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyWords from "@/components/EmptyWords";
import GameHeader from "@/components/GameHeader";
import { COLORS } from "@/lib/constants";
import type { GameProps } from "@/lib/game-types";
import type { Word } from "@/lib/sr-engine";
import { useTimeouts } from "@/lib/use-game-loop";

const PAIRS = 5;

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

type Side = "en" | "tr";

export default function MatchGame({ sr, level, onBack }: GameProps) {
  const enough = sr.count() >= 2;
  const [left, setLeft] = useState<Word[]>([]);
  const [right, setRight] = useState<Word[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<{ side: Side; en: string } | null>(null);
  const [wrong, setWrong] = useState<{ en: string; tr: string } | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const missed = useRef<Set<string>>(new Set());
  const later = useTimeouts();

  const newRound = useCallback(() => {
    const words = sr.getUnique(PAIRS);
    setLeft(words);
    setRight(shuffle(words));
    setMatched(new Set());
    setSel(null);
    setWrong(null);
    missed.current = new Set();
  }, [sr]);

  useEffect(() => {
    if (enough) newRound();
  }, [enough, newRound]);

  const tap = (side: Side, w: Word) => {
    if (matched.has(w.en) || wrong) return;
    if (!sel || sel.side === side) {
      setSel(sel?.side === side && sel.en === w.en ? null : { side, en: w.en });
      return;
    }
    // İki farklı taraftan seçim yapıldı
    const enWord = side === "en" ? w : left.find((x) => x.en === sel.en)!;
    const trWord = side === "tr" ? w : right.find((x) => x.en === sel.en)!;
    if (enWord.en === trWord.en) {
      if (!missed.current.has(enWord.en)) sr.record(enWord, true);
      const m = new Set(matched);
      m.add(enWord.en);
      setMatched(m);
      setSel(null);
      setScore((s) => s + 1);
      if (m.size === left.length) {
        later(() => {
          setRound((r) => r + 1);
          newRound();
        }, 600);
      }
    } else {
      if (!missed.current.has(enWord.en)) {
        missed.current.add(enWord.en);
        sr.record(enWord, false);
      }
      setWrong({ en: enWord.en, tr: trWord.en });
      later(() => {
        setWrong(null);
        setSel(null);
      }, 700);
    }
  };

  if (!enough) {
    return (
      <SafeAreaView style={s.root}>
        <GameHeader title="Eşleştir" level={level} score={0} onBack={onBack} />
        <EmptyWords need={2} onBack={onBack} />
      </SafeAreaView>
    );
  }

  const cellStyle = (side: Side, w: Word) => {
    if (matched.has(w.en)) return s.cellGone;
    if (wrong && ((side === "en" && wrong.en === w.en) || (side === "tr" && wrong.tr === w.en)))
      return s.cellWrong;
    if (sel && sel.side === side && sel.en === w.en) return s.cellSel;
    return null;
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <GameHeader title="Eşleştir" level={level} score={score} onBack={onBack} />
      <Text style={s.round}>Tur {round}</Text>
      <View style={s.cols}>
        <View style={s.col}>
          {left.map((w) => (
            <Pressable
              key={`en-${w.en}`}
              disabled={matched.has(w.en)}
              style={[s.cell, cellStyle("en", w)]}
              onPress={() => tap("en", w)}
            >
              <Text style={[s.cellTxt, matched.has(w.en) && s.txtGone]} numberOfLines={2} adjustsFontSizeToFit>
                {w.en}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={s.col}>
          {right.map((w) => (
            <Pressable
              key={`tr-${w.en}`}
              disabled={matched.has(w.en)}
              style={[s.cell, s.cellTr, cellStyle("tr", w)]}
              onPress={() => tap("tr", w)}
            >
              <Text style={[s.cellTxt, matched.has(w.en) && s.txtGone]} numberOfLines={2} adjustsFontSizeToFit>
                {w.tr}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  round: { color: COLORS.textDim, textAlign: "center", marginBottom: 8, fontWeight: "600" },
  cols: { flex: 1, flexDirection: "row", paddingHorizontal: 12, gap: 12, paddingBottom: 16 },
  col: { flex: 1, gap: 10, justifyContent: "center" },
  cell: {
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.indigo,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cellTr: { borderColor: COLORS.cardBorder },
  cellSel: { backgroundColor: COLORS.indigo, borderColor: COLORS.indigo },
  cellWrong: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  cellGone: { opacity: 0, borderColor: "transparent" },
  cellTxt: { color: COLORS.text, fontSize: 16, fontWeight: "700", textAlign: "center" },
  txtGone: { color: "transparent" },
});
