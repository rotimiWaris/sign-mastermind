// ------------------ GAME VARIABLES -------------------
// These variables keep track of the game state
let firstSelectedSlice = null; // Stores the first selected puzzle piece
let moveCount = 0; // Track number of moves made
let timer; // Timer reference for tracking elapsed time
let seconds = 0; // Time elapsed in seconds
let level = 1; // Current game level
let sliceCount = 3; // Grid size (3x3 for level 1)
let gameMode = "swap"; // Default to swap mode
let puzzleArray = []; // For slide mode
let blankPosition = 0; // For slide mode

// ------------------ EVENT LISTENERS -------------------
// Listen for level changes
document.getElementById("levelSelect").addEventListener("change", function (e) {
  // Update level and grid size based on selected level
  level = parseInt(e.target.value);
  // Calculate grid size: lvl 1 = 3x3, lvl 2 = 4x4
  sliceCount = 2 + level;
  resetGame();
});

// Listen for image file selection
document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];

  if (file) {
    document.getElementById("shareButton").style.display = "none";

    // Read the selected image fike
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;

      // Once image is loaded, slice it into puzzle pieces and start the game
      img.onload = function () {
        initializeGame(img);
        // sliceAndRandomizeImage(img);
        // startTimer();
        // document.getElementById(
        //   "imageContainer"
        // ).innerHTML = `<img src="${e.target.result}" style="max-width:100%; height:auto; margin-top:-1rem">`;
      };
    };

    reader.readAsDataURL(file);
  }
});

/**
 * Listen for shuffle button click
 * 
 * document.getElementById("shuffleButton").addEventListener("click", function () {
  // Get all puzzle pieces and randomize their order
  const slices = Array.from(document.querySelectorAll(".slice"));
  shuffleArray(slices);

  // Update the display with the new order
  slices.forEach((slice) =>
    document.getElementById("sliceContainer").appendChild(slice)
  );

  // Reset game state
  moveCount = 0;
  document.getElementById("moveCount").textContent = moveCount;
  startTimer();
}); 
*/

// Listen for reset button click
document.getElementById("resetButton").addEventListener("click", resetGame);

// Listen for "Next Challenge" button clicks in the completion modal
document.getElementById("nextLevelBtn").addEventListener("click", function () {
  const modal = document.getElementById("puzzleCompleteModal");
  modal.style.display = "none";

  // Progress to next level if not at next level
  if (level < 6) {
    level++;
    document.getElementById("levelSelect").value = level;
    sliceCount = 2 + level;
    resetGame();
  } else {
    alert("Congratulations! You've completed all levels!");
  }
});

// Mode selection buttons
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document
      .querySelectorAll(".mode-btn")
      .forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    gameMode = this.dataset.value;
    resetGame();
  });
});

// ------------------ GAME FUNCTIONS -------------------
// ================== GAME INITIALIZATION ==================
function initializeGame(img) {
  document.getElementById(
    "imageContainer"
  ).innerHTML = `<img src="${img.src}" style="max-width:100%; height:auto; margin-top:-1rem">`;

  if (gameMode === "swap") {
    sliceAndRandomizeImage(img);
  } else {
    initializeSlideMode(img);
  }

  startTimer();
}

function initializeSlideMode(img) {
  const sliceContainer = document.getElementById("sliceContainer");
  sliceContainer.innerHTML = "";

  // Create canvas for the full image
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const displaySize = 600;
  canvas.width = displaySize;
  canvas.height = displaySize;
  ctx.drawImage(img, 0, 0, displaySize, displaySize);

  // Calculate slice dimensions
  const sliceWidth = canvas.width / sliceCount;
  const sliceHeight = canvas.height / sliceCount;

  // Initialize array for slide mode
  puzzleArray = Array.from({ length: sliceCount * sliceCount }, (_, i) => i);

  // Shuffle the array (Fisher-Yates)
  for (let i = puzzleArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [puzzleArray[i], puzzleArray[j]] = [puzzleArray[j], puzzleArray[i]];
  }

  // Set blank position (last piece)
  blankPosition = puzzleArray.indexOf(sliceCount * sliceCount - 1);

  // Create puzzle board
  sliceContainer.style.gridTemplateColumns = `repeat(${sliceCount}, 1fr)`;

  // Store references to all slices
  const slices = [];

  for (let i = 0; i < puzzleArray.length; i++) {
    const position = puzzleArray[i];
    const row = Math.floor(position / sliceCount);
    const col = position % sliceCount;

    const sliceDiv = document.createElement("div");
    sliceDiv.className = "slice";
    sliceDiv.dataset.index = i;

    if (position !== sliceCount * sliceCount - 1) {
      // Create canvas for each slice
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = sliceWidth;
      sliceCanvas.height = sliceHeight;
      const sliceCtx = sliceCanvas.getContext("2d");

      sliceCtx.drawImage(
        canvas,
        col * sliceWidth,
        row * sliceHeight,
        sliceWidth,
        sliceHeight,
        0,
        0,
        sliceWidth,
        sliceHeight
      );

      const sliceImg = document.createElement("img");
      sliceImg.src = sliceCanvas.toDataURL();
      sliceDiv.appendChild(sliceImg);
    } else {
      // Blank tile
      sliceDiv.classList.add("blank");
    }

    slices.push(sliceDiv);
    sliceContainer.appendChild(sliceDiv);
  }

  // Add single event listener to container (event delegation)
  sliceContainer.addEventListener("click", (e) => {
    const sliceDiv = e.target.closest(".slice:not(.blank)");
    if (sliceDiv) {
      const index = parseInt(sliceDiv.dataset.index);
      handleSlideClick(index);
    }
  });
}

// Fix to handleSlideClick
function handleSlideClick(index) {
  if (gameMode !== "slide") return;

  const blankRow = Math.floor(blankPosition / sliceCount);
  const blankCol = blankPosition % sliceCount;
  const clickedRow = Math.floor(index / sliceCount);
  const clickedCol = index % sliceCount;

  const isAdjacent =
    (Math.abs(blankRow - clickedRow) === 1 && blankCol === clickedCol) ||
    (Math.abs(blankCol - clickedCol) === 1 && blankRow === clickedRow);

  if (!isAdjacent) return;

  [puzzleArray[blankPosition], puzzleArray[index]] = [
    puzzleArray[index],
    puzzleArray[blankPosition],
  ];
  blankPosition = index;

  moveCount++;
  document.getElementById("moveCount").textContent = moveCount;

  const sliceContainer = document.getElementById("sliceContainer");
  const displaySize = 600;
  const sliceSize = displaySize / sliceCount;

  const canvas = document.createElement("canvas");
  canvas.width = displaySize;
  canvas.height = displaySize;
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    ctx.drawImage(img, 0, 0, displaySize, displaySize);
    sliceContainer.innerHTML = "";
    sliceContainer.style.position = "relative";
    sliceContainer.style.display = "grid";
    sliceContainer.style.gridTemplateColumns = `repeat(${sliceCount}, 1fr)`;

    puzzleArray.forEach((val, i) => {
      const sliceDiv = document.createElement("div");
      sliceDiv.className = "slice";
      sliceDiv.dataset.index = i;

      if (val === sliceCount * sliceCount - 1) {
        sliceDiv.classList.add("blank");
      } else {
        const row = Math.floor(val / sliceCount);
        const col = val % sliceCount;

        const pieceCanvas = document.createElement("canvas");
        pieceCanvas.width = sliceSize;
        pieceCanvas.height = sliceSize;
        const pieceCtx = pieceCanvas.getContext("2d");
        pieceCtx.drawImage(
          canvas,
          col * sliceSize,
          row * sliceSize,
          sliceSize,
          sliceSize,
          0,
          0,
          sliceSize,
          sliceSize
        );

        const imgEl = document.createElement("img");
        imgEl.src = pieceCanvas.toDataURL();
        imgEl.style.width = "100%";
        imgEl.style.height = "100%";
        sliceDiv.appendChild(imgEl);

        // Add animation class
        sliceDiv.classList.add("slide-anim");
        setTimeout(() => {
          sliceDiv.classList.remove("slide-anim");
        }, 300);
      }

      sliceContainer.appendChild(sliceDiv);
    });

    document.querySelectorAll(".slice:not(.blank)").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.dataset.index);
        handleSlideClick(idx);
      });
    });

    if (checkPuzzleComplete()) {
      setTimeout(() => showPuzzleCompletionModal(), 1000);
    }
  };

  img.src = document.querySelector("#imageContainer img").src;
}

/**
 * Slices the image into pieces and randomizes their positions
 * parse {image} image - The image to slice into puzzle pieces
 */
function sliceAndRandomizeImage(image) {
  // Get the container for puzzle pieces
  const sliceContainer = document.getElementById("sliceContainer");
  sliceContainer.innerHTML = ""; // Clear previous puzzle pieces

  // Create a temporary canvas to work with the image
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const displaySize = 600; // Fixed size for the displayed image

  canvas.width = displaySize;
  canvas.height = displaySize;

  // Draw the image onto the canvas, scaling it to our fixed size
  ctx.drawImage(image, 0, 0, displaySize, displaySize);

  const slices = []; // Array to hold all puzzle pieces

  //   Calculate dimensions of each puzzle piece
  const sliceWidth = canvas.width / sliceCount;
  const sliceHeight = canvas.height / sliceCount;

  // Create Individual puzzle pieces
  for (let row = 0; row < sliceCount; row++) {
    for (let col = 0; col < sliceCount; col++) {
      // Create a canvas for each puzzle piece
      const sliceCanvas = document.createElement("canvas");
      const sliceCtx = sliceCanvas.getContext("2d");
      sliceCanvas.width = sliceWidth;
      sliceCanvas.height = sliceHeight;

      // Draw the corresponding portion of the original Image
      sliceCtx.drawImage(
        canvas,
        col * sliceWidth,
        row * sliceHeight,
        sliceWidth,
        sliceHeight, // source rectangle
        0,
        0,
        sliceWidth,
        sliceHeight // destination rectangle
      );

      // Create an Image from the slice canvas
      const sliceImg = document.createElement("img");
      sliceImg.src = sliceCanvas.toDataURL();

      // Crete the div element that will contain the image
      const sliceDiv = document.createElement("div");
      sliceDiv.className = "slice";
      sliceDiv.appendChild(sliceImg);

      // Store original position data (this is how we know if pieces are in correct spots)
      sliceDiv.dataset.row = row;
      sliceDiv.dataset.col = col;

      // Add click event to the slice
      sliceDiv.addEventListener("click", function () {
        onSliceClick(sliceDiv);
      });

      slices.push(sliceDiv);
    }
  }

  // Randomize the order of slices
  shuffleArray(slices);

  // Add all puzzle pieces to the container
  slices.forEach((slice) => {
    sliceContainer.appendChild(slice);
  });

  // Update the grid layout based on the current level
  sliceContainer.style.gridTemplateColumns = `repeat(${sliceCount}, 1fr)`;

  // Reset the move count
  moveCount = 0;
  document.getElementById("moveCount").textContent = moveCount;
}

/**
 * Shuffle array elements randomly (fisher-Yates algo)
 * @param {Array} array - The array to shuffle
 */

function shuffleArray(array) {
  let j, temp;
  j = temp = 0;
  for (let i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    // Swap element i and j
    temp = array[j];
    array[j] = array[i];
    array[i] = temp;

    /**
     * ANOTHER WAY TO SWAP
     * [array[i], array[j]] = [array[j], array[i]];
     */
  }
}

/**
 * Handles click element on puzzle pieces
 * @param {HTMLElement} slice - The clicked puzzle piece
 */
function onSliceClick(slice) {
  // if no piece is currently selected, select this one
  if (firstSelectedSlice === null) {
    firstSelectedSlice = slice;
    slice.classList.add("selected"); // Highlight the selected piece
  } else {
    // If a piece is already selected, swap it with the current one
    const secondSelectedSlice = slice;

    // Don't count clicking the same piece twice as a move
    if (firstSelectedSlice === secondSelectedSlice) {
      firstSelectedSlice.classList.remove("selected");
      firstSelectedSlice = null;
      return;
    }

    // Swap the two selected pieces
    swapSlices(firstSelectedSlice, secondSelectedSlice);
    firstSelectedSlice.classList.remove("selected");
    firstSelectedSlice = null;

    // Increment move counter and update display
    moveCount++;
    document.getElementById("moveCount").textContent = moveCount;

    // Check if puzzle is complete after the swap
    if (checkPuzzleComplete()) {
      setTimeout(() => {
        showPuzzleCompletionModal();
      }, 1000);
    }
  }
}

/**
 * Checks if the puzzle is completed (all pieces in correct position)
 */

function checkPuzzleComplete() {
  if (gameMode === "swap") {
    const slices = document.querySelectorAll(".slice");
    for (let i = 0; i < slices.length; i++) {
      const row = Math.floor(i / sliceCount);
      const col = i % sliceCount;
      if (slices[i].dataset.row != row || slices[i].dataset.col != col) {
        return false;
      }
    }
    return true;
  } else {
    // For slide mode, check if array is in order except last element
    for (let i = 0; i < puzzleArray.length - 1; i++) {
      if (puzzleArray[i] !== i) return false;
    }
    return true;
  }
}

/**
 * Swaps two puzzle pieces with animation
 * @param {HTMLElement} slice1 - First puzzle piece
 * @param {HTMLElement} slice2 - Second puzzle piece
 */

function swapSlices(slice1, slice2) {
  // Add animation class
  slice1.classList.add("swapping");
  slice2.classList.add("swapping");

  // Get parent and position references
  const parent = slice1.parentNode;
  const sibling = slice1.nextSibling === slice2 ? slice1 : slice1.nextSibling;

  // Swap the DOM elements
  slice2.parentNode.insertBefore(slice1, slice2);
  parent.insertBefore(slice2, sibling);

  // Remove animation class after animation completes
  setTimeout(() => {
    slice1.classList.remove("swapping");
    slice2.classList.remove("swapping");
  }, 600);
}

/* Starts the game timer */
function startTimer() {
  stopTimer(); // clear any existing timer
  seconds = 0;
  timer = setInterval(updateTimer, 1000);
}

/* Stops the game timer */
function stopTimer() {
  clearInterval(timer);
}

/* Update the timer display every second */
function updateTimer() {
  seconds++;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Format time as HH:MM:SS
  document.getElementById("timer").textContent =
    `${hours.toString().padStart(2, "0")}:` +
    `${minutes.toString().padStart(2, "0")}:` +
    `${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Show the completion modal with stats
 */

function showPuzzleCompletionModal() {
  const modal = document.getElementById("puzzleCompleteModal");

  const fileInput = document.getElementById("fileInput");

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;

      // Once image is loaded, slice it into puzzle pieces and start the game
      img.onload = function () {
        document.getElementById(
          "imgModalContainer"
        ).innerHTML = `<img src="${e.target.result}" style="max-width:100%; height:auto;">`;
      };
    };
    reader.readAsDataURL(file);
  }
  document.getElementById("completedLevel").textContent = level;
  document.getElementById("completedMode").textContent =
    gameMode.charAt(0).toUpperCase() + gameMode.slice(1);
  document.getElementById("completionTime").textContent =
    document.getElementById("timer").textContent;
  document.getElementById("completionMoves").textContent = moveCount;

  modal.style.display = "block";
}

/**
 * Reset the game state
 */

function resetGame() {
  // If an image has been selected, re-slice it
  const fileInput = document.getElementById("fileInput");

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;

      // Once image is loaded, slice it into puzzle pieces and start the game
      img.onload = function () {
        initializeGame(img);
      };
    };
    reader.readAsDataURL(file);
  }

  // Update level display
  document.getElementById("level").textContent = level;
  moveCount = 0;
  document.getElementById("moveCount").textContent = moveCount;
}

// Initialize the game when page loads
resetGame();
