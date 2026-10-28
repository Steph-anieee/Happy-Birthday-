const expectedBirthdate = "";
const lockScreen = document.querySelector("#lock-screen");
const unlockForm = document.querySelector("#unlock-form");
const birthdateInput = document.querySelector("#birthdate");
const unlockMessage = document.querySelector("#unlock-message");
const book = document.querySelector("#book");
const pages = Array.from(document.querySelectorAll(".book-page"));
const previousTurn = document.querySelector("#turn-previous");
const nextTurn = document.querySelector("#turn-next");
const envelopeCards = Array.from(document.querySelectorAll(".envelope-card"));
const letterDialog = document.querySelector("#letter-dialog");
const letterTitle = document.querySelector("#letter-dialog-title");
const letterKicker = document.querySelector("#letter-dialog-kicker");
const letterMessage = document.querySelector("#letter-dialog-message");
const letterStory = document.querySelector("#letter-dialog-story");
const diagnoseButton = document.querySelector("#diagnose-button");
const prescriptionReveal = document.querySelector("#prescription-reveal");
const letterPrescription = document.querySelector("#letter-dialog-prescription");
const dialogClose = document.querySelector("#dialog-close");
const cakeStage = document.querySelector("#cake-stage");
const cakePage = document.querySelector(".cake-page");
const birthdaySong = document.getElementById("birthday-song");
const songToggle = document.getElementById("song-toggle");
const candles = Array.from(document.querySelectorAll(".candle"));
const flameButtons = Array.from(document.querySelectorAll(".flame"));
const micButton = document.querySelector("#mic-button");
const micStatus = document.querySelector("#mic-status");
const successMessage = document.querySelector("#success-message");
const confettiContainer = document.querySelector("#confetti-container");

let currentPage = 0;
let isTurning = false;
let turnTimer;
let envelopeTimer;
let touchStartX;
let audioContext;
let microphoneStream;
let animationFrame;
let isBlowingOut = false;
let noiseFloor = 0.012;

function updateSongToggle() {
  const isPlaying = !birthdaySong.paused && !birthdaySong.ended;
  songToggle.textContent = isPlaying ? "Pause birthday song" : "Play birthday song";
  songToggle.setAttribute("aria-pressed", String(isPlaying));
}

function playBirthdaySong() {
  if (!birthdaySong.paused && !birthdaySong.ended) return;
  if (birthdaySong.ended) birthdaySong.currentTime = 0;
  birthdaySong.play().catch((e) => console.log(e));
}

function toggleBirthdaySong() {
  if (birthdaySong.paused || birthdaySong.ended) {
    playBirthdaySong();
  } else {
    birthdaySong.pause();
  }
}

function setPageOrder() {
  pages.forEach((page, index) => {
    page.style.zIndex = page.classList.contains("is-turned")
      ? String(index + 1)
      : String(pages.length - index);
  });
}

function stopMicrophone() {
  if (animationFrame !== undefined) {
    cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
  }
  if (microphoneStream) {
    microphoneStream.getTracks().forEach((track) => track.stop());
    microphoneStream = undefined;
  }
  if (audioContext && audioContext.state !== "closed") {
    audioContext.close();
  }
  audioContext = undefined;
}

function resetCakeState() {
  isBlowingOut = false;
  stopMicrophone();
  candles.forEach((candle) => candle.classList.remove("is-out"));
  flameButtons.forEach((flame, index) => {
    flame.setAttribute("aria-label", `Put out candle ${index + 1}`);
  });
  successMessage.hidden = true;
  micButton.disabled = false;
  micButton.innerHTML = '<span class="mic-icon" aria-hidden="true"></span> Turn on microphone';
  micStatus.textContent = "Microphone is off. You can also tap any flame to put out all eight.";
  cakeStage.classList.remove("celebrating");
}

function turnPage(direction) {
  if (isTurning || direction === 1 && currentPage >= pages.length - 1 || direction === -1 && currentPage <= 0) return;

  window.clearTimeout(envelopeTimer);
  envelopeCards.forEach((card) => card.classList.remove("is-opening"));
  const turningPageIndex = direction === 1 ? currentPage : currentPage - 1;
  const turningPage = pages[turningPageIndex];
  const destinationIndex = currentPage + direction;
  if (currentPage === 2 && destinationIndex !== 2) birthdaySong.pause();
  isTurning = true;
  turningPage.classList.add(direction === 1 ? "turning-forward" : "turning-back");
  turningPage.style.zIndex = String(pages.length + 2);

  if (direction === 1) {
    currentPage += 1;
    turningPage.setAttribute("aria-hidden", "true");
    pages[currentPage].setAttribute("aria-hidden", "false");
  } else {
    currentPage -= 1;
    turningPage.setAttribute("aria-hidden", "false");
    pages[currentPage + 1].setAttribute("aria-hidden", "true");
  }

  if (currentPage === 2 || turningPageIndex === 2) resetCakeState();
  if (currentPage === 2) playBirthdaySong();
  history.replaceState(null, "", `#page-${currentPage + 1}`);
  previousTurn.disabled = currentPage === 0;
  nextTurn.disabled = currentPage === pages.length - 1;

  window.clearTimeout(turnTimer);
  turnTimer = window.setTimeout(() => {
    turningPage.classList.toggle("is-turned", direction === 1);
    turningPage.classList.remove("turning-forward", "turning-back");
    setPageOrder();
    isTurning = false;
    pages[destinationIndex].focus({ preventScroll: true });
  }, 850);
}

unlockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!birthdateInput.value) {
    birthdateInput.focus();
    unlockMessage.textContent = "Enter your birthdate to open your gift.";
    return;
  }
  const enteredDate = new Date(`${birthdateInput.value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(enteredDate.getTime()) || enteredDate > today) {
    unlockMessage.textContent = "Enter a valid birthdate to open your gift.";
    birthdateInput.focus();
    return;
  }
  if (expectedBirthdate && birthdateInput.value !== expectedBirthdate) {
    unlockMessage.textContent = "That birthdate does not match. Please try again.";
    birthdateInput.focus();
    return;
  }
  unlockMessage.textContent = "";
  book.hidden = false;
  requestAnimationFrame(() => {
    lockScreen.classList.add("is-opening");
    book.classList.add("is-open");
  });
  window.setTimeout(() => {
    lockScreen.hidden = true;
    pages[0].focus({ preventScroll: true });
  }, 750);
});

previousTurn.addEventListener("click", () => turnPage(-1));
nextTurn.addEventListener("click", () => turnPage(1));
songToggle.addEventListener("click", toggleBirthdaySong);
birthdaySong.addEventListener("play", updateSongToggle);
birthdaySong.addEventListener("pause", updateSongToggle);
birthdaySong.addEventListener("ended", updateSongToggle);

cakePage.addEventListener("click", (event) => {
  if (event.target.closest("#song-toggle")) return;
  if (birthdaySong.paused || birthdaySong.ended) playBirthdaySong();
});

book.addEventListener("click", (event) => {
  if (event.target.closest(".cake-page")) return;
  if (event.target.closest(".envelope-card, .page-turn, .cake-controls, .flame")) return;
  const bounds = book.getBoundingClientRect();
  const edgeWidth = Math.min(110, bounds.width * 0.16);
  if (event.clientX > bounds.right - edgeWidth) turnPage(1);
  if (event.clientX < bounds.left + edgeWidth) turnPage(-1);
});

book.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

book.addEventListener("touchend", (event) => {
  if (touchStartX === undefined) return;
  const difference = event.changedTouches[0].clientX - touchStartX;
  touchStartX = undefined;
  if (Math.abs(difference) < 55) return;
  turnPage(difference < 0 ? 1 : -1);
}, { passive: true });

document.addEventListener("keydown", (event) => {
  if (book.hidden || letterDialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "ArrowRight" || event.key === "PageDown") turnPage(1);
  if (event.key === "ArrowLeft" || event.key === "PageUp") turnPage(-1);
});

function openLetter(card) {
  window.clearTimeout(envelopeTimer);
  envelopeCards.forEach((item) => item.classList.remove("is-opening"));
  card.classList.add("is-opening");
  envelopeTimer = window.setTimeout(() => {
    letterTitle.textContent = card.dataset.letterTitle;
    letterKicker.textContent = card.dataset.letterKicker;
    letterMessage.textContent = card.dataset.letterMessage;
    const hasDiagnosis = Boolean(card.dataset.letterStory);
    letterStory.textContent = card.dataset.letterStory || "";
    letterStory.hidden = !hasDiagnosis;
    letterMessage.hidden = hasDiagnosis;
    letterDialog.setAttribute("aria-describedby", hasDiagnosis ? "letter-dialog-story" : "letter-dialog-message");
    diagnoseButton.hidden = !hasDiagnosis;
    diagnoseButton.setAttribute("aria-expanded", "false");
    prescriptionReveal.classList.remove("is-revealed");
    prescriptionReveal.setAttribute("aria-hidden", "true");
    letterPrescription.textContent = hasDiagnosis ? card.dataset.letterMessage : "";
    letterDialog.showModal();
    requestAnimationFrame(() => letterDialog.classList.add("is-open"));
  }, 520);
}

envelopeCards.forEach((card) => {
  card.addEventListener("click", () => openLetter(card));
});

diagnoseButton.addEventListener("click", () => {
  const isRevealed = diagnoseButton.getAttribute("aria-expanded") === "true";
  diagnoseButton.setAttribute("aria-expanded", String(!isRevealed));
  prescriptionReveal.classList.toggle("is-revealed", !isRevealed);
  prescriptionReveal.setAttribute("aria-hidden", String(isRevealed));
});

dialogClose.addEventListener("click", () => letterDialog.close());
letterDialog.addEventListener("click", (event) => {
  if (event.target === letterDialog) letterDialog.close();
});
letterDialog.addEventListener("close", () => {
  letterDialog.classList.remove("is-open");
  envelopeCards.forEach((card) => card.classList.remove("is-opening"));
});

function launchConfetti() {
  const colors = ["#e6bb70", "#df887c", "#f7e9c8", "#b58ba5", "#83a991", "#eea65c"];
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 88; index += 1) {
    const piece = document.createElement("span");
    const angle = Math.PI * 2 * index / 88;
    const distance = 8 + Math.random() * 16;
    piece.className = "confetti-piece";
    piece.style.backgroundColor = colors[index % colors.length];
    piece.style.left = `${50 + Math.cos(angle) * distance}%`;
    piece.style.top = `${48 + Math.sin(angle) * distance}%`;
    piece.style.animationDelay = `${Math.random() * 170}ms`;
    fragment.append(piece);
  }
  confettiContainer.replaceChildren(fragment);
  window.setTimeout(() => confettiContainer.replaceChildren(), 2400);
}

function blowOutCandles() {
  if (isBlowingOut) return;
  isBlowingOut = true;
  micButton.disabled = true;
  micStatus.textContent = "Your wish is on its way.";
  stopMicrophone();

  candles.forEach((candle) => candle.classList.add("is-out"));
  flameButtons.forEach((flame, index) => {
    flame.setAttribute("aria-label", `Candle ${index + 1} is out`);
  });
  cakeStage.classList.add("celebrating");
  successMessage.hidden = false;
  micStatus.textContent = "All eight candles are out. Wish Granted!";
  micButton.textContent = "Wish Granted!";
  launchConfetti();
}

async function listenForBlow() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!navigator.mediaDevices?.getUserMedia || !AudioContextClass) {
    micStatus.textContent = "Microphone listening is not supported here. Tap any flame to put out all eight.";
    return;
  }

  micButton.disabled = true;
  micStatus.textContent = "Requesting microphone permission.";
  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (isBlowingOut) {
      stopMicrophone();
      return;
    }
    audioContext = new AudioContextClass();
    await audioContext.resume();
    if (isBlowingOut) {
      stopMicrophone();
      return;
    }
    const source = audioContext.createMediaStreamSource(microphoneStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.15;
    source.connect(analyser);

    const timeData = new Uint8Array(analyser.fftSize);
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    let startedAt;
    micButton.innerHTML = '<span class="mic-icon" aria-hidden="true"></span> Listening';
    micStatus.textContent = "Blow toward your microphone to put out all eight candles.";

    const detectBlow = (timestamp) => {
      if (isBlowingOut) return;
      analyser.getByteTimeDomainData(timeData);
      analyser.getByteFrequencyData(frequencyData);
      let sumSquares = 0;
      for (const sample of timeData) {
        const amplitude = (sample - 128) / 128;
        sumSquares += amplitude * amplitude;
      }
      const volume = Math.sqrt(sumSquares / timeData.length);
      let highFrequencyEnergy = 0;
      let totalEnergy = 0;
      const highFrequencyStart = Math.floor(900 / (audioContext.sampleRate / analyser.fftSize));
      for (let index = 1; index < frequencyData.length; index += 1) {
        const energy = frequencyData[index] * frequencyData[index];
        totalEnergy += energy;
        if (index >= highFrequencyStart) highFrequencyEnergy += energy;
      }
      const highFrequencyRatio = totalEnergy ? highFrequencyEnergy / totalEnergy : 0;
      if (startedAt === undefined) startedAt = timestamp;
      const warmingUp = timestamp - startedAt < 700;
      if (!warmingUp && volume < noiseFloor * 1.5) noiseFloor = noiseFloor * 0.96 + volume * 0.04;
      const loudSpike = volume > 0.18;
      const airySpike = volume > Math.max(0.045, noiseFloor * 2.8) && highFrequencyRatio > 0.32;
      if (!warmingUp && (loudSpike || airySpike)) {
        blowOutCandles();
        return;
      }
      animationFrame = requestAnimationFrame(detectBlow);
    };
    animationFrame = requestAnimationFrame(detectBlow);
  } catch (error) {
    stopMicrophone();
    if (isBlowingOut) return;
    micButton.disabled = false;
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      micStatus.textContent = "Microphone permission was denied. Allow access in your browser, or tap any flame instead.";
    } else if (error instanceof DOMException && error.name === "NotFoundError") {
      micStatus.textContent = "No microphone was found. Connect one, or tap any flame instead.";
    } else {
      micStatus.textContent = "Could not start the microphone. Check browser permissions and try again, or tap any flame.";
    }
  }
}

micButton.addEventListener("click", listenForBlow);
flameButtons.forEach((flame) => flame.addEventListener("click", blowOutCandles));

pages.forEach((page, index) => {
  page.tabIndex = 0;
  page.setAttribute("aria-hidden", index === currentPage ? "false" : "true");
});
previousTurn.disabled = true;
nextTurn.disabled = pages.length < 2;
setPageOrder();
