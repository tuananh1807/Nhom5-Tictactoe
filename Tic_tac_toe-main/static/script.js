const MAX = 1000;
const MIN = -1000;
const boardSize = 8;
const winCondition = 5;
const maxDepth = 5; // Độ sâu Minimax để AI mạnh mẽ hơn
const priorityRange = 1; // Bán kính ưu tiên quanh nước đi của người chơi
let board, currentPlayer;
let gameStarted = false;
const memo = new Map(); // Bảng ghi nhớ cho Minimax

// Lấy các phần tử DOM cần thiết
const message = document.getElementById("message");
const countdown = document.getElementById("countdown");
const boardElement = document.getElementById("board");

// Không khai báo lại `playerScore` vì nó đã được đặt từ HTML
// `let playerScore;` nếu cần thiết trong trường hợp biến chưa tồn tại
if (typeof playerScore === 'undefined') {
    playerScore = 0;
}

// Hàm bắt đầu trò chơi
function startGame() {
    if (!message || !boardElement || !countdown) return console.error("Các phần tử HTML không tồn tại.");
    message.innerText = '';
    currentPlayer = 'X';
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(''));
    gameStarted = false;
    createBoard();
    startCountdown();
}

// Hàm đếm ngược để bắt đầu trò chơi
function startCountdown() {
    countdown.innerText = '3';
    let count = 3;
    const timer = setInterval(() => {
        count--;
        if (count === 0) {
            clearInterval(timer);
            countdown.innerText = '';
            gameStarted = true;
            message.innerText = "Bắt đầu chơi!";
        } else {
            countdown.innerText = count;
        }
    }, 1000);
}

// Hàm tạo bàn cờ
function createBoard() {
    boardElement.innerHTML = '';
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.addEventListener("click", () => handleMove(i, j));
            boardElement.appendChild(cell);
        }
    }
}

// Hàm xử lý lượt chơi
function handleMove(row, col) {
    if (!gameStarted || board[row][col] !== '' || (gameMode === 'player-vs-ai' && currentPlayer !== 'X')) {
        return;
    }

    board[row][col] = currentPlayer;
    updateBoard();

    if (checkWin(row, col)) {
        message.innerText = `Chúc mừng ${currentPlayer} đã chiến thắng!`;
        if (currentPlayer === 'X' && gameMode === 'player-vs-ai') {
            updateScore(); // Cập nhật điểm khi người chơi thắng
        }
        document.getElementById("restart").style.display = 'block';
        return;
    } else if (isDraw()) {
        message.innerText = 'Trò chơi hòa!';
        document.getElementById("restart").style.display = 'block';
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

    if (gameMode === 'player-vs-ai' && currentPlayer === 'O') {
        setTimeout(aiMove, 500);
    }
}

// Hàm AI thực hiện lượt đi
function aiMove() {
    const bestMove = findBestMove();
    if (bestMove) {
        board[bestMove.row][bestMove.col] = 'O';
        updateBoard();
        if (checkWin(bestMove.row, bestMove.col)) {
            message.innerText = "Máy đã chiến thắng!";
            document.getElementById("restart").style.display = 'block';
        } else if (isDraw()) {
            message.innerText = 'Trò chơi hòa!';
            document.getElementById("restart").style.display = 'block';
        }
        currentPlayer = 'X';
    }
}

// Hàm xác định các nước đi ưu tiên
function getPriorityMoves(board) {
    const priorityMoves = new Set();
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === 'X') {
                for (let dx = -priorityRange; dx <= priorityRange; dx++) {
                    for (let dy = -priorityRange; dy <= priorityRange; dy++) {
                        const newRow = i + dx;
                        const newCol = j + dy;
                        if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize && board[newRow][newCol] === '') {
                            priorityMoves.add(`${newRow},${newCol}`);
                        }
                    }
                }
            }
        }
    }
    return Array.from(priorityMoves).map(move => {
        const [row, col] = move.split(',').map(Number);
        return { row, col };
    });
}

// Hàm tìm nước đi tốt nhất cho AI
function findBestMove() {
    let bestScore = MIN;
    let bestMove = null;
    const priorityMoves = getPriorityMoves(board);

    for (let move of priorityMoves) {
        const { row, col } = move;
        board[row][col] = 'O';
        let moveScore = minimax(0, false, MIN, MAX);
        board[row][col] = '';
        if (moveScore > bestScore) {
            bestScore = moveScore;
            bestMove = { row, col };
        }
    }
    return bestMove;
}

// Thuật toán Minimax với cắt tỉa Alpha-Beta
function minimax(depth, isMaximizing, alpha, beta) {
    const boardKey = JSON.stringify(board);
    if (memo.has(boardKey)) return memo.get(boardKey);

    const score = evaluateBoard();
    if (Math.abs(score) === 100 || isDraw() || depth === maxDepth) return score - depth;

    if (isMaximizing) {
        let maxEval = MIN;
        for (const move of getPriorityMoves(board)) {
            const { row, col } = move;
            board[row][col] = 'O';
            const eval = minimax(depth + 1, false, alpha, beta);
            board[row][col] = '';
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, maxEval);
            if (beta <= alpha) break;
        }
        memo.set(boardKey, maxEval);
        return maxEval;
    } else {
        let minEval = MAX;
        for (const move of getPriorityMoves(board)) {
            const { row, col } = move;
            board[row][col] = 'X';
            const eval = minimax(depth + 1, true, alpha, beta);
            board[row][col] = '';
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, minEval);
            if (beta <= alpha) break;
        }
        memo.set(boardKey, minEval);
        return minEval;
    }
}

// Hàm đánh giá bảng cờ
function evaluateBoard() {
    if (checkWinCondition('O')) return 100;
    if (checkWinCondition('X')) return -100;
    return 0;
}

// Hàm kiểm tra nếu bàn cờ đầy
function isDraw() {
    return board.flat().every(cell => cell !== '');
}

// Hàm kiểm tra chiến thắng
function checkWin(row, col) {
    return checkWinCondition(currentPlayer);
}

function checkWinCondition(player) {
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (checkDirection(row, col, 1, 0, player) || checkDirection(row, col, 0, 1, player) ||
                checkDirection(row, col, 1, 1, player) || checkDirection(row, col, 1, -1, player)) {
                return true;
            }
        }
    }
    return false;
}

// Kiểm tra theo một hướng
function checkDirection(row, col, rowDir, colDir, player) {
    let count = 0;
    for (let step = 0; step < winCondition; step++) {
        const r = row + rowDir * step;
        const c = col + colDir * step;
        if (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === player) {
            count++;
            if (count === winCondition) return true;
        } else break;
    }
    return false;
}

// Cập nhật hiển thị bảng cờ
function updateBoard() {
    boardElement.childNodes.forEach((cell, index) => {
        const row = Math.floor(index / boardSize);
        const col = index % boardSize;
        cell.innerText = board[row][col];
    });
}

// Hàm khởi động lại trò chơi
function restartGame() {
    startGame();
    document.getElementById("restart").style.display = 'none';
}

// Cập nhật điểm khi người chơi thắng
function updateScore() {
    fetch('/update_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            playerScore++;
            document.getElementById('playerScore').innerText = `Người chơi: ${playerName} - Điểm: ${playerScore}`;
        }
    });
}

// Hàm hiển thị hướng dẫn chơi
function showRules() {
    alert(`Luật chơi Tic Tac Toe 8x8:
    - Mục tiêu: Xếp 5 dấu liên tiếp (theo hàng, cột, hoặc chéo).
    
    Chế độ đấu với máy:
    - Người chơi nhập tên trước khi bắt đầu.
    - Mỗi trận thắng sẽ được cộng 1 điểm.
    
    Chế độ đấu 2 người:
    - Hai người chơi luân phiên đặt dấu X và O trên bàn cờ.
    - Người thắng sẽ được bắt đầu ở lượt kế tiếp.`);
}
