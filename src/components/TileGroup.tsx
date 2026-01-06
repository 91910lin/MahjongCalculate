import { Tile } from '../types/mahjong'
import { MahjongTile } from './MahjongTile'
import './TileGroup.css'

interface TileGroupProps {
  tiles: Tile[]
  label?: string
  size?: 'small' | 'medium' | 'large'
  rotate?: boolean
  showCount?: boolean  // 是否顯示每張牌的數量
}

export function TileGroup({
  tiles,
  label,
  size = 'medium',
  rotate = false,
  showCount = false
}: TileGroupProps) {
  // 如果需要顯示數量，將 tiles 轉換為 { tile, count } 格式
  const tileWithCounts = showCount
    ? tiles.reduce((acc, tile) => {
        const existing = acc.find(item => item.tile === tile)
        if (existing) {
          existing.count++
        } else {
          acc.push({ tile, count: 1 })
        }
        return acc
      }, [] as { tile: Tile; count: number }[])
    : tiles.map(tile => ({ tile, count: 1 }))

  return (
    <div className="tile-group">
      {label && <div className="tile-group-label">{label}</div>}
      <div className={`tile-group-container ${rotate ? 'rotate' : ''}`}>
        {showCount ? (
          tileWithCounts.map(({ tile, count }, index) => (
            <div key={index} className="tile-with-count">
              <MahjongTile tile={tile} size={size} rotate={rotate} />
              {count > 1 && <span className="tile-count">×{count}</span>}
            </div>
          ))
        ) : (
          tiles.map((tile, index) => (
            <MahjongTile key={index} tile={tile} size={size} rotate={rotate} />
          ))
        )}
      </div>
    </div>
  )
}
