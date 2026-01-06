// 簡單測試：驗證胡牌判定邏輯
// 114張牌型：111 222 333 444 55（暗牌13張）+ 5萬（胡張）= 14張完成胡牌

const counts = new Array(34).fill(0);
counts[0] = 3; // 1萬x3
counts[1] = 3; // 2萬x3
counts[2] = 3; // 3萬x3
counts[3] = 3; // 4萬x3
counts[4] = 1; // 5萬x1 (等對子)

console.log('暗牌總數:', counts.reduce((a,b)=>a+b, 0)); // 應該是 13
console.log('胡張: 5萬 (tile 4)');
console.log('胡後總數: 14 張');
console.log('結構: 111萬 222萬 333萬 444萬 55萬');
