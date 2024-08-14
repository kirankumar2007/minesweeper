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
        this.leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
        this.gameOver = false;
        this.diamondsCollected = 0;
        this.firstClick = true;
        this.createBoard();
        this.renderBoard();
        this.addEventListeners();
        this.updateScores();
        this.renderLeaderboard();
        this.loadSounds();
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
                    } else if (cell.diamond) {
                        cellElement.classList.add('diamond');
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

    placeMinesAndDiamonds(excludeRow, excludeCol) {
        let availableCells = this.board.flat().filter(cell => cell.row !== excludeRow || cell.col !== excludeCol);

        for (let i = 0; i < this.mines; i++) {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            const cell = availableCells.splice(randomIndex, 1)[0];
            cell.mine = true;
        }

        for (let i = 0; i < this.diamonds; i++) {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            const cell = availableCells.splice(randomIndex, 1)[0];
            cell.diamond = true;
        }

        this.board.forEach(row => {
            row.forEach(cell => {
                if (!cell.mine && !cell.diamond) {
                    cell.adjacentMines = this.countAdjacentMines(cell.row, cell.col);
                }
            });
        });
    }

    countAdjacentMines(row, col) {
        return this.getNeighbors(row, col).filter(cell => cell.mine).length;
    }

    getNeighbors(row, col) {
        const neighbors = [];
        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                if (r === 0 && c === 0) continue;
                const neighborRow = row + r;
                const neighborCol = col + c;
                if (neighborRow >= 0 && neighborRow < this.rows && neighborCol >= 0 && neighborCol < this.cols) {
                    neighbors.push(this.board[neighborRow][neighborCol]);
                }
            }
        }
        return neighbors;
    }

    revealCell(row, col) {
        const cell = this.board[row][col];

        if (cell.reveal() && !this.gameOver) {
            this.playSound('reveal');
            if (this.firstClick) {
                this.firstClick = false;
                this.placeMinesAndDiamonds(row, col);
                this.renderBoard();
            }

            if (cell.mine) {
                this.playSound('explosion');
                this.endGame(false);
                return;
            } else if (cell.diamond) {
                this.playSound('collect');
                this.diamondsCollected++;
                this.score += 100;
            }

            if (cell.adjacentMines === 0) {
                this.getNeighbors(row, col).forEach(neighbor => this.revealCell(neighbor.row, neighbor.col));
            }

            this.renderBoard();
            this.updateScores();

            if (this.checkWin()) {
                this.endGame(true);
            }
        }
    }

    checkWin() {
        return this.diamondsCollected === this.diamonds && this.board.flat().every(cell => cell.revealed || cell.mine || cell.diamond);
    }

    endGame(won) {
        this.gameOver = true;
        document.getElementById('game-message').textContent = won ? 'You Win!' : 'Game Over!';
        this.updateHighScore();
        if (won) {
            this.updateLeaderboard();
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

    updateLeaderboard() {
        this.leaderboard.push(this.score);
        this.leaderboard.sort((a, b) => b - a);
        this.leaderboard = this.leaderboard.slice(0, 5);
        localStorage.setItem('leaderboard', JSON.stringify(this.leaderboard));
        this.renderLeaderboard();
    }

    renderLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        this.leaderboard.forEach(score => {
            const li = document.createElement('li');
            li.textContent = score;
            leaderboardList.appendChild(li);
        });
    }

    addEventListeners() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.addEventListener('click', event => {
            if (event.target.classList.contains('cell') && !this.gameOver) {
                const row = parseInt(event.target.dataset.row);
                const col = parseInt(event.target.dataset.col);
                this.revealCell(row, col);
            }
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.startNewGame();
        });
    }

    startNewGame() {
        const rows = parseInt(document.getElementById('rows').value);
        const cols = parseInt(document.getElementById('cols').value);
        const mines = parseInt(document.getElementById('mines').value);
        const diamonds = parseInt(document.getElementById('diamonds').value);

        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.diamonds = diamonds;
        this.score = 0;
        this.gameOver = false;
        this.firstClick = true;
        this.diamondsCollected = 0;

        this.createBoard();
        this.renderBoard();
        this.updateScores();
        document.getElementById('game-message').textContent = '';
    }

    loadSounds() {
        this.sounds = {
            reveal: new Audio('sounds/reveal.wav'),
            explosion: new Audio('sounds/explosion.wav'),
            collect: new Audio('sounds/collect.wav')
        };
    }

    playSound(name) {
        if (this.sounds[name]) {
            this.sounds[name].play();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Minesweeper(10, 10, 15, 10);
});
