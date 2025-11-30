const board = document.getElementById('board');
const cells = document.querySelectorAll('[data-cell]');
const statusText = document.getElementById('status');
const ratingDisplay = document.getElementById('ratingDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = document.getElementById('undoBtn');
const hintBtn = document.getElementById('hintBtn');
const historyBtn = document.getElementById('historyBtn');
const doubleMoveBtn = document.getElementById('doubleMoveBtn');
const replaceBtn = document.getElementById('replaceBtn');
const tournamentBtn = document.getElementById('tournamentBtn');
const difficultySelect = document.getElementById('difficulty');
const boardTypeSelect = document.getElementById('boardType');
const gameModeSelect = document.getElementById('gameMode');
const randomRulesBtn = document.getElementById('randomRulesBtn');
const chatBtn = document.getElementById('chatBtn');
const chatModal = document.getElementById('chatModal');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessage = document.getElementById('sendMessage');

// Мультиплеер элементы
const tournamentModal = document.getElementById('tournamentModal');
const closeTournament = document.getElementById('closeTournament');
const gamesPlayed = document.getElementById('gamesPlayed');
const gamesWon = document.getElementById('gamesWon');
const gamesLost = document.getElementById('gamesLost');
const gamesTied = document.getElementById('gamesTied');
const winRate = document.getElementById('winRate');
const currentRating = document.getElementById('currentRating');
const achievementsList = document.getElementById('achievementsList');


// Онлайн мультиплеер элементы
const onlineMultiplayerModal = document.getElementById('onlineMultiplayerModal');
const closeOnlineMultiplayer = document.getElementById('closeOnlineMultiplayer');
const connectionStatus = document.getElementById('connectionStatus');
const onlineGameSetup = document.getElementById('onlineGameSetup');
const myPlayerSymbol = document.getElementById('myPlayerSymbol');
const opponentName = document.getElementById('opponentName');
const roomId = document.getElementById('roomId');
const copyRoomBtn = document.getElementById('copyRoomBtn');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomInputDiv = document.getElementById('roomInputDiv');
const roomIdInput = document.getElementById('roomIdInput');
const confirmJoinBtn = document.getElementById('confirmJoinBtn');

// Темы
const themeSelect = document.getElementById('themeSelect');

let currentPlayer = 'X';
let gameActive = true;
let gameState = ['', '', '', '', '', '', '', '', ''];
let difficulty = 'hard';
let boardType = '3x3';
let boardSize = 3;
let winLength = 3;
let gameMode = 'classic'; // 'classic', 'cooperation', 'reverse', 'mines', 'blitz'

// Система рейтинга и статистики
let playerRating = 1000;
let gameStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    gamesTied: 0
};

// История ходов
let moveHistory = [];
let gameStartTime = null;
let gameTimer = null;

// Нестандартные механики
let mines = []; // Массив индексов клеток с минами
let blitzTimeLeft = 60; // Время на игру в режиме блиц (секунды)
let blitzTimer = null;
let doubleMoveActive = false; // Флаг для двойного хода
let powerUpsUsed = 0; // Счетчик использованных бустеров

// Мультиплеер
let isOnlineMultiplayer = false;

// Онлайн мультиплеер
let onlineGameId = null;
let onlinePlayerId = null;
let onlineOpponentId = null;
let onlineConnection = null;
let isHost = false;

// Темы
let currentTheme = 'cosmic';

// Performance optimizations
const memo = new Map();
let animationFrameId = null;

// Use requestAnimationFrame for smooth animations
function scheduleAnimationFrame(callback) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = window.requestAnimationFrame(callback);
}

let winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// Функция для генерации условий победы в зависимости от типа поля
function generateWinningConditions() {
    winningConditions = [];

    if (boardType === '3x3') {
        boardSize = 3;
        winLength = 3;
        winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // строки
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // столбцы
            [0, 4, 8], [2, 4, 6] // диагонали
        ];
    } else if (boardType === '5x5') {
        boardSize = 5;
        winLength = 4;
        // Генерируем все возможные комбинации из 4 в ряд
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j <= boardSize - winLength; j++) {
                // горизонтальные
                const horizontal = [];
                for (let k = 0; k < winLength; k++) {
                    horizontal.push(i * boardSize + j + k);
                }
                winningConditions.push(horizontal);

                // вертикальные
                const vertical = [];
                for (let k = 0; k < winLength; k++) {
                    vertical.push((j + k) * boardSize + i);
                }
                winningConditions.push(vertical);
            }
        }
        // диагонали
        for (let i = 0; i <= boardSize - winLength; i++) {
            for (let j = 0; j <= boardSize - winLength; j++) {
                // главная диагональ
                const diagonal1 = [];
                for (let k = 0; k < winLength; k++) {
                    diagonal1.push((i + k) * boardSize + (j + k));
                }
                winningConditions.push(diagonal1);

                // побочная диагональ
                const diagonal2 = [];
                for (let k = 0; k < winLength; k++) {
                    diagonal2.push((i + k) * boardSize + (j + winLength - 1 - k));
                }
                winningConditions.push(diagonal2);
            }
        }
    } else if (boardType === 'hex') {
        // Гексагональная сетка - упрощенная версия для демонстрации
        boardSize = 7; // 7 клеток в гексагоне
        winLength = 3;
        // Для гексагональной сетки нужны специальные условия победы
        // Пока оставим базовую логику, позже доработаем
        winningConditions = [
            [0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5], [4, 5, 6],
            [0, 3, 6], [1, 4, 6], [0, 2, 5], [1, 3, 5], [2, 4, 6]
        ];
    } else if (boardType === '3d') {
        boardSize = 3;
        winLength = 3;
        // 3D поле 3x3x3 - 27 клеток
        // Условия победы включают линии через все уровни
        const size = 3;
        const totalSize = size * size * size;

        // Генерируем все возможные линии в 3D пространстве
        for (let level = 0; level < size; level++) {
            for (let row = 0; row < size; row++) {
                // строки на каждом уровне
                const rowLine = [];
                for (let col = 0; col < size; col++) {
                    rowLine.push(level * size * size + row * size + col);
                }
                winningConditions.push(rowLine);

                // столбцы на каждом уровне
                const colLine = [];
                for (let col = 0; col < size; col++) {
                    colLine.push(level * size * size + col * size + row);
                }
                winningConditions.push(colLine);
            }

            // диагонали на каждом уровне
            const diag1 = [];
            const diag2 = [];
            for (let i = 0; i < size; i++) {
                diag1.push(level * size * size + i * size + i);
                diag2.push(level * size * size + i * size + (size - 1 - i));
            }
            winningConditions.push(diag1);
            winningConditions.push(diag2);
        }

        // вертикальные линии между уровнями
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const vertical = [];
                for (let level = 0; level < size; level++) {
                    vertical.push(level * size * size + row * size + col);
                }
                winningConditions.push(vertical);
            }
        }

        // диагонали между уровнями
        for (let i = 0; i < size; i++) {
            // диагонали в плоскости row-col
            const diag3d1 = [];
            const diag3d2 = [];
            for (let j = 0; j < size; j++) {
                diag3d1.push(j * size * size + i * size + j);
                diag3d2.push(j * size * size + i * size + (size - 1 - j));
            }
            winningConditions.push(diag3d1);
            winningConditions.push(diag3d2);

            // диагонали в плоскости level-row
            const diag3d3 = [];
            const diag3d4 = [];
            for (let j = 0; j < size; j++) {
                diag3d3.push(j * size * size + j * size + i);
                diag3d4.push(j * size * size + (size - 1 - j) * size + i);
            }
            winningConditions.push(diag3d3);
            winningConditions.push(diag3d4);

            // диагонали в плоскости level-col
            const diag3d5 = [];
            const diag3d6 = [];
            for (let j = 0; j < size; j++) {
                diag3d5.push(j * size * size + i * size + j);
                diag3d6.push(j * size * size + i * size + (size - 1 - j));
            }
            winningConditions.push(diag3d5);
            winningConditions.push(diag3d6);
        }

        // главные диагонали через все измерения
        const spaceDiag1 = [];
        const spaceDiag2 = [];
        for (let i = 0; i < size; i++) {
            spaceDiag1.push(i * size * size + i * size + i);
            spaceDiag2.push(i * size * size + i * size + (size - 1 - i));
        }
        winningConditions.push(spaceDiag1);
        winningConditions.push(spaceDiag2);

        const spaceDiag3 = [];
        const spaceDiag4 = [];
        for (let i = 0; i < size; i++) {
            spaceDiag3.push(i * size * size + (size - 1 - i) * size + i);
            spaceDiag4.push(i * size * size + (size - 1 - i) * size + (size - 1 - i));
        }
        winningConditions.push(spaceDiag3);
        winningConditions.push(spaceDiag4);
    }
}

function handleCellClick(event) {
    const cell = event.target;
    let cellIndex;

    if (boardType === '3d') {
        // Для 3D поля индекс рассчитывается по уровню, строке и столбцу
        const level = parseInt(cell.dataset.level);
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        cellIndex = level * boardSize * boardSize + row * boardSize + col;
    } else {
        // Для остальных типов полей используем обычный индекс
        cellIndex = Array.from(window.cells).indexOf(cell);
    }

    if (gameState[cellIndex] !== '' || !gameActive) {
        return;
    }

    // В онлайн мультиплеере проверяем, что игрок ходит своим символом
    if (isOnlineMultiplayer && player !== currentPlayer) {
        return;
    }

    // В одиночной игре проверяем ход ИИ
    if (!isOnlineMultiplayer && currentPlayer === 'O') {
        return;
    }

    // Проверяем мины в режиме мин
    if (gameMode === 'mines' && checkMine(cellIndex)) {
        statusText.textContent = '💥 Вы попали на мину! ИИ победил!';
        gameActive = false;
        updateGameStats('loss');
        return;
    }

    // Обрабатываем двойной ход
    if (doubleMoveActive && currentPlayer === 'X') {
        makeMove(cellIndex, 'X');
        doubleMoveActive = false;
        doubleMoveBtn.disabled = false;
        statusText.textContent = '⚡ Выполнен двойной ход! Ход ИИ...';
        // Не вызываем aiMove здесь, он вызовется в makeMove
        return;
    }

    makeMove(cellIndex, 'X');
    // aiMove будет вызван в makeMove если нужно
}

function makeMove(index, player) {
    gameState[index] = player;

    // Записываем ход в историю
    recordMove(index, player);

    // Отправляем ход в онлайн-игре
    if (isOnlineMultiplayer) {
        sendOnlineMove(index);
    }

    // Находим соответствующую клетку для отображения
    let targetCell;
    if (boardType === '3d') {
        const level = Math.floor(index / (boardSize * boardSize));
        const row = Math.floor((index % (boardSize * boardSize)) / boardSize);
        const col = index % boardSize;
        targetCell = document.querySelector(`[data-cell][data-level="${level}"][data-row="${row}"][data-col="${col}"]`);
    } else {
        targetCell = window.cells[index];
    }

    if (targetCell) {
        // Убираем анимацию для всех символов, чтобы избежать проблем
        targetCell.textContent = player;
        targetCell.classList.add(player.toLowerCase());
        targetCell.classList.add('filled');
    }

    // Проверяем условия окончания игры в зависимости от режима
    if (gameMode === 'reverse') {
        // В обратных правилах проигрывает тот, кто соберет линию первым
        if (checkWin(player)) {
            statusText.textContent = player === 'X' ? '😵 Вы проиграли (собрали линию первым)!' : '🎉 ИИ проиграл!';
            gameActive = false;
            stopGameTimer();
            updateGameStats(player === 'X' ? 'loss' : 'win');
            return;
        }
    } else {
        // В классическом режиме и кооперации проверяем обычную победу
        if (checkWin(player)) {
            if (gameMode === 'cooperation') {
                statusText.textContent = '🎉 Вы и ИИ победили вместе!';
                updateGameStats('win');
            } else {
                statusText.textContent = player === 'X' ? '🎉 Вы победили!' : '🤖 ИИ победил!';
                updateGameStats(player === 'X' ? 'win' : 'loss');
            }
            gameActive = false;
            stopGameTimer();
            createVictoryParticles();
            createVictoryWave();
            return;
        }
    }

    if (checkTie()) {
        if (gameMode === 'cooperation') {
            statusText.textContent = '🤝 Вы и ИИ сыграли вничью!';
        } else {
            statusText.textContent = '🤝 Ничья!';
        }
        gameActive = false;
        stopGameTimer();
        updateGameStats('tie');
        return;
    }

    // Определяем следующего игрока в зависимости от режима
    if (isOnlineMultiplayer) {
        // В онлайн мультиплеере после хода обновляем статус и ждем соперника
        statusText.textContent = 'Ожидание хода соперника...';
        return; // Не меняем currentPlayer здесь
    } else if (gameMode === 'cooperation') {
        // В кооперации игроки ходят по очереди, но оба против системы
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        if (currentPlayer === 'X') {
            statusText.textContent = 'Ваш ход (X)';
        } else {
            statusText.textContent = '🤝 Ход союзника (ИИ)';
            // Вызываем aiMove только если игра активна
            if (gameActive) {
                setTimeout(() => aiMove(), 500);
            }
        }
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        if (currentPlayer === 'X') {
            statusText.textContent = 'Ваш ход (X)';
        } else {
            statusText.textContent = '🤔 ИИ думает...';
            // Вызываем aiMove только если игра активна
            if (gameActive) {
                setTimeout(() => aiMove(), 500);
            }
        }
    }
}

function checkWin(player) {
    return winningConditions.some(condition => {
        return condition.every(index => gameState[index] === player);
    });
}

function checkTie() {
    return gameState.every(cell => cell !== '');
}

function aiMove() {
    // Проверяем, что игра активна и сейчас ход ИИ
    if (!gameActive || currentPlayer !== 'O') {
        return;
    }

    let move;
    if (gameMode === 'cooperation') {
        // В режиме кооперации ИИ помогает игроку - выбирает оптимальный ход для победы
        move = getBestMoveForCooperation();
    } else {
        switch (difficulty) {
            case 'easy':
                move = getRandomMove();
                break;
            case 'medium':
                move = getMediumMove();
                break;
            case 'hard':
                move = getBestMove();
                break;
        }
    }

    if (move !== -1) {
        makeMove(move, 'O');
    }
}

function getBestMoveForCooperation() {
    // В кооперации ИИ выбирает ход, который помогает выиграть (для X)
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === '') {
            gameState[i] = 'X'; // Пробуем ход за игрока
            let score = minimaxCooperation(gameState, 0, true);
            gameState[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove;
}

function minimaxCooperation(board, depth, isMaximizing) {
    // Проверяем, выиграл ли игрок X
    if (checkWinOnBoard(board, 'X')) {
        return 10 - depth;
    }
    if (checkWinOnBoard(board, 'O')) {
        return depth - 10; // O мешает выиграть
    }
    if (checkTieOnBoard(board)) {
        return 0;
    }

    const maxDepth = boardType === '3x3' ? 3 : boardType === '5x5' ? 2 : 1;
    if (depth >= maxDepth) {
        return 0;
    }

    let bestScore = isMaximizing ? -Infinity : Infinity;

    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = isMaximizing ? 'X' : 'O';
            const score = minimaxCooperation(board, depth + 1, !isMaximizing);
            board[i] = '';

            if (isMaximizing) {
                bestScore = Math.max(score, bestScore);
            } else {
                bestScore = Math.min(score, bestScore);
            }
        }
    }

    return bestScore;
}

function getRandomMove() {
    const availableMoves = [];
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === '') {
            availableMoves.push(i);
        }
    }
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function getMediumMove() {
    // 70% chance of optimal move, 30% chance of random move
    if (Math.random() < 0.7) {
        return getBestMove();
    } else {
        return getRandomMove();
    }
}

function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === '') {
            gameState[i] = 'O';
            let score = minimax(gameState, 0, false);
            gameState[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    // Terminal states - check the board parameter, not global gameState
    if (checkWinOnBoard(board, 'O')) {
        return 10 - depth;
    }
    if (checkWinOnBoard(board, 'X')) {
        return depth - 10;
    }
    if (checkTieOnBoard(board)) {
        return 0;
    }

    // Limit depth for performance (adjust based on board size)
    const maxDepth = boardType === '3x3' ? 3 : boardType === '5x5' ? 2 : 1;
    if (depth >= maxDepth) {
        return 0;
    }

    let bestScore = isMaximizing ? -Infinity : Infinity;

    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = isMaximizing ? 'O' : 'X';
            const score = minimax(board, depth + 1, !isMaximizing);
            board[i] = '';

            if (isMaximizing) {
                bestScore = Math.max(score, bestScore);
            } else {
                bestScore = Math.min(score, bestScore);
            }
        }
    }

    return bestScore;
}

function checkWinOnBoard(board, player) {
    return winningConditions.some(condition => {
        return condition.every(index => board[index] === player);
    });
}

function checkTieOnBoard(board) {
    return board.every(cell => cell !== '');
}

// Функция для создания игрового поля
function createBoard() {
    board.innerHTML = '';
    const totalCells = boardType === '3d' ? boardSize * boardSize * boardSize : boardSize * boardSize;

    if (boardType === '3d') {
        // Создаем 3D поле с уровнями
        for (let level = 0; level < boardSize; level++) {
            const levelDiv = document.createElement('div');
            levelDiv.className = 'level';
            levelDiv.style.display = 'grid';
            levelDiv.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
            levelDiv.style.gap = '8px';
            levelDiv.style.marginBottom = '20px';

            for (let row = 0; row < boardSize; row++) {
                for (let col = 0; col < boardSize; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.cell = '';
                    cell.dataset.level = level;
                    cell.dataset.row = row;
                    cell.dataset.col = col;
                    cell.style.width = '80px';
                    cell.style.height = '80px';
                    levelDiv.appendChild(cell);
                }
            }
            board.appendChild(levelDiv);
        }
        board.style.gridTemplateColumns = '1fr';
    } else if (boardType === 'hex') {
        // Создаем гексагональную сетку
        board.style.gridTemplateColumns = 'repeat(4, 1fr)';
        board.style.gap = '10px';

        // Создаем 7 гексагональных клеток
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell hex-cell';
            cell.dataset.cell = '';
            cell.style.width = '90px';
            cell.style.height = '90px';
            cell.style.clipPath = 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)';
            board.appendChild(cell);
        }
    } else {
        // Стандартное квадратное поле
        board.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
        board.style.gap = boardSize === 5 ? '8px' : '12px';

        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.cell = '';
            cell.style.width = boardSize === 5 ? '90px' : '110px';
            cell.style.height = boardSize === 5 ? '90px' : '110px';
            board.appendChild(cell);
        }
    }

    // Обновляем ссылку на клетки
    updateCellsReference();
}

function updateCellsReference() {
    // Обновляем глобальную ссылку на клетки
    window.cells = document.querySelectorAll('[data-cell]');
    // Перепривязываем обработчики событий
    window.cells.forEach(cell => {
        cell.removeEventListener('click', handleCellClick);
        cell.addEventListener('click', handleCellClick, { passive: true });
    });
}

function resetGame() {
    currentPlayer = 'X';
    gameActive = true;
    const totalCells = boardType === '3d' ? boardSize * boardSize * boardSize : boardSize * boardSize;
    gameState = new Array(totalCells).fill('');
    moveHistory = [];
    mines = [];
    doubleMoveActive = false;
    powerUpsUsed = 0;

    stopGameTimer();
    stopBlitzTimer();

    if (gameMode === 'blitz') {
        startBlitzTimer();
    } else {
        startGameTimer();
    }

    if (gameMode === 'mines') {
        placeMines();
    }

    // Включаем бустеры
    doubleMoveBtn.disabled = false;
    replaceBtn.disabled = false;

    updateGameStatus();

    const allCells = document.querySelectorAll('[data-cell]');
    allCells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'filled', 'hint-cell', 'mine-cell');
    });
}

function handleDifficultyChange() {
    difficulty = difficultySelect.value;
}

function handleBoardTypeChange() {
    boardType = boardTypeSelect.value;
    generateWinningConditions();
    createBoard();
    resetGame();
}

function handleGameModeChange() {
    gameMode = gameModeSelect.value;

    // Останавливаем предыдущие таймеры
    stopBlitzTimer();

    // Запускаем соответствующие режимы
    if (gameMode === 'mines') {
        placeMines();
    }

    if (gameMode === 'blitz') {
        startBlitzTimer();
    }

    // Показываем/скрываем бустеры
    const powerUps = document.querySelector('.power-ups');
    if (gameMode === 'classic' || gameMode === 'cooperation') {
        powerUps.style.display = 'flex';
    } else {
        powerUps.style.display = 'none';
    }

    updateGameStatus();
    resetGame();
}

function handleRandomRules() {
    // Случайный выбор типа поля
    const boardTypes = ['3x3', '5x5', 'hex', '3d'];
    boardType = boardTypes[Math.floor(Math.random() * boardTypes.length)];
    boardTypeSelect.value = boardType;

    // Случайный выбор режима игры
    const gameModes = ['classic', 'cooperation', 'reverse'];
    gameMode = gameModes[Math.floor(Math.random() * gameModes.length)];
    gameModeSelect.value = gameMode;

    // Случайная сложность
    const difficulties = ['easy', 'medium', 'hard'];
    difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    difficultySelect.value = difficulty;

    // Применяем изменения
    generateWinningConditions();
    createBoard();
    updateGameStatus();
    resetGame();

    // Показываем уведомление о новых правилах
    showRandomRulesNotification();
}

function showRandomRulesNotification() {
    const notification = document.createElement('div');
    notification.className = 'random-rules-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h3>🎲 Новые случайные правила!</h3>
            <p>Тип поля: ${getBoardTypeName(boardType)}</p>
            <p>Режим: ${getGameModeName(gameMode)}</p>
            <p>Сложность: ${getDifficultyName(difficulty)}</p>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function getBoardTypeName(type) {
    const names = {
        '3x3': '3x3 (Классика)',
        '5x5': '5x5 (4 в ряд)',
        'hex': 'Гексагональная',
        '3d': '3D (3x3x3)'
    };
    return names[type] || type;
}

function getGameModeName(mode) {
    const names = {
        'classic': 'Классический',
        'cooperation': 'Кооперация',
        'reverse': 'Обратные правила'
    };
    return names[mode] || mode;
}

function getDifficultyName(diff) {
    const names = {
        'easy': 'Легко',
        'medium': 'Средне',
        'hard': 'Сложно'
    };
    return names[diff] || diff;
}

function updateGameStatus() {
    if (gameMode === 'cooperation') {
        statusText.textContent = '🤝 Режим кооперации: вы и ИИ вместе против системы!';
    } else if (gameMode === 'reverse') {
        statusText.textContent = '🔄 Обратные правила: проигрывает тот, кто соберет линию первым!';
    } else if (gameMode === 'mines') {
        statusText.textContent = '💣 Режим мин: избегайте клеток с минами!';
    } else if (gameMode === 'blitz') {
        statusText.textContent = `⚡ Блиц: ${blitzTimeLeft} сек осталось!`;
    } else {
        statusText.textContent = 'Ваш ход (X)';
    }
}

// Функции для работы с минами
function placeMines() {
    mines = [];
    const totalCells = boardType === '3d' ? boardSize * boardSize * boardSize : boardSize * boardSize;
    const mineCount = Math.min(Math.floor(totalCells * 0.15), 5); // 15% клеток или максимум 5 мин

    while (mines.length < mineCount) {
        const randomIndex = Math.floor(Math.random() * totalCells);
        if (!mines.includes(randomIndex)) {
            mines.push(randomIndex);
        }
    }

    // Отображаем мины на поле
    mines.forEach(mineIndex => {
        let mineCell;
        if (boardType === '3d') {
            const level = Math.floor(mineIndex / (boardSize * boardSize));
            const row = Math.floor((mineIndex % (boardSize * boardSize)) / boardSize);
            const col = mineIndex % boardSize;
            mineCell = document.querySelector(`[data-cell][data-level="${level}"][data-row="${row}"][data-col="${col}"]`);
        } else {
            mineCell = window.cells[mineIndex];
        }

        if (mineCell) {
            mineCell.classList.add('mine-cell');
            mineCell.textContent = '💣';
        }
    });
}

function checkMine(index) {
    return mines.includes(index);
}

// Функции для режима блиц
function startBlitzTimer() {
    blitzTimeLeft = 60; // 60 секунд на игру
    updateGameStatus();

    blitzTimer = setInterval(() => {
        blitzTimeLeft--;
        updateGameStatus();

        if (blitzTimeLeft <= 0) {
            clearInterval(blitzTimer);
            blitzTimer = null;
            // Время вышло - ИИ побеждает
            statusText.textContent = '⏰ Время вышло! ИИ победил!';
            gameActive = false;
            updateGameStats('loss');
        }
    }, 1000);
}

function stopBlitzTimer() {
    if (blitzTimer) {
        clearInterval(blitzTimer);
        blitzTimer = null;
    }
}

// Функции для бустеров
function activateDoubleMove() {
    if (powerUpsUsed >= 3) return; // Максимум 3 бустера за игру

    doubleMoveActive = true;
    powerUpsUsed++;
    doubleMoveBtn.disabled = true;
    statusText.textContent = '⚡ Выберите две клетки для двойного хода!';
}

function replaceOpponentSymbol() {
    if (powerUpsUsed >= 3) return;

    // Находим все клетки противника
    const opponentCells = [];
    gameState.forEach((cell, index) => {
        if (cell === 'O') {
            opponentCells.push(index);
        }
    });

    if (opponentCells.length === 0) return;

    // Выбираем случайную клетку противника для замены
    const randomIndex = opponentCells[Math.floor(Math.random() * opponentCells.length)];
    gameState[randomIndex] = 'X';

    // Обновляем отображение
    let targetCell;
    if (boardType === '3d') {
        const level = Math.floor(randomIndex / (boardSize * boardSize));
        const row = Math.floor((randomIndex % (boardSize * boardSize)) / boardSize);
        const col = randomIndex % boardSize;
        targetCell = document.querySelector(`[data-cell][data-level="${level}"][data-row="${row}"][data-col="${col}"]`);
    } else {
        targetCell = window.cells[randomIndex];
    }

    if (targetCell) {
        targetCell.textContent = 'X';
        targetCell.classList.remove('o');
        targetCell.classList.add('x');
    }

    powerUpsUsed++;
    replaceBtn.disabled = true;

    // Записываем в историю как специальный ход
    recordMove(randomIndex, 'X-REPLACE');
}

// Функции мультиплеера
function openTournament() {
    updateTournamentStats();
    updateAchievements();
    tournamentModal.classList.add('show');
}

function closeTournamentModal() {
    tournamentModal.classList.remove('show');
}

function updateTournamentStats() {
    gamesPlayed.textContent = gameStats.gamesPlayed;
    gamesWon.textContent = gameStats.gamesWon;
    gamesLost.textContent = gameStats.gamesLost;
    gamesTied.textContent = gameStats.gamesTied;

    const rate = gameStats.gamesPlayed > 0 ?
        Math.round((gameStats.gamesWon / gameStats.gamesPlayed) * 100) : 0;
    winRate.textContent = rate + '%';

    currentRating.textContent = playerRating;
}

function updateAchievements() {
    const achievements = [];

    if (gameStats.gamesWon >= 1) achievements.push('🏆 Первая победа');
    if (gameStats.gamesWon >= 5) achievements.push('⭐ 5 побед');
    if (gameStats.gamesWon >= 10) achievements.push('🌟 10 побед');
    if (gameStats.gamesWon >= 25) achievements.push('👑 25 побед');
    if (gameStats.gamesWon >= 50) achievements.push('💎 50 побед');

    if (playerRating >= 1200) achievements.push('🔥 Высокий рейтинг');
    if (playerRating >= 1500) achievements.push('⚡ Мастер игры');

    if (gameStats.gamesPlayed >= 10) achievements.push('🎯 10 игр сыграно');
    if (gameStats.gamesPlayed >= 50) achievements.push('🎪 50 игр сыграно');

    achievementsList.innerHTML = achievements.length > 0 ?
        achievements.map(achievement => `<div class="achievement">${achievement}</div>`).join('') :
        '<p>Пока нет достижений. Играйте больше!</p>';
}


function switchToSinglePlayer() {
    isOnlineMultiplayer = false;

    // Показываем элементы ИИ
    document.querySelector('.difficulty-selector').style.display = 'block';
    document.querySelector('.power-ups').style.display = 'flex';

    resetGame();
}

// Функции онлайн-мультиплеера
function openOnlineMultiplayer() {
    onlineMultiplayerModal.classList.add('show');
    connectionStatus.innerHTML = '<p>🔄 Подключение к серверу...</p>';

    // Имитация подключения к серверу
    setTimeout(() => {
        connectionStatus.innerHTML = '<p>✅ Подключено! Выберите действие:</p>';
        document.querySelector('.online-menu').style.display = 'flex';
        document.querySelector('.online-menu').style.flexDirection = 'column';
    }, 1000);
}

function closeOnlineMultiplayerModal() {
    onlineMultiplayerModal.classList.remove('show');
    // Очистка состояния
    onlineGameId = null;
    onlinePlayerId = null;
    onlineOpponentId = null;
    isOnlineMultiplayer = false;
    isHost = false;
}

function createOnlineRoom() {
    // Генерируем уникальный ID комнаты
    onlineGameId = 'room_' + Math.random().toString(36).substr(2, 9);
    onlinePlayerId = 'player_' + Math.random().toString(36).substr(2, 9);
    isHost = true;

    // Сохраняем информацию о комнате в localStorage (имитация сервера)
    const roomData = {
        id: onlineGameId,
        host: onlinePlayerId,
        hostName: 'Игрок 1',
        status: 'waiting',
        created: Date.now()
    };
    localStorage.setItem('ticTacToeRoom_' + onlineGameId, JSON.stringify(roomData));

    // Показываем информацию о комнате
    showOnlineGameSetup('X', 'Ожидание соперника...');

    // Начинаем проверку на подключение соперника
    startRoomPolling();
}

function joinOnlineRoom() {
    document.querySelector('.online-menu').style.display = 'none';
    roomInputDiv.style.display = 'flex';
    roomIdInput.focus();
}

function confirmJoinRoom() {
    const roomIdToJoin = roomIdInput.value.trim();
    if (!roomIdToJoin) return;

    // Проверяем существование комнаты
    const roomData = JSON.parse(localStorage.getItem('ticTacToeRoom_' + roomIdToJoin));
    if (!roomData || roomData.status !== 'waiting') {
        alert('Комната не найдена или уже занята!');
        return;
    }

    // Присоединяемся к комнате
    onlineGameId = roomIdToJoin;
    onlinePlayerId = 'player_' + Math.random().toString(36).substr(2, 9);
    onlineOpponentId = roomData.host;
    isHost = false;

    // Обновляем данные комнаты
    roomData.guest = onlinePlayerId;
    roomData.guestName = 'Игрок 2';
    roomData.status = 'playing';
    localStorage.setItem('ticTacToeRoom_' + onlineGameId, JSON.stringify(roomData));

    // Показываем информацию об игре
    showOnlineGameSetup('O', roomData.hostName);

    // Начинаем игру
    startOnlineGame();
}

function showOnlineGameSetup(playerSymbol, opponent) {
    document.getElementById('onlineMenu').style.display = 'none';
    onlineGameSetup.style.display = 'block';

    myPlayerSymbol.textContent = playerSymbol;
    opponentName.textContent = opponent;
    roomId.textContent = onlineGameId;
}

function copyRoomId() {
    navigator.clipboard.writeText(onlineGameId).then(() => {
        copyRoomBtn.textContent = '✅ Скопировано!';
        setTimeout(() => {
            copyRoomBtn.textContent = '📋 Скопировать ID комнаты';
        }, 2000);
    });
}

function startRoomPolling() {
    // Проверяем подключение соперника каждые 2 секунды
    const pollInterval = setInterval(() => {
        const roomData = JSON.parse(localStorage.getItem('ticTacToeRoom_' + onlineGameId));
        if (roomData && roomData.guest) {
            // Соперник подключился
            clearInterval(pollInterval);
            onlineOpponentId = roomData.guest;
            opponentName.textContent = roomData.guestName;
            startOnlineGame();
        }
    }, 2000);
}

function startOnlineGame() {
    isOnlineMultiplayer = true;
    // В онлайн игре каждый игрок имеет фиксированный символ
    currentPlayer = isHost ? 'X' : 'O';
    currentPlayerName = isHost ? 'Игрок 1 (X)' : 'Игрок 2 (O)';

    // Скрываем элементы ИИ
    document.querySelector('.difficulty-selector').style.display = 'none';
    document.querySelector('.power-ups').style.display = 'none';

    // Устанавливаем классический режим
    gameMode = 'classic';
    boardType = '3x3';
    boardSize = 3;
    winLength = 3;

    generateWinningConditions();
    createBoard();
    resetGame();

    closeOnlineMultiplayerModal();
}

function sendOnlineMove(moveIndex) {
    if (!isOnlineMultiplayer || !onlineGameId) return;

    const moveData = {
        playerId: onlinePlayerId,
        moveIndex: moveIndex,
        timestamp: Date.now()
    };

    // Сохраняем ход в localStorage (имитация отправки на сервер)
    const gameKey = 'ticTacToeGame_' + onlineGameId;
    const gameData = JSON.parse(localStorage.getItem(gameKey)) || { moves: [] };
    gameData.moves.push(moveData);
    localStorage.setItem(gameKey, JSON.stringify(gameData));
}

function checkOnlineMoves() {
    if (!isOnlineMultiplayer || !onlineGameId) return;

    const gameKey = 'ticTacToeGame_' + onlineGameId;
    const gameData = JSON.parse(localStorage.getItem(gameKey));

    if (gameData && gameData.moves.length > 0) {
        // Проверяем новые ходы соперника
        const lastMove = gameData.moves[gameData.moves.length - 1];
        if (lastMove.playerId !== onlinePlayerId && gameState[lastMove.moveIndex] === '') {
            // Определяем символ соперника
            const opponentSymbol = currentPlayer === 'X' ? 'O' : 'X';
            // Применяем ход соперника без проверки currentPlayer
            applyOpponentMove(lastMove.moveIndex, opponentSymbol);
            // Теперь ход игрока
            statusText.textContent = 'Ваш ход (' + currentPlayer + ')';
        }
    }
}

function applyOpponentMove(index, player) {
    gameState[index] = player;

    // Находим соответствующую клетку для отображения
    let targetCell;
    if (boardType === '3d') {
        const level = Math.floor(index / (boardSize * boardSize));
        const row = Math.floor((index % (boardSize * boardSize)) / boardSize);
        const col = index % boardSize;
        targetCell = document.querySelector(`[data-cell][data-level="${level}"][data-row="${row}"][data-col="${col}"]`);
    } else {
        targetCell = window.cells[index];
    }

    if (targetCell) {
        targetCell.textContent = player;
        targetCell.classList.add(player.toLowerCase());
        targetCell.classList.add('filled');
    }

    // Записываем ход в историю
    recordMove(index, player);

    // Проверяем условия окончания игры
    if (checkWin(player)) {
        statusText.textContent = player === currentPlayer ? '🎉 Вы победили!' : '🤖 Соперник победил!';
        gameActive = false;
        createVictoryParticles();
        createVictoryWave();
        updateGameStats(player === currentPlayer ? 'win' : 'loss');
        return;
    }

    if (checkTie()) {
        statusText.textContent = '🤝 Ничья!';
        gameActive = false;
        updateGameStats('tie');
        return;
    }
}

// Проверяем ходы соперника каждые 500 мс для более быстрой реакции
setInterval(checkOnlineMoves, 500);

// Функции для тем
function changeTheme(theme) {
    // Убираем предыдущую тему
    document.body.classList.remove('cosmic', 'medieval', 'cyberpunk');

    // Добавляем новую тему
    if (theme !== 'cosmic') {
        document.body.classList.add(theme);
    }

    currentTheme = theme;
    localStorage.setItem('ticTacToeTheme', theme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('ticTacToeTheme') || 'cosmic';
    themeSelect.value = savedTheme;
    changeTheme(savedTheme);
}

function handleThemeChange() {
    changeTheme(themeSelect.value);
}

function createVictoryParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'victory-particles';
    document.body.appendChild(particleContainer);

    const particleCount = 50;
    const colors = ['#ff6b6b', '#4ecdc4', '#ffd700', '#ff4757', '#3742fa'];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'victory-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.animationDuration = (Math.random() * 2 + 1) + 's';

        particleContainer.appendChild(particle);
    }

    // Удаляем частицы через 3 секунды
    setTimeout(() => {
        if (document.body.contains(particleContainer)) {
            document.body.removeChild(particleContainer);
        }
    }, 3000);
}

function createVictoryWave() {
    const allCells = document.querySelectorAll('[data-cell]');
    allCells.forEach((cell, index) => {
        setTimeout(() => {
            cell.classList.add('victory-wave');
        }, index * 100);
    });

    // Убираем класс волны через 2 секунды
    setTimeout(() => {
        allCells.forEach(cell => {
            cell.classList.remove('victory-wave');
        });
    }, 2000);
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick, { passive: true }));
resetBtn.addEventListener('click', resetGame, { passive: true });
undoBtn.addEventListener('click', undoLastMove, { passive: true });
hintBtn.addEventListener('click', getHint, { passive: true });
historyBtn.addEventListener('click', showGameHistory, { passive: true });
doubleMoveBtn.addEventListener('click', activateDoubleMove, { passive: true });
replaceBtn.addEventListener('click', replaceOpponentSymbol, { passive: true });
tournamentBtn.addEventListener('click', openTournament, { passive: true });
onlineMultiplayerBtn.addEventListener('click', openOnlineMultiplayer, { passive: true });
difficultySelect.addEventListener('change', handleDifficultyChange, { passive: true });
boardTypeSelect.addEventListener('change', handleBoardTypeChange, { passive: true });
gameModeSelect.addEventListener('change', handleGameModeChange, { passive: true });
randomRulesBtn.addEventListener('click', handleRandomRules, { passive: true });

// Мультиплеер обработчики
closeTournament.addEventListener('click', closeTournamentModal, { passive: true });
tournamentModal.addEventListener('click', (event) => {
    if (event.target === tournamentModal) {
        closeTournamentModal();
    }
}, { passive: true });


// Онлайн мультиплеер обработчики
closeOnlineMultiplayer.addEventListener('click', closeOnlineMultiplayerModal, { passive: true });
createRoomBtn.addEventListener('click', createOnlineRoom, { passive: true });
joinRoomBtn.addEventListener('click', joinOnlineRoom, { passive: true });
confirmJoinBtn.addEventListener('click', confirmJoinRoom, { passive: true });
copyRoomBtn.addEventListener('click', copyRoomId, { passive: true });
onlineMultiplayerModal.addEventListener('click', (event) => {
    if (event.target === onlineMultiplayerModal) {
        closeOnlineMultiplayerModal();
    }
}, { passive: true });

// Темы
themeSelect.addEventListener('change', handleThemeChange, { passive: true });

// Функции для работы с localStorage
function loadGameStats() {
    const savedStats = localStorage.getItem('ticTacToeStats');
    if (savedStats) {
        gameStats = JSON.parse(savedStats);
    }
    const savedRating = localStorage.getItem('ticTacToeRating');
    if (savedRating) {
        playerRating = parseInt(savedRating);
    }
    updateRatingDisplay();
}

function saveGameStats() {
    localStorage.setItem('ticTacToeStats', JSON.stringify(gameStats));
    localStorage.setItem('ticTacToeRating', playerRating.toString());
}

function updateRatingDisplay() {
    ratingDisplay.textContent = `Рейтинг: ${playerRating}`;
}

// Функции для таймера
function startGameTimer() {
    gameStartTime = Date.now();
    gameTimer = setInterval(updateTimerDisplay, 1000);
}

function stopGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

function updateTimerDisplay() {
    if (!gameStartTime) return;
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Функции для истории ходов
function recordMove(index, player) {
    moveHistory.push({
        index: index,
        player: player,
        timestamp: Date.now(),
        gameState: [...gameState]
    });
}

function undoLastMove() {
    if (moveHistory.length === 0 || !gameActive) return;

    const lastMove = moveHistory.pop();
    gameState[lastMove.index] = '';

    // Находим клетку и очищаем её
    let targetCell;
    if (boardType === '3d') {
        const level = Math.floor(lastMove.index / (boardSize * boardSize));
        const row = Math.floor((lastMove.index % (boardSize * boardSize)) / boardSize);
        const col = lastMove.index % boardSize;
        targetCell = document.querySelector(`[data-cell][data-level="${level}"][data-row="${row}"][data-col="${col}"]`);
    } else {
        targetCell = window.cells[lastMove.index];
    }

    if (targetCell) {
        targetCell.textContent = '';
        targetCell.classList.remove('x', 'o', 'filled');
    }

    currentPlayer = lastMove.player;
    gameActive = true;
    updateGameStatus();
}

// Функции для подсказок
function getHint() {
    if (!gameActive || currentPlayer !== 'X') return;

    const bestMove = getBestMove();
    if (bestMove !== -1) {
        // Подсвечиваем рекомендуемую клетку
        const hintCell = boardType === '3d' ?
            document.querySelector(`[data-cell][data-level="${Math.floor(bestMove / (boardSize * boardSize))}"][data-row="${Math.floor((bestMove % (boardSize * boardSize)) / boardSize)}"][data-col="${bestMove % boardSize}"]`) :
            window.cells[bestMove];

        if (hintCell) {
            hintCell.classList.add('hint-cell');
            setTimeout(() => {
                hintCell.classList.remove('hint-cell');
            }, 2000);
        }
    }
}

// Функции для истории игры
function showGameHistory() {
    let historyText = 'История ходов:\n\n';
    moveHistory.forEach((move, index) => {
        const time = new Date(move.timestamp).toLocaleTimeString();
        historyText += `${index + 1}. ${move.player} в клетке ${move.index + 1} (${time})\n`;
    });

    if (moveHistory.length === 0) {
        historyText = 'История ходов пуста';
    }

    alert(historyText);
}

// Обновление статистики после завершения игры
function updateGameStats(result) {
    gameStats.gamesPlayed++;

    if (result === 'win') {
        gameStats.gamesWon++;
        // Увеличиваем рейтинг за победу
        const ratingChange = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
        playerRating += ratingChange;
    } else if (result === 'loss') {
        gameStats.gamesLost++;
        // Уменьшаем рейтинг за поражение
        const ratingChange = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15;
        playerRating = Math.max(0, playerRating - ratingChange);
    } else if (result === 'tie') {
        gameStats.gamesTied++;
        // Небольшое изменение рейтинга за ничью
        playerRating += 1;
    }

    saveGameStats();
    updateRatingDisplay();
}

// Инициализация игры
loadGameStats();
loadTheme();
generateWinningConditions();
createBoard();

// Performance: Pre-calculate winning conditions for faster checks
const winningPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
];

// Optimize win checking with pre-calculated patterns
function checkWinOnBoard(board, player) {
    return winningPatterns.some(pattern => {
        return pattern.every(index => board[index] === player);
    });
}

function checkTieOnBoard(board) {
    return board.every(cell => cell !== '');
}

// Memory management: Clear unused references
function cleanup() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Chat functionality
function openChat() {
    chatModal.classList.add('show');
    chatInput.focus();
}

function closeChatModal() {
    chatModal.classList.remove('show');
}

function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;

    messageDiv.innerHTML = `
        <div class="message-avatar">${isUser ? '👤' : '🤖'}</div>
        <div class="message-content">
            <p>${content}</p>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getAIResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Game-related responses
    if (message.includes('сложност') || message.includes('уров') || message.includes('difficult')) {
        return 'У игры есть три уровня сложности: Легкий (ИИ делает случайные ходы), Средний (ИИ иногда ошибается) и Сложный (ИИ играет оптимально и не проигрывает).';
    }

    if (message.includes('правил') || message.includes('как игра') || message.includes('rules')) {
        return 'Правила простые: вы играете крестиками (X), ИИ - ноликами (O). Цель - собрать три символа в ряд по горизонтали, вертикали или диагонали. ИИ всегда ходит вторым!';
    }

    if (message.includes('побед') || message.includes('выигра') || message.includes('win')) {
        return 'Чтобы победить, нужно собрать три крестика в ряд. ИИ на сложном уровне играет идеально, так что победить можно только на легком или среднем уровне сложности!';
    }

    if (message.includes('ничь') || message.includes('tie') || message.includes('draw')) {
        return 'Ничья происходит, когда все клетки заполнены, но никто не собрал три символа в ряд. Это возможно на любом уровне сложности.';
    }

    if (message.includes('совет') || message.includes('tip') || message.includes('помощ')) {
        return 'Совет: старайтесь занять центр и углы доски. Не давайте ИИ собрать два символа в ряд без блокировки!';
    }

    if (message.includes('привет') || message.includes('hello') || message.includes('здравствуй')) {
        return 'Привет! Я ИИ-помощник игры в крестики-нолики. Могу ответить на вопросы о правилах, стратегии и особенностях игры. Что вас интересует?';
    }

    if (message.includes('спасибо') || message.includes('thank')) {
        return 'Пожалуйста! Если есть еще вопросы об игре, спрашивайте. Удачи в игре! 🎮';
    }

    // Default responses
    const defaultResponses = [
        'Интересный вопрос! Могу рассказать подробнее о правилах игры.',
        'Я здесь, чтобы помочь с игрой в крестики-нолики. Что вас интересует?',
        'Попробуйте сыграть несколько партий на разных уровнях сложности!',
        'Крестики-нолики - это классическая игра, требующая стратегии и внимания.'
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

function handleSendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatInput.value = '';

    // Simulate AI thinking delay
    setTimeout(() => {
        const response = getAIResponse(message);
        addMessage(response, false);
    }, 500 + Math.random() * 1000);
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        handleSendMessage();
    }
}

// Chat event listeners
chatBtn.addEventListener('click', openChat, { passive: true });
closeChat.addEventListener('click', closeChatModal, { passive: true });
sendMessage.addEventListener('click', handleSendMessage, { passive: true });
chatInput.addEventListener('keypress', handleChatKeyPress, { passive: true });

// Close chat when clicking outside
chatModal.addEventListener('click', (event) => {
    if (event.target === chatModal) {
        closeChatModal();
    }
}, { passive: true });

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup, { passive: true });