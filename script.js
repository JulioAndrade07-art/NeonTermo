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

                    // Click para focar
                    const colIndex = c;
                    cell.addEventListener('click', (e) => {
                        e.stopPropagation(); // Evita bolha indesejada
                        this.controller.setCursor(colIndex);
                    });

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
            this.currentGuess = new Array(5).fill("");
            this.cursorCol = 0;
            this.isGameOver = false;

            // Elementos DOM
            this.boardArea = document.getElementById('game-board-area');
            this.keyboardDiv = document.getElementById('keyboard');
            this.messageArea = document.getElementById('message-area');
            this.newWordBtn = document.getElementById('new-word-btn');
            this.hiddenInput = document.getElementById('hidden-input'); // Novo input

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
            if (currentMode === 'quarteto') this.boardArea.classList.add('grid-quarteto');

            // Criar Boards
            for (let i = 0; i < config.grids; i++) {
                const secretWord = this.getRandomWord();
                const board = new TermoBoard(i, secretWord, config.attempts, this);
                this.activeBoards.push(board);
                this.boardArea.appendChild(board.element);
                console.log(`Board ${i} Target: ${secretWord}`);
            }

            this.renderKeyboard();
            this.focusInput();
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
            if (this.hiddenInput) {
                this.hiddenInput.value = "";
                this.hiddenInput.blur();
            }
        }

        getRandomWord() {
            return globalWords[Math.floor(Math.random() * globalWords.length)];
        }

        // Foca no input oculto para abrir teclado mobile
        focusInput() {
            if (this.hiddenInput && !this.isModalOpen() && !this.isGameOver) {
                this.hiddenInput.focus({ preventScroll: true });
            }
        }

        // Define a coluna ativa baseado no clique
        setCursor(colIndex) {
            if (this.isGameOver) return;

            // Permite navegar para qualquer coluna
            if (colIndex >= 0 && colIndex < 5) {
                this.cursorCol = colIndex;
                this.updateAllBoardsActiveRow();
                this.focusInput();
            }
        }

        handleInput(key) {
            if (this.isGameOver) return;
            key = key.toUpperCase();

            if (key === 'ENTER') {
                this.submitRow();
                return;
            }

            if (key === 'BACKSPACE') {
                if (this.currentGuess[this.cursorCol]) {
                    // Se tem letra, apaga
                    this.currentGuess[this.cursorCol] = "";
                } else if (this.cursorCol > 0) {
                    // Se vazio e não é a primeira, volta e apaga
                    this.cursorCol--;
                    this.currentGuess[this.cursorCol] = "";
                }
                this.updateAllBoardsActiveRow();
                return;
            }

            if (key === 'ARROWLEFT') {
                if (this.cursorCol > 0) this.setCursor(this.cursorCol - 1);
                return;
            }

            if (key === 'ARROWRIGHT') {
                if (this.cursorCol < 4) this.setCursor(this.cursorCol + 1);
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
            const guessStr = this.currentGuess.join("");

            if (guessStr.length !== 5 || this.currentGuess.includes("")) {
                this.showMessage("DIGITE 5 LETRAS");
                this.focusInput(); // Mantém foco
                return;
            }

            const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const normalizedGuess = normalize(guessStr);
            const targetWord = globalWords.find(w => normalize(w) === normalizedGuess);

            if (!targetWord) {
                this.showMessage("PALAVRA INEXISTENTE");
                this.focusInput();
                return;
            }

            if (targetWord !== guessStr) {
                this.currentGuess = targetWord.split("");
                this.updateAllBoardsActiveRow();
            }

            const finalGuessStr = targetWord;

            if (this.attemptsHistory.has(finalGuessStr)) {
                this.showMessage("PALAVRA JÁ UTILIZADA");
                this.focusInput();
                return;
            }
            this.attemptsHistory.add(finalGuessStr);

            const turnResults = [];
            let allSolved = true;

            this.activeBoards.forEach(board => {
                if (!board.isSolved) {
                    const result = board.submitGuess(finalGuessStr);
                    if (result) {
                        turnResults.push(...result);
                    }
                    if (!board.isSolved) allSolved = false;
                }
            });

            setTimeout(() => {
                this.updateKeyboard(turnResults);
            }, 500);

            if (allSolved) {
                this.isGameOver = true;
                if (this.hiddenInput) this.hiddenInput.blur(); // Fecha teclado
                setTimeout(() => {
                    this.showMessage("VITÓRIA! 🏆", true);
                    this.updateStats(true, this.currentRow + 1); // Passa tentativas usadas
                    this.showStats();
                }, 600);
                return;
            }

            const maxAttempts = MODES[currentMode].attempts;
            this.currentRow++;

            if (this.currentRow >= maxAttempts) {
                this.isGameOver = true;
                if (this.hiddenInput) this.hiddenInput.blur();
                setTimeout(() => {
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
                this.updateAllBoardsActiveRow(); // Limpa visual da nova linha
                this.focusInput(); // Mantém teclado
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
            const saved = localStorage.getItem('termostats_v2'); // Mudando chave para evitar conflito com formato antigo
            return saved ? JSON.parse(saved) : {
                termo: { played: 0, wins: 0, streak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0], failures: 0 },
                duetto: { played: 0, wins: 0, streak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0, 0], failures: 0 }, // Duetto tem 7 chances
                quarteto: { played: 0, wins: 0, streak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0, 0, 0, 0], failures: 0 } // Quarteto tem 9
            };
        }

        updateStats(isWin, attemptsUsed) {
            const stats = this.getStats();
            const modeStats = stats[currentMode];

            // Garantir que distribution existe (para migração)
            if (!modeStats.distribution) {
                const attemptCount = MODES[currentMode].attempts;
                modeStats.distribution = new Array(attemptCount).fill(0);
            }

            modeStats.played++;
            if (isWin) {
                modeStats.wins++;
                modeStats.streak++;
                if (modeStats.streak > modeStats.maxStreak) modeStats.maxStreak = modeStats.streak;

                // Distribuição (attemptsUsed é 1-indexed)
                if (attemptsUsed > 0 && attemptsUsed <= modeStats.distribution.length) {
                    modeStats.distribution[attemptsUsed - 1]++;
                }
            } else {
                modeStats.streak = 0;
                modeStats.failures++;
            }

            localStorage.setItem('termostats_v2', JSON.stringify(stats));
        }

        showStats() {
            const stats = this.getStats();
            const s = stats[currentMode];

            // Safety check para renderização
            if (!s.distribution) {
                const attemptCount = MODES[currentMode].attempts;
                s.distribution = new Array(attemptCount).fill(0);
            }

            const winPct = s.played === 0 ? 0 : Math.round((s.wins / s.played) * 100);

            // Calcular max para barras
            const maxVal = Math.max(...s.distribution, s.failures, 1); // evita div por 0

            // Gerar HTML de resumo
            let html = `
                <h2>Estatísticas</h2>
                <div class="stats-group">
                    <div class="stat-box">
                        <span class="stat-number">${s.played}</span>
                        <span class="stat-label">jogos</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-number">${winPct}%</span>
                        <span class="stat-label">de vitórias</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-number">${s.streak}</span>
                        <span class="stat-label">sequência atual</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-number">${s.maxStreak}</span>
                        <span class="stat-label">melhor sequência</span>
                    </div>
                </div>
                
                <h3 class="distribution-title">Distribuição de Vitórias</h3>
                <div class="distribution-chart">
            `;

            // Gerar Barras (1 até MaxTentativas)
            s.distribution.forEach((count, idx) => {
                const width = Math.max(8, (count / maxVal) * 100);
                const bgClass = count > 0 ? "filled" : "";
                html += `
                    <div class="chart-row">
                        <span class="chart-label">${idx + 1}</span>
                        <div class="chart-bar-container">
                            <div class="chart-bar ${bgClass}" style="width: ${width}%">${count}</div>
                        </div>
                    </div>
                `;
            });

            // Barra de Falhas (Caveira)
            if (s.failures > 0) {
                const width = Math.max(8, (s.failures / maxVal) * 100);
                html += `
                    <div class="chart-row">
                         <span class="chart-label skull-icon">💀</span>
                         <div class="chart-bar-container">
                             <div class="chart-bar filled" style="width: ${width}%; background-color: #ff3333;">${s.failures}</div>
                         </div>
                    </div>
                 `;
            }

            html += `</div>`; // Fechar chart-container

            this.statsContainer.innerHTML = html;
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

                if (this.isModalOpen()) return;

                // Atalhos de teclado físico
                if (key === 'ARROWLEFT' || key === 'ARROWRIGHT') {
                    this.handleInput(key);
                } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
                    // SE o input oculto estiver focado, deixa o evento 'input' lidar com isso
                    // para evitar duplicidade. Se NÃO estiver focado, trata aqui.
                    if (document.activeElement !== this.hiddenInput) {
                        this.handleInput(key);
                        this.focusInput();
                    }
                }
                else if (key === 'BACKSPACE' || key === 'ENTER') {
                    if (document.activeElement !== this.hiddenInput) {
                        this.handleInput(key);
                        this.focusInput();
                    }
                }
            });

            // Input Oculto (Mobile)
            if (this.hiddenInput) {
                this.hiddenInput.addEventListener('input', (e) => {
                    e.preventDefault();
                    if (this.isModalOpen() || this.isGameOver) {
                        this.hiddenInput.value = "";
                        return;
                    }

                    const val = (e.data || this.hiddenInput.value).toUpperCase();
                    // Processa último char digitado
                    if (val && val.length > 0) {
                        const char = val.slice(-1); // Pega último
                        if (/[A-Z]/.test(char)) {
                            this.handleInput(char);
                        }
                    }

                    // Limpa buffer
                    setTimeout(() => {
                        this.hiddenInput.value = "";
                    }, 0);
                });

                // Captura Backspace no Android (em alguns teclados o input event não vem bem)
                this.hiddenInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace') {
                        e.stopPropagation(); // Impede que suba para o document
                        // Se o input estiver vazio, manda backspace manual
                        if (this.hiddenInput.value.length === 0) {
                            this.handleInput('BACKSPACE');
                        }
                    }
                    if (e.key === 'Enter') {
                        e.stopPropagation();
                        this.handleInput('ENTER');
                    }
                });
            }

            this.newWordBtn.addEventListener('click', () => {
                this.start();
                this.newWordBtn.blur();
                this.focusInput();
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
