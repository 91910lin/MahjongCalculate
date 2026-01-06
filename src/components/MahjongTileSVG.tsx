import { Tile } from '../types/mahjong'
import { getTileName } from '../utils/tileUtils'

interface MahjongTileSVGProps {
  tile: Tile
  width?: number
  height?: number
}

export function MahjongTileSVG({ tile, width = 60, height = 80 }: MahjongTileSVGProps) {
  const tileName = getTileName(tile)

  return (
    <img
      src={`/tiles/${tile}.svg`}
      alt={tileName}
      title={tileName}
      width={width}
      height={height}
      style={{
        filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.3))',
        cursor: 'default'
      }}
    />
  )
}
