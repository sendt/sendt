import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyWords from "@/components/EmptyWords";
import GameHeader from "@/components/GameHeader";
import GameOver from "@/components/GameOver";
import { COLORS, initialSpeedFactor, nextSpeedFactor } from "@/lib/constants";
import type { GameProps } from "@/lib/game-types";
import type { Word } from "@/lib/sr-engine";
import { useTimeouts } from "@/lib/use-game-loop";

const OPTIONS = 4;
const OPT_H = 54;
const BASE_DURATION = 7000; // normal hızda bir seçeneğin ekranı geçme süresi (ms)
const STAGGER = 0.14; // seçenekler arası gecikme (süreye oranla)
const MAX_LIVES = 3;

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

type Mark = { idx: number; color: string }[];

export default function FallingGame({ sr, speed, level, onBack }: GameProps) {
  const enough = sr.count() >= OPTIONS;
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [over, setOver] = useState(false);
  const [question, setQuestion] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [marks, setMarks] = useState<Mark>([]);
  const [round, setRound] = useState(0);
  const later = useTimeouts();

  const anims = useRef(Array.from({ length: OPTIONS }, () => new Animated.Value(-OPT_H)));
  const running = useRef<{ stop: () => void } | null>(null);
  const resolved = useRef(true);
  const factor = useRef(initialSpeedFactor(speed));
  const livesRef = useRef(MAX_LIVES);

  const next = useCallback(() => {
    const q = sr.next();
    setQuestion(q);
    setOptions(shuffle([q, ...sr.distractors(q, OPTIONS - 1)]));
    setMarks([]);
    resolved.current = false;
    setRound((r) => r + 1);
  }, [sr]);

  const start = useCallback(() => {
    livesRef.current = MAX_LIVES;
    factor.current = initialSpeedFactor(speed);
    setLives(MAX_LIVES);
    setScore(0);
    setOver(false);
    next();
  }, [next, speed]);

  useEffect(() => {
    if (area && enough) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, enough]);

  const finish = (ok: boolean, tapped: number | null) => {
    if (resolved.current || !question) return;
    resolved.current = true;
    running.current?.stop();
    sr.record(question, ok);
    factor.current = nextSpeedFactor(speed, factor.current, ok);
    const correctIdx = options.findIndex((o) => o.en === question.en);
    if (ok) {
      setScore((s) => s + 1);
      setMarks([{ idx: correctIdx, color: COLORS.green }]);
      later(next, 500);
    } else {
      const m: Mark = [{ idx: correctIdx, color: COLORS.green }];
      if (tapped !== null) m.push({ idx: tapped, color: COLORS.red });
      setMarks(m);
      livesRef.current -= 1;
      setLives(livesRef.current);
      if (livesRef.current <= 0) later(() => setOver(true), 900);
      else later(next, 1200);
    }
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Her yeni soruda seçenekleri yukarıdan aşağı kaydır
  useEffect(() => {
    if (!area || round === 0 || !question) return;
    const duration = BASE_DURATION / factor.current;
    const correctIdx = options.findIndex((o) => o.en === question.en);
    const list = anims.current.map((v, i) => {
      v.setValue(-OPT_H);
      return Animated.timing(v, {
        toValue: area.h,
        duration,
        delay: i * duration * STAGGER,
        easing: Easing.linear,
        useNativeDriver: true,
      });
    });
    // Doğru seçenek dokunulmadan alta ulaşırsa kaçırılmış sayılır
    list[correctIdx]?.start(({ finished }) => {
      if (finished) finishRef.current(false, null);
    });
    list.forEach((a, i) => i !== correctIdx && a.start());
    running.current = { stop: () => list.forEach((a) => a.stop()) };
    return () => list.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, area]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!area || area.w !== width || area.h !== height) setArea({ w: width, h: height });
  };

  if (!enough) {
    return (
      <SafeAreaView style={s.root}>
        <GameHeader title="Düşen Kelimeler" level={level} score={0} onBack={onBack} />
        <EmptyWords need={OPTIONS} onBack={onBack} />
      </SafeAreaView>
    );
  }

  const colW = area ? (area.w - 36) / 2 : 0;

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <GameHeader title="Düşen Kelimeler" level={level} score={score} lives={lives} onBack={onBack} />
      <View style={s.questionBar}>
        <Text style={s.question} numberOfLines={1} adjustsFontSizeToFit>
          {question?.en ?? ""}
        </Text>
      </View>

      <View style={s.area} onLayout={onLayout}>
        {area &&
          options.map((o, i) => {
            const m = marks.find((x) => x.idx === i);
            return (
              <Animated.View
                key={`${round}-${i}`}
                style={[
                  s.opt,
                  {
                    width: colW,
                    left: 12 + (i % 2) * (colW + 12),
                    transform: [{ translateY: anims.current[i] }],
                  },
                  m && { backgroundColor: m.color, borderColor: m.color },
                ]}
              >
                <Pressable
                  style={s.optPress}
                  onPress={() => {
                    if (!question) return;
                    finish(o.en === question.en, i);
                  }}
                >
                  <Text style={s.optTxt} numberOfLines={2} adjustsFontSizeToFit>
                    {o.tr}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
      </View>

      {over && <GameOver score={score} onRestart={start} onBack={onBack} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  questionBar: {
    marginHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    alignItems: "center",
  },
  question: { color: COLORS.text, fontSize: 26, fontWeight: "800", paddingHorizontal: 12 },
  area: { flex: 1, overflow: "hidden" },
  opt: {
    position: "absolute",
    top: 0,
    height: OPT_H,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.indigo,
    backgroundColor: COLORS.card,
  },
  optPress: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  optTxt: { color: COLORS.text, fontSize: 16, fontWeight: "700", textAlign: "center" },
});
