/**
 * 麻將牌型定義（0-33）
 * 0-8: 萬子 (1萬-9萬)
 * 9-17: 筒子 (1筒-9筒)
 * 18-26: 條子 (1條-9條)
 * 27-30: 風牌 (東南西北)
 * 31-33: 三元牌 (中發白)
 */
export type Tile = number; // 0-33

/**
 * 副露類型
 */
export type Meld =
  | { kind: 'CHI'; tiles: [Tile, Tile, Tile] }          // 吃（順子）
  | { kind: 'PON'; tiles: [Tile, Tile, Tile] }          // 碰（刻子）
  | { kind: 'MING_KONG'; tiles: [Tile, Tile, Tile, Tile] } // 明槓
  | { kind: 'AN_KONG'; tiles: [Tile, Tile, Tile, Tile] };  // 暗槓

/**
 * 風位
 */
export enum Wind {
  EAST = 27,   // 東
  SOUTH = 28,  // 南
  WEST = 29,   // 西
  NORTH = 30   // 北
}

/**
 * 遊戲場景資訊
 */
export interface Scenario {
  isSelfDraw: boolean;           // 自摸
  isDealer: boolean;             // 是否為莊家
  dealerStreak: number;          // 連莊數
  roundWind: Wind;               // 圈風
  seatWind: Wind;                // 門風
  isHaidi: boolean;              // 海底撈月/海底撈魚
  isGangShangKaiHua: boolean;    // 槓上開花
  isQiangGangHu: boolean;        // 搶槓胡
  isTianHu: boolean;             // 天胡
  isDiHu: boolean;               // 地胡
  flowers: number[];             // 花牌（0-7）：春夏秋冬梅蘭竹菊
}

/**
 * 面子類型（用於胡牌拆解）
 */
export type MeldInHand =
  | { type: 'SHUN'; tiles: [Tile, Tile, Tile]; isOpen: boolean }      // 順子
  | { type: 'KE'; tiles: [Tile, Tile, Tile]; isOpen: boolean }        // 刻子
  | { type: 'GANG'; tiles: [Tile, Tile, Tile, Tile]; isOpen: boolean }; // 槓

/**
 * 胡牌拆解結果
 */
export interface WinningDecomposition {
  pair: [Tile, Tile];           // 將（對子）
  melds: MeldInHand[];          // 所有面子（含開門/暗的）
}

/**
 * 題目狀態
 */
export interface Question {
  concealedCounts: number[];    // 暗牌數量陣列 [34]
  openMelds: Meld[];           // 副露
  winningTile: Tile;           // 胡張
  scenario: Scenario;          // 場景資訊
}

/**
 * 台數計算結果
 */
export interface FanResult {
  name: string;                // 台型名稱
  fan: number;                 // 台數
  description?: string;        // 說明
}

/**
 * 總計分結果
 */
export interface ScoreResult {
  fans: FanResult[];           // 所有台型
  totalFan: number;            // 總台數
  basePoints: number;          // 底分
  totalPoints: number;         // 總分
  isWinning: boolean;          // 是否胡牌
  decomposition?: WinningDecomposition; // 胡牌拆解
}
