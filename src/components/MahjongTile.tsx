import { Tile } from '../types/mahjong'
import { getTileUnicode, getTileName } from '../utils/tileUtils'
import './MahjongTile.css'

interface MahjongTileProps {
  tile: Tile
  size?: 'small' | 'medium' | 'large'
  rotate?: boolean  // 是否旋轉（模擬橫放的副露牌）
  showName?: boolean // 是否顯示文字名稱
}

export function MahjongTile({
  tile,
  size = 'medium',
  rotate = false,
  showName = false
}: MahjongTileProps) {
  return (
    <div
      className={`mahjong-tile ${size} ${rotate ? 'rotate' : ''}`}
      title={getTileName(tile)}
    >
      <span className="tile-unicode">{getTileUnicode(tile)}</span>
      {showName && <span className="tile-name">{getTileName(tile)}</span>}
    </div>
  )
}
