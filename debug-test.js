// Debug script to check winning detection decomposition
import { checkWinning } from './src/core/winningDetector.ts'

// 碰碰胡測試：111萬 222萬 333萬 444萬 555萬 6萬 + 6萬
const counts = new Array(34).fill(0)
counts[0] = 3 // 1萬x3 (刻子)
counts[1] = 3 // 2萬x3 (刻子)
counts[2] = 3 // 3萬x3 (刻子)
counts[3] = 3 // 4萬x3 (刻子)
counts[4] = 3 // 5萬x3 (刻子)
counts[5] = 1 // 6萬x1 (等對子)

console.log('測試碰碰胡牌型')
console.log('暗牌總數:', counts.reduce((a, b) => a + b, 0)) // 應該是 16
console.log('胡張: 6萬 (tile 5)')

const result = checkWinning(counts, [], 5)
console.log('\n檢測結果:', result ? '可胡牌' : '不可胡牌')

if (result) {
  console.log('\n對子:', result.pair)
  console.log('\n面子:')
  result.melds.forEach((meld, i) => {
    console.log(`  ${i + 1}. 類型=${meld.type}, 牌=${meld.tiles}, 明牌=${meld.isOpen}`)
  })

  const allTriplets = result.melds.every(m => m.type === 'KE' || m.type === 'GANG')
  console.log('\n全部是刻子?', allTriplets)
}
