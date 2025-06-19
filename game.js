
// Helper function to get the level number from the URL
function getLevelFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('level')) || 1;
}

// Helper function to get the difficulty from the URL
function getDifficultyFromURL() {
  const params = new URLSearchParams(window.location.search);
  // Default to 'easy' if not set
  return params.get('difficulty') || 'easy';
}

// Game state variables
let score = 0; // Player's score
let level = getLevelFromURL(); // Current level
let targetScore = 10 + (level - 1) * 5; // Score needed to win (10 for level 1)
let itemFallSpeed = 2; // How fast items fall

// Set garbageChance to a fixed value (e.g., 0.7 means 70% chance)
// This value will NOT change based on difficulty
let garbageChance = 0.7; // Fixed garbage chance for all difficulties

let gameActive = false; // Is the game currently running?

// Get the selected difficulty
let difficulty = getDifficultyFromURL();

// Get references to important HTML elements
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const river = document.getElementById('river');
const scoreDisplay = document.getElementById('score');
const endMessage = document.getElementById('end-message');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const sparkle = document.getElementById('sparkle');
const happySound = document.getElementById('happy-sound');
const failSound = document.getElementById('fail-sound');
const pauseBtn = document.getElementById('pause-btn');
const pauseBtnImg = document.getElementById('pause-btn-img');
const pauseOverlay = document.getElementById('pause-overlay');
const pauseMenuBtn = document.getElementById('pause-menu-btn');
let paused = false;

// Save the current level to localStorage so progress is remembered
localStorage.setItem('riverRescueLevel', level);

// When the restart button is clicked, restart the game
restartBtn.onclick = () => {
  startGame();
};

// When the next level button is clicked, go to the next level and restart the game
nextBtn.onclick = () => {
  level++;
  localStorage.setItem('riverRescueLevel', level);
  startGame();
};

// When the menu button is clicked, go back to the main menu
menuBtn.onclick = () => {
  window.location.href = 'index.html';
};

// When the pause button is clicked, toggle pause
pauseBtn.onclick = () => {
  if (!gameActive) return;
  paused = true;
  pauseBtnImg.alt = 'Play';
  pauseOverlay.classList.add('active');
};

pauseMenuBtn.onclick = (e) => {
  e.stopPropagation();
  window.location.href = 'index.html';
};

// Clicking the overlay (but not the popup) resumes the game
pauseOverlay.onclick = (e) => {
  if (e.target === pauseOverlay) {
    paused = false;
    pauseBtnImg.src = 'img/pause.jpg'; // Switch back to pause image
    pauseBtnImg.alt = 'Pause';
    pauseOverlay.classList.remove('active');
    // Resume item spawning if needed
    spawnItems();
  }
};

// Add an array of animal image file paths
const animalImages = [
  'img/otter.jpg',      // Existing animal image
  'img/dog-swim.jpg',    // New animal image 1
  'img/beaver-swim.webp'     // New animal image 2
];

// Start or restart the game
function startGame() {
  // Set up level difficulty
  // Adjust game variables based on selected difficulty
  // Only itemFallSpeed and targetScore change with difficulty now
  if (difficulty === 'easy') {
    itemFallSpeed = 2 + level * 0.7; // Items fall a bit slower
    // garbageChance is fixed and does not change
    targetScore = 8 + (level - 1) * 4; // Lower target score
  } else if (difficulty === 'hard') {
    itemFallSpeed = 3 + level * 1.2; // Items fall faster
    // garbageChance is fixed and does not change
    targetScore = 14 + (level - 1) * 7; // Higher target score
  } else {
    // Normal
    itemFallSpeed = 2 + level; // Default speed
    // garbageChance is fixed and does not change
    targetScore = 10 + (level - 1) * 5; // Default target
  }
  score = 0;
  gameActive = true;
  gameScreen.classList.remove('hidden');
  endScreen.classList.add('hidden');
  scoreDisplay.innerText = `Score: ${score} / ${targetScore}`;
  river.innerHTML = '';
  spawnItems();
}

// This function spawns garbage and animal items one by one using setTimeout
function spawnItems() {
  function spawnNextItem() {
    if (!gameActive) return;
    if (paused) return; // Stop spawning if paused
    // Randomly decide if this item is garbage
    const isGarbage = Math.random() < garbageChance;
    // Create a new image element for the item
    const item = document.createElement('img');
    item.classList.add('item');
    item.style.top = '-60px'; // Start above the visible area
    item.style.left = `${Math.random() * 80 + 5}%`;
    if (isGarbage) {
      item.src = 'img/water.jpg'; // Garbage image
      item.alt = 'Garbage';
      item.dataset.type = 'garbage';
    } else {
      // Pick a random animal image from the array
      const randomIndex = Math.floor(Math.random() * animalImages.length);
      item.src = animalImages[randomIndex];
      item.alt = 'Happy Animal';
      item.dataset.type = 'animal';
    }
    // Add the item to the river area
    river.appendChild(item);
    // Attach click handler
    item.onclick = () => handleItemClick(item);
    // Start the falling animation
    fallItem(item);
    // Keep spawning items as long as the game is active
    if (gameActive && !paused) {
      setTimeout(spawnNextItem, Math.max(400, 1000 - level * 100));
    }
  }
  // Start spawning the first item
  spawnNextItem();
}

// Handles what happens when an item is clicked
function handleItemClick(item) {
  if (!gameActive) return;
  if (item.dataset.type === 'garbage') {
    // If it's garbage, show sparkle, play sound, remove item, and update score
    sparkleAt(item);
    happySound.currentTime = 0;
    happySound.play();
    item.remove();
    score++;
    scoreDisplay.innerText = `Score: ${score} / ${targetScore}`;
    // If score reaches target, win the level
    if (score >= targetScore) {
      winLevel();
      return;
    }
  } else {
    // If it's an animal, play fail sound and subtract score
    failSound.currentTime = 0;
    failSound.play();
    item.remove();
    score--;
    scoreDisplay.innerText = `Score: ${score} / ${targetScore}`;
  }
}

// Handles what happens when an item falls to the bottom
function handleItemFall(item) {
  if (!gameActive) return;
  // Just remove the item, no score change or lose condition
  item.remove();
}

// Makes an item fall down the screen
function fallItem(item) {
  function fall() {
    if (!gameActive) return;
    if (paused) {
      setTimeout(fall, 100); // Check again after a short delay
      return;
    }
    let top = parseFloat(item.style.top);
    if (isNaN(top)) top = -60;
    top += itemFallSpeed;
    item.style.top = `${top}px`;
    // If the item reaches the bottom of the screen
    if (top > window.innerHeight - 100) {
      handleItemFall(item); // Only remove the item, no penalty
    } else {
      // Keep moving the item down
      setTimeout(fall, 20);
    }
  }
  fall();
}

// Show a sparkle effect at the item's position
function sparkleAt(item) {
  const rect = item.getBoundingClientRect();
  sparkle.style.left = `${rect.left + rect.width / 2}px`;
  sparkle.style.top = `${rect.top}px`;
  sparkle.classList.remove('hidden');
  setTimeout(() => {
    sparkle.classList.add('hidden');
  }, 400); // Hide sparkle after 400ms
}

// Called when the player wins the level
function winLevel() {
  gameActive = false; // Stop the game
  gameScreen.classList.add('hidden'); // Hide game screen
  endScreen.classList.remove('hidden'); // Show end screen
  endMessage.innerText = `Great job! You cleaned the river!\nFinal Score: ${score}`;
  nextBtn.classList.remove('hidden'); // Show next level button
}

// Called when the player loses the level
function loseLevel(message) {
  gameActive = false; // Stop the game
  gameScreen.classList.add('hidden'); // Hide game screen
  endScreen.classList.remove('hidden'); // Show end screen
  endMessage.innerText = `${message}\nFinal Score: ${score}`;
  nextBtn.classList.add('hidden'); // Hide next level button
}

// Start the game when the page loads
startGame();
