import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// CONFIGURABLES
const BOARD_SIZE = 20; // 20x20 grid
const INITIAL_SNAKE = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
];
const INITIAL_DIRECTION = { x: 1, y: 0 }; // moving right
const INITIAL_SPEED = 180; // milliseconds
const MIN_SPEED = 70;
const SPEED_STEP = 10; // decrease ms per apple
const COLORS = {
  board: 'var(--bg-secondary, #f8f9fa)',
  snake: 'var(--primary, #43a047)',
  head: '#419be0',
  food: 'var(--accent, #ffd600)',
  grid: 'var(--border-color, #e9ecef)',
};

function getRandomFood(snake) {
  let food;
  do {
    food = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    };
  } while (snake.some(seg => seg.x === food.x && seg.y === food.y));
  return food;
}

// PUBLIC_INTERFACE
function App() {
  // THEME (optional, kept for header button, but simplified for this page)
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // GAME STATE
  const [snake, setSnake] = useState([...INITIAL_SNAKE]);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(getRandomFood(INITIAL_SNAKE));
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [gameOver, setGameOver] = useState(false);

  // REFS
  const moveRef = useRef();
  moveRef.current = direction;
  const snakeRef = useRef();
  snakeRef.current = snake;
  const speedRef = useRef();
  speedRef.current = speed;
  const runningRef = useRef();
  runningRef.current = running;

  // Handle KEYBOARD input
  useEffect(() => {
    function handleKeyDown(e) {
      if (!runningRef.current && e.key === ' ') {
        doRestart();
        return;
      }
      let newDir;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newDir = { x: 1, y: 0 };
          break;
        default:
          return;
      }
      // Prevent turning directly 180°
      if (
        newDir &&
        (moveRef.current.x !== -newDir.x || moveRef.current.y !== -newDir.y)
      ) {
        setDirection(newDir);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line
  }, []);

  // GAME LOOP
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const newHead = {
          x: (head.x + moveRef.current.x + BOARD_SIZE) % BOARD_SIZE,
          y: (head.y + moveRef.current.y + BOARD_SIZE) % BOARD_SIZE,
        };

        // Collision with self?
        const hit = prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y);
        if (hit) {
          setGameOver(true);
          setRunning(false);
          return prevSnake; // don't move
        }

        let newSnake;
        // Eat food?
        if (newHead.x === food.x && newHead.y === food.y) {
          newSnake = [newHead, ...prevSnake];
          setFood(getRandomFood(newSnake));
          setScore(s => s + 1);
          setSpeed(spd => Math.max(spd - SPEED_STEP, MIN_SPEED));
        } else {
          // Normal move
          newSnake = [newHead, ...prevSnake.slice(0, -1)];
        }

        return newSnake;
      });
    }, speedRef.current);

    return () => clearInterval(interval);
  }, [food, running, speed]);

  // Restart game
  // PUBLIC_INTERFACE
  function doRestart() {
    setSnake([...INITIAL_SNAKE]);
    setDirection(INITIAL_DIRECTION);
    setFood(getRandomFood(INITIAL_SNAKE));
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setRunning(true);
    setGameOver(false);
  }

  // Render board
  function renderBoard() {
    let cells = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        let cellType = '';
        let cellColor = COLORS.board;
        if (food.x === x && food.y === y) {
          cellType = 'food';
          cellColor = COLORS.food;
        }
        let index = snake.findIndex(seg => seg.x === x && seg.y === y);
        if (index === 0) {
          cellType = 'head';
          cellColor = COLORS.head;
        } else if (index > 0) {
          cellType = 'snake';
          cellColor = COLORS.snake;
        }
        cells.push(
          <div
            key={`${x},${y}`}
            className={`sg-cell ${cellType}`}
            style={{
              background: cellColor,
              border: cellType ? '1.5px solid ' + COLORS.grid : '1px solid ' + COLORS.grid,
              transition: cellType === 'head' ? 'background .16s' : undefined,
            }}
          />
        );
      }
    }
    return cells;
  }

  return (
    <div className="App" style={{ background: 'var(--bg-primary)' }}>
      <header className="sg-header">
        <div className="sg-title">
          <span role="img" aria-label="snake">🐍</span> SNAKE GAME
        </div>
        <button className="theme-toggle" onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      <main className="sg-main">
        <div className="sg-score-area">
          <span className="sg-score-label">Score:</span>
          <span className="sg-score">{score}</span>
          {!running && (
            <button className="sg-btn-restart" onClick={doRestart}>Restart</button>
          )}
        </div>
        <div
          className="sg-board-container"
          tabIndex={0}
          aria-label="Snake Game Board"
          onKeyDown={e => e.preventDefault()} // prevent arrowkeys from scrolling
        >
          <div
            className="sg-board"
            style={{
              gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
              gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            }}
          >
            {renderBoard()}
          </div>
          {gameOver && (
            <div className="sg-gameover-overlay">
              <div className="sg-gameover-box">
                <div className="sg-gameover-title">Game Over!</div>
                <div className="sg-gameover-score">Final Score: {score}</div>
                <button className="sg-btn-restart" onClick={doRestart}>Restart</button>
                <div className="sg-gameover-hint">Press <strong>Space</strong> to play again</div>
              </div>
            </div>
          )}
        </div>
        <div className="sg-controls-desc">
          <span className="sg-desc-head">Controls:</span>
          <span>Use <strong>Arrow keys</strong> or <strong>WASD</strong> to move.</span>
          <span>Eat food to grow and increase speed.</span>
        </div>
      </main>
      <footer className="sg-footer">
        <span>
          Made with <span aria-label="React" role="img">⚛️</span> & <span aria-label="snake" role="img">🐍</span> —
          <span style={{ marginLeft: 6 }}>KAVIA Template Light</span>
        </span>
      </footer>
    </div>
  );
}

export default App;
