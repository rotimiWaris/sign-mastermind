// ------------------ GAME VARIABLES -------------------
let firstSelectedSlice = null;
let moveCount = 0;
let timer;
let seconds = 0;
let level = 1;
let sliceCount = 3;
let gameMode = "swap";
let puzzleArray = [];
let blankPosition = 0;
let uploadedImageSrc = null; // Store uploaded image source
let isMuted = false; // Track mute state

// ------------------ EVENT LISTENERS -------------------
// Level change
document.getElementById("levelSelect").addEventListener("change", function (e) {
  level = parseInt(e.target.value);
  sliceCount = 2 + level;
  resetGame();
});

// Image file selection
document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    document.getElementById("shareButton").style.display = "none";
    document.getElementById("muteButton").style.display = "block";
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;
      uploadedImageSrc = e.target.result; // Store image source
      img.onload = function () {
        initializeGame(img);
        // Show image upload modal on mobile
        if (window.innerWidth <= 768) {
          const modal = document.getElementById("imageUploadModal");
          modal.style.display = "block";
        }
      };
    };
    reader.readAsDataURL(file);
  }
});

// Scroll to Board button
document
  .getElementById("scrollToBoardBtn")
  .addEventListener("click", function () {
    const modal = document.getElementById("imageUploadModal");
    modal.style.display = "none";
    document
      .getElementById("muteButton")
      .scrollIntoView({ behavior: "smooth" });
  });

// Mute/Unmute button
document.getElementById("muteButton").addEventListener("click", function () {
  isMuted = !isMuted;
  const muteIcon = document.getElementById("muteIcon");
  if (isMuted) {
    muteIcon.innerHTML = `
      <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
      <line x1="23" y1="9" x2="17" y2="15"></line>
      <line x1="17" y1="9" x2="23" y2="15"></line>
    `;
  } else {
    muteIcon.innerHTML = `
      <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    `;
  }
});

// Reset button
document.getElementById("resetButton").addEventListener("click", resetGame);

// Next level button
document.getElementById("nextLevelBtn").addEventListener("click", function () {
  const modal = document.getElementById("puzzleCompleteModal");
  modal.style.display = "none";
  if (level < 6) {
    level++;
    document.getElementById("levelSelect").value = level;
    sliceCount = 2 + level;
    resetGame();
  } else {
    alert("Congratulations! You've completed all levels!");
  }
});

// Mode selection
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

// Download victory image
document
  .getElementById("downloadWinBtn")
  .addEventListener("click", downloadVictoryImage);

// Share win on X
document.getElementById("shareWinBtn").addEventListener("click", function () {
  const level = document.getElementById("completedLevel").textContent;
  const mode = document.getElementById("completedMode").textContent;
  const time = document.getElementById("completionTime").textContent;
  const moves = document.getElementById("completionMoves").textContent;
  const owner = document.getElementById("pictureOwnerInput").value.trim();
  const message = owner
    ? `🎉 I TRIUMPHANTLY arranged ${owner}'s masterpiece & CRUSHED @sign Mastermind Level ${level} (${mode}) in ${time} with ${moves} moves! 🧩 Dare to beat me? https://sign-mastermind.vercel.app #SignMastermind #PuzzleKing`
    : `🎉 I CRUSHED @sign Mastermind Level ${level} (${mode}) in ${time} with ${moves} moves! 🧩 Dare to beat me? https://sign-mastermind.vercel.app #SignMastermind #PuzzleKing`;
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
    "_blank"
  );
});

// ------------------ GAME FUNCTIONS -------------------
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
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const displaySize = 600;
  canvas.width = displaySize;
  canvas.height = displaySize;
  ctx.drawImage(img, 0, 0, displaySize, displaySize);
  const sliceWidth = canvas.width / sliceCount;
  const sliceHeight = canvas.height / sliceCount;
  puzzleArray = Array.from({ length: sliceCount * sliceCount }, (_, i) => i);
  for (let i = puzzleArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [puzzleArray[i], puzzleArray[j]] = [puzzleArray[j], puzzleArray[i]];
  }
  blankPosition = puzzleArray.indexOf(sliceCount * sliceCount - 1);
  sliceContainer.style.gridTemplateColumns = `repeat(${sliceCount}, 1fr)`;
  const slices = [];
  for (let i = 0; i < puzzleArray.length; i++) {
    const position = puzzleArray[i];
    const row = Math.floor(position / sliceCount);
    const col = position % sliceCount;
    const sliceDiv = document.createElement("div");
    sliceDiv.className = "slice";
    sliceDiv.dataset.index = i;
    if (position !== sliceCount * sliceCount - 1) {
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
      sliceDiv.classList.add("blank");
    }
    slices.push(sliceDiv);
    sliceContainer.appendChild(sliceDiv);
  }
  sliceContainer.addEventListener("click", (e) => {
    const sliceDiv = e.target.closest(".slice:not(.blank)");
    if (sliceDiv) {
      const index = parseInt(sliceDiv.dataset.index);
      handleSlideClick(index);
    }
  });
}

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
  // Play move sound if not muted
  if (!isMuted) {
    const moveSound = document.getElementById("moveSound");
    moveSound.currentTime = 0;
    moveSound.play();
  }
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

function sliceAndRandomizeImage(image) {
  const sliceContainer = document.getElementById("sliceContainer");
  sliceContainer.innerHTML = "";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const displaySize = 600;
  canvas.width = displaySize;
  canvas.height = displaySize;
  ctx.drawImage(image, 0, 0, displaySize, displaySize);
  const slices = [];
  const sliceWidth = canvas.width / sliceCount;
  const sliceHeight = canvas.height / sliceCount;
  for (let row = 0; row < sliceCount; row++) {
    for (let col = 0; col < sliceCount; col++) {
      const sliceCanvas = document.createElement("canvas");
      const sliceCtx = sliceCanvas.getContext("2d");
      sliceCanvas.width = sliceWidth;
      sliceCanvas.height = sliceHeight;
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
      const sliceDiv = document.createElement("div");
      sliceDiv.className = "slice";
      sliceDiv.appendChild(sliceImg);
      sliceDiv.dataset.row = row;
      sliceDiv.dataset.col = col;
      sliceDiv.addEventListener("click", function () {
        onSliceClick(sliceDiv);
      });
      slices.push(sliceDiv);
    }
  }
  shuffleArray(slices);
  slices.forEach((slice) => {
    sliceContainer.appendChild(slice);
  });
  sliceContainer.style.gridTemplateColumns = `repeat(${sliceCount}, 1fr)`;
  moveCount = 0;
  document.getElementById("moveCount").textContent = moveCount;
}

function shuffleArray(array) {
  let j, temp;
  for (let i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    temp = array[j];
    array[j] = array[i];
    array[i] = temp;
  }
}

function onSliceClick(slice) {
  if (firstSelectedSlice === null) {
    firstSelectedSlice = slice;
    slice.classList.add("selected");
    // Play move sound if not muted
    if (!isMuted) {
      const moveSound = document.getElementById("moveSound");
      moveSound.currentTime = 0;
      moveSound.play();
    }
  } else {
    const secondSelectedSlice = slice;
    if (firstSelectedSlice === secondSelectedSlice) {
      firstSelectedSlice.classList.remove("selected");
      firstSelectedSlice = null;
      return;
    }
    swapSlices(firstSelectedSlice, secondSelectedSlice);
    firstSelectedSlice.classList.remove("selected");
    firstSelectedSlice = null;
    moveCount++;
    document.getElementById("moveCount").textContent = moveCount;
    // Play move sound if not muted
    if (!isMuted) {
      const moveSound = document.getElementById("moveSound");
      moveSound.currentTime = 0;
      moveSound.play();
    }
    if (checkPuzzleComplete()) {
      setTimeout(() => {
        showPuzzleCompletionModal();
      }, 1000);
    }
  }
}

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
    for (let i = 0; i < puzzleArray.length - 1; i++) {
      if (puzzleArray[i] !== i) return false;
    }
    return true;
  }
}

function swapSlices(slice1, slice2) {
  slice1.classList.add("swapping");
  slice2.classList.add("swapping");
  const parent = slice1.parentNode;
  const sibling = slice1.nextSibling === slice2 ? slice1 : slice1.nextSibling;
  slice2.parentNode.insertBefore(slice1, slice2);
  parent.insertBefore(slice2, sibling);
  setTimeout(() => {
    slice1.classList.remove("swapping");
    slice2.classList.remove("swapping");
  }, 600);
}

function startTimer() {
  stopTimer();
  seconds = 0;
  timer = setInterval(updateTimer, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function updateTimer() {
  seconds++;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  document.getElementById("timer").textContent =
    `${hours.toString().padStart(2, "0")}:` +
    `${minutes.toString().padStart(2, "0")}:` +
    `${remainingSeconds.toString().padStart(2, "0")}`;
}

function showPuzzleCompletionModal() {
  const modal = document.getElementById("puzzleCompleteModal");
  const fileInput = document.getElementById("fileInput");
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;
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
  // Reset picture owner input
  document.getElementById("pictureOwnerInput").value = "";
  modal.style.display = "block";
  // Play win sound if not muted
  if (!isMuted) {
    const winSound = document.getElementById("winSound");
    winSound.currentTime = 0;
    winSound.play();
  }
}

function downloadVictoryImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");

  // Background: Dark gradient for text visibility
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#4a1c00"); // --card-bg
  gradient.addColorStop(1, "#330d00"); // --background-color
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Orange slice icons in top corners (reduced opacity)
  ctx.fillStyle = "rgba(255, 140, 0, 0.8)"; // Deep orange, semi-transparent
  ctx.beginPath();
  ctx.arc(50, 50, 30, 0, Math.PI / 2);
  ctx.lineTo(50, 50);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(canvas.width - 50, 50, 30, Math.PI / 2, Math.PI);
  ctx.lineTo(canvas.width - 50, 50);
  ctx.fill();

  // Decorative orange line above header
  ctx.strokeStyle = "rgba(255, 69, 0, 0.8)"; // Neon orange, semi-transparent
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(50, 90);
  ctx.lineTo(canvas.width - 50, 90);
  ctx.stroke();

  // Header: SIGN MASTERMIND
  ctx.font = "bold 50px Orbitron";
  ctx.fillStyle = "#fffacd"; // --text-color (light orange)
  ctx.textAlign = "center";
  ctx.shadowColor = "#ff4500"; // Neon orange
  ctx.shadowBlur = 15;
  ctx.fillText("SIGN MASTERMIND", canvas.width / 2, 120);
  ctx.shadowBlur = 0;

  // Success message (letter style, without puzzle details)
  const owner = document.getElementById("pictureOwnerInput").value.trim();
  const message = owner
    ? `Wow... Orange Fam, I SUCCESSFULLY arranged ${owner}'s masterpiece, claiming victory!`
    : `Wow... Orange Fam, I CRUSHED the puzzle, claiming victory!`;

  ctx.textAlign = "center"; // Center the text horizontally
  const textX = canvas.width / 2; // Center point of canvas
  let textY = 160;
  const maxWidth = canvas.width - 200;
  const lineHeight = 32;

  // Wrap text for the message
  const words = message.split(" ");
  let line = "";
  const lines = [];
  for (let word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== "") {
      lines.push(line);
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // Render message
  let currentX = textX;
  ctx.font = "bold 24px Poppins";
  ctx.fillStyle = "#fffacd"; // --text-color
  for (let line of lines) {
    ctx.fillText(line, currentX, textY);
    textY += lineHeight;
  }

  // Load and draw the arranged image
  const img = new Image();
  img.src = uploadedImageSrc;
  img.onload = () => {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const imgWidth = 330;
    const imgHeight = 330;
    const imgX = (canvas.width - imgWidth) / 2;
    const imgY = textY + 30;
    ctx.fillStyle = "#fffacd"; // --text-color
    ctx.fillRect(imgX - 15, imgY - 15, imgWidth + 30, imgHeight + 30);
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
    // Double orange border
    ctx.strokeStyle = "rgba(255, 69, 0, 0.8)"; // Neon orange, semi-transparent
    ctx.lineWidth = 5;
    ctx.strokeRect(imgX - 15, imgY - 15, imgWidth + 30, imgHeight + 30);
    ctx.strokeStyle = "rgba(255, 140, 0, 0.8)"; // Deep orange, semi-transparent
    ctx.lineWidth = 3;
    ctx.strokeRect(imgX - 10, imgY - 10, imgWidth + 20, imgHeight + 20);

    // Bottom text: You can try it too!
    ctx.font = "bold 20px Poppins";
    ctx.fillStyle = "#fffacd"; // --text-color
    ctx.textAlign = "center";
    const bottomTextY = imgY + imgHeight + 40;
    ctx.fillText("You can try it too!", canvas.width / 2, bottomTextY);

    // Puzzle details table
    const tableY = bottomTextY + 30;
    const tableWidth = 600;
    const tableHeight = 60;
    const tableX = (canvas.width - tableWidth) / 2;
    const cellWidth = tableWidth / 4;
    const cellHeight = tableHeight / 2;

    // Table background
    ctx.fillStyle = "#191914"; // --text-color
    ctx.fillRect(tableX, tableY, tableWidth, tableHeight);

    // Table borders
    ctx.strokeStyle = "#ff4500"; // Neon orange
    ctx.lineWidth = 2;
    ctx.strokeRect(tableX, tableY, tableWidth, tableHeight);
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      ctx.moveTo(tableX + i * cellWidth, tableY);
      ctx.lineTo(tableX + i * cellWidth, tableY + tableHeight);
    }
    ctx.moveTo(tableX, tableY + cellHeight);
    ctx.lineTo(tableX + tableWidth, tableY + cellHeight);
    ctx.stroke();

    // Table content
    const completedLevel =
      document.getElementById("completedLevel").textContent;
    const completedMode = document.getElementById("completedMode").textContent;
    const completionTime =
      document.getElementById("completionTime").textContent;
    const completionMoves =
      document.getElementById("completionMoves").textContent;

    const labels = ["Level", "Mode", "Time", "Moves"];
    const values = [
      completedLevel,
      completedMode,
      completionTime,
      completionMoves,
    ];

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700"; // Light orange
    ctx.font = "bold 18px Poppins";
    for (let i = 0; i < 4; i++) {
      ctx.fillText(
        labels[i],
        tableX + (i + 0.5) * cellWidth,
        tableY + cellHeight / 2 + 6
      );
    }
    ctx.fillStyle = "#ff8c00"; // Deep orange
    ctx.font = "900 28px Poppins";
    for (let i = 0; i < 4; i++) {
      ctx.fillText(
        values[i],
        tableX + (i + 0.5) * cellWidth,
        tableY + cellHeight + cellHeight / 2 + 6
      );
    }

    // Decorative orange line below table
    ctx.strokeStyle = "rgba(255, 69, 0, 0.8)"; // Neon orange, semi-transparent
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(50, tableY + tableHeight + 20);
    ctx.lineTo(canvas.width - 50, tableY + tableHeight + 20);
    ctx.stroke();

    // Footer: ORANGE DYNASTY
    ctx.font = "bold 40px Orbitron";
    ctx.fillStyle = "#fffacd"; // --text-color
    ctx.shadowColor = "#ff4500"; // Neon orange
    ctx.shadowBlur = 15;
    ctx.fillText("ORANGE DYNASTY", canvas.width / 2, tableY + tableHeight + 60);
    ctx.shadowBlur = 0;

    // Download the image
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SignMastermind_Level${level}_Win.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  };
}

function resetGame() {
  const fileInput = document.getElementById("fileInput");
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;
      img.onload = function () {
        initializeGame(img);
      };
    };
    reader.readAsDataURL(file);
  }
  document.getElementById("level").textContent = level;
  moveCount = 0;
  document.getElementById("moveCount").textContent = moveCount;
}

// Initialize game
resetGame();
