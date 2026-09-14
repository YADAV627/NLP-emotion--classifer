/* ============================================================
   EmotionAI — Frontend logic
   ------------------------------------------------------------
   This file is the ONLY place that talks to the backend.
   Change API_URL below when you deploy FastAPI (e.g. to Render).
   ============================================================ */

// 1. BACKEND URL -----------------------------------------------------------
// Local FastAPI (uvicorn) during development:
const API_URL = "https://nlp-emotion-classifer-1.onrender.com/predict";

// When you deploy the backend (e.g. on Render), replace the line above with
// your live URL, for example:
// const API_URL = "https://emotionai-backend.onrender.com/predict";


// 2. GRAB ELEMENTS -----------------------------------------------------------
const textInput      = document.getElementById("textInput");
const charCount       = document.getElementById("charCount");
const analyzeBtn      = document.getElementById("analyzeBtn");
const errorMsg        = document.getElementById("errorMsg");

const resultCard        = document.getElementById("resultCard");
const resultIcon        = document.getElementById("resultIcon");
const resultEmotion     = document.getElementById("resultEmotion");
const resultMessage     = document.getElementById("resultMessage");
const resultSourceText  = document.getElementById("resultSourceText");

const examplesGrid = document.getElementById("examplesGrid");

const apiStatusDot  = document.getElementById("apiStatusDot");
const apiStatusText = document.getElementById("apiStatusText");


// 3. EMOTION -> UI MAPPING ---------------------------------------------------
// Everything here is presentation only. The emotion itself always comes
// from the backend response — this object never decides the prediction.
const EMOTION_UI = {
  joy: {
    icon: "fa-solid fa-face-grin-beam",
    message: "You seem to be feeling joyful!",
  },
  sadness: {
    icon: "fa-solid fa-face-sad-tear",
    message: "The text expresses sadness.",
  },
  anger: {
    icon: "fa-solid fa-face-angry",
    message: "The text expresses anger.",
  },
  love: {
    icon: "fa-solid fa-heart",
    message: "The text expresses love.",
  },
  surprise: {
    icon: "fa-solid fa-face-surprise",
    message: "The text expresses surprise.",
  },
  fear: {
    icon: "fa-solid fa-face-flushed",
    message: "The text expresses fear.",
  },
};


// 4. CHARACTER COUNTER --------------------------------------------------------
textInput.addEventListener("input", () => {
  charCount.textContent = textInput.value.length;
  // Hide any previous error as soon as the user starts typing again
  hideError();
});


// 5. EXAMPLE SENTENCES ---------------------------------------------------------
examplesGrid.addEventListener("click", (event) => {
  const chip = event.target.closest(".example-chip");
  if (!chip) return;

  const text = chip.dataset.text;
  textInput.value = text;
  charCount.textContent = text.length;
  textInput.focus();
  hideError();
});


// 6. KEYBOARD SHORTCUT (Ctrl+Enter to analyze) ----------------------------------
textInput.addEventListener("keydown", (event) => {
  const isCtrlEnter = (event.ctrlKey || event.metaKey) && event.key === "Enter";
  if (isCtrlEnter) {
    event.preventDefault();
    handleAnalyzeClick();
  }
});


// 7. MAIN BUTTON ----------------------------------------------------------------
analyzeBtn.addEventListener("click", handleAnalyzeClick);

async function handleAnalyzeClick() {
  const userText = textInput.value.trim();

  // ---- Validate empty input ----
  if (!userText) {
    showError("Please enter some text before analyzing.");
    return;
  }

  hideError();
  setLoading(true);
  hideResult();

  try {
    const emotion = await predictEmotion(userText);
    showResult(userText, emotion);
  } catch (err) {
    console.error("Prediction failed:", err);
    showError(
      err.message === "Failed to fetch"
        ? "Could not reach the API. Make sure the FastAPI backend is running."
        : `Something went wrong: ${err.message}`
    );
  } finally {
    setLoading(false);
  }
}


// 8. CALL THE FASTAPI BACKEND ----------------------------------------------------
async function predictEmotion(userText) {
  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: userText,
    }),
  });

  if (!response.ok) {
    throw new Error(`API returned status ${response.status}`);
  }

  const data = await response.json();

  if (!data || !data.emotion) {
    throw new Error("API response did not contain an 'emotion' field.");
  }

  // The emotion always comes straight from the backend response.
  return data.emotion;
}


// 9. UI STATE HELPERS -------------------------------------------------------------
function setLoading(isLoading) {
  analyzeBtn.classList.toggle("is-loading", isLoading);
  analyzeBtn.disabled = isLoading;
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.add("is-visible");
}

function hideError() {
  errorMsg.classList.remove("is-visible");
  errorMsg.textContent = "";
}

function hideResult() {
  resultCard.classList.remove("is-visible");
}

function showResult(sourceText, emotion) {
  const normalized = String(emotion).toLowerCase().trim();
  const ui = EMOTION_UI[normalized] || {
    icon: "fa-solid fa-circle-question",
    message: `The text expresses ${normalized}.`,
  };

  // Text content — the emotion label is exactly what the API returned
  resultEmotion.textContent = normalized;
  resultMessage.textContent = ui.message;
  resultSourceText.textContent = `"${sourceText}"`;
  resultIcon.innerHTML = `<i class="${ui.icon}"></i>`;

  // Color theming: set a CSS variable the stylesheet uses for icon/glow/border
  resultCard.dataset.emotion = normalized;
  resultCard.style.setProperty(
    "--e-color",
    `var(--emotion-${normalized}, var(--emotion-default))`
  );

  resultCard.classList.add("is-visible");
  resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
}


// 10. OPTIONAL: LIGHT API REACHABILITY CHECK ----------------------------------------
// Purely cosmetic — lets the navbar show whether the backend seems reachable.
// If this fails, it does NOT block the "Analyze" button; predictEmotion()
// will still try and surface its own error if the API is really down.
(async function checkApiStatus() {
  try {
    const baseUrl = API_URL.replace(/\/predict\/?$/, "/");
    const response = await fetch(baseUrl, { method: "GET" });
    setApiStatus(response.ok || response.status === 404);
  } catch (err) {
    setApiStatus(false);
  }
})();

function setApiStatus(isOnline) {
  apiStatusDot.classList.toggle("is-online", isOnline);
  apiStatusDot.classList.toggle("is-offline", !isOnline);
  apiStatusText.textContent = isOnline ? "API connected" : "API unreachable";
}
