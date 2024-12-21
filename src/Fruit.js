import { FRUIT_SIZE, PARTICLE_COUNT } from './constants.js';
import { Particle } from './Particle.js';

export class Fruit {
    constructor(option, index, emoji, totalFruits) {
        // Calculate positions in a horizontal line
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const spacing = FRUIT_SIZE * 3; // Increased spacing between fruits
        const totalWidth = (totalFruits - 1) * spacing;
        
        // Position fruits horizontally with equal spacing
        this.x = centerX - (totalWidth / 2) + (index * spacing);
        this.y = centerY - FRUIT_SIZE;
        
        this.option = option;
        this.emoji = emoji;
        this.size = FRUIT_SIZE;
        this.isSliced = false;
        this.particles = [];
        this.isStable = true;
        this.fruitColors = ['#ff6b6b', '#51cf66', '#ffd43b', '#ff922b'];
        this.color = this.fruitColors[index % this.fruitColors.length];
    }

    update() {
        if (this.isSliced) {
            this.particles = this.particles.filter(particle => particle.life > 0);
            this.particles.forEach(particle => particle.update());
        }
    }

    draw(ctx) {
        // Draw fruit emoji
        ctx.save();
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x + this.size/2, this.y + this.size/2);
        
        // Draw option text below fruit with background for better visibility
        ctx.font = '20px Arial';
        const textY = this.y + this.size + 30;
        const padding = 10;
        const textWidth = ctx.measureText(this.option).width;
        
        // Draw text background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(
            this.x + this.size/2 - textWidth/2 - padding,
            textY - 15,
            textWidth + padding * 2,
            30
        );
        
        // Draw text
        ctx.fillStyle = 'black';
        ctx.fillText(this.option, this.x + this.size/2, textY);
        
        ctx.restore();
    }

    createParticles() {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            this.particles.push(new Particle(
                this.x + this.size/2,
                this.y + this.size/2,
                this.color
            ));
        }
    }
}