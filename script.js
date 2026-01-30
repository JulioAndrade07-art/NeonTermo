document.addEventListener('DOMContentLoaded', () => {

    // --- Configuração Global ---
    let globalWords = [];

    // Configurações dos Modos
    const MODES = {
        termo: { name: "TERMO", grids: 1, attempts: 6, containerClass: "grid-termo" },
        duetto: { name: "DUETTO", grids: 2, attempts: 7, containerClass: "grid-duetto" },
        quarteto: { name: "QUARTETO", grids: 4, attempts: 9, containerClass: "grid-quarteto" }
    };

    let currentMode = "termo"; // Padrão

    // --- Classes ---

    class TermoBoard {
        constructor(id, secretWord, maxAttempts, gameController) {
            this.id = id;
            this.secretWord = secretWord;
            this.maxAttempts = maxAttempts;
            this.controller = gameController;

            this.guesses = [];
            this.isSolved = false;

            this.element = this.createGridElement();
        }

        createGridElement() {
            const container = document.createElement('div');
            container.className = 'grid-container';
            container.dataset.id = this.id;

            for (let r = 0; r < this.maxAttempts; r++) {
                const row = document.createElement('div');
                row.className = 'row';
                row.dataset.row = r;

                for (let c = 0; c < 5; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    row.appendChild(cell);
                }
                container.appendChild(row);
            }
            return container;
        }

        updateActiveRow(currentGuess) {
            if (this.isSolved) return;

            const rowIdx = this.controller.currentRow;
            // Limpar linha atual
            const rowEl = this.element.querySelector(`.row[data-row="${rowIdx}"]`);
            if (!rowEl) return; // Se estourou tentativas, ignora

            // Limpa visual da linha
            Array.from(rowEl.children).forEach((cell, i) => {
                cell.textContent = currentGuess[i] || "";
                cell.className = "cell";
                cell.classList.remove('active');
            });

            // Ativa a célula do cursor atual
            const cursorCol = this.controller.cursorCol;
            if (cursorCol >= 0 && cursorCol < 5) {
                rowEl.children[cursorCol].classList.add('active');
            }
        }

        submitGuess(guess) {
            if (this.isSolved) return null; // Já resolvido, ignora

            const rowIdx = this.controller.currentRow;
            const secretArr = this.secretWord.split('');
            const guessArr = guess.split('');

            const result = Array(5).fill('absent');
            const secretCounts = {};

            for (const char of secretArr) secretCounts[char] = (secretCounts[char] || 0) + 1;

            // 1. Verdes
            for (let i = 0; i < 5; i++) {
                if (guessArr[i] === secretArr[i]) {
                    result[i] = 'correct';
                    secretCounts[guessArr[i]]--;
                }
            }

            // 2. Amarelos
            for (let i = 0; i < 5; i++) {
                if (result[i] !== 'correct' && secretCounts[guessArr[i]] > 0) {
                    result[i] = 'present';
                    secretCounts[guessArr[i]]--;
                }
            }

            // Atualizar Visual
            const rowEl = this.element.querySelector(`.row[data-row="${rowIdx}"]`);
            Array.from(rowEl.children).forEach((cell, i) => {
                cell.classList.remove('active');
                setTimeout(() => {
                    cell.classList.add(result[i]);
                }, i * 100);
            });

            // Checar Vitória neste board
            if (guess === this.secretWord) {
                this.isSolved = true;
                this.element.classList.add('finished');
            }

            // Retorna o resultado para que o controller atualize o teclado global
            // Retorna array de objetos { char: 'A', status: 'correct' }
            return guessArr.map((char, i) => ({ char, status: result[i] }));
        }
    }

    class GameController {
        constructor() {
            this.activeBoards = [];
            this.currentRow = 0;
            this.currentGuess = new Array(5).fill(""); // Buffer agora é array
            this.cursorCol = 0;
            this.isGameOver = false;

            // Elementos DOM
            this.boardArea = document.getElementById('game-board-area');
            this.keyboardDiv = document.getElementById('keyboard');
            this.messageArea = document.getElementById('message-area');
            this.newWordBtn = document.getElementById('new-word-btn');

            // Modal Stats
            this.statsModal = document.getElementById('stats-modal');
            this.statsContainer = document.getElementById('stats-container');

            this.bindEvents();
            this.setupModeSelector();
        }

        start() {
            if (!globalWords || globalWords.length === 0) {
                this.showMessage("ERRO: Palavras não carregadas.");
                return;
            }

            this.reset();
            const config = MODES[currentMode];
            this.boardArea.className = `game-board-area ${config.containerClass}`;
            if (currentMode === 'quarteto') this.boardArea.classList.add('grid-quarteto'); // Auxiliar layout

            // Criar Boards
            for (let i = 0; i < config.grids; i++) {
                const secretWord = this.getRandomWord();
                const board = new TermoBoard(i, secretWord, config.attempts, this);
                this.activeBoards.push(board);
                this.boardArea.appendChild(board.element);
                console.log(`Board ${i} Target: ${secretWord}`); // Debug
            }

            this.renderKeyboard();
        }

        reset() {
            this.activeBoards = [];
            this.currentRow = 0;
            this.currentGuess = new Array(5).fill("");
            this.cursorCol = 0;
            this.isGameOver = false;
            this.boardArea.innerHTML = '';
            this.messageArea.textContent = "";
            this.attemptsHistory = new Set();
            this.closeStats();
        }

        getRandomWord() {
            return globalWords[Math.floor(Math.random() * globalWords.length)];
        }

        handleInput(key) {
            if (this.isGameOver) return;

            if (key === 'ENTER') {
                this.submitRow();
                return;
            }

            if (key === 'BACKSPACE') {
                if (this.currentGuess[this.cursorCol]) {
                    this.currentGuess[this.cursorCol] = "";
                } else if (this.cursorCol > 0) {
                    this.cursorCol--;
                    this.currentGuess[this.cursorCol] = "";
                }
                this.updateAllBoardsActiveRow();
                return;
            }

            if (key === 'ARROWLEFT') {
                if (this.cursorCol > 0) {
                    this.cursorCol--;
                    this.updateAllBoardsActiveRow();
                }
                return;
            }

            if (key === 'ARROWRIGHT') {
                if (this.cursorCol < 4) {
                    this.cursorCol++;
                    this.updateAllBoardsActiveRow();
                }
                return;
            }

            if (/^[A-Z]$/.test(key)) {
                this.currentGuess[this.cursorCol] = key;
                if (this.cursorCol < 4) {
                    this.cursorCol++;
                }
                this.updateAllBoardsActiveRow();
            }
        }

        updateAllBoardsActiveRow() {
            this.activeBoards.forEach(board => {
                if (!board.isSolved) {
                    board.updateActiveRow(this.currentGuess);
                }
            });
        }

        submitRow() {
            // Converte array para string para validação
            const guessStr = this.currentGuess.join("");

            if (guessStr.length !== 5 || this.currentGuess.includes("")) {
                this.showMessage("DIGITE 5 LETRAS");
                return;
            }

            // Normalização para aceitar palavras sem acento
            const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const normalizedGuess = normalize(guessStr);

            // Tenta encontrar a palavra na lista original (com ou sem acento)
            // A busca compara a versão normalizada da lista com a entrada normalizada
            const targetWord = globalWords.find(w => normalize(w) === normalizedGuess);

            if (!targetWord) {
                this.showMessage("PALAVRA INEXISTENTE");
                return;
            }

            // Se encontrou, atualiza o palpite atual com a palavra correta (acentuada)
            // Isso garante que os acentos apareçam no tabuleiro
            if (targetWord !== guessStr) {
                this.currentGuess = targetWord.split("");
                this.updateAllBoardsActiveRow(); // Atualiza visualmente imediatamente
            }

            // Usa a palavra alvo correta para a lógica de jogo
            const finalGuessStr = targetWord;

            if (this.attemptsHistory.has(finalGuessStr)) {
                this.showMessage("PALAVRA JÁ UTILIZADA");
                return;
            }
            this.attemptsHistory.add(finalGuessStr);

            // Coletar resultados de todos os boards ativos
            const turnResults = [];
            let allSolved = true;

            this.activeBoards.forEach(board => {
                if (!board.isSolved) {
                    const result = board.submitGuess(finalGuessStr);
                    if (result) {
                        turnResults.push(...result); // Coleta status de cada letra
                    }
                    if (!board.isSolved) allSolved = false;
                }
            });

            // Atualizar Teclado (Melhor status entre todos os boards ativos)
            // Espera animação (500ms)
            setTimeout(() => {
                this.updateKeyboard(turnResults);
            }, 500);

            // Checar Fim de Jogo
            if (allSolved) {
                this.isGameOver = true;
                setTimeout(() => {
                    this.showMessage("VITÓRIA! 🏆", true);
                    this.updateStats(true);
                    this.showStats();
                }, 600);
                return;
            }

            const maxAttempts = MODES[currentMode].attempts;
            this.currentRow++;

            if (this.currentRow >= maxAttempts) {
                this.isGameOver = true;
                setTimeout(() => {
                    // Revelar palavras não resolvidas
                    const failedWords = this.activeBoards
                        .filter(b => !b.isSolved)
                        .map(b => b.secretWord)
                        .join(", ");
                    this.showMessage(`FIM DE JOGO: ${failedWords}`, false);
                    this.updateStats(false);
                    this.showStats();
                }, 600);
            } else {
                this.currentGuess = new Array(5).fill("");
                this.cursorCol = 0;
                // Foca na próxima linha (se o board não estiver resolvido, updateActiveRow lidará com isso)
            }
        }

        // --- Teclado ---

        renderKeyboard() {
            this.keyboardDiv.innerHTML = '';
            const keysLayout = ["QWERTYUIOP", "ASDFGHJKLÇ", "ZXCVBNM"];

            keysLayout.forEach((rowStr, idx) => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'kb-row';

                if (idx === 2) {
                    rowDiv.appendChild(this.createKey("ENTER", true));
                }

                for (const char of rowStr) {
                    const key = this.createKey(char, false);
                    key.classList.add('key-neon');
                    rowDiv.appendChild(key);
                }

                if (idx === 2) {
                    const backKey = this.createKey("⌫", true);
                    backKey.dataset.key = "BACKSPACE";
                    rowDiv.appendChild(backKey);
                }
                this.keyboardDiv.appendChild(rowDiv);
            });
        }

        createKey(label, isBig) {
            const key = document.createElement('div');
            key.textContent = label;
            key.className = isBig ? 'key big' : 'key';
            key.dataset.key = label;

            key.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleInput(key.dataset.key);
            });
            return key;
        }

        updateKeyboard(results) {
            const priority = { 'correct': 3, 'present': 2, 'absent': 1, 'neutral': 0 };

            // Agrupar melhor status por letra
            const bestStatus = {};
            results.forEach(({ char, status }) => {
                const current = bestStatus[char] || 'neutral';
                if (priority[status] > priority[current]) {
                    bestStatus[char] = status;
                }
            });

            // Aplicar no DOM
            for (const [char, status] of Object.entries(bestStatus)) {
                const keyEl = document.querySelector(`.key[data-key="${char}"]`);
                if (!keyEl) continue;

                // Não rebaixa status (mesmo entre turnos, se já foi verde, fica verde)
                const currentClass = keyEl.classList.contains('used-correct') ? 'correct' :
                    keyEl.classList.contains('used-present') ? 'present' :
                        keyEl.classList.contains('used-absent') ? 'absent' : 'neutral';

                if (priority[status] > priority[currentClass]) {
                    keyEl.className = `key ${keyEl.classList.contains('big') ? 'big' : ''}`; // Reset classes
                    if (status === 'correct') keyEl.classList.add('used-correct');
                    else if (status === 'present') keyEl.classList.add('used-present');
                    else if (status === 'absent') keyEl.classList.add('used-absent');
                    else keyEl.classList.add('key-neon');
                }
            }
        }

        // --- Stats ---

        getStats() {
            const saved = localStorage.getItem('termostats');
            return saved ? JSON.parse(saved) : {
                termo: { played: 0, wins: 0, streak: 0, maxStreak: 0 },
                duetto: { played: 0, wins: 0, streak: 0, maxStreak: 0 },
                quarteto: { played: 0, wins: 0, streak: 0, maxStreak: 0 }
            };
        }

        updateStats(isWin) {
            const stats = this.getStats();
            const modeStats = stats[currentMode];

            modeStats.played++;
            if (isWin) {
                modeStats.wins++;
                modeStats.streak++;
                if (modeStats.streak > modeStats.maxStreak) modeStats.maxStreak = modeStats.streak;
            } else {
                modeStats.streak = 0;
            }

            localStorage.setItem('termostats', JSON.stringify(stats));
        }

        showStats() {
            const stats = this.getStats();
            const s = stats[currentMode];
            const winPct = s.played === 0 ? 0 : Math.round((s.wins / s.played) * 100);

            this.statsContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-value">${s.played}</span>
                    <span class="stat-label">JOGOS</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${winPct}%</span>
                    <span class="stat-label">% VITÓRIAS</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${s.streak}</span>
                    <span class="stat-label">SEQUÊNCIA</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${s.maxStreak}</span>
                    <span class="stat-label">MELHOR SEQ.</span>
                </div>
            `;
            this.statsModal.classList.remove('hidden');
        }

        closeStats() {
            this.statsModal.classList.add('hidden');
        }

        // --- Helpers ---

        showMessage(msg, success) {
            this.messageArea.textContent = msg;
            this.messageArea.style.color = success ? "var(--color-neon-green)" : "var(--color-neon-purple)";
            if (!this.isGameOver) setTimeout(() => this.messageArea.textContent = "", 2500);
        }

        setupModeSelector() {
            const buttons = document.querySelectorAll('.mode-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const mode = btn.id.replace('mode-', '');
                    if (mode === currentMode) return;

                    currentMode = mode;
                    // Update active styles
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Restart
                    this.start();
                });
            });
        }

        bindEvents() {
            document.addEventListener('keydown', (e) => {
                const key = e.key.toUpperCase();
                // Fecha modais com ESC
                if (e.key === 'Escape') {
                    this.closeStats();
                    this.closeHelp();
                    return;
                }

                if (this.isModalOpen()) return; // Bloqueia input se modal aberto

                if (key === 'ARROWLEFT' || key === 'ARROWRIGHT') {
                    this.handleInput(key);
                } else if (key.length === 1 && key >= 'A' && key <= 'Z') this.handleInput(key);
                else if (key === 'BACKSPACE' || key === 'ENTER') this.handleInput(key);
            });

            this.newWordBtn.addEventListener('click', () => {
                this.start();
                this.newWordBtn.blur();
            });

            // Modais e Botões Header
            const helpBtn = document.getElementById('help-btn');
            const statsBtn = document.getElementById('stats-btn');
            const closeHelpBtn = document.getElementById('close-help');
            const closeStatsBtn = document.getElementById('close-stats');
            const helpModal = document.getElementById('help-modal');

            helpBtn.addEventListener('click', () => {
                helpModal.classList.remove('hidden');
                helpBtn.blur();
            });

            closeHelpBtn.addEventListener('click', () => {
                this.closeHelp();
            });

            statsBtn.addEventListener('click', () => {
                this.showStats();
                statsBtn.blur();
            });

            closeStatsBtn.addEventListener('click', () => this.closeStats());

            // Fechar ao clicar fora
            window.addEventListener('click', (e) => {
                if (e.target === this.statsModal) this.closeStats();
                if (e.target === helpModal) this.closeHelp();
            });

            // Tema Switcher
            const themeToggleBtn = document.getElementById('theme-toggle');
            if (themeToggleBtn) {
                themeToggleBtn.addEventListener('click', () => {
                    this.toggleTheme();
                    themeToggleBtn.blur();
                });
            }

            // Carregar tema salvo
            const savedTheme = localStorage.getItem('termotheme');
            if (savedTheme) {
                document.body.className = savedTheme;
            }
        }

        toggleTheme() {
            const themes = ['', 'theme-nature', 'theme-retro'];
            const currentTheme = document.body.className || '';
            let nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;

            const nextTheme = themes[nextIndex];
            document.body.className = nextTheme;
            localStorage.setItem('termotheme', nextTheme);
        }

        closeHelp() {
            document.getElementById('help-modal').classList.add('hidden');
        }

        isModalOpen() {
            return !document.getElementById('stats-modal').classList.contains('hidden') ||
                !document.getElementById('help-modal').classList.contains('hidden');
        }
    }

    // --- Boot ---
    const game = new GameController();

    // Carregar palavras e iniciar
    if (typeof wordsList !== 'undefined') {
        globalWords = wordsList;
        game.start();
    } else {
        console.error("words.js não carregado.");
    }
});
