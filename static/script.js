const API_base = "http://127.0.0.1:8000";
const form = document.getElementById("prediction-form");
const errorMessage = document.getElementById("error-message");
const emptyResult = document.getElementById("empty-result");
const scoreResult = document.getElementById("score-result");
const sampleButton = document.getElementById("sample-button");

const sample = {
  age: 21, gender: "Female", country: "India", academic_level: "Undergraduate",
  most_used_platform: "Instagram", purpose_of_use: "Entertainment",
  avg_daily_usage_hours: 4, daily_unlocks: 35, study_hours: 5,
  physical_activity_hours: 1, sleep_hours_per_night: 7, stress_level: "Medium"
};

function setValues(values) {
  Object.entries(values).forEach(([key, value]) => {
    const input = document.getElementById(key);
    if (input) input.value = value;
  });
  document.querySelectorAll('input[type="range"]').forEach(updateRange);
}

function updateRange(eventOrInput) {
  const input = eventOrInput.target || eventOrInput;
  const output = document.getElementById(`${input.id}_value`);
  if (output) output.textContent = `${input.value} ${input.value === "1" ? "hr" : "hrs"}`;
}

document.querySelectorAll('input[type="range"]').forEach((input) => {
  input.addEventListener("input", updateRange);
  updateRange(input);
});

sampleButton.addEventListener("click", () => {
  setValues(sample);
  errorMessage.textContent = "Example answers added. Change any of them to match your day.";
});

form.addEventListener("reset", () => {
  setTimeout(() => {
    document.querySelectorAll('input[type="range"]').forEach(updateRange);
    errorMessage.textContent = "";
    scoreResult.classList.add("hidden");
    emptyResult.classList.remove("hidden");
  });
});

document.getElementById("new-assessment").addEventListener("click", () => {
  form.reset();
  window.scrollTo({top: 0, behavior: "smooth"});
});

function payloadFromForm() {
  const data = Object.fromEntries(new FormData(form).entries());
  ["age", "daily_unlocks"].forEach((key) => { data[key] = Number(data[key]); });
  ["avg_daily_usage_hours", "study_hours", "physical_activity_hours", "sleep_hours_per_night"]
    .forEach((key) => { data[key] = Number(data[key]); });
  return data;
}

function showScore(score) {
  const value = Math.max(0, Math.min(10, Number(score)));
  document.getElementById("score").textContent = value.toFixed(2);
  document.getElementById("score-meter-fill").style.width = `${value * 10}%`;
  document.getElementById("score-summary").textContent =
    value >= 7 ? "Your responses point to some positive wellbeing habits. Keep making time for what helps you feel well." :
    value >= 4 ? "Your responses suggest there may be room for a little more balance in your routine." :
    "Your responses suggest you could use some extra support. Consider reaching out to someone you trust.";
  emptyResult.classList.add("hidden");
  scoreResult.classList.remove("hidden");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.textContent = "";
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "Checking in…";
  try {
    const response = await fetch(`${API_base}/predict`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payloadFromForm())
    });
    const result = await response.json();
    if (!response.ok) {
      const detail = Array.isArray(result.detail) ? result.detail[0]?.msg : result.detail;
      throw new Error(detail || "We couldn't complete your check-in. Please try again.");
    }
    showScore(result.predicted_mental_health_score);
  } catch (error) {
    errorMessage.textContent = error.message.includes("Failed to fetch")
      ? "We could not complete your check-in right now. Please try again in a moment."
      : "Please check your answers and try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Check my mental wellbeing";
  }
});
