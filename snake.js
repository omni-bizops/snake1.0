class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.startButton = document.getElementById('startButton');
        
        // Game settings
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        this.gameSpeed = 150;
        
        // Game state
        this.gameRunning = false;
        this.waitingForInput = false;
        this.score = 0;
        this.snake = [{x: 10, y: 10}];
        this.food = this.generateFood();
        this.direction = {x: 0, y: 0};
        this.nextDirection = {x: 0, y: 0};
        
        // Colors
        this.colors = {
            snake: '#81b29a',
            snakeHead: '#6a8c7a',
            food: '#f4a261',
            background: '#f8f9fa',
            grid: '#e9ecef'
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.drawGrid();
        this.showStartScreen();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Button click
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0 && this.direction.x === 0) {
                    this.nextDirection = {x: 1, y: 0};
                    if (this.waitingForInput) {
                        this.waitingForInput = false;
                        this.gameLoop();
                    }
                } else if (deltaX < 0 && this.direction.x === 0) {
                    this.nextDirection = {x: -1, y: 0};
                    if (this.waitingForInput) {
                        this.waitingForInput = false;
                        this.gameLoop();
                    }
                }
            } else {
                // Vertical swipe
                if (deltaY > 0 && this.direction.y === 0) {
                    this.nextDirection = {x: 0, y: 1};
                    if (this.waitingForInput) {
                        this.waitingForInput = false;
                        this.gameLoop();
                    }
                } else if (deltaY < 0 && this.direction.y === 0) {
                    this.nextDirection = {x: 0, y: -1};
                    if (this.waitingForInput) {
                        this.waitingForInput = false;
                        this.gameLoop();
                    }
                }
            }
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning && e.code === 'Space') {
            this.startGame();
            return;
        }
        
        if (!this.gameRunning) return;
        
        switch(e.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (this.direction.y === 0) {
                    this.nextDirection = {x: 0, y: -1};
                    if (this.waitingForInput) {
                        this.waitingForInput = false;
                        this.gameLoop();
                    }
                }
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (this.direction.y === 0) {
                    this.nextDirection = {x: 0, y: 1};
                    if (this.waitingForInput) {
                        this.waitingForInput = false;
                        this.gameLoop();
                    }
                }
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (this.direction.x === 0) {
                    this.nextDirection = {x: -1, y: 0};
                    if (this.waitingForInput) {
                        this.waitingForInput = false;
                        this.gameLoop();
                    }
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (this.direction.x === 0) {
                    this.nextDirection = {x: 1, y: 0};
                    if (this.waitingForInput) {
                        this.waitingForInput = false;
                        this.gameLoop();
                    }
                }
                break;
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 0, y: 0};
        this.nextDirection = {x: 0, y: 0};
        this.food = this.generateFood();
        this.updateScore();
        this.hideOverlay();
        // Don't start game loop immediately - wait for first input
        this.waitingForInput = true;
        this.draw();
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.draw();
        
        setTimeout(() => {
            requestAnimationFrame(() => this.gameLoop());
        }, this.gameSpeed);
    }
    
    update() {
        // Update direction
        this.direction = {...this.nextDirection};
        
        // Move snake
        const head = {...this.snake[0]};
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check self collision (skip first segment as it's the old head position)
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver();
                return;
            }
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
            
            // Increase speed slightly
            if (this.gameSpeed > 50) {
                this.gameSpeed -= 2;
            }
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            const color = index === 0 ? this.colors.snakeHead : this.colors.snake;
            this.drawSegment(segment, color);
        });
        
        // Draw food
        this.drawFood();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.tileCount; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSegment(segment, color) {
        const x = segment.x * this.gridSize;
        const y = segment.y * this.gridSize;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
        
        // Add rounded corners effect
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, 4);
        this.ctx.fill();
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        
        // Draw food with gradient effect
        const gradient = this.ctx.createRadialGradient(
            x + this.gridSize/2, y + this.gridSize/2, 0,
            x + this.gridSize/2, y + this.gridSize/2, this.gridSize/2
        );
        gradient.addColorStop(0, this.colors.food);
        gradient.addColorStop(1, '#e76f51');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4, 6);
        this.ctx.fill();
        
        // Add shine effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + this.gridSize/3, y + this.gridSize/3, 2, 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
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
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    gameOver() {
        this.gameRunning = false;
        this.showGameOverScreen();
    }
    
    showStartScreen() {
        this.overlayTitle.textContent = 'Snake';
        this.overlayMessage.textContent = 'Drücke Leertaste zum Starten';
        this.startButton.textContent = 'Spiel starten';
        this.overlay.classList.remove('hidden');
    }
    
    showGameOverScreen() {
        this.overlayTitle.textContent = 'Game Over!';
        this.overlayMessage.textContent = `Dein Score: ${this.score} Punkte`;
        this.startButton.textContent = 'Nochmal spielen';
        this.overlay.classList.remove('hidden');
    }
    
    hideOverlay() {
        this.overlay.classList.add('hidden');
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});

// Add roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
} 