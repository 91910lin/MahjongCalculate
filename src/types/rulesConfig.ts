/**
 * 台灣麻將規則設定
 * 使用者可自訂啟用/停用各項台型規則
 */
export interface RulesConfig {
  // === 特殊模式 ===
  /** 見花見字：每朵花1台、每組字牌刻子1台（不區分門風/圈風） */
  jianHuaJianZi: boolean;

  // === 十六台 ===
  tianHu: boolean;         // 天胡
  diHu: boolean;           // 地胡
  daSiXi: boolean;         // 大四喜

  // === 八台 ===
  guoShiWuShuang: boolean; // 國士無雙
  daSanYuan: boolean;      // 大三元
  xiaoSiXi: boolean;       // 小四喜
  ziYiSe: boolean;         // 字一色
  qingYiSe: boolean;       // 清一色
  wuAnKe: boolean;         // 五暗刻
  baXianGuoHai: boolean;   // 八仙過海

  // === 五台 ===
  siAnKe: boolean;         // 四暗刻

  // === 四台 ===
  hunYiSe: boolean;        // 混一色
  pengPengHu: boolean;     // 碰碰胡
  xiaoSanYuan: boolean;    // 小三元
  qiDuiZi: boolean;        // 七對子

  // === 二台 ===
  pingHu: boolean;         // 平胡
  quanQiuRen: boolean;     // 全求人
  sanAnKe: boolean;        // 三暗刻

  // === 一台 ===
  menQing: boolean;        // 門清
  buQiu: boolean;          // 不求
  ziMo: boolean;           // 自摸
  zhuangJia: boolean;      // 莊家
  quanFeng: boolean;       // 圈風（見花見字時自動停用）
  menFeng: boolean;        // 門風（見花見字時自動停用）
  sanYuanPai: boolean;     // 三元牌（中/發/白）
  huaPai: boolean;         // 花牌/正花
  duTing: boolean;         // 獨聽
  haiDi: boolean;          // 海底撈月/河底撈魚
  gangShangKaiHua: boolean;// 槓上開花
  qiangGang: boolean;      // 搶槓
  lianZhuang: boolean;     // 連莊
  laZhuang: boolean;       // 拉莊
  huaGang: boolean;        // 花槓
}

/** 預設規則：依據中華民國麻將競技協會規則，全部啟用 */
export const DEFAULT_RULES_CONFIG: RulesConfig = {
  jianHuaJianZi: false,
  tianHu: true,
  diHu: true,
  daSiXi: true,
  guoShiWuShuang: true,
  daSanYuan: true,
  xiaoSiXi: true,
  ziYiSe: true,
  qingYiSe: true,
  wuAnKe: true,
  baXianGuoHai: true,
  siAnKe: true,
  hunYiSe: true,
  pengPengHu: true,
  xiaoSanYuan: true,
  qiDuiZi: true,
  pingHu: true,
  quanQiuRen: true,
  sanAnKe: true,
  menQing: true,
  buQiu: true,
  ziMo: true,
  zhuangJia: true,
  quanFeng: true,
  menFeng: true,
  sanYuanPai: true,
  huaPai: true,
  duTing: true,
  haiDi: true,
  gangShangKaiHua: true,
  qiangGang: true,
  lianZhuang: true,
  laZhuang: true,
  huaGang: true,
};
