class Cell {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.revealed = false;
        this.mine = false;
        this.count = 0;
    }

    reveal() {
        this.revealed = true;
    }

    setMine() {
        this.mine = true;
    }

    incrementCount() {
        this.count++;
    }
}

class Minesweeper {
    constructor(rows, cols, mines) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.board = [];
        this.createBoard();
        this.placeMines();
        this.calculateCounts();
        this.addEventListeners();
    }

    createBoard() {
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
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                gameBoard.appendChild(cell);
            }
        }
    }

    placeMines() {
        let minesToPlace = this.mines;
        while (minesToPlace > 0) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);

            if (!this.board[row][col].mine) {
                this.board[row][col].setMine();
                minesToPlace--;
            }
        }
    }

    calculateCounts() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].mine) continue;

                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        const newRow = r + i;
                        const newCol = c + j;

                        if (this.isInBounds(newRow, newCol) && this.board[newRow][newCol].mine) {
                            count++;
                        }
                    }
                }
                this.board[r][c].count = count;
            }
        }
    }

    isInBounds(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    revealCell(row, col) {
        const cell = this.board[row][col];
        if (cell.revealed) return;

        cell.reveal();
        const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cellElement.classList.add('revealed');

        if (cell.mine) {
            cellElement.classList.add('mine');
            alert('Game Over!');
            return;
        }

        if (cell.count > 0) {
            cellElement.textContent = cell.count;
            cellElement.classList.add('number');
        } else {
            cellElement.classList.add('safe');
            this.revealAdjacentCells(row, col);
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

    addEventListeners() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                const row = e.target.dataset.row;
                const col = e.target.dataset.col;
                this.revealCell(row, col);
            });
        });

        const resetButton = document.getElementById('reset-btn');
        resetButton.addEventListener('click', () => {
            new Minesweeper(this.rows, this.cols, this.mines);
        });
    }
}

// Initialize the game
new Minesweeper(10, 10, 10);
