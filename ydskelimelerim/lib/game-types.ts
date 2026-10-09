import type { SpeedMode } from "./constants";
import type { SREngine } from "./sr-engine";

export type GameProps = {
  sr: SREngine;
  speed: SpeedMode;
  level: string;
  onBack: () => void;
};
