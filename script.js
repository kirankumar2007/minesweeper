class Cell {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.revealed = false;
        this.mine = false;
        this.diamond = false;
        this.adjacentMines = 0;
        this.flagged = false;
    }

    reveal() {
        if (!this.flagged && !this.revealed) {
            this.revealed = true;
            return true;
        }
        return false;
    }

    toggleFlag() {
        if (!this.revealed) {
            this.flagged = !this.flagged;
            return true;
        }
        return false;
    }
}

class Minesweeper {
    constructor(rows, cols, mines, diamonds) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.diamonds = diamonds;
        this.board = [];
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.gameOver = false;
        this.diamondsCollected = 0;
        this.firstClick = true;
        this.createBoard();
        this.renderBoard();
        this.addEventListeners();
        this.updateScores();
    }

    createBoard() {
        this.board = Array.from({ length: this.rows }, (_, r) =>
            Array.from({ length: this.cols }, (_, c) => new Cell(r, c))
        );
    }

    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;

        this.board.forEach((row, r) => {
            row.forEach((cell, c) => {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                cellElement.dataset.row = r;
                cellElement.dataset.col = c;
                
                if (cell.revealed) {
                    cellElement.classList.add('revealed');
                    if (cell.mine) {
                        cellElement.classList.add('mine');
                        cellElement.textContent = 'M';
                    } else if (cell.diamond) {
                        cellElement.classList.add('diamond');
                        cellElement.textContent = 'D';
                    } else if (cell.adjacentMines > 0) {
                        cellElement.textContent = cell.adjacentMines;
                        cellElement.classList.add(`adjacent-${cell.adjacentMines}`);
                    }
                } else if (cell.flagged) {
                    cellElement.classList.add('flagged');
                    cellElement.textContent = 'F';
                }

                gameBoard.appendChild(cellElement);
            });
        });
    }

    placeMinesAndDiamonds(safeRow, safeCol) {
        const totalItems = this.mines + this.diamonds;
        const flatPositions = this.board.flatMap((row, r) => 
            row.map((_, c) => [r, c])
        ).filter(([r, c]) => r !== safeRow || c !== safeCol);

        const shuffled = this.fisherYatesShuffle(flatPositions).slice(0, totalItems);

        shuffled.forEach(([r, c], index) => {
            if (index < this.mines) {
                this.board[r][c].mine = true;
            } else {
                this.board[r][c].diamond = true;
            }
        });

        this.calculateAdjacentMines();
    }

    fisherYatesShuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    calculateAdjacentMines() {
        this.board.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (!cell.mine) {
                    cell.adjacentMines = this.countAdjacentMines(r, c);
                }
            });
        });
    }

    countAdjacentMines(row, col) {
        let count = 0;
        this.getAdjacentCells(row, col).forEach(([r, c]) => {
            if (this.board[r][c].mine) {
                count++;
            }
        });
        return count;
    }

    getAdjacentCells(row, col) {
        const adj = [];
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && !(r === row && c === col)) {
                    adj.push([r, c]);
                }
            }
        }
        return adj;
    }

    revealCell(row, col) {
        const cell = this.board[row][col];

        if (cell.revealed || cell.flagged) return;
        
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMinesAndDiamonds(row, col);
        }

        cell.reveal();
        if (cell.mine) {
            this.gameOver = true;
            this.showGameOver(false);
        } else if (cell.diamond) {
            this.score++;
            this.diamondsCollected++;
        } else if (cell.adjacentMines === 0) {
            this.revealAdjacentCells(row, col);
        }

        this.checkWin();
        this.renderBoard();
        this.updateScores();
    }

    revealAdjacentCells(row, col) {
        this.getAdjacentCells(row, col).forEach(([r, c]) => {
            if (!this.board[r][c].revealed) {
                this.revealCell(r, c);
            }
        });
    }

    checkWin() {
        if (this.diamondsCollected === this.diamonds) {
            this.gameOver = true;
            this.updateHighScore();
            this.showGameOver(true);
        }
    }

    updateScores() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
    }

    showGameOver(win) {
        const message = document.getElementById('game-message');
        if (win) {
            message.textContent = 'You win!';
        } else {
            message.textContent = 'Game Over';
        }
    }

    resetGame() {
        this.score = 0;
        this.diamondsCollected = 0;
        this.gameOver = false;
        this.firstClick = true;
        this.createBoard();
        this.renderBoard();
        this.updateScores();
        document.getElementById('game-message').textContent = '';
    }

    addEventListeners() {
        document.getElementById('game-board').addEventListener('click', (e) => {
            if (this.gameOver) return;

            const target = e.target;
            const row = parseInt(target.dataset.row);
            const col = parseInt(target.dataset.col);

            if (!isNaN(row) && !isNaN(col)) {
                this.revealCell(row, col);
            }
        });

        document.getElementById('game-board').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.gameOver) return;

            const target = e.target;
            const row = parseInt(target.dataset.row);
            const col = parseInt(target.dataset.col);

            if (!isNaN(row) && !isNaN(col)) {
                const cell = this.board[row][col];
                if (cell.toggleFlag()) {
                    this.renderBoard();
                }
            }
        });

        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('start-btn').addEventListener('click', () => {
            this.rows = parseInt(document.getElementById('rows').value);
            this.cols = parseInt(document.getElementById('cols').value);
            this.mines = parseInt(document.getElementById('mines').value);
            this.diamonds = parseInt(document.getElementById('diamonds').value);
            this.resetGame();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Minesweeper(10, 10, 15, 10);
});
