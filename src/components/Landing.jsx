import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PIN_REGISTRY from '../pinRegistry'

// ─── Tim Tam Game Data ───

const STAGES = [
  { threshold: 0, label: 'Dry', color: '#8B4513', integrity: 100 },
  { threshold: 8, label: 'Slightly Damp', color: '#7a3b10', integrity: 90 },
  { threshold: 18, label: 'Nicely Soaked', color: '#6a300d', integrity: 70 },
  { threshold: 35, label: 'Dangerously Soggy', color: '#5a260a', integrity: 45 },
  { threshold: 55, label: 'Structural Failure Imminent', color: '#4a1c07', integrity: 20 },
  { threshold: 75, label: 'CRITICAL', color: '#3a1205', integrity: 5 },
]

const RESULTS = {
  dry: { emoji: '😐', title: 'Coward.', subtitle: 'That Tim Tam barely touched the tea. Were you even trying?' },
  light: { emoji: '🤔', title: 'Timid Dunker', subtitle: 'A brief encounter. The Tim Tam wanted more.' },
  perfect: { emoji: '🤌', title: 'PERFECT DUNK', subtitle: 'Maximum saturation. Zero casualties. You are a god among dunkers.' },
  risky: { emoji: '😰', title: 'Living on the Edge', subtitle: 'That was close. The Tim Tam gods smiled upon you today.' },
  disaster: { emoji: '💀', title: 'CATASTROPHIC FAILURE', subtitle: '' },
}

const DISASTER_MESSAGES = [
  "Your Tim Tam has drowned. It's gone. It's in tea heaven now.",
  "Structural integrity: zero. That Tim Tam is now tea soup.",
  "The Tim Tam has entered the shadow realm (bottom of the mug).",
  "Gone. Reduced to atoms. The tea claimed another victim.",
  "That wasn't a dunk, that was a burial at sea.",
  "RIP Tim Tam. Cause of death: hubris.",
  "The soggy bottom has claimed another. You monster.",
  "Tim Tam status: dissolved. Your dignity: also dissolved.",
]

function getResult(dunkTime, collapsed) {
  if (collapsed) {
    const msg = DISASTER_MESSAGES[Math.floor(Math.random() * DISASTER_MESSAGES.length)]
    return { ...RESULTS.disaster, subtitle: msg }
  }
  if (dunkTime < 8) return RESULTS.dry
  if (dunkTime < 20) return RESULTS.light
  if (dunkTime < 50) return RESULTS.perfect
  return RESULTS.risky
}

function getCurrentStage(progress) {
  let current = STAGES[0]
  for (const stage of STAGES) {
    if (progress >= stage.threshold) current = stage
  }
  return current
}

// ─── Component ───

export default function Landing() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState(false)

  const handlePinChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6)
    setPin(cleaned)
    setPinError('')
    setPinSuccess(false)
  }

  const handlePinSubmit = () => {
    const entry = PIN_REGISTRY[pin]
    if (!entry) { setPinError('Invalid pin'); return }
    if (entry.expires && new Date(entry.expires) < new Date()) { setPinError('This demo has expired'); return }
    setPinSuccess(true)
    setTimeout(() => navigate(entry.path), 400)
  }

  const handlePinKeyDown = (e) => {
    if (e.key === 'Enter' && pin.length >= 4) handlePinSubmit()
  }

  // Tim Tam state
  const [gameState, setGameState] = useState('idle')
  const [dunkProgress, setDunkProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [biscuitY, setBiscuitY] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [wobble, setWobble] = useState(0)
  const [crumbs, setCrumbs] = useState([])
  const [splashActive, setSplashActive] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const animRef = useRef(null)
  const startTimeRef = useRef(null)
  const collapseChanceRef = useRef(0)
  const dunkProgressRef = useRef(0)

  const resetGame = useCallback(() => {
    setGameState('idle')
    setDunkProgress(0)
    dunkProgressRef.current = 0
    setBiscuitY(0)
    setCollapsed(false)
    setWobble(0)
    setCrumbs([])
    setSplashActive(false)
    setResult(null)
    collapseChanceRef.current = 0
    if (animRef.current) cancelAnimationFrame(animRef.current)
  }, [])

  const endDunk = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = null
    const progress = dunkProgressRef.current
    setGameState('result')
    setAttempts(a => a + 1)
    setResult(getResult(progress, false))
    if (progress >= 20) setHighScore(prev => Math.max(prev, Math.round(progress)))
  }, [])

  const startDunk = useCallback(() => {
    if (gameState !== 'idle') return
    setGameState('dunking')
    startTimeRef.current = Date.now()
    collapseChanceRef.current = 0
    dunkProgressRef.current = 0
    setSplashActive(true)
    setTimeout(() => setSplashActive(false), 300)

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current
      const progress = Math.min((elapsed / 5000) * 100, 100)
      setDunkProgress(progress)
      dunkProgressRef.current = progress
      setBiscuitY(Math.min(progress * 0.6, 55))
      if (progress > 35) setWobble(Math.sin(elapsed / 80) * (progress - 35) * 0.08)
      if (progress > 45 && Math.random() < 0.03) {
        setCrumbs(prev => [...prev.slice(-8), { id: Date.now() + Math.random(), x: 45 + Math.random() * 10, delay: Math.random() * 0.2 }])
      }
      if (progress > 55) {
        collapseChanceRef.current += 0.001 * ((progress - 55) / 10)
        if (Math.random() < collapseChanceRef.current) {
          setCollapsed(true); setGameState('result'); setAttempts(a => a + 1); setResult(getResult(progress, true)); return
        }
      }
      if (progress >= 100) {
        setCollapsed(true); setGameState('result'); setAttempts(a => a + 1); setResult(getResult(100, true)); return
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
  }, [gameState])

  useEffect(() => { return () => { if (animRef.current) cancelAnimationFrame(animRef.current) } }, [])

  useEffect(() => {
    if (gameState !== 'dunking') return
    const handleRelease = (e) => { e.preventDefault(); endDunk() }
    const preventScroll = (e) => { e.preventDefault() }
    window.addEventListener('mouseup', handleRelease)
    window.addEventListener('touchend', handleRelease)
    window.addEventListener('touchcancel', handleRelease)
    window.addEventListener('touchmove', preventScroll, { passive: false })
    return () => {
      window.removeEventListener('mouseup', handleRelease)
      window.removeEventListener('touchend', handleRelease)
      window.removeEventListener('touchcancel', handleRelease)
      window.removeEventListener('touchmove', preventScroll)
    }
  }, [gameState, endDunk])

  const stage = getCurrentStage(dunkProgress)
  const isCritical = dunkProgress > 55

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .lp { font-family: 'Inter', -apple-system, system-ui, sans-serif; height: 100vh; overflow: hidden; background: #1a1a1a; -webkit-font-smoothing: antialiased; }

        /* Two columns */
        .lp-grid { display: grid; grid-template-columns: 7fr 3fr; height: 100vh; }
        @media (max-width: 720px) { .lp-grid { grid-template-columns: 1fr; } }

        /* Orange pin column */
        .lp-pin {
          background: #e8760a;
          padding: 60px 40px;
          display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
          position: relative; overflow: hidden;
        }
        .lp-pin::before {
          content: ''; position: absolute; inset: 0;
          background:
            repeating-linear-gradient(45deg, transparent, transparent 24px, rgba(255,255,255,0.08) 24px, rgba(255,255,255,0.08) 26px),
            repeating-linear-gradient(-45deg, transparent, transparent 24px, rgba(255,255,255,0.08) 24px, rgba(255,255,255,0.08) 26px);
          pointer-events: none;
        }
        .lp-pin::after {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(circle at 90% 10%, transparent 80px, rgba(255,255,255,0.15) 80px, rgba(255,255,255,0.15) 84px, transparent 84px),
            radial-gradient(circle at 90% 10%, transparent 120px, rgba(255,255,255,0.1) 120px, rgba(255,255,255,0.1) 123px, transparent 123px),
            radial-gradient(circle at 90% 10%, transparent 160px, rgba(255,255,255,0.06) 160px, rgba(255,255,255,0.06) 162px, transparent 162px),
            radial-gradient(circle at 8% 88%, transparent 50px, rgba(255,255,255,0.12) 50px, rgba(255,255,255,0.12) 53px, transparent 53px),
            radial-gradient(circle at 8% 88%, transparent 85px, rgba(255,255,255,0.08) 85px, rgba(255,255,255,0.08) 87px, transparent 87px),
            radial-gradient(circle at 50% 80%, transparent 35px, rgba(255,255,255,0.07) 35px, rgba(255,255,255,0.07) 37px, transparent 37px),
            radial-gradient(circle at 75% 50%, transparent 25px, rgba(255,255,255,0.06) 25px, rgba(255,255,255,0.06) 27px, transparent 27px),
            radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.1) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 85%, rgba(0,0,0,0.15) 0%, transparent 45%);
          pointer-events: none;
        }
        .lp-pin > * { position: relative; z-index: 1; }
        .lp-pin h1 { font-size: 32px; font-weight: 800; color: #fff; line-height: 1.15; margin-bottom: 10px; }
        .lp-pin .sub { font-size: 15px; color: rgba(255,255,255,0.75); line-height: 1.6; margin-bottom: 36px; }
        .lp-pin-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
        .lp-pin-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .lp-pin-input {
          font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 700;
          letter-spacing: 0.3em; text-align: center;
          padding: 14px 16px; width: 160px;
          background: #c56409; border: 2px solid rgba(255,255,255,0.25); border-radius: 8px;
          color: #fff; outline: none; transition: border-color 0.2s;
        }
        .lp-pin-input::placeholder { color: rgba(255,255,255,0.3); }
        .lp-pin-input:focus { border-color: rgba(255,255,255,0.6); }
        .lp-pin-input.error { border-color: #fff; background: rgba(200,0,0,0.2); }
        .lp-pin-input.success { border-color: #fff; }
        .lp-pin-btn {
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          padding: 14px 24px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3);
          background: #c56409; color: #fff; cursor: pointer; transition: all 0.2s;
        }
        .lp-pin-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .lp-pin-btn:not(:disabled):hover { background: #a85507; border-color: rgba(255,255,255,0.5); }
        .lp-pin-btn.success { background: #9a4e06; }
        .lp-pin-error { font-size: 12px; font-weight: 600; color: #fff; }

        .lp-pin-contact { margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.15); width: 30%; }
        .lp-pin-contact p { font-size: 13px; color: rgba(255,255,255,0.55); margin-bottom: 12px; }
        .lp-pin-contact a {
          display: block; width: 100%; padding: 12px 0; background: #179ecd; color: #fff;
          border-radius: 8px; font-weight: 600; font-size: 16px; text-decoration: none;
          text-align: center; cursor: pointer; transition: all 0.2s;
        }
        .lp-pin-contact a:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); }

        /* White Tim Tam column */
        .lp-tt {
          background: #f5f5f5; padding: 40px 32px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          touch-action: none; -webkit-touch-callout: none; user-select: none;
        }
        .lp-tt-label { font-size: 13px; font-weight: 700; color: #333; margin-bottom: 2px; }
        .lp-tt-sub { font-size: 12px; color: #999; margin-bottom: 20px; }

        .tt-scene { position: relative; height: 200px; width: 160px; margin: 0 auto 16px; }
        .tt-steam {
          position: absolute; width: 6px; height: 16px; background: rgba(0,0,0,0.04);
          border-radius: 50%; animation: steam 2s ease-in-out infinite;
        }
        .tt-biscuit-wrap {
          position: absolute; top: 45px; left: 50%; margin-left: -14px; z-index: 5;
          transition: transform 0.05s linear;
        }
        .tt-biscuit {
          width: 28px; height: 70px; border-radius: 3px; position: relative;
          overflow: hidden; border: 1px solid rgba(0,0,0,0.2);
        }
        .tt-biscuit-lines {
          position: absolute; inset: 0;
          background: repeating-linear-gradient(180deg, transparent, transparent 16px, rgba(0,0,0,0.1) 16px, rgba(0,0,0,0.1) 18px);
        }
        .tt-biscuit-gloss {
          position: absolute; top: 0; left: 0; right: 0; height: 28%;
          background: linear-gradient(180deg, rgba(92,50,18,0.3), transparent);
        }
        .tt-sogginess {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(0deg, rgba(30,15,5,0.9), rgba(60,30,10,0.3));
          transition: height 0.3s ease;
        }
        .tt-falling {
          position: absolute; top: 105px; left: 50%; margin-left: -14px; z-index: 5;
          animation: fall 0.8s ease-in forwards;
        }
        .tt-crumb {
          position: absolute; top: 110px; width: 3px; height: 3px; border-radius: 50%;
          background: #8B6914; animation: crumbFall 0.8s ease-in forwards;
        }
        .tt-mug-back {
          position: absolute; bottom: 8px; left: 50%; margin-left: -40px;
          width: 80px; height: 80px;
          background: linear-gradient(180deg, #e0e0e0, #bbb); border-radius: 5px 5px 14px 14px;
          z-index: 3; box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .tt-mug-inner {
          position: absolute; top: 5px; left: 5px; right: 5px; bottom: 8px;
          background: #2a2a2a; border-radius: 2px 2px 10px 10px; overflow: hidden;
        }
        .tt-tea {
          position: absolute; bottom: 0; left: 0; right: 0; height: 75%;
          background: linear-gradient(180deg, #78350f, #5c2d0e); transition: transform 0.3s ease;
        }
        .tt-tea.splash { transform: scaleY(1.05); }
        .tt-tea-shine {
          position: absolute; top: 0; left: 10%; width: 36%; height: 3px;
          background: rgba(255,255,255,0.08); border-radius: 2px;
        }
        .tt-mug-front {
          position: absolute; bottom: 8px; left: 50%; margin-left: -40px;
          width: 80px; height: 80px; border-radius: 5px 5px 14px 14px;
          border: 5px solid #bbb; border-top-color: #ddd;
          background: transparent; z-index: 6; pointer-events: none; box-sizing: border-box;
        }
        .tt-handle {
          position: absolute; right: -18px; top: 16px; width: 18px; height: 40px;
          border: 6px solid #bbb; border-left: none; border-radius: 0 12px 12px 0;
        }

        .tt-status { min-height: 110px; display: flex; align-items: center; justify-content: center; text-align: center; width: 100%; max-width: 280px; margin-bottom: 8px; }
        .tt-bar { height: 6px; background: #ddd; border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
        .tt-bar-fill { height: 100%; border-radius: 3px; transition: width 0.1s linear; }
        .tt-stage { font-size: 12px; font-weight: 700; margin-bottom: 2px; }
        .tt-integ { font-size: 11px; color: #aaa; }
        .tt-r-emoji { font-size: 2.5rem; margin-bottom: 6px; }
        .tt-r-title { font-size: 14px; font-weight: 800; color: #222; margin-bottom: 4px; }
        .tt-r-sub { font-size: 12px; color: #888; line-height: 1.5; }
        .tt-r-score { font-size: 12px; color: #b45309; margin-top: 6px; font-weight: 700; }

        .tt-btn {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          padding: 10px 24px; border-radius: 8px; border: none; cursor: pointer;
          background: #78350f; color: #fed7aa; transition: all 0.15s;
          touch-action: manipulation; -webkit-tap-highlight-color: transparent; user-select: none;
        }
        .tt-btn.active { background: #92400e; transform: scale(0.97); box-shadow: 0 0 16px rgba(180,83,9,0.15); }
        .tt-btn.critical { background: #b91c1c; color: #fecaca; animation: pulse 0.3s ease-in-out infinite alternate; }
        .tt-stats { font-size: 11px; color: #aaa; margin-top: 10px; font-weight: 500; }

        @keyframes steam { 0%{opacity:0;transform:translateY(0) scaleX(1)} 50%{opacity:0.5} 100%{opacity:0;transform:translateY(-30px) scaleX(1.8)} }
        @keyframes fall { 0%{transform:translateY(0) rotate(0);opacity:0.7} 100%{transform:translateY(50px) rotate(25deg);opacity:0} }
        @keyframes crumbFall { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(30px);opacity:0} }
        @keyframes pulse { 0%{opacity:1} 100%{opacity:0.5} }
      `}</style>

      <div className="lp">
        <div className="lp-grid">
          {/* Orange — Pin Entry */}
          <div className="lp-pin">
            <h1>I've built something for you</h1>
            <p className="sub">Enter your pin to check it out.</p>

            <div className="lp-pin-label">Demo Pin</div>
            <div className="lp-pin-row">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={e => handlePinChange(e.target.value)}
                onKeyDown={handlePinKeyDown}
                placeholder="••••"
                maxLength={6}
                className={`lp-pin-input${pinError ? ' error' : ''}${pinSuccess ? ' success' : ''}`}
              />
              <button
                onClick={handlePinSubmit}
                disabled={pin.length < 4 || pinSuccess}
                className={`lp-pin-btn${pinSuccess ? ' success' : ''}`}
              >
                {pinSuccess ? '✓' : 'Go'}
              </button>
            </div>
            {pinError && <div className="lp-pin-error">{pinError}</div>}

            <div className="lp-pin-contact">
              <p>Want a custom tool built for your business?</p>
              <a href="https://shmake.nz/#contact" target="_blank" rel="noopener noreferrer">Get in Touch</a>
            </div>
          </div>

          {/* White — Tim Tam */}
          <div className="lp-tt">
            <div className="lp-tt-label">Tim Tam Dunk Simulator</div>
            <div className="lp-tt-sub">Hold to dunk. Release before structural failure.</div>

            <div className="tt-scene">
              {[0,1,2].map(i => (
                <div key={i} className="tt-steam" style={{ left: `${30+i*18}%`, top: 60, animationDelay: `${i*0.5}s` }} />
              ))}

              {!collapsed && (
                <div className="tt-biscuit-wrap" style={{ transform: `translateY(${biscuitY}px) rotate(${wobble}deg)` }}>
                  <div className="tt-biscuit" style={{
                    background: stage.color,
                    boxShadow: isCritical ? `0 0 ${dunkProgress-45}px rgba(139,69,19,0.3)` : 'none',
                  }}>
                    <div className="tt-biscuit-lines" />
                    <div className="tt-biscuit-gloss" />
                    <div className="tt-sogginess" style={{ height: `${Math.min(dunkProgress*1.2,100)}%` }} />
                  </div>
                </div>
              )}

              {collapsed && (
                <div className="tt-falling">
                  <div className="tt-biscuit" style={{ background: '#3a1205', opacity: 0.7 }}>
                    <div className="tt-biscuit-lines" />
                  </div>
                </div>
              )}

              {crumbs.map(c => (
                <div key={c.id} className="tt-crumb" style={{ left: `${c.x}%`, animationDelay: `${c.delay}s` }} />
              ))}

              <div className="tt-mug-back">
                <div className="tt-mug-inner">
                  <div className={`tt-tea${splashActive ? ' splash' : ''}`}>
                    <div className="tt-tea-shine" />
                  </div>
                </div>
              </div>
              <div className="tt-mug-front">
                <div className="tt-handle" />
              </div>
            </div>

            <div className="tt-status">
              {gameState === 'dunking' && (
                <div style={{ width: '100%' }}>
                  <div className="tt-bar">
                    <div className="tt-bar-fill" style={{
                      width: `${dunkProgress}%`,
                      background: dunkProgress > 55 ? 'linear-gradient(90deg,#b45309,#dc2626)' : dunkProgress > 35 ? 'linear-gradient(90deg,#b45309,#f59e0b)' : 'linear-gradient(90deg,#78350f,#b45309)',
                    }} />
                  </div>
                  <div className="tt-stage" style={{
                    color: isCritical ? '#dc2626' : '#888',
                    ...(isCritical ? { animation: 'pulse 0.3s ease-in-out infinite alternate' } : {}),
                  }}>
                    {stage.label}{isCritical && ' ⚠️'}
                  </div>
                  <div className="tt-integ">
                    Integrity: {Math.max(0, Math.round(stage.integrity - (dunkProgress - stage.threshold)))}%
                  </div>
                </div>
              )}

              {gameState === 'result' && result && (
                <div>
                  <div className="tt-r-emoji">{result.emoji}</div>
                  <div className="tt-r-title">{result.title}</div>
                  <div className="tt-r-sub">{result.subtitle}</div>
                  {!collapsed && dunkProgress >= 20 && (
                    <div className="tt-r-score">Saturation: {Math.round(dunkProgress)}%</div>
                  )}
                </div>
              )}
            </div>

            {gameState === 'idle' && (
              <button className="tt-btn" onMouseDown={startDunk} onTouchStart={e => { e.preventDefault(); startDunk() }}>
                🍫 Hold to Dunk
              </button>
            )}
            {gameState === 'dunking' && (
              <button className={`tt-btn active${isCritical ? ' critical' : ''}`}>
                {isCritical ? '🫣 RELEASE!' : '☕ Dunking...'}
              </button>
            )}
            {gameState === 'result' && (
              <button className="tt-btn" onClick={resetGame}>🍫 Another Tim Tam</button>
            )}

            {(highScore > 0 || attempts > 0) && (
              <div className="tt-stats">
                {highScore > 0 && `Best: ${highScore}%`}
                {highScore > 0 && attempts > 0 && ' · '}
                {attempts > 0 && `Consumed: ${attempts}`}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
