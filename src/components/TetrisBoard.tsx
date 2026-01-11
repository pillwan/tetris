import type { Tetromino, Position } from '../types';

interface TetrisBoardProps {
  board: (string | null)[][];
  currentPiece: Tetromino | null;
  currentPosition: Position;
}

const TetrisBoard = ({ board, currentPiece, currentPosition }: TetrisBoardProps) => {
  // 현재 피스를 포함한 보드 생성
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    // 현재 피스를 보드에 표시
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const newY = currentPosition.y + y;
            const newX = currentPosition.x + x;

            if (newY >= 0 && newY < board.length && newX >= 0 && newX < board[0].length) {
              displayBoard[newY][newX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  const displayBoard = renderBoard();

  return (
    <div className="tetris-board">
      {displayBoard.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell, cellIndex) => (
            <div
              key={cellIndex}
              className="board-cell"
              style={{
                backgroundColor: cell || '#1a1a2e',
                border: cell ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.05)',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default TetrisBoard;
