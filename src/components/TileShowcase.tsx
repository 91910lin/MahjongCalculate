import { MahjongTileSVG } from './MahjongTileSVG'
import './TileShowcase.css'

export function TileShowcase() {
  // 萬子 0-8
  const mans = [0, 1, 2, 3, 4, 5, 6, 7, 8]

  // 筒子 9-17
  const pins = [9, 10, 11, 12, 13, 14, 15, 16, 17]

  // 條子 18-26
  const sous = [18, 19, 20, 21, 22, 23, 24, 25, 26]

  // 風牌 27-30
  const winds = [27, 28, 29, 30]

  // 三元牌 31-33
  const dragons = [31, 32, 33]

  // 範例胡牌組合：111萬 444萬 777萬 111筒 444筒 77筒
  const winningHand = [0, 0, 0, 3, 3, 3, 6, 6, 6, 9, 9, 9, 12, 12, 12, 15, 15]

  return (
    <div className="tile-showcase">
      <h1>🀄 台灣麻將牌型展示（SVG版本）</h1>

      <section>
        <h2>萬子 (Characters)</h2>
        <div className="tile-row">
          {mans.map(tile => (
            <MahjongTileSVG key={tile} tile={tile} width={70} height={95} />
          ))}
        </div>
      </section>

      <section>
        <h2>筒子 (Dots)</h2>
        <div className="tile-row">
          {pins.map(tile => (
            <MahjongTileSVG key={tile} tile={tile} width={70} height={95} />
          ))}
        </div>
      </section>

      <section>
        <h2>條子 (Bamboo)</h2>
        <div className="tile-row">
          {sous.map(tile => (
            <MahjongTileSVG key={tile} tile={tile} width={70} height={95} />
          ))}
        </div>
      </section>

      <section>
        <h2>風牌 (Winds)</h2>
        <div className="tile-row">
          {winds.map(tile => (
            <MahjongTileSVG key={tile} tile={tile} width={70} height={95} />
          ))}
        </div>
      </section>

      <section>
        <h2>三元牌 (Dragons)</h2>
        <div className="tile-row">
          {dragons.map(tile => (
            <MahjongTileSVG key={tile} tile={tile} width={70} height={95} />
          ))}
        </div>
      </section>

      <section>
        <h2>碰碰胡範例</h2>
        <p className="description">111萬 444萬 777萬 111筒 444筒 77筒 (17張)</p>
        <div className="tile-row">
          {winningHand.map((tile, index) => (
            <MahjongTileSVG key={index} tile={tile} width={60} height={80} />
          ))}
        </div>
      </section>

      <section>
        <h2>尺寸比較</h2>
        <div className="size-comparison">
          <div>
            <p>小號 (40×55)</p>
            <div className="tile-row">
              <MahjongTileSVG tile={0} width={40} height={55} />
              <MahjongTileSVG tile={9} width={40} height={55} />
              <MahjongTileSVG tile={18} width={40} height={55} />
            </div>
          </div>
          <div>
            <p>中號 (60×80)</p>
            <div className="tile-row">
              <MahjongTileSVG tile={1} width={60} height={80} />
              <MahjongTileSVG tile={10} width={60} height={80} />
              <MahjongTileSVG tile={19} width={60} height={80} />
            </div>
          </div>
          <div>
            <p>大號 (80×110)</p>
            <div className="tile-row">
              <MahjongTileSVG tile={2} width={80} height={110} />
              <MahjongTileSVG tile={11} width={80} height={110} />
              <MahjongTileSVG tile={20} width={80} height={110} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
