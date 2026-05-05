/**
 * EXCEL SHORTCUT LAB - Application Logic
 * Author: Emiliano Zamudio
 */

// ==========================================
// 1. STATE VARIABLES
// ==========================================
let questionsData = [];
let currentIndex = 0;
let currentStreak = 0;

// Load persisted data from localStorage (or default to 0/false)
let highestStreak = parseInt(localStorage.getItem('excel_highest_streak')) || 0;
let isDarkMode = localStorage.getItem('excel_dark_mode') === 'true';

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Set initial UI states based on localStorage
    document.getElementById('highest-streak').innerText = highestStreak;
    applyDarkModePreference();

    // Event listener for Dark Mode toggle
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    // Fetch the JSON data
    fetchQuestions();
});

// ==========================================
// 3. CORE LOGIC & RENDERING
// ==========================================
async function fetchQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error("Network response was not ok");
        
        questionsData = await response.json();
        renderQuestion(questionsData[currentIndex]);
    } catch (error) {
        console.error("Error loading questions:", error);
        document.getElementById('quiz-content').innerHTML = `
            <div style="color: #c5221f; padding: 20px; background: #fce8e6; border-radius: 6px;">
                <strong>Error:</strong> Could not load the dataset. If you are running this locally, make sure you are using a local server (like VS Code Live Server) so the fetch API can access the JSON file.
            </div>
        `;
    }
}

function renderQuestion(q) {
    const container = document.getElementById('quiz-content');
    
    // Update the difficulty level in the stats column
    document.getElementById('difficulty-level').innerText = q.difficulty;
    
    // Build the core HTML for the Scenario and Question
    let html = `
        <h3>Scenario Analysis:</h3>
        <p>${q.scenario}</p>
        <h4>${q.type === 'simulation' ? 'Task / Input Required:' : 'Question:'}</h4>
        <p><strong>${q.type === 'simulation' ? q.task : q.question}</strong></p>
    `;

    // Branch logic based on question type
    if (q.type === 'multiple-choice') {
        q.options.forEach(opt => {
            // Use backticks for explanation to avoid issues with single quotes in the text
            html += `<button class="choice-btn" onclick="handleMCQ('${opt}', '${q.answer}', \`${q.explanation}\`)">🗹 ${opt}</button>`;
        });
    } else if (q.type === 'simulation') {
        html += `
            <div class="formula-bar-sim">
                <label for="sim-input">Input (Formula Bar Equivalent): </label>
                <input type="text" id="sim-input" class="excel-input" placeholder="e.g. Ctrl + C" autocomplete="off">
                <button id="sim-submit-btn" onclick="handleSimulation('${q.expectedInput}', \`${q.explanation}\`)" class="excel-btn green-btn">Enter Data</button>
            </div>
        `;
    }

    // Inject into the DOM
    container.innerHTML = html;

    // If simulation, automatically focus the input box and allow pressing "Enter"
    if (q.type === 'simulation') {
        const inputField = document.getElementById('sim-input');
        inputField.focus();
        inputField.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                document.getElementById('sim-submit-btn').click();
            }
        });
    }
}

// ==========================================
// 4. ANSWER HANDLING & FEEDBACK
// ==========================================

// Global function for multiple choice
window.handleMCQ = function(selected, correct, explanation) {
    // Disable all buttons to prevent double-clicking
    const btns = document.querySelectorAll('.choice-btn');
    btns.forEach(b => b.disabled = true);
    
    showFeedback(selected === correct, explanation);
};

// Global function for simulation input
window.handleSimulation = function(expected, explanation) {
    const inputField = document.getElementById('sim-input');
    const userVal = inputField.value;
    
    // Disable input and button
    inputField.disabled = true;
    document.getElementById('sim-submit-btn').disabled = true;

    // Normalizing logic: Remove spaces and make lowercase so "Ctrl+C" matches "ctrl + c"
    const normalizedUser = userVal.toLowerCase().replace(/\s+/g, '');
    const normalizedExpected = expected.toLowerCase().replace(/\s+/g, '');
    
    showFeedback(normalizedUser === normalizedExpected, explanation);
};

function showFeedback(isCorrect, explanation) {
    const overlay = document.getElementById('feedback-overlay');
    const title = document.getElementById('feedback-title');
    const expText = document.getElementById('feedback-explanation');

    if (isCorrect) {
        // Handle Streak & High Score
        currentStreak++;
        if (currentStreak > highestStreak) {
            highestStreak = currentStreak;
            localStorage.setItem('excel_highest_streak', highestStreak);
            document.getElementById('highest-streak').innerText = highestStreak;
        }
        
        title.innerText = "✓ Cell Calculated Correctly";
        overlay.className = "correct-feedback"; // CSS class for green
    } else {
        // Reset Streak
        currentStreak = 0;
        
        title.innerText = "⨯ Calculation Error";
        overlay.className = "wrong-feedback"; // CSS class for red
    }

    // Update UI Stats
    document.getElementById('streak-counter').innerText = currentStreak;
    expText.innerText = explanation;
    
    // Show Overlay & Update Progress Bar
    overlay.classList.remove('hidden');
    updateProgress();
}

function updateProgress() {
    // Calculate percentage based on current index
    const percentage = ((currentIndex + 1) / questionsData.length) * 100;
    document.getElementById('progress-fill').style.width = percentage + '%';
}

// ==========================================
// 5. NAVIGATION & MODALS
// ==========================================

window.nextQuestion = function() {
    currentIndex++;
    
    // Hide the feedback overlay
    document.getElementById('feedback-overlay').classList.add('hidden');
    
    // Check if there are more questions
    if (currentIndex < questionsData.length) {
        renderQuestion(questionsData[currentIndex]);
    } else {
        showSummary();
    }
};

function showSummary() {
    document.getElementById('final-streak').innerText = highestStreak;
    document.getElementById('summary-modal').classList.remove('hidden');
}

window.restartQuiz = function() {
    // Reset App State
    currentIndex = 0;
    currentStreak = 0;
    
    // Reset UI State
    document.getElementById('streak-counter').innerText = 0;
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('summary-modal').classList.add('hidden');
    
    // Render first question
    renderQuestion(questionsData[currentIndex]);
};

// ==========================================
// 6. DARK MODE TOGGLE LOGIC
// ==========================================

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('excel_dark_mode', isDarkMode);
    applyDarkModePreference();
}

function applyDarkModePreference() {
    const toggleBtn = document.getElementById('dark-mode-toggle');
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        toggleBtn.innerText = "☀️ Tone Up"; // Icon change for light mode
    } else {
        document.body.classList.remove('dark-mode');
        toggleBtn.innerText = "🌙 Tone Down"; // Icon change for dark mode
    }
}