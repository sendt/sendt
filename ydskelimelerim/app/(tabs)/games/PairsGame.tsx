import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyWords from "@/components/EmptyWords";
import GameHeader from "@/components/GameHeader";
import { COLORS } from "@/lib/constants";
import type { GameProps } from "@/lib/game-types";
import type { Word } from "@/lib/sr-engine";
import { useTimeouts } from "@/lib/use-game-loop";

const COLS = 3;
const ROWS = 4;
const PAIRS = (COLS * ROWS) / 2; // 4×3 ızgara → 6 çift

type Card = { id: number; word: Word; side: "en" | "tr" };

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// Bu oyunda speed kullanılmaz.
export default function PairsGame({ sr, level, onBack }: GameProps) {
  const enough = sr.count() >= 2;
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const seenCards = useRef<Set<number>>(new Set());
  const missed = useRef<Set<string>>(new Set());
  const busy = useRef(false);
  const later = useTimeouts();

  const newRound = useCallback(() => {
    const words = sr.getUnique(PAIRS);
    let id = 0;
    const list: Card[] = [];
    for (const w of words) {
      list.push({ id: id++, word: w, side: "en" });
      list.push({ id: id++, word: w, side: "tr" });
    }
    setCards(shuffle(list));
    setOpen([]);
    setDone(new Set());
    setMoves(0);
    seenCards.current = new Set();
    missed.current = new Set();
    busy.current = false;
  }, [sr]);

  useEffect(() => {
    if (enough) newRound();
  }, [enough, newRound]);

  const flip = (c: Card) => {
    if (busy.current || done.has(c.word.en) || open.includes(c.id)) return;
    const nextOpen = [...open, c.id];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;

    busy.current = true;
    setMoves((m) => m + 1);
    const [a, b] = nextOpen.map((id) => cards.find((x) => x.id === id)!);
    if (a.word.en === b.word.en) {
      if (!missed.current.has(a.word.en)) sr.record(a.word, true);
      const d = new Set(done);
      d.add(a.word.en);
      setDone(d);
      setScore((s) => s + 1);
      later(() => {
        setOpen([]);
        busy.current = false;
        if (d.size === cards.length / 2) {
          later(() => {
            setRound((r) => r + 1);
            newRound();
          }, 700);
        }
      }, 350);
    } else {
      // Daha önce görülmüş bir kartın eşini bulamadıysa o kelime yanlış sayılır
      for (const card of [a, b]) {
        if (seenCards.current.has(card.id) && !missed.current.has(card.word.en)) {
          missed.current.add(card.word.en);
          sr.record(card.word, false);
        }
      }
      seenCards.current.add(a.id);
      seenCards.current.add(b.id);
      later(() => {
        setOpen([]);
        busy.current = false;
      }, 900);
    }
  };

  if (!enough) {
    return (
      <SafeAreaView style={s.root}>
        <GameHeader title="Çiftler" level={level} score={0} onBack={onBack} />
        <EmptyWords need={2} onBack={onBack} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <GameHeader title="Çiftler" level={level} score={score} onBack={onBack} />
      <Text style={s.info}>
        Tur {round} · Hamle {moves}
      </Text>
      <View style={s.grid}>
        {Array.from({ length: ROWS }, (_, r) => (
          <View key={r} style={s.row}>
            {cards.slice(r * COLS, r * COLS + COLS).map((c) => {
              const isDone = done.has(c.word.en);
              const isOpen = isDone || open.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => flip(c)}
                  style={[
                    s.card,
                    isOpen && (c.side === "en" ? s.cardEn : s.cardTr),
                    isDone && s.cardDone,
                  ]}
                >
                  {isOpen ? (
                    <>
                      <Text style={s.cardSide}>{c.side === "en" ? "EN" : "TR"}</Text>
                      <Text style={s.cardTxt} numberOfLines={3} adjustsFontSizeToFit>
                        {c.side === "en" ? c.word.en : c.word.tr}
                      </Text>
                    </>
                  ) : (
                    <Text style={s.back}>?</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  info: { color: COLORS.textDim, textAlign: "center", marginBottom: 8, fontWeight: "600" },
  grid: { flex: 1, paddingHorizontal: 12, paddingBottom: 16, gap: 10 },
  row: { flex: 1, flexDirection: "row", gap: 10 },
  card: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: COLORS.indigoDark,
    borderWidth: 2,
    borderColor: COLORS.indigo,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  cardEn: { backgroundColor: COLORS.card, borderColor: COLORS.indigo },
  cardTr: { backgroundColor: COLORS.card, borderColor: COLORS.amber },
  cardDone: { backgroundColor: "rgba(34,197,94,0.2)", borderColor: COLORS.green },
  cardSide: { position: "absolute", top: 6, left: 8, color: COLORS.textDim, fontSize: 10, fontWeight: "800" },
  cardTxt: { color: COLORS.text, fontSize: 15, fontWeight: "700", textAlign: "center" },
  back: { color: "rgba(255,255,255,0.6)", fontSize: 32, fontWeight: "800" },
});
