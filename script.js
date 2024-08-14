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
        if (!this.flagged) {
            this.revealed = true;
        }
    }

    toggleFlag() {
        if (!this.revealed) {
            this.flagged = !this.flagged;
        }
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
        this.createBoard();
        this.placeMines();
        this.placeDiamonds();
        this.calculateAdjacentMines();
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
        gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 40px)`;

        this.board.forEach((row, r) => {
            row.forEach((cell, c) => {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                cellElement.dataset.row = r;
                cellElement.dataset.col = c;
                
                if (cell.revealed) {
                    cellElement.classList.add('revealed');
                    if (cell.mine) {
                        cellElement.style.backgroundImage = 'url("images/bomb.png")';
                    } else if (cell.diamond) {
                        cellElement.style.backgroundImage = 'url("images/diamond.png")';
                    } else if (cell.adjacentMines > 0) {
                        cellElement.textContent = cell.adjacentMines;
                    }
                } else if (cell.flagged) {
                    cellElement.style.backgroundImage = 'url("images/flag.png")';
                }

                gameBoard.appendChild(cellElement);
            });
        });
    }

    placeMines() {
        let minesToPlace = this.mines;
        while (minesToPlace > 0) {
            const [row, col] = this.getRandomPosition();
            if (!this.board[row][col].mine) {
                this.board[row][col].mine = true;
                minesToPlace--;
            }
        }
    }

    placeDiamonds() {
        let diamondsToPlace = this.diamonds;
        while (diamondsToPlace > 0) {
            const [row, col] = this.getRandomPosition();
            if (!this.board[row][col].mine && !this.board[row][col].diamond) {
                this.board[row][col].diamond = true;
                diamondsToPlace--;
            }
        }
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
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (this.isInBounds(newRow, newCol) && this.board[newRow][newCol].mine) {
                    count++;
                }
            }
        }
        return count;
    }

    isInBounds(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    revealCell(row, col) {
        if (this.gameOver || this.board[row][col].revealed || this.board[row][col].flagged) return;

        const cell = this.board[row][col];
        cell.reveal();

        if (cell.mine) {
            this.endGame('You hit a mine! Game Over.');
            this.revealAllMines();
        } else if (cell.diamond) {
            this.score += 10;
            this.diamondsCollected++;
            if (this.diamondsCollected === this.diamonds) {
                this.endGame('Congratulations! You collected all diamonds!');
            }
        } else if (cell.adjacentMines === 0) {
            this.revealAdjacentCells(row, col);
        }

        this.renderBoard();
        this.updateScores();
    }

    revealAdjacentCells(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (this.isInBounds(newRow, newCol)) {
                    this.revealCell(newRow, newCol);
                }
            }
        }
    }

    revealAllMines() {
        this.board.forEach(row => {
            row.forEach(cell => {
                if (cell.mine) {
                    cell.reveal();
                }
            });
        });
    }

    flagCell(row, col) {
        if (this.gameOver) return;

        const cell = this.board[row][col];
        cell.toggleFlag();
        this.renderBoard();
    }

    endGame(message) {
        this.gameOver = true;
        document.getElementById('game-message').textContent = message;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.score);
        }
        this.updateScores();
    }

    addEventListeners() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.revealCell(row, col);
            }
        });

        gameBoard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.flagCell(row, col);
            }
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            const rows = parseInt(document.getElementById('rows').value);
            const cols = parseInt(document.getElementById('cols').value);
            const mines = parseInt(document.getElementById('mines').value);
            const diamonds = parseInt(document.getElementById('diamonds').value);

            if (this.validateInputs(rows, cols, mines, diamonds)) {
                this.resetGame(rows, cols, mines, diamonds);
            } else {
                alert('Invalid input. Please enter valid numbers.');
            }
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame(this.rows, this.cols, this.mines, this.diamonds);
        });
    }

    validateInputs(rows, cols, mines, diamonds) {
        return (
            rows > 0 && cols > 0 && mines > 0 && diamonds > 0 &&
            mines < rows * cols && diamonds < rows * cols &&
            mines + diamonds < rows * cols
        );
    }

    resetGame(rows, cols, mines, diamonds) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.diamonds = diamonds;
        this.score = 0;
        this.gameOver = false;
        this.diamondsCollected = 0;
        document.getElementById('game-message').textContent = '';
        this.createBoard();
        this.placeMines();
        this.placeDiamonds();
        this.calculateAdjacentMines();
        this.renderBoard();
        this.updateScores();
    }

    updateScores() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
    }

    getRandomPosition() {
        return [
            Math.floor(Math.random() * this.rows),
            Math.floor(Math.random() * this.cols)
        ];
    }
}

// Initialize the game with default values on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const rows = parseInt(document.getElementById('rows').value) || 10;
    const cols = parseInt(document.getElementById('cols').value) || 10;
    const mines = parseInt(document.getElementById('mines').value) || 15;
    const diamonds = parseInt(document.getElementById('diamonds').value) || 10;

    new Minesweeper(rows, cols, mines, diamonds);
});