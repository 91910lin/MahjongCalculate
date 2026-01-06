import { Routes, Route, Link } from 'react-router-dom'
import PracticeMode from './components/PracticeMode'
import { TileShowcase } from './components/TileShowcase'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🀄 台灣麻將計算器</h1>
        <nav>
          <Link to="/">練習模式</Link>
          <Link to="/showcase">牌型展示</Link>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<PracticeMode />} />
          <Route path="/showcase" element={<TileShowcase />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>純前端靜態網站 | 可部署至 GitHub Pages</p>
      </footer>
    </div>
  )
}

export default App
