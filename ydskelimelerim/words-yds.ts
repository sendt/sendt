export type YDSWord = { en: string; tr: string; synonyms?: string[] };
export type YDSDay = { day: number; words: YDSWord[]; category?: string };
export const YDS_DAYS: YDSDay[] = [];
