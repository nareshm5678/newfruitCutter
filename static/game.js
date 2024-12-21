document.getElementById('start-btn').addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim();
    const college = document.getElementById('college').value.trim();

    if (!name || !college) {
        alert('Please enter both name and college!');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                name: name, 
                college: college 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        userId = data.userId;
        
        // Animate transition
        gsap.to('#registration-screen', {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                document.getElementById('registration-screen').classList.add('hidden');
                document.getElementById('game-screen').classList.remove('hidden');
                gsap.from('#game-screen', {
                    opacity: 0,
                    y: 50,
                    duration: 0.5
                });
                startGame();
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        alert('Failed to register. Please try again. Error: ' + error.message);
    }
});

async function startGame() {
    try {
        const response = await fetch('/api/questions');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        questions = Array.isArray(data) ? [...data] : [];
        
        if (questions.length === 0) {
            throw new Error('No questions available');
        }
        
        displayNextQuestion();
    } catch (error) {
        console.error('Error fetching questions:', error);
        alert('Failed to load questions. Please refresh the page.');
    }
}

function displayNextQuestion() {
    if (questions.length === 0) {
        endGame();
        return;
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    currentQuestion = questions[randomIndex];
    questions.splice(randomIndex, 1);

    const fruitsContainer = document.getElementById('fruits-container');
    fruitsContainer.innerHTML = '';

    if (!currentQuestion || !currentQuestion.options || !Array.isArray(currentQuestion.options)) {
        endGame();
        return;
    }

    const questionElement = document.getElementById('question');
    questionElement.textContent = currentQuestion.question;

    currentQuestion.options.forEach((option, index) => {
        const fruitElement = document.createElement('div');
        fruitElement.className = 'fruit';
        
        const fruitContent = document.createElement('div');
        fruitContent.className = 'fruit-content';
        
        const fruitImage = document.createElement('img');
        fruitImage.className = 'fruit-image';
        fruitImage.src = fruits[index % fruits.length].image;
        fruitImage.alt = 'Fruit';
        fruitContent.appendChild(fruitImage);
        
        const optionText = document.createElement('div');
        optionText.className = 'fruit-option';
        optionText.textContent = option;
        fruitContent.appendChild(optionText);
        
        fruitElement.appendChild(fruitContent);
        fruitElement.setAttribute('data-option', option);
        fruitElement.addEventListener('click', handleFruitClick);
        fruitsContainer.appendChild(fruitElement);

        gsap.from(fruitElement, {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            delay: index * 0.1,
            ease: "back.out(1.7)"
        });
    });
}

function handleFruitClick(event) {
    const fruitElement = event.target.closest('.fruit');
    if (!fruitElement) return;

    const selectedOption = fruitElement.getAttribute('data-option');
    const rect = fruitElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    if (selectedOption === currentQuestion.correct) {
        currentScore += 10;
        
        gsap.to('#score', {
            textContent: currentScore,
            duration: 0.5,
            snap: { textContent: 1 },
            ease: "power2.out"
        });
        
        const lastMousePositions = mouseTrail.slice(-2);
        if (lastMousePositions.length === 2) {
            const angle = Math.atan2(
                lastMousePositions[1].y - lastMousePositions[0].y,
                lastMousePositions[1].x - lastMousePositions[0].x
            ) * 180 / Math.PI;
            
            const fruitIndex = Array.from(fruitElement.parentNode.children).indexOf(fruitElement);
            createSliceEffect(centerX, centerY, angle, fruits[fruitIndex].shadow);
        }
        
        gsap.to(fruitElement, {
            scale: 0,
            rotation: 360,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                displayNextQuestion();
            }
        });
    } else {
        gsap.to(fruitElement, {
            scale: 0.8,
            opacity: 0.5,
            duration: 0.2,
            yoyo: true,
            repeat: 1
        });
    }
}

async function endGame() {
    try {
        await fetch('/api/score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                score: currentScore
            }),
        });

        gsap.to('#game-screen', {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                document.getElementById('game-screen').classList.add('hidden');
                document.getElementById('leaderboard-screen').classList.remove('hidden');
                gsap.from('#leaderboard-screen', {
                    opacity: 0,
                    y: 50,
                    duration: 0.5
                });
                loadLeaderboard();
            }
        });
    } catch (error) {
        console.error('Error saving score:', error);
        alert('Failed to save score. Please try again.');
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const leaderboard = await response.json();
        
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        
        leaderboard.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span>${index + 1}. ${entry.name} (${entry.college})</span>
                <span>${entry.score} points</span>
            `;
            leaderboardList.appendChild(item);
            
            gsap.from(item, {
                opacity: 0,
                x: -50,
                duration: 0.5,
                delay: index * 0.1
            });
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        alert('Failed to load leaderboard. Please refresh the page.');
    }
}

document.getElementById('play-again-btn').addEventListener('click', () => {
    window.location.reload();
});
