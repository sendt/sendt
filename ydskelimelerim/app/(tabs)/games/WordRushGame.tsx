import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyWords from "@/components/EmptyWords";
import GameHeader from "@/components/GameHeader";
import GameOver from "@/components/GameOver";
import { COLORS, initialSpeedFactor, nextSpeedFactor } from "@/lib/constants";
import type { GameProps } from "@/lib/game-types";
import type { Word } from "@/lib/sr-engine";
import { useGameLoop, useTimeouts } from "@/lib/use-game-loop";

const LANES = 3;
const BLOCK_H = 56;
const CAR_W = 56;
const CAR_H = 64;
const CAR_BOTTOM = 16;
const MAX_LIVES = 3;

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export default function WordRushGame({ sr, speed, level, onBack }: GameProps) {
  const enough = sr.count() >= LANES;
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);
  const [, setFrame] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [over, setOver] = useState(false);
  const [question, setQuestion] = useState<Word | null>(null);
  const [blocks, setBlocks] = useState<Word[]>([]);
  const [result, setResult] = useState<{ lane: number; ok: boolean } | null>(null);
  const later = useTimeouts();

  const rowY = useRef(-BLOCK_H);
  const lane = useRef(1);
  const carX = useRef(0);
  const paused = useRef(false);
  const factor = useRef(initialSpeedFactor(speed));
  const livesRef = useRef(MAX_LIVES);
  const questionRef = useRef(question);
  questionRef.current = question;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const laneW = area ? area.w / LANES : 0;
  const laneCenter = (i: number) => laneW * i + laneW / 2;

  const newRow = useCallback(() => {
    const q = sr.next();
    setQuestion(q);
    setBlocks(shuffle([q, ...sr.distractors(q, LANES - 1)]));
    setResult(null);
    rowY.current = -BLOCK_H;
    paused.current = false;
  }, [sr]);

  const start = useCallback(() => {
    livesRef.current = MAX_LIVES;
    factor.current = initialSpeedFactor(speed);
    lane.current = 1;
    setLives(MAX_LIVES);
    setScore(0);
    setOver(false);
    newRow();
  }, [newRow, speed]);

  useEffect(() => {
    if (area && enough) {
      carX.current = area.w / 2;
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, enough]);

  const resolve = () => {
    const q = questionRef.current;
    if (!q) return;
    paused.current = true;
    const ok = blocksRef.current[lane.current]?.en === q.en;
    sr.record(q, ok);
    factor.current = nextSpeedFactor(speed, factor.current, ok);
    setResult({ lane: lane.current, ok });
    if (ok) {
      setScore((s) => s + 1);
      later(newRow, 450);
    } else {
      livesRef.current -= 1;
      setLives(livesRef.current);
      if (livesRef.current <= 0) later(() => setOver(true), 900);
      else later(newRow, 1100);
    }
  };

  const step = (dt: number) => {
    if (!area) return;
    // Araba hedef şeride yumuşakça kayar
    const target = laneCenter(lane.current);
    carX.current += (target - carX.current) * Math.min(1, dt * 14);

    if (!paused.current) {
      rowY.current += area.h * 0.26 * factor.current * dt;
      const carTop = area.h - CAR_BOTTOM - CAR_H;
      if (rowY.current + BLOCK_H >= carTop) {
        rowY.current = carTop - BLOCK_H;
        resolve();
      }
    }
    setFrame((f) => f + 1);
  };

  useGameLoop(step, !!area && enough && !over);

  const move = (dir: -1 | 1) => {
    if (paused.current) return;
    lane.current = Math.max(0, Math.min(LANES - 1, lane.current + dir));
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!area || area.w !== width || area.h !== height) setArea({ w: width, h: height });
  };

  if (!enough) {
    return (
      <SafeAreaView style={s.root}>
        <GameHeader title="Kelime Arabası" level={level} score={0} onBack={onBack} />
        <EmptyWords need={LANES} onBack={onBack} />
      </SafeAreaView>
    );
  }

  const correctLane = question ? blocks.findIndex((b) => b.en === question.en) : -1;

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <GameHeader title="Kelime Arabası" level={level} score={score} lives={lives} onBack={onBack} />
      <View style={s.questionBar}>
        <Text style={s.question} numberOfLines={1} adjustsFontSizeToFit>
          {question?.en ?? ""}
        </Text>
      </View>

      <View style={s.area} onLayout={onLayout}>
        {/* Şerit çizgileri */}
        {area &&
          Array.from({ length: LANES - 1 }, (_, i) => (
            <View key={i} style={[s.laneLine, { left: laneW * (i + 1) - 1 }]} />
          ))}

        {area &&
          blocks.map((b, i) => {
            let bg = "rgba(99,102,241,0.25)";
            let border: string = COLORS.indigo;
            if (result) {
              if (i === correctLane) { bg = COLORS.green; border = COLORS.green; }
              else if (i === result.lane && !result.ok) { bg = COLORS.red; border = COLORS.red; }
            }
            return (
              <View
                key={`${b.en}-${i}`}
                style={[
                  s.block,
                  {
                    left: laneW * i + 6,
                    width: laneW - 12,
                    top: rowY.current,
                    backgroundColor: bg,
                    borderColor: border,
                  },
                ]}
              >
                <Text style={s.blockTxt} numberOfLines={2} adjustsFontSizeToFit>
                  {b.tr}
                </Text>
              </View>
            );
          })}

        {area && (
          <View
            style={[
              s.car,
              { left: carX.current - CAR_W / 2, top: area.h - CAR_BOTTOM - CAR_H },
            ]}
          >
            <Text style={s.carTxt}>🚗</Text>
          </View>
        )}

        {/* Dokunma bölgeleri: sol yarı sola, sağ yarı sağa */}
        <View style={s.touchRow}>
          <Pressable style={s.touchHalf} onPressIn={() => move(-1)}>
            <Text style={s.arrow}>◀</Text>
          </Pressable>
          <Pressable style={s.touchHalf} onPressIn={() => move(1)}>
            <Text style={s.arrow}>▶</Text>
          </Pressable>
        </View>
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
  laneLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(148,163,184,0.15)",
  },
  block: {
    position: "absolute",
    height: BLOCK_H,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  blockTxt: { color: COLORS.text, fontSize: 15, fontWeight: "700", textAlign: "center" },
  car: {
    position: "absolute",
    width: CAR_W,
    height: CAR_H,
    alignItems: "center",
    justifyContent: "center",
  },
  carTxt: { fontSize: 46, transform: [{ rotate: "90deg" }] },
  touchRow: { ...StyleSheet.absoluteFillObject, flexDirection: "row" },
  touchHalf: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 6 },
  arrow: { color: "rgba(148,163,184,0.35)", fontSize: 18 },
});
