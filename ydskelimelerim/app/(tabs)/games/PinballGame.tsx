import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
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
import { useGameLoop, useTimeouts } from "@/lib/use-game-loop";

const BALL_R = 10;
const PADDLE_W = 110;
const PADDLE_H = 14;
const PADDLE_BOTTOM = 28;
const BOX_H = 52;
const BOX_GAP = 10;
const MARGIN = 12;
const MAX_LIVES = 3;

type Target = {
  word: Word;
  x: number;
  y: number;
  w: number;
  h: number;
};
type Flash = { idx: number; color: string }[];

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export default function PinballGame({ sr, speed, level, onBack }: GameProps) {
  const enough = sr.count() >= 4;
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);
  const [, setFrame] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [over, setOver] = useState(false);
  const [question, setQuestion] = useState<Word | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [options, setOptions] = useState<Word[]>([]);
  const [flash, setFlash] = useState<Flash>([]);
  const later = useTimeouts();

  const ball = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const paddleX = useRef(0);
  const serving = useRef(true);
  const locked = useRef(false); // bir kutuya çarpıldıktan sonra yeni soruya kadar
  const factor = useRef(initialSpeedFactor(speed));
  const livesRef = useRef(MAX_LIVES);

  const targets: Target[] = useMemo(() => {
    if (!area) return [];
    const w = (area.w - MARGIN * 2 - BOX_GAP) / 2;
    return options.map((word, i) => ({
      word,
      x: MARGIN + (i % 2) * (w + BOX_GAP),
      y: MARGIN + Math.floor(i / 2) * (BOX_H + BOX_GAP),
      w,
      h: BOX_H,
    }));
  }, [area, options]);
  const areaRef = useRef(area);
  areaRef.current = area;
  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  const questionRef = useRef(question);
  questionRef.current = question;

  const ballSpeed = () => (area ? area.h * 0.6 : 360) * factor.current;

  const serve = useCallback(() => {
    serving.current = true;
    later(() => {
      if (!serving.current) return;
      serving.current = false;
      const v = (area ? area.h * 0.6 : 360) * factor.current;
      const ang = (Math.random() * 0.6 - 0.3) * Math.PI / 2;
      ball.current.vx = v * Math.sin(ang);
      ball.current.vy = -v * Math.cos(ang);
    }, 700);
  }, [area, later]);

  const newQuestion = useCallback(() => {
    const q = sr.next();
    const opts = shuffle([q, ...sr.distractors(q, 3)]);
    setIsNew(!sr.mem[q.en.trim().toLowerCase()]);
    setQuestion(q);
    setOptions(opts);
    setFlash([]);
    locked.current = false;
  }, [sr]);

  const start = useCallback(() => {
    if (!area) return;
    paddleX.current = area.w / 2;
    ball.current = {
      x: area.w / 2,
      y: area.h - PADDLE_BOTTOM - PADDLE_H - BALL_R - 1,
      vx: 0,
      vy: 0,
    };
    livesRef.current = MAX_LIVES;
    factor.current = initialSpeedFactor(speed);
    setLives(MAX_LIVES);
    setScore(0);
    setOver(false);
    newQuestion();
    serve();
  }, [area, newQuestion, serve, speed]);

  useEffect(() => {
    if (area && enough) start();
    // Sadece alan ölçüldüğünde başlat
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, enough]);

  const loseLife = () => {
    livesRef.current -= 1;
    setLives(livesRef.current);
    if (livesRef.current <= 0) setOver(true);
  };

  const onHit = (idx: number) => {
    const q = questionRef.current;
    if (!q || locked.current) return;
    locked.current = true;
    const t = targetsRef.current;
    const correctIdx = t.findIndex((x) => x.word.en === q.en);
    const ok = idx === correctIdx;
    sr.record(q, ok);
    factor.current = nextSpeedFactor(speed, factor.current, ok);
    if (ok) {
      setScore((s) => s + 1);
      setFlash([{ idx, color: COLORS.green }]);
      later(newQuestion, 600);
    } else {
      setFlash([
        { idx, color: COLORS.red },
        { idx: correctIdx, color: COLORS.green },
      ]);
      loseLife();
      later(() => {
        if (livesRef.current > 0) newQuestion();
      }, 1200);
    }
  };

  const step = (dt: number) => {
    if (!area || over) return;
    const b = ball.current;
    const paddleY = area.h - PADDLE_BOTTOM - PADDLE_H;

    if (serving.current) {
      b.x = paddleX.current;
      b.y = paddleY - BALL_R - 1;
      setFrame((f) => f + 1);
      return;
    }

    const dist = Math.hypot(b.vx, b.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / 5));
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
      b.x += b.vx * sdt;
      b.y += b.vy * sdt;

      // Duvarlar
      if (b.x < BALL_R) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
      if (b.x > area.w - BALL_R) { b.x = area.w - BALL_R; b.vx = -Math.abs(b.vx); }
      if (b.y < BALL_R) { b.y = BALL_R; b.vy = Math.abs(b.vy); }

      // Hedef kutular
      const ts = targetsRef.current;
      for (let k = 0; k < ts.length; k++) {
        const t = ts[k];
        const cx = Math.max(t.x, Math.min(b.x, t.x + t.w));
        const cy = Math.max(t.y, Math.min(b.y, t.y + t.h));
        const dx = b.x - cx;
        const dy = b.y - cy;
        if (dx * dx + dy * dy < BALL_R * BALL_R) {
          const sideHit = b.x < t.x || b.x > t.x + t.w;
          if (sideHit) {
            b.vx = -b.vx;
            b.x = b.x < t.x ? t.x - BALL_R : t.x + t.w + BALL_R;
          } else {
            b.vy = Math.abs(b.vy);
            b.y = t.y + t.h + BALL_R;
          }
          onHit(k);
          break;
        }
      }

      // Paddle
      const px = paddleX.current;
      if (
        b.vy > 0 &&
        b.y + BALL_R >= paddleY &&
        b.y + BALL_R <= paddleY + PADDLE_H + 8 &&
        b.x >= px - PADDLE_W / 2 - BALL_R &&
        b.x <= px + PADDLE_W / 2 + BALL_R
      ) {
        const off = Math.max(-1, Math.min(1, (b.x - px) / (PADDLE_W / 2)));
        const ang = off * (Math.PI / 3);
        const v = ballSpeed();
        b.vx = v * Math.sin(ang);
        b.vy = -v * Math.cos(ang);
        b.y = paddleY - BALL_R;
      }

      // Kaçırıldı
      if (b.y > area.h + BALL_R) {
        loseLife();
        if (livesRef.current > 0) serve();
        else serving.current = true;
        break;
      }
    }
    setFrame((f) => f + 1);
  };

  useGameLoop(step, !!area && enough && !over);

  const movePaddle = (x: number) => {
    const a = areaRef.current;
    if (!a) return;
    paddleX.current = Math.max(PADDLE_W / 2, Math.min(a.w - PADDLE_W / 2, x));
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => movePaddle(e.nativeEvent.pageX),
        onPanResponderMove: (_, g) => movePaddle(g.moveX),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!area || area.w !== width || area.h !== height) setArea({ w: width, h: height });
  };

  if (!enough) {
    return (
      <SafeAreaView style={s.root}>
        <GameHeader title="Kelime Pinball" level={level} score={0} onBack={onBack} />
        <EmptyWords need={4} onBack={onBack} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <GameHeader
        title="Kelime Pinball"
        level={level}
        score={score}
        lives={lives}
        onBack={onBack}
      />
      <View style={s.questionBar}>
        {isNew && <Text style={s.newBadge}>YENİ</Text>}
        <Text style={s.question} numberOfLines={1} adjustsFontSizeToFit>
          {question?.en ?? ""}
        </Text>
        {!!question?.synonyms?.length && (
          <Text style={s.syn} numberOfLines={1}>
            ≈ {question.synonyms.join(", ")}
          </Text>
        )}
      </View>

      <View style={s.area} onLayout={onLayout} {...pan.panHandlers}>
        {targets.map((t, i) => {
          const f = flash.find((x) => x.idx === i);
          const hint = isNew && question && t.word.en === question.en && !f;
          return (
            <View
              key={`${t.word.en}-${i}`}
              pointerEvents="none"
              style={[
                s.box,
                { left: t.x, top: t.y, width: t.w, height: t.h },
                f && { backgroundColor: f.color, borderColor: f.color },
                hint && s.hintBox,
              ]}
            >
              <Text style={s.boxTxt} numberOfLines={2} adjustsFontSizeToFit>
                {t.word.tr}
              </Text>
            </View>
          );
        })}

        {area && (
          <>
            <View
              pointerEvents="none"
              style={[
                s.ball,
                { left: ball.current.x - BALL_R, top: ball.current.y - BALL_R },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                s.paddle,
                {
                  left: paddleX.current - PADDLE_W / 2,
                  top: area.h - PADDLE_BOTTOM - PADDLE_H,
                },
              ]}
            />
          </>
        )}
        {isNew && (
          <Text style={s.tip} pointerEvents="none">
            💡 Yeni kelime: doğru kutu parlıyor
          </Text>
        )}
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
    paddingHorizontal: 14,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    alignItems: "center",
  },
  newBadge: {
    color: "#fff",
    backgroundColor: COLORS.amber,
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 6,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 2,
  },
  question: { color: COLORS.text, fontSize: 26, fontWeight: "800" },
  syn: { color: COLORS.textDim, fontSize: 12, marginTop: 2 },
  area: { flex: 1, overflow: "hidden" },
  box: {
    position: "absolute",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.indigo,
    backgroundColor: "rgba(99,102,241,0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  hintBox: { borderColor: COLORS.amber, borderStyle: "dashed", borderWidth: 3 },
  boxTxt: { color: COLORS.text, fontSize: 15, fontWeight: "700", textAlign: "center" },
  ball: {
    position: "absolute",
    width: BALL_R * 2,
    height: BALL_R * 2,
    borderRadius: BALL_R,
    backgroundColor: "#fbbf24",
  },
  paddle: {
    position: "absolute",
    width: PADDLE_W,
    height: PADDLE_H,
    borderRadius: PADDLE_H / 2,
    backgroundColor: COLORS.indigo,
  },
  tip: {
    position: "absolute",
    bottom: PADDLE_BOTTOM + PADDLE_H + 40,
    alignSelf: "center",
    color: COLORS.textDim,
    fontSize: 12,
  },
});
