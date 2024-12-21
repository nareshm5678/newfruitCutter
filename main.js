import { Game } from './src/Game.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Set initial canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    // Initialize game
    const game = new Game(canvas, ctx);

    // Handle mouse clicks
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        game.handleSlice(x, y);
    });

    // Start game function
    window.startGame = function() {
        game.start();
    };

    // Start the game
    startGame();
});
