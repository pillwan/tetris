import { useState, useEffect, useCallback, useRef } from 'react';
import TetrisBoard from './TetrisBoard';
import type { GameState, Position } from '../types';
import { BOARD_WIDTH } from '../types';
import {
  createEmptyBoard,
  getRandomTetromino,
  rotatePiece,
  checkCollision,
  mergePieceToBoard,
  clearLines,
  calculateScore,
  getDropSpeed,
} from '../tetrisUtils';

const TetrisGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    currentPiece: null,
    currentPosition: { x: 0, y: 0 },
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
    isPaused: false,
  });

  const gameLoopRef = useRef<number | null>(null);
  const lastDropTimeRef = useRef<number>(Date.now());

  // 새 피스 생성
  const spawnNewPiece = useCallback(() => {
    const newPiece = getRandomTetromino();
    const startPosition: Position = {
      x: Math.floor((BOARD_WIDTH - newPiece.shape[0].length) / 2),
      y: 0,
    };

    // 새 피스가 충돌하면 게임 오버
    if (checkCollision(gameState.board, newPiece.shape, startPosition)) {
      setGameState(prev => ({ ...prev, gameOver: true, currentPiece: newPiece, currentPosition: startPosition }));
      return false;
    }

    setGameState(prev => ({
      ...prev,
      currentPiece: newPiece,
      currentPosition: startPosition,
    }));

    return true;
  }, [gameState.board]);

  // 피스 이동
  const movePiece = useCallback((dx: number, dy: number) => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.gameOver || prev.isPaused) return prev;

      const newPosition: Position = {
        x: prev.currentPosition.x + dx,
        y: prev.currentPosition.y + dy,
      };

      if (checkCollision(prev.board, prev.currentPiece.shape, newPosition)) {
        return prev;
      }

      return { ...prev, currentPosition: newPosition };
    });
  }, []);

  // 피스 회전
  const handleRotate = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.gameOver || prev.isPaused) return prev;

      const rotated = rotatePiece(prev.currentPiece.shape);

      // 회전 후 충돌 체크
      if (checkCollision(prev.board, rotated, prev.currentPosition)) {
        // Wall kick 시도 (왼쪽, 오른쪽으로 이동 시도)
        const kicks = [0, 1, -1, 2, -2];
        for (const kick of kicks) {
          const kickedPosition: Position = {
            x: prev.currentPosition.x + kick,
            y: prev.currentPosition.y,
          };

          if (!checkCollision(prev.board, rotated, kickedPosition)) {
            return {
              ...prev,
              currentPiece: { ...prev.currentPiece, shape: rotated },
              currentPosition: kickedPosition,
            };
          }
        }

        return prev;
      }

      return {
        ...prev,
        currentPiece: { ...prev.currentPiece, shape: rotated },
      };
    });
  }, []);

  // 하드 드롭
  const hardDrop = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.gameOver || prev.isPaused) return prev;

      let newY = prev.currentPosition.y;
      while (!checkCollision(prev.board, prev.currentPiece.shape, { x: prev.currentPosition.x, y: newY + 1 })) {
        newY++;
      }

      return { ...prev, currentPosition: { x: prev.currentPosition.x, y: newY } };
    });
  }, []);

  // 피스 고정 및 라인 클리어
  const lockPiece = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece) return prev;

      const newBoard = mergePieceToBoard(prev.board, prev.currentPiece, prev.currentPosition);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

      const newLines = prev.lines + linesCleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      const scoreGained = calculateScore(linesCleared, prev.level);

      return {
        ...prev,
        board: clearedBoard,
        currentPiece: null,
        score: prev.score + scoreGained,
        level: newLevel,
        lines: newLines,
      };
    });
  }, []);

  // 피스 아래로 이동
  const dropPiece = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.gameOver || prev.isPaused) return prev;

      const newPosition: Position = {
        x: prev.currentPosition.x,
        y: prev.currentPosition.y + 1,
      };

      if (checkCollision(prev.board, prev.currentPiece.shape, newPosition)) {
        return prev;
      }

      return { ...prev, currentPosition: newPosition };
    });
  }, []);

  // 키보드 입력 처리
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (gameState.gameOver) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          event.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          event.preventDefault();
          dropPiece();
          break;
        case 'ArrowUp':
        case ' ':
          event.preventDefault();
          handleRotate();
          break;
        case 'Enter':
          event.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          event.preventDefault();
          setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
          break;
      }
    },
    [gameState.gameOver, movePiece, dropPiece, handleRotate, hardDrop]
  );

  // 게임 루프
  useEffect(() => {
    const gameLoop = () => {
      const now = Date.now();
      const dropSpeed = getDropSpeed(gameState.level);

      if (now - lastDropTimeRef.current > dropSpeed && !gameState.isPaused && !gameState.gameOver) {
        if (gameState.currentPiece) {
          const newPosition: Position = {
            x: gameState.currentPosition.x,
            y: gameState.currentPosition.y + 1,
          };

          if (checkCollision(gameState.board, gameState.currentPiece.shape, newPosition)) {
            lockPiece();
          } else {
            dropPiece();
          }
        }

        lastDropTimeRef.current = now;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, dropPiece, lockPiece]);

  // 새 피스 생성
  useEffect(() => {
    if (!gameState.currentPiece && !gameState.gameOver) {
      spawnNewPiece();
    }
  }, [gameState.currentPiece, gameState.gameOver, spawnNewPiece]);

  // 키보드 이벤트 리스너
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // 게임 재시작
  const restartGame = () => {
    setGameState({
      board: createEmptyBoard(),
      currentPiece: null,
      currentPosition: { x: 0, y: 0 },
      score: 0,
      level: 1,
      lines: 0,
      gameOver: false,
      isPaused: false,
    });
    lastDropTimeRef.current = Date.now();
  };

  return (
    <div className="tetris-game">
      <div className="game-container">
        <div className="game-info">
          <h1>TETRIS</h1>
          <div className="stats">
            <div className="stat">
              <span className="stat-label">Score</span>
              <span className="stat-value">{gameState.score}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Level</span>
              <span className="stat-value">{gameState.level}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Lines</span>
              <span className="stat-value">{gameState.lines}</span>
            </div>
          </div>

          <div className="controls">
            <h3>Controls</h3>
            <div className="control-item">
              <span>← →</span>
              <span>Move</span>
            </div>
            <div className="control-item">
              <span>↑ / Space</span>
              <span>Rotate</span>
            </div>
            <div className="control-item">
              <span>↓</span>
              <span>Soft Drop</span>
            </div>
            <div className="control-item">
              <span>Enter</span>
              <span>Hard Drop</span>
            </div>
            <div className="control-item">
              <span>P</span>
              <span>Pause</span>
            </div>
          </div>

          {gameState.isPaused && !gameState.gameOver && (
            <div className="message paused">PAUSED</div>
          )}

          {gameState.gameOver && (
            <div className="game-over">
              <div className="message">GAME OVER</div>
              <button onClick={restartGame} className="restart-button">
                Play Again
              </button>
            </div>
          )}

          {!gameState.gameOver && (
            <button onClick={restartGame} className="restart-button">
              New Game
            </button>
          )}
        </div>

        <TetrisBoard
          board={gameState.board}
          currentPiece={gameState.currentPiece}
          currentPosition={gameState.currentPosition}
        />
      </div>
    </div>
  );
};

export default TetrisGame;
