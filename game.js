class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.level = 1;
        this.speed = 150;
        
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.nextDx = 0;
        this.nextDy = 0;
        
        this.food = this.generateFood();
        
        // 初始化音频上下文
        this.initAudio();
        
        this.bindEvents();
        this.updateDisplay();
        this.draw();
    }
    
    initAudio() {
        // 创建音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 音效设置
        this.soundEnabled = true;
        this.lastMoveTime = 0;
        this.moveSoundCooldown = 50; // 移动音效冷却时间（毫秒）
    }
    
    // 生成移动音效
    playMoveSound() {
        if (!this.soundEnabled || Date.now() - this.lastMoveTime < this.moveSoundCooldown) return;
        
        this.lastMoveTime = Date.now();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    // 生成得分音效
    playScoreSound() {
        if (!this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 上升的音调
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    // 生成失败音效
    playGameOverSound() {
        if (!this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 下降的音调
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    // 生成开始游戏音效
    playStartSound() {
        if (!this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 欢快的音调
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.2);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    // 切换音效开关
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('soundBtn');
        
        if (this.soundEnabled) {
            soundBtn.textContent = '🔊 音效开启';
            soundBtn.className = 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200';
        } else {
            soundBtn.textContent = '🔇 音效关闭';
            soundBtn.className = 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200';
        }
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.hideGameOverModal();
            this.restartGame();
        });
        
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.hideGameOverModal();
        });
        
        // 音效开关按钮
        document.getElementById('soundBtn').addEventListener('click', () => {
            this.toggleSound();
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning) return;
        
        switch(e.key) {
            case 'ArrowUp':
                if (this.dy !== 1) {
                    this.nextDx = 0;
                    this.nextDy = -1;
                }
                break;
            case 'ArrowDown':
                if (this.dy !== -1) {
                    this.nextDx = 0;
                    this.nextDy = 1;
                }
                break;
            case 'ArrowLeft':
                if (this.dx !== 1) {
                    this.nextDx = -1;
                    this.nextDy = 0;
                }
                break;
            case 'ArrowRight':
                if (this.dx !== -1) {
                    this.nextDx = 1;
                    this.nextDy = 0;
                }
                break;
        }
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.gameOver = false;
        this.dx = 1;
        this.dy = 0;
        this.nextDx = 1;
        this.nextDy = 0;
        
        // 播放开始游戏音效
        this.playStartSound();
        
        document.getElementById('startBtn').textContent = '⏸️ 暂停游戏';
        this.gameLoop();
    }
    
    restartGame() {
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        this.speed = 150;
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.nextDx = 0;
        this.nextDy = 0;
        this.food = this.generateFood();
        
        document.getElementById('startBtn').textContent = '🎮 开始游戏';
        this.updateDisplay();
        this.draw();
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gameOver) return;
        
        this.update();
        this.draw();
        
        setTimeout(() => {
            this.gameLoop();
        }, this.speed);
    }
    
    update() {
        this.dx = this.nextDx;
        this.dy = this.nextDy;
        
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        if (this.checkCollision(head)) {
            this.endGame();
            return;
        }
        
        this.snake.unshift(head);
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            this.snake.pop();
            // 播放移动音效
            this.playMoveSound();
        }
    }
    
    checkCollision(head) {
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    eatFood() {
        this.score += 10;
        this.food = this.generateFood();
        
        // 播放得分音效
        this.playScoreSound();
        
        const newLevel = Math.floor(this.score / 100) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.speed = Math.max(50, 150 - (this.level - 1) * 10);
        }
        
        this.updateDisplay();
    }
    
    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        
        return food;
    }
    
    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        
        // 播放游戏结束音效
        this.playGameOverSound();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        
        document.getElementById('startBtn').textContent = '🎮 开始游戏';
        this.showGameOverModal();
    }
    
    showGameOverModal() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverModal').classList.remove('hidden');
        document.getElementById('gameOverModal').classList.add('flex');
    }
    
    hideGameOverModal() {
        document.getElementById('gameOverModal').classList.add('hidden');
        document.getElementById('gameOverModal').classList.remove('flex');
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        this.drawSnake();
        this.drawFood();
        
        if (!this.gameRunning && !this.gameOver) {
            this.drawStartMessage();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.fillStyle = '#059669';
                this.ctx.fillRect(segment.x * this.gridSize + 1, segment.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(segment.x * this.gridSize + 4, segment.y * this.gridSize + 4, 3, 3);
                this.ctx.fillRect(segment.x * this.gridSize + 13, segment.y * this.gridSize + 4, 3, 3);
            } else {
                const alpha = 1 - (index * 0.1);
                this.ctx.fillStyle = `rgba(5, 150, 105, ${Math.max(0.3, alpha)})`;
                this.ctx.fillRect(segment.x * this.gridSize + 1, segment.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
            }
        });
    }
    
    drawFood() {
        const time = Date.now() * 0.005;
        const scale = 0.8 + Math.sin(time) * 0.2;
        
        this.ctx.save();
        this.ctx.translate(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2
        );
        this.ctx.scale(scale, scale);
        
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.gridSize / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(-3, -3, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawStartMessage() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('点击开始游戏', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('使用方向键控制', this.canvas.width / 2, this.canvas.height / 2 + 10);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
}); 