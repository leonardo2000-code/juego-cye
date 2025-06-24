window.onload = function() {
    // --- Configuración del Canvas y Contexto ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // --- Pantallas y Botones ---
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');

    // --- Recursos del Juego ---
    const playerImg = new Image();
    playerImg.src = 'https://i.imgur.com/xWPFPgQ.png';

    const lifeImg = new Image();
    lifeImg.src = 'https://i.imgur.com/CtzB2Q1.jpeg';

    const goodObjectSources = [
        'https://i.imgur.com/vOlwUmD.jpeg',
        'https://i.imgur.com/UMAE5Fc.jpeg',
        'https://i.imgur.com/yxbuGP0.mp4https://i.imgur.com/nr8SdGN.jpeg'
    ];
    const badObjectSources = [
        'https://i.imgur.com/9k10jKE.jpeg',
        'https://i.imgur.com/pgfoOyX.jpeg'
    ];

    let goodObjectImgs = goodObjectSources.map(src => {
        const img = new Image();
        img.src = src;
        return img;
    });
    let badObjectImgs = badObjectSources.map(src => {
        const img = new Image();
        img.src = src;
        return img;
    });

    // --- Variables del Juego ---
    let score;
    let lives;
    let missedGoodObjects;
    let gameOver;
    let gameTime; // Track game time for speed increase
    
    // --- Configuración del Jugador ---
    const player = {
        width: 70,
        height: 100,
        x: canvas.width / 2 - 35,
        y: canvas.height - 110,
        speed: 8,
        dx: 0
    };

    // --- Configuración de Objetos ---
    let fallingObjects;
    let objectSpawnTimer;
    let spawnInterval;
    let lastGoodObjectCount; // Track recent good objects

    // --- Controles ---
    const keys = {
        ArrowRight: false,
        ArrowLeft: false,
        d: false,
        a: false
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.ArrowRight = true;
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.ArrowLeft = true;
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.ArrowRight = false;
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.ArrowLeft = false;
    });

    function movePlayer() {
        player.x += player.dx;
        if (keys.ArrowRight) player.dx = player.speed;
        else if (keys.ArrowLeft) player.dx = -player.speed;
        else player.dx = 0;

        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    }

    // --- Lógica de Objetos ---
    function spawnObject() {
        objectSpawnTimer++;
        if (objectSpawnTimer >= spawnInterval) {
            objectSpawnTimer = 0;
            if (spawnInterval > 40) spawnInterval -= 0.5;

            // Count current good objects
            const currentGoodObjects = fallingObjects.filter(obj => obj.type === 'good').length;

            // Prevent spawning more than 2 good objects at a time
            let type, img, width, height;
            const x = Math.random() * (canvas.width - 50);
            let speed = 2 + Math.random() * 3 + (gameTime / 10000); // Increase speed over time

            if (currentGoodObjects < 2 && Math.random() > 0.35) {
                type = 'good';
                img = goodObjectImgs[Math.floor(Math.random() * goodObjectImgs.length)];
                width = 50; height = 50;
            } else {
                type = 'bad';
                img = badObjectImgs[Math.floor(Math.random() * badObjectImgs.length)];
                width = 50; height = 50;
            }
            fallingObjects.push({ x, y: -50, width, height, speed, type, img });
        }
    }

    function updateObjects() {
        for (let i = fallingObjects.length - 1; i >= 0; i--) {
            const obj = fallingObjects[i];
            obj.y += obj.speed;
            // Gradually increase speed of existing objects
            obj.speed += 0.0001 * (gameTime / 10000);

            if (
                obj.x < player.x + player.width &&
                obj.x + obj.width > player.x &&
                obj.y < player.y + player.height &&
                obj.y + obj.height > player.y
            ) {
                if (obj.type === 'good') {
                    score += 10;
                } else {
                    score = Math.max(0, score - 5); // Evita puntajes negativos
                    lives--;
                }
                fallingObjects.splice(i, 1);
                continue;
            }

            if (obj.y + obj.height > canvas.height) {
                if (obj.type === 'good') {
                    missedGoodObjects++;
                    if (missedGoodObjects >= 3) {
                        lives--;
                        missedGoodObjects = 0;
                    }
                }
                fallingObjects.splice(i, 1);
            }
        }
    }

    // --- Funciones de Dibujo ---
    function drawPlayer() {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    }
    
    function drawObjects() {
        fallingObjects.forEach(obj => {
            ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
        });
    }

    function drawUI() {
        ctx.font = "30px 'Cinzel', serif";
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Puntuación: ${score}`, 20, 40);
        ctx.textAlign = 'right';
        ctx.fillText(`Vidas: `, canvas.width - 130, 40);
        for (let i = 0; i < lives; i++) {
             ctx.drawImage(lifeImg, canvas.width - 100 + (i * 35), 15, 30, 30);
        }
        ctx.textAlign = 'left';
        
        if(missedGoodObjects > 0) {
            ctx.fillStyle = 'rgba(236, 240, 241, 0.7)';
            ctx.fillText(`Ofrendas falladas: ${missedGoodObjects}/3`, 20, 80);
        }
    }

    // --- Bucle Principal del Juego ---
    function gameLoop() {
        if (gameOver) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        movePlayer();
        drawPlayer();
        
        spawnObject();
        updateObjects();
        drawObjects();

        drawUI();

        gameTime += 16; // Approximate ms per frame

        if (lives <= 0) {
            endGame();
        }

        requestAnimationFrame(gameLoop);
    }
    
    // --- Función para resetear el estado del juego ---
    function resetGame() {
        score = 0;
        lives = 3;
        missedGoodObjects = 0;
        gameOver = false;
        player.x = canvas.width / 2 - player.width / 2;
        fallingObjects = [];
        objectSpawnTimer = 0;
        spawnInterval = 100;
        gameTime = 0; // Reset game time
    }

    // --- Funciones de Estado del Juego ---
    function startGame() {
        startScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
        resetGame(); // Resetea todo al empezar
        requestAnimationFrame(gameLoop);
    }

    function endGame() {
        gameOver = true;
        document.getElementById('final-score').textContent = score;
        gameOverScreen.style.display = 'flex';
    }

    // --- Iniciar el Juego ---
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame); // El botón de reinicio también llama a startGame
};