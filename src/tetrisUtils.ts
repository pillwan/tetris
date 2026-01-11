import type { Tetromino, TetrominoType, Position } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT } from './types';

// 테트로미노 모양 정의
const TETROMINOES: Record<TetrominoType, { shape: number[][]; color: string }> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#00f0f0',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#f0f000',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a000f0',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#00f000',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#f00000',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#0000f0',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f0a000',
  },
};

// 빈 보드 생성
export const createEmptyBoard = (): (string | null)[][] => {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
};

// 랜덤 테트로미노 생성
export const getRandomTetromino = (): Tetromino => {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  const { shape, color } = TETROMINOES[randomType];
  return { shape, color, type: randomType };
};

// 피스 회전
export const rotatePiece = (piece: number[][]): number[][] => {
  const rotated: number[][] = [];
  const size = piece.length;

  for (let i = 0; i < size; i++) {
    rotated[i] = [];
    for (let j = 0; j < size; j++) {
      rotated[i][j] = piece[size - 1 - j][i];
    }
  }

  return rotated;
};

// 충돌 감지
export const checkCollision = (
  board: (string | null)[][],
  piece: number[][],
  position: Position
): boolean => {
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x]) {
        const newX = position.x + x;
        const newY = position.y + y;

        // 경계 체크
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return true;
        }

        // 보드 위쪽 경계는 허용 (새 피스 생성 시)
        if (newY < 0) {
          continue;
        }

        // 다른 블록과 충돌 체크
        if (board[newY][newX] !== null) {
          return true;
        }
      }
    }
  }

  return false;
};

// 보드에 피스 병합
export const mergePieceToBoard = (
  board: (string | null)[][],
  piece: Tetromino,
  position: Position
): (string | null)[][] => {
  const newBoard = board.map(row => [...row]);

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newY = position.y + y;
        const newX = position.x + x;

        if (newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH) {
          newBoard[newY][newX] = piece.color;
        }
      }
    }
  }

  return newBoard;
};

// 완성된 라인 제거
export const clearLines = (board: (string | null)[][]): { newBoard: (string | null)[][]; linesCleared: number } => {
  let linesCleared = 0;
  const newBoard = board.filter(row => {
    if (row.every(cell => cell !== null)) {
      linesCleared++;
      return false;
    }
    return true;
  });

  // 제거된 라인만큼 위에 빈 라인 추가
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }

  return { newBoard, linesCleared };
};

// 점수 계산
export const calculateScore = (linesCleared: number, level: number): number => {
  const baseScores = [0, 100, 300, 500, 800];
  return baseScores[linesCleared] * level;
};

// 레벨별 낙하 속도 계산 (밀리초)
export const getDropSpeed = (level: number): number => {
  return Math.max(100, 1000 - (level - 1) * 100);
};
