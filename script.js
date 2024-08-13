class Cell {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.revealed = false;
        this.mine = false;
        this.diamond = false;
        this.adjacentMines = 0;
    }

    reveal() {
        this.revealed = true;
    }

    setMine() {
        this.mine = true;
    }

    setDiamond() {
        this.diamond = true;
    }

    incrementAdjacentMines() {
        this.adjacentMines++;
    }

    isEmpty() {
        return !this.mine && !this.diamond && this.adjacentMines === 0;
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
        this.highScore = localStorage.getItem('highScore') || 0;
        this.gameOver = false;
        this.createBoard();
        this.placeMines();
        this.placeDiamonds();
        this.calculateAdjacentMines();
        this.addEventListeners();
        this.updateScores();
    }

    createBoard() {
        this.board = [];
        for (let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.board[r][c] = new Cell(r, c);
            }
        }
        this.renderBoard();
    }

    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 40px)`;
        gameBoard.style.gridTemplateRows = `repeat(${this.rows}, 40px)`;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.style.backgroundImage = 'url("images/diamond.png")'; // Set default background
                cell.style.backgroundSize = 'cover';
                gameBoard.appendChild(cell);
            }
        }
    }

    placeMines() {
        let minesToPlace = this.mines;
        const minePositions = new Set();
        while (minesToPlace > 0) {
            const position = this.getRandomPosition();
            if (!minePositions.has(position)) {
                const [row, col] = position.split(',').map(Number);
                this.board[row][col].setMine();
                minePositions.add(position);
                minesToPlace--;
            }
        }
    }

    placeDiamonds() {
        let diamondsToPlace = this.diamonds;
        const emptyCells = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].mine) {
                    emptyCells.push([r, c]);
                }
            }
        }
        while (diamondsToPlace > 0 && emptyCells.length > 0) {
            const index = Math.floor(Math.random() * emptyCells.length);
            const [row, col] = emptyCells.splice(index, 1)[0];
            this.board[row][col].setDiamond();
            diamondsToPlace--;
        }
    }

    calculateAdjacentMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].mine) {
                    this.incrementAdjacentCells(r, c);
                }
            }
        }
    }

    incrementAdjacentCells(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i;
                const newCol = col + j;
                if (this.isInBounds(newRow, newCol)) {
                    this.board[newRow][newCol].incrementAdjacentMines();
                }
            }
        }
    }

    isInBounds(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    revealCell(row, col) {
        if (this.gameOver) return;

        const cell = this.board[row][col];
        if (cell.revealed) return;

        cell.reveal();
        const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cellElement.classList.add('revealed');

        if (cell.mine) {
            cellElement.classList.add('mine');
            cellElement.style.backgroundImage = 'url("images/bomb.png")'; // Display bomb image
            this.endGame('You hit a mine! Game Over.');
        } else if (cell.diamond) {
            cellElement.classList.add('diamond');
        } else {
            cellElement.textContent = cell.adjacentMines > 0 ? cell.adjacentMines : '';
            if (cell.isEmpty()) {
                cellElement.style.backgroundColor = '#b5e5b5'; // Light green for empty cells
                this.revealAdjacentCells(row, col);
            }
        }
    }

    revealAdjacentCells(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i;
                const newCol = col + j;
                if (this.isInBounds(newRow, newCol) && !this.board[newRow][newCol].revealed) {
                    this.revealCell(newRow, newCol);
                }
            }
        }
    }

    endGame(message) {
        this.gameOver = true;
        document.getElementById('game-message').textContent = message;
        if (this.score > this.highScore) {
            localStorage.setItem('highScore', this.score);
            this.highScore = this.score;
            this.updateScores();
        }
        this.disableBoard();
    }

    disableBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => cell.removeEventListener('click', this.handleClick));
    }

    addEventListeners() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                const row = e.target.dataset.row;
                const col = e.target.dataset.col;
                this.revealCell(row, col);
            });
        });

        const startButton = document.getElementById('start-btn');
        startButton.addEventListener('click', () => {
            const rows = parseInt(document.getElementById('rows').value);
            const cols = parseInt(document.getElementById('cols').value);
            const mines = parseInt(document.getElementById('mines').value);
            const diamonds = parseInt(document.getElementById('diamonds').value);

            if (rows <= 0 || cols <= 0 || mines < 0 || diamonds < 0 || mines >= rows * cols) {
                alert('Invalid input. Please enter valid numbers.');
                return;
            }

            this.resetGame(rows, cols, mines, diamonds);
        });

        const resetButton = document.getElementById('reset-btn');
        resetButton.addEventListener('click', () => {
            if (this.gameOver) {
                this.resetGame(this.rows, this.cols, this.mines, this.diamonds);
            }
        });
    }

    resetGame(rows, cols, mines, diamonds) {
        document.getElementById('game-message').textContent = '';
        new Minesweeper(rows, cols, mines, diamonds);
    }

    updateScores() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
    }

    getRandomPosition() {
        const row = Math.floor(Math.random() * this.rows);
        const col = Math.floor(Math.random() * this.cols);
        return `${row},${col}`;
    }
}

// Initialize the game with default values on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const rows = parseInt(document.getElementById('rows').value) || 10;
    const cols = parseInt(document.getElementById('cols').value) || 10;
    const mines = parseInt(document.getElementById('mines').value) || 15;
    const diamonds = parseInt(document.getElementById('diamonds').value) || 50;

    new Minesweeper(rows, cols, mines, diamonds);
});
