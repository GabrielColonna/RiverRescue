// River Rescue game logic for game.html
// This is a copy of your previous script.js, but now reads the level from the URL and saves progress to localStorage

// Helper function to get the level number from the URL
function getLevelFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('level')) || 1;
}

// Game state variables
let score = 0; // Player's score
let level = getLevelFromURL(); // Current level
let gameInterval; // Used for intervals (not used in this code)
let itemFallSpeed = 2; // How fast items fall
let itemsToSpawn = 5; // How many items to spawn this level
let garbageChance = 0.7; // Chance an item is garbage
let totalGarbage = 0; // How many garbage items this level
let clearedGarbage = 0; // How many garbage items have been cleared
let gameActive = false; // Is the game currently running?

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

// Start or restart the game
function startGame() {
  // Set up level difficulty
  itemsToSpawn = 5 + (level - 1) * 2; // More items each level
  garbageChance = Math.min(0.7 + (level - 1) * 0.05, 0.95); // More garbage each level, max 95%
  itemFallSpeed = 2 + level; // Items fall faster each level
  score = 0;
  clearedGarbage = 0;
  totalGarbage = 0;
  gameActive = true;
  gameScreen.classList.remove('hidden');
  endScreen.classList.add('hidden');
  scoreDisplay.innerText = `Score: ${score}`;
  river.innerHTML = '';
  spawnItems();
}

// This function spawns garbage and animal items one by one using setTimeout
function spawnItems() {
  // Plan which items will be garbage or animals
  const garbagePlan = [];
  totalGarbage = 0;
  for (let i = 0; i < itemsToSpawn; i++) {
    // Randomly decide if this item is garbage
    const isGarbage = Math.random() < garbageChance;
    garbagePlan.push(isGarbage);
    if (isGarbage) totalGarbage++;
  }
  // Make sure there is at least one garbage item
  if (totalGarbage === 0) {
    garbagePlan[0] = true;
    totalGarbage = 1;
  }

  let itemsSpawned = 0;

  // Helper function to spawn a single item
  function spawnNextItem() {
    if (!gameActive || itemsSpawned >= itemsToSpawn) {
      return; // Stop if game is not active or all items are spawned
    }
    const isGarbage = garbagePlan[itemsSpawned];
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
      item.src = 'img/otter.jpg'; // Animal image
      item.alt = 'Happy Animal';
      item.dataset.type = 'animal';
    }
    // Add the item to the river area
    river.appendChild(item);
    // Attach click handler
    item.onclick = () => handleItemClick(item);
    // Start the falling animation
    fallItem(item);
    itemsSpawned++;
    // Spawn the next item after a delay
    if (itemsSpawned < itemsToSpawn && gameActive) {
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
    clearedGarbage++;
    scoreDisplay.innerText = `Score: ${score}`;
    // If all garbage is cleared, win the level
    if (clearedGarbage === totalGarbage) {
      winLevel();
    }
  } else {
    // If it's an animal, play fail sound and lose the level
    failSound.currentTime = 0;
    failSound.play();
    loseLevel('Oh no! You clicked a happy animal!');
  }
}

// Handles what happens when an item falls to the bottom
function handleItemFall(item) {
  if (!gameActive) return;
  if (item.dataset.type === 'garbage') {
    item.remove();
    loseLevel('You missed some garbage!');
  } else if (item.dataset.type === 'animal') {
    // If it's an animal, just remove it (no penalty)
    item.remove();
  }
}

// Makes an item fall down the screen
function fallItem(item) {
  function fall() {
    if (!gameActive) return;
    let top = parseFloat(item.style.top);
    if (isNaN(top)) top = -60;
    top += itemFallSpeed;
    item.style.top = `${top}px`;
    // If the item reaches the bottom of the screen
    if (top > window.innerHeight - 100) {
      handleItemFall(item);
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
  endMessage.innerText = 'Great job! River is cleaner!';
  nextBtn.classList.remove('hidden'); // Show next level button
}

// Called when the player loses the level
function loseLevel(message) {
  gameActive = false; // Stop the game
  gameScreen.classList.add('hidden'); // Hide game screen
  endScreen.classList.remove('hidden'); // Show end screen
  endMessage.innerText = message; // Show the reason for losing
  nextBtn.classList.add('hidden'); // Hide next level button
}

// Start the game when the page loads
startGame();
