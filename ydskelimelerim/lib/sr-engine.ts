import AsyncStorage from "@react-native-async-storage/async-storage";

export type Word = { en: string; tr: string; synonyms?: string[] };

type MemEntry = { seen: number; correct: number; nextAt: number };

/**
 * Soru sayısı cinsinden tekrar aralıkları. Art arda doğru bilinen her kelime
 * bir sonraki aralığa geçer; yanlışta başa döner.
 */
const INTERVALS = [6, 20, 60, 150, 400];
/** Yanlış bilinen kelime kaç soru sonra tekrar sorulsun. */
const RETRY_AFTER = 3;

function keyOf(w: Word): string {
  return w.en.trim().toLowerCase();
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Basit aralıklı tekrar motoru.
 * - `mem[key].correct`: art arda doğru sayısı (yanlışta 0'a döner), aralığı belirler.
 * - `mem[key].nextAt`: kelimenin tekrar sorulacağı soru sırası (tick).
 */
export class SREngine {
  words: Word[];
  storageKey: string;
  mem: Record<string, MemEntry> = {};
  private tick = 0;
  private lastKey: string | null = null;

  constructor(words: Word[], storageKey = "wv_sr_data") {
    // Aynı İngilizce kelime iki kez gelirse tekini tut.
    const seen = new Set<string>();
    this.words = words.filter((w) => {
      const k = keyOf(w);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    this.storageKey = storageKey;
  }

  /** Sıradaki sorulacak kelime: önce vadesi gelenler, sonra yeniler, sonra en yakın vadeli. */
  next(): Word {
    if (this.words.length === 0) throw new Error("SREngine: kelime listesi boş");
    this.tick++;
    const ranked = this.rank();
    let pick = ranked[0];
    if (keyOf(pick) === this.lastKey && ranked.length > 1) pick = ranked[1];
    this.lastKey = keyOf(pick);
    return pick;
  }

  record(w: Word, ok: boolean) {
    const k = keyOf(w);
    const e = this.mem[k] ?? { seen: 0, correct: 0, nextAt: 0 };
    e.seen++;
    if (ok) {
      const idx = Math.min(e.correct, INTERVALS.length - 1);
      e.correct++;
      e.nextAt = this.tick + INTERVALS[idx];
    } else {
      e.correct = 0;
      e.nextAt = this.tick + RETRY_AFTER;
    }
    this.mem[k] = e;
    this.save();
  }

  /** Öncelik sırasına göre n farklı kelime (karışık sırada). Tur bazlı oyunlar için. */
  getUnique(n: number): Word[] {
    this.tick++;
    return shuffle(this.rank().slice(0, Math.min(n, this.words.length)));
  }

  /** Şık üretmek için: verilen kelime(ler) dışında rastgele n kelime. */
  distractors(exclude: Word | Word[], n: number): Word[] {
    const ex = Array.isArray(exclude) ? exclude : [exclude];
    const exKeys = new Set(ex.map(keyOf));
    const exTr = new Set(ex.map((w) => w.tr.trim().toLowerCase()));
    const pool = this.words.filter(
      (w) => !exKeys.has(keyOf(w)) && !exTr.has(w.tr.trim().toLowerCase()),
    );
    return shuffle(pool).slice(0, n);
  }

  /** Motordaki toplam kelime sayısı. */
  count(): number {
    return this.words.length;
  }

  /** En az bir kez doğru bilinmiş kelime sayısı. */
  learnedCount(): number {
    return this.words.filter((w) => (this.mem[keyOf(w)]?.correct ?? 0) > 0).length;
  }

  save() {
    AsyncStorage.setItem(
      this.storageKey,
      JSON.stringify({ tick: this.tick, mem: this.mem }),
    ).catch(() => {});
  }

  async load() {
    try {
      const raw = await AsyncStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.mem = data?.mem ?? {};
      this.tick = typeof data?.tick === "number" ? data.tick : 0;
    } catch {
      this.mem = {};
      this.tick = 0;
    }
  }

  async reset() {
    this.mem = {};
    this.tick = 0;
    this.lastKey = null;
    await AsyncStorage.removeItem(this.storageKey);
  }

  private rank(): Word[] {
    const due: { w: Word; at: number }[] = [];
    const fresh: Word[] = [];
    const later: { w: Word; at: number }[] = [];
    for (const w of this.words) {
      const e = this.mem[keyOf(w)];
      if (!e || e.seen === 0) fresh.push(w);
      else if (e.nextAt <= this.tick) due.push({ w, at: e.nextAt });
      else later.push({ w, at: e.nextAt });
    }
    due.sort((a, b) => a.at - b.at);
    later.sort((a, b) => a.at - b.at);
    return [...due.map((d) => d.w), ...fresh, ...later.map((l) => l.w)];
  }
}
