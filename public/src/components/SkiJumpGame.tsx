'use client';

import { useEffect } from 'react';
import { mountGame } from '@/lib/gameEngine';
import DailyLeaderboard from '@/components/DailyLeaderboard';

export default function SkiJumpGame() {
  useEffect(() => {
    const cleanup = mountGame();
    return cleanup;
  }, []);

  return (
    <div className="wrap">
      <div className="outerbar">
        <div className="brand">❄ FROST FLIGHT <span style={{ color: '#b34e59' }}>/ NUMERIC JUMP</span></div>
        <DailyLeaderboard location="clock" />
      </div>
      <main className="game">
        <canvas
          id="scene"
          width={1920}
          height={1080}
          aria-label="Animated 2D pixel art ski jump game in a winter mountain landscape"
        />

        <div className="top">
          <div className="brandstack">
            <div className="titleRow">
              <img id="ssxMark" src="/art/ssx-logo.jpg" alt="SSX Exeter logo" className="ssxMark" />
              <div>
                <div className="logo">FROST FLIGHT</div>
                <div className="sub">GUESS THE NUMBER · JUMP THE DISTANCE</div>
              </div>
            </div>
          </div>
          <div className="hudright">
            <div className="chip"><small>JUMP</small><b id="round">01/07</b></div>
            <div className="chip" id="timebox"><small>SECONDS</small><b id="time">25.0</b></div>
            <div className="chip"><small>TOTAL</small><b id="total">0m</b></div>
          </div>
        </div>

        <section className="panel hidden" id="panel">
          <div className="eyebrow" id="eyebrow">QUESTION 01 / 07</div>
          <h2 id="question" />
          <form id="form" autoComplete="off">
            <label className="answerlabel" htmlFor="answer">YOUR NUMERICAL GUESS</label>
            <input
              id="answer"
              className="answer"
              inputMode="numeric"
              placeholder="Enter a number..."
              spellCheck={false}
            />
            <div className="actions">
              <button className="btn" type="submit">SUBMIT JUMP ↗</button>
              <span className="caption">
                One question per jump.<br />
                The closer your guess is, the further Uncle Austen flies.
              </span>
            </div>
          </form>
        </section>

        <div className="progress" id="progress" />
        <div className="status" id="status">READY AT THE TOP OF THE INRUN</div>

        <div className="overlay" id="intro"><div className="modal">
          <div className="kicker">❄ FROST FLIGHT ❄</div>
          <h1>GUESS CLOSER.<br /><em>FLY FURTHER.</em></h1>
          <p className="desktopIntro">
            Uncle Austen starts at the top of the jump. Hit <strong>DROP IN</strong> to start the run. A question will appear,
            you have 25 seconds to type your numerical guess, and when you submit, he launches from the ramp. The closer
            your guess is to the real answer, the longer the jump. After each landing, the correct answer is revealed.
          </p>
          <p className="mobileIntro">Seven number guesses. 25 seconds each. Closer guesses send Uncle Austen further!</p>
          <button className="btn" id="start">DROP IN →</button>
        </div></div>

        <div className="overlay hidden" id="intermission"><div className="modal">
          <div className="kicker" id="resultKicker">JUMP COMPLETE</div>
          <div className="huge" id="jumpDistance">132.5m</div>
          <div className="little" id="resultDetail" />
          <p id="resultText" />
          <button className="btn" id="next">NEXT JUMP →</button>
        </div></div>

        <div className="overlay hidden" id="end"><div className="modal">
          <div className="kicker">❄ ALL JUMPS COMPLETE ❄</div>
          <h1>FINAL <em>DISTANCE</em></h1>
          <div className="huge" id="finalTotal">0m</div>
          <div className="little">COMBINED DISTANCE / 7 JUMPS</div>
          <div className="summary" id="summary" />
          <p id="endMessage" />
          <DailyLeaderboard location="final" />
          <button className="btn" id="again">PLAY AGAIN ↻</button>
        </div></div>
      </main>
      <DailyLeaderboard location="board" />
      <div className="bottom"><span>✦ FROST FLIGHT · SSX EXETER EDITION</span><span>Made by (Uncle) Eren Kandemir</span></div>
    </div>
  );
}
