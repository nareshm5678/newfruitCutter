import { questions } from './questions.js';
import { FRUIT_SIZE } from './constants.js';

export class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.score = 0;
        this.currentQuestion = null;
        this.fruitsInGame = [];
        this.isGameOver = false;
        this.fruitImages = [];
        this.loadFruitImages();
        
        // Set canvas size to match container
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    async loadFruitImages() {
        const fruitImageFiles = [
            '/src/images/apple.png',    // First fruit
            '/src/images/orange.png',   // Second fruit
            '/src/images/cherry.png',   // Third fruit
            '/src/images/watermelon.png' // Fourth fruit
        ];
        
        for (const file of fruitImageFiles) {
            const img = new Image();
            img.src = file;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => {
                    console.error('Error loading image:', file);
                    reject(new Error(`Failed to load image: ${file}`));
                };
            });
            this.fruitImages.push(img);
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
    }

    async start() {
        this.score = 0;
        this.isGameOver = false;
        document.getElementById('score').textContent = '0';
        document.getElementById('gameOver').classList.add('hidden');
        
        // Make sure images are loaded before starting
        if (this.fruitImages.length === 0) {
            await this.loadFruitImages();
        }
        
        this.spawnFruits();
        this.animate();
    }

    getRandomQuestion() {
        return questions[Math.floor(Math.random() * questions.length)];
    }

    spawnFruits() {
        this.currentQuestion = this.getRandomQuestion();
        document.getElementById('question').textContent = this.currentQuestion.question;
    
        // Shuffle fruit images to ensure unique images for each option
        const shuffledFruitImages = [...this.fruitImages];
        this.shuffleArray(shuffledFruitImages);
    
        // Randomize the order of options while keeping track of the correct answer
        const shuffledOptions = [...this.currentQuestion.options];
        const correctOption = shuffledOptions[this.currentQuestion.correct];
        this.shuffleArray(shuffledOptions);
    
        // Find the new index of the correct answer
        this.currentQuestion.correct = shuffledOptions.indexOf(correctOption);
    
        // Create fruits with shuffled options, ensuring each fruit image is unique
        this.fruitsInGame = shuffledOptions.map((option, index) => ({
            option,
            index,
            x: 0,
            y: 0,
            isSliced: false,
            image: shuffledFruitImages[index] // Assign unique shuffled image
        }));
    
        // Position fruits with more spacing
        const spacing = FRUIT_SIZE * 4;
        const totalWidth = (this.fruitsInGame.length - 1) * spacing;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
    
        this.fruitsInGame.forEach((fruit, index) => {
            fruit.x = centerX - (totalWidth / 2) + (index * spacing);
            fruit.y = centerY - FRUIT_SIZE;
        });
    }
    

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    checkCollision(x, y, fruit) {
        return x >= fruit.x && 
               x <= fruit.x + FRUIT_SIZE && 
               y >= fruit.y && 
               y <= fruit.y + FRUIT_SIZE;
    }

    async handleSlice(x, y) {
        if (this.isGameOver) return;

        for (let i = 0; i < this.fruitsInGame.length; i++) {
            const fruit = this.fruitsInGame[i];
            if (!fruit.isSliced && this.checkCollision(x, y, fruit)) {
                fruit.isSliced = true;
                
                if (i === this.currentQuestion.correct) {
                    this.score += 10;
                    document.getElementById('score').textContent = this.score;
                    setTimeout(() => {
                        if (!this.isGameOver) {
                            this.spawnFruits();
                        }
                    }, 1000);
                } else {
                    await this.endGame();
                }
                break;
            }
        }
    }

    async endGame() {
        this.isGameOver = true;
        
        // Get user info from localStorage
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        
        try {
            // Save score
            await fetch('/api/score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userInfo.userId,
                    score: this.score
                })
            });

            // Get leaderboard
            const response = await fetch('/api/leaderboard');
            const leaderboard = await response.json();

            // Update game over screen
            const gameOver = document.getElementById('gameOver');
            let leaderboardHTML = '';
            leaderboard.forEach((entry, index) => {
                let rankEmoji = '';
                if (index === 0) rankEmoji = '👑 ';
                else if (index === 1) rankEmoji = '🥈 ';
                else if (index === 2) rankEmoji = '🥉 ';

                leaderboardHTML += `
                    <div class="leaderboard-item">
                        <span>${rankEmoji}${index + 1}. ${entry.studentName}</span>
                        <span>${entry.collegeName}</span>
                        <span>${entry.score}</span>
                    </div>
                `;
            });
            gameOver.innerHTML = `
                <h2>Game Over!</h2>
                <div class="final-score">Your Score: ${this.score}</div>
                <div class="leaderboard">
                    <h3>Top 5 Scores</h3>
                    ${leaderboardHTML}
                </div>
                <button class="play-again" onclick="window.startGame()">Play Again</button>
                <button class="new-player" onclick="window.location.href='/'">New Player</button>
            `;
            gameOver.classList.remove('hidden');
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }

    checkAnswer(selectedOption) {
        const isCorrect = selectedOption === this.currentQuestion.correctAnswer;
        
        // Get the clicked option element
        const options = document.querySelectorAll('.option-text');
        const clickedOption = Array.from(options).find(opt => opt.textContent === selectedOption);
        
        if (clickedOption) {
            // Add slicing effect
            clickedOption.classList.add('sliced');
            
            // Play slicing sound
            const sliceSound = new Audio('/src/sounds/slice.mp3');
            sliceSound.play().catch(() => {}); // Ignore if sound fails
            
            setTimeout(() => {
                clickedOption.classList.remove('sliced');
                
                if (isCorrect) {
                    this.score += 10;
                    document.getElementById('score').textContent = this.score;
                    
                    // Get option position for emoji burst
                    const rect = clickedOption.getBoundingClientRect();
                    const x = rect.left + (rect.width / 2);
                    const y = rect.top;
                    
                    // Trigger emoji burst
                    window.handleCorrectOption(x, y);
                    
                    this.generateQuestion();
                } else {
                    this.endGame();
                }
            }, 600); // Wait for slice animation to complete
        }
    }

    generateQuestion() {
        const fruitImages = [
            '/src/images/apple.png',
            '/src/images/orange.png',
            '/src/images/cherry.png',
            '/src/images/watermelon.png'
        ];

        const optionsContainer = document.querySelector('.options-container');
        optionsContainer.innerHTML = '';

        const options = this.currentQuestion.options;
        
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option-text';
            
            // Use index to assign unique fruit image to each option
            const fruitImage = fruitImages[index];
            
            optionElement.innerHTML = `
                <img src="${fruitImage}" alt="fruit" class="option-image">
                <span>${option}</span>
            `;
            
            optionElement.addEventListener('click', () => {
                this.checkAnswer(option);
            });
            
            optionsContainer.appendChild(optionElement);
        });

        document.getElementById('question').textContent = this.currentQuestion.question;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw fruits and their options
        this.fruitsInGame.forEach(fruit => {
            if (!fruit.isSliced) {
                // Draw fruit image
                this.ctx.drawImage(fruit.image, fruit.x, fruit.y, FRUIT_SIZE, FRUIT_SIZE);
                
                // Draw option text with background
                this.ctx.save();
                this.ctx.font = 'bold 20px Poppins';
                const text = fruit.option;
                const textWidth = this.ctx.measureText(text).width;
                
                // Draw text background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                const padding = 10;
                const textY = fruit.y + FRUIT_SIZE + 25;
                this.ctx.fillRect(
                    fruit.x + FRUIT_SIZE/2 - textWidth/2 - padding,
                    textY - 15,
                    textWidth + padding * 2,
                    30
                );
                
                // Draw text
                this.ctx.fillStyle = 'white';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(text, fruit.x + FRUIT_SIZE/2, textY);
                this.ctx.restore();
            }
        });
    }

    animate() {
        if (!this.isGameOver) {
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    }
}