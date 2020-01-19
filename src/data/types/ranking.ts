import { LevelWithDelta } from "./level";
import { PlayerMetadataLite } from "./metadata";

export enum RankingTimeSpan {
  OneWeek = "1w",
  FourWeeks = "4w"
}
export type DeltaRankingItem = {
  id: number;
  nickname: string;
  level: LevelWithDelta;
  delta: number;
};
export type DeltaRankingResponse = {
  [modeId: string]: {
    top: DeltaRankingItem[];
    bottom: DeltaRankingItem[];
  };
};
export interface CareerRankingItem extends PlayerMetadataLite {
  rank_key: number;
  count: number;
}
export enum CareerRankingType {
  Rank1 = "rank1",
  Rank12 = "rank12",
  Rank123 = "rank123",
  Rank4 = "rank4",
  AvgRank = "avg_rank",
  NumGames = "num_games",
  StableLevel = "stable_level",
  Win = "win",
  Lose = "lose",
  里宝率 = "里宝率",
  被炸率 = "被炸率",
  一发率 = "一发率",
  里宝率Rev = "里宝率_rev",
  被炸率Rev = "被炸率_rev",
  一发率Rev = "一发率_rev"
}
