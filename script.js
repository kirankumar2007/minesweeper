const rows = 10;
const cols = 10;
const mines = 10;
const board = document.getElementById('game-board');
const grid = [];

function createBoard() {
    for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', handleClick);
            board.appendChild(cell);
            grid[r][c] = { revealed: false, mine: false, count: 0 };
        }
    }
    placeMines();
    calculateCounts();
}

function handleClick(event) {
    const cell = event.target;
    const row = cell.dataset.row;
    const col = cell.dataset.col;

    if (grid[row][col].revealed) return;

    grid[row][col].revealed = true;
    cell.classList.add('revealed');

    if (grid[row][col].mine) {
        cell.classList.add('mine');
        alert('Game Over!');
    } else {
        cell.textContent = grid[row][col].count || '';
        cell.classList.add('safe');
    }
}

function placeMines() {
    let minesToPlace = mines;
    while (minesToPlace > 0) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);

        if (!grid[row][col].mine) {
            grid[row][col].mine = true;
            minesToPlace--;
        }
    }
}

function calculateCounts() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c].mine) continue;

            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    const newRow = r + i;
                    const newCol = c + j;

                    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                        if (grid[newRow][newCol].mine) count++;
                    }
                }
            }
            grid[r][c].count = count;
        }
    }
}

createBoard();
