export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Position {
  x: number;
  y: number;
}

export interface Tetromino {
  shape: number[][];
  color: string;
  type: TetrominoType;
}

export interface GameState {
  board: (string | null)[][];
  currentPiece: Tetromino | null;
  currentPosition: Position;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  isPaused: boolean;
}

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
