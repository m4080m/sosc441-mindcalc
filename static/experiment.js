// Configuration
const PROBLEMS_PER_STEP = 20;
const GRID_SIZE = 4;

// Experiment state
let currentStep = 0;
let currentProblem = 0;
let problemData = null;
let gridData = null;
let stepOrder = []; // Randomized order of steps
let stepIndex = 0; // Current position in stepOrder
let results = {
    step1: [],
    step2: [],
    step3: []
};

// Timing variables
let problemShowTime = 0;
let firstInputTime = 0;

// Microphone monitoring
let audioContext = null;
let analyser = null;
let microphone = null;
let micStream = null;
let micCheckInterval = null;
let lowVolumeTimer = null;
const LOW_VOLUME_THRESHOLD = 30;
const LOW_VOLUME_WARNING_TIME = 2000; // 2 seconds

// Grid state
let currentGridProblem = null;
let gridRecallState = null;

// Initialize page
window.addEventListener('DOMContentLoaded', function() {
    const startDescription = document.getElementById('start-description');
    if (startDescription) {
        startDescription.textContent = `This experiment consists of 3 steps with ${PROBLEMS_PER_STEP} problems each.`;
    }
});

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('#container > div').forEach(div => {
        div.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

// Load problem data from server
async function loadProblems() {
    const response = await fetch('/api/problems');
    const data = await response.json();
    problemData = data.addition_sets;
    gridData = data.grid_problems;
}

// Start experiment
async function startExperiment() {
    await loadProblems();
    
    // Randomize step order
    stepOrder = [1, 2, 3];
    for (let i = stepOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [stepOrder[i], stepOrder[j]] = [stepOrder[j], stepOrder[i]];
    }
    
    stepIndex = 0;
    currentStep = stepOrder[stepIndex];
    currentProblem = 0;
    showStepIntro();
}

// Show step introduction
function showStepIntro() {
    const stepTitle = document.getElementById('step-title');
    const stepDescription = document.getElementById('step-description');
    const startButton = document.getElementById('start-step-button');
    
    if (currentStep === 1) {
        stepTitle.textContent = 'Basic Addition';
        stepDescription.textContent = `Solve ${PROBLEMS_PER_STEP} addition problems. Enter your answer and press Enter.`;
        startButton.textContent = 'Start';
        startButton.onclick = () => startStep(1);
    } else if (currentStep === 2) {
        stepTitle.textContent = 'Addition with Verbal Task';
        stepDescription.textContent = `Solve ${PROBLEMS_PER_STEP} addition problems while saying a word repeatedly. Your microphone will monitor your voice.`;
        startButton.textContent = 'Start Microphone Check';
        startButton.onclick = startMicCheck;
    } else if (currentStep === 3) {
        stepTitle.textContent = 'Addition with Grid Memorization';
        stepDescription.textContent = `Memorize a ${GRID_SIZE}x${GRID_SIZE} grid for 5 seconds, then solve the problem and recall the grid.`;
        startButton.textContent = 'Start';
        startButton.onclick = () => startStep(3);
    }
    
    showScreen('step-intro-screen');
}

// Start microphone check for Step 2
async function startMicCheck() {
    showScreen('mic-check-screen');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream = stream;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const micStatus = document.getElementById('mic-status');
        
        micCheckInterval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            
            if (average > LOW_VOLUME_THRESHOLD) {
                micStatus.textContent = `Microphone Active (Volume: ${Math.round(average)})`;
                micStatus.className = 'active';
            } else {
                micStatus.textContent = `Speak louder! (Volume: ${Math.round(average)})`;
                micStatus.className = 'warning';
            }
        }, 100);
    } catch (err) {
        alert('Microphone access denied. Please allow microphone access.');
        console.error('Microphone error:', err);
    }
}

// Finish microphone check and start Step 2
function finishMicCheck() {
    if (micCheckInterval) {
        clearInterval(micCheckInterval);
        micCheckInterval = null;
    }
    startStep(2);
}

// Monitor microphone during Step 2
function startMicMonitoring() {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkVolume = () => {
        if (currentStep !== 2 || currentProblem >= PROBLEMS_PER_STEP) {
            return; // Stop monitoring after Step 2
        }
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        if (average < LOW_VOLUME_THRESHOLD) {
            if (!lowVolumeTimer) {
                lowVolumeTimer = setTimeout(() => {
                    playBeep();
                    showLowVoiceWarning();
                    lowVolumeTimer = null;
                }, LOW_VOLUME_WARNING_TIME);
            }
        } else {
            if (lowVolumeTimer) {
                clearTimeout(lowVolumeTimer);
                lowVolumeTimer = null;
            }
            // Clear warning when voice is detected
            clearLowVoiceWarning();
        }
        
        setTimeout(checkVolume, 100);
    };
    
    checkVolume();
}

// Show low voice warning
function showLowVoiceWarning() {
    const infoDisplay = document.getElementById('info-display');
    if (infoDisplay) {
        infoDisplay.textContent = 'Voice is too low!';
        infoDisplay.style.color = 'red';
        infoDisplay.style.fontWeight = 'bold';
    }
}

// Clear low voice warning
function clearLowVoiceWarning() {
    const infoDisplay = document.getElementById('info-display');
    if (infoDisplay) {
        infoDisplay.textContent = '';
        infoDisplay.style.color = '';
        infoDisplay.style.fontWeight = '';
    }
}

// Play beep sound using Web Audio API
function playBeep() {
    const beepContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = beepContext.createOscillator();
    const gainNode = beepContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(beepContext.destination);
    
    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, beepContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, beepContext.currentTime + 0.5);
    
    oscillator.start(beepContext.currentTime);
    oscillator.stop(beepContext.currentTime + 0.5);
}

// Start a step
function startStep(step) {
    currentStep = step;
    currentProblem = 0;
    
    if (step === 2) {
        startMicMonitoring();
    }
    
    showNextProblem();
}

// Show next problem
function showNextProblem() {
    if (currentProblem >= PROBLEMS_PER_STEP) {
        // Step complete
        finishStep();
        return;
    }
    
    const problem = problemData[currentStep - 1].problems[currentProblem];
    
    if (currentStep === 3) {
        // Show grid first
        showGridMemorization();
    } else {
        // Show problem directly
        displayProblem(problem);
    }
}

// Display problem
function displayProblem(problem) {
    showScreen('problem-screen');
    
    const infoDisplay = document.getElementById('info-display');
    const problemDisplay = document.getElementById('problem-display');
    const answerInput = document.getElementById('answer-input');
    
    // Leave info display empty (will show warning in Step 2 if needed)
    infoDisplay.textContent = '';
    infoDisplay.style.color = '';
    infoDisplay.style.fontWeight = '';
    problemDisplay.textContent = `${problem.a} + ${problem.b}`;
    
    answerInput.value = '';
    answerInput.classList.add('hidden');
    
    // Record when problem is shown
    problemShowTime = Date.now();
    firstInputTime = 0;
    
    // Show input after a brief moment and focus it
    setTimeout(() => {
        answerInput.classList.remove('hidden');
        answerInput.focus();
    }, 100);
    
    // Listen for first input
    answerInput.oninput = handleFirstInput;
    answerInput.onkeypress = handleAnswerSubmit;
}

// Handle first input
function handleFirstInput(e) {
    if (firstInputTime === 0 && e.target.value.length > 0) {
        firstInputTime = Date.now();
    }
}

// Handle answer submit
function handleAnswerSubmit(e) {
    if (e.key === 'Enter') {
        const answerInput = document.getElementById('answer-input');
        const answer = parseInt(answerInput.value);
        const finishTime = Date.now();
        
        const problem = problemData[currentStep - 1].problems[currentProblem];
        const correctAnswer = problem.a + problem.b;
        
        // Record result
        const result = {
            problem_number: currentProblem + 1,
            a: problem.a,
            b: problem.b,
            correct_answer: correctAnswer,
            user_answer: answer || null,
            is_correct: answer === correctAnswer,
            time_to_first_input: firstInputTime ? firstInputTime - problemShowTime : null,
            time_to_completion: finishTime - problemShowTime,
            difficulty: problem.diff
        };
        
        if (currentStep === 1) {
            results.step1.push(result);
        } else if (currentStep === 2) {
            results.step2.push(result);
        } else if (currentStep === 3) {
            results.step3.push(result);
        }
        
        if (currentStep === 3) {
            // Show grid recall (don't increment counter yet)
            showGridRecall();
        } else {
            // Increment and show next problem for steps 1 and 2
            currentProblem++;
            showNextProblem();
        }
    }
}

// Show grid memorization (Step 3)
function showGridMemorization() {
    currentGridProblem = gridData[currentProblem];
    
    showScreen('grid-memorize-screen');
    
    const gridDisplay = document.getElementById('grid-display');
    gridDisplay.innerHTML = '';
    gridDisplay.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 60px)`;
    
    // Create grid with filled cells based on indices
    // currentGridProblem contains indices of cells that should be filled
    const filledIndices = new Set(currentGridProblem);
    const totalCells = GRID_SIZE * GRID_SIZE;
    
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        if (filledIndices.has(i)) {
            cell.classList.add('filled');
        }
        gridDisplay.appendChild(cell);
    }
    
    // Countdown timer
    let timeLeft = 5;
    const timerDisplay = document.getElementById('grid-timer');
    timerDisplay.textContent = timeLeft;
    
    const countdown = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(countdown);
            const problem = problemData[currentStep - 1].problems[currentProblem];
            displayProblem(problem);
        }
    }, 1000);
}

// Show grid recall
function showGridRecall() {
    showScreen('grid-recall-screen');
    
    const gridRecall = document.getElementById('grid-recall');
    gridRecall.innerHTML = '';
    gridRecall.className = 'grid-display';
    gridRecall.style.display = 'inline-grid';
    gridRecall.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 60px)`;
    gridRecall.style.gridGap = '5px';
    
    // Initialize recall state (all empty)
    const totalCells = GRID_SIZE * GRID_SIZE;
    gridRecallState = Array(totalCells).fill(false);
    
    // Create clickable grid
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = i;
        cell.onclick = toggleGridCell;
        gridRecall.appendChild(cell);
    }
}

// Toggle grid cell
function toggleGridCell(e) {
    const index = parseInt(e.target.dataset.index);
    gridRecallState[index] = !gridRecallState[index];
    e.target.classList.toggle('filled');
}

// Submit grid recall
function submitGridRecall() {
    // Calculate accuracy
    // currentGridProblem contains indices of cells that should be filled
    const filledIndices = new Set(currentGridProblem);
    const totalCells = GRID_SIZE * GRID_SIZE;
    let correct = 0;
    
    for (let i = 0; i < totalCells; i++) {
        const shouldBeFilled = filledIndices.has(i);
        const recalled = gridRecallState[i];
        
        if (recalled === shouldBeFilled) {
            correct++;
        }
    }
    
    const accuracy = (correct / totalCells) * 100;
    
    // Add grid recall data to the last problem result
    const lastResult = results.step3[results.step3.length - 1];
    lastResult.grid_problem = currentGridProblem;
    lastResult.grid_recall = gridRecallState;
    lastResult.grid_accuracy = accuracy;
    
    currentProblem++;
    showNextProblem();
}

// Finish step
function finishStep() {
    if (currentStep === 2) {
        // Stop microphone monitoring
        if (lowVolumeTimer) {
            clearTimeout(lowVolumeTimer);
            lowVolumeTimer = null;
        }
        
        // Stop microphone stream to remove browser indicator
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
    }
    
    stepIndex++;
    if (stepIndex < stepOrder.length) {
        // Move to next step in randomized order
        currentStep = stepOrder[stepIndex];
        showStepIntro();
    } else {
        // All steps complete, show info form
        showInfoForm();
    }
}

// Show info form
function showInfoForm() {
    showScreen('info-form-screen');
}

// VVIQ Survey questions
const vviqQuestions = [
    {
        scenario: "Imagine a relative or friend you see often",
        questions: [
            "The exact contours of face, head, shoulders and body.",
            "Characteristic poses of head, attitudes of body, etc.",
            "The precise carriage, length of step, etc., in walking.",
            "The different colors of some familiar clothes."
        ]
    },
    {
        scenario: "Visualize a rising sun",
        questions: [
            "The sun rising above the horizon into a hazy sky.",
            "The sky clears and surrounds the sun with blueness.",
            "Clouds: a storm blows up with flashes of lightning.",
            "A rainbow appears."
        ]
    },
    {
        scenario: "Imagine the front of a familiar shop",
        questions: [
            "The overall appearance of the shop from the opposite side of the road.",
            "A window display including colours, shapes and details of individual items.",
            "You are near the entrance: the colour, shape and details of the door.",
            "Inside at the counter: the assistant serves you and money changes hands."
        ]
    },
    {
        scenario: "Visualize a country scene",
        questions: [
            "The contours of the landscape (trees, mountains, lake).",
            "The colour and shape of the trees.",
            "The colour and shape of the lake.",
            "A strong wind blows on the trees and lake, causing waves."
        ]
    }
];

// Show VVIQ Survey
function showVVIQSurvey() {
    const studentId = document.getElementById('student-id').value.trim();
    const name = document.getElementById('name').value.trim();
    
    if (!studentId || !name) {
        alert('Please fill in Student ID and Name.');
        return;
    }
    
    showScreen('vviq-survey-screen');
    
    // Generate survey questions
    const questionsContainer = document.getElementById('vviq-questions');
    questionsContainer.innerHTML = '';
    
    vviqQuestions.forEach((section, sectionIndex) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'vviq-section';
        
        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = section.scenario;
        sectionDiv.appendChild(sectionTitle);
        
        section.questions.forEach((question, questionIndex) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'vviq-question';
            
            const questionText = document.createElement('p');
            questionText.textContent = question;
            questionDiv.appendChild(questionText);
            
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'vviq-options';
            
            for (let rating = 1; rating <= 5; rating++) {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'vviq-option';
                
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = `vviq_${sectionIndex}_${questionIndex}`;
                input.value = rating;
                input.id = `vviq_${sectionIndex}_${questionIndex}_${rating}`;
                input.required = true;
                
                const label = document.createElement('label');
                label.htmlFor = input.id;
                label.textContent = rating;
                
                optionDiv.appendChild(input);
                optionDiv.appendChild(label);
                optionsDiv.appendChild(optionDiv);
            }
            
            questionDiv.appendChild(optionsDiv);
            sectionDiv.appendChild(questionDiv);
        });
        
        questionsContainer.appendChild(sectionDiv);
    });
}

// Submit results
async function submitResults() {
    const studentId = document.getElementById('student-id').value.trim();
    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    
    if (!studentId || !name) {
        alert('Please fill in Student ID and Name.');
        return;
    }
    
    // Collect VVIQ responses
    const vviqResponses = [];
    let allAnswered = true;
    
    vviqQuestions.forEach((section, sectionIndex) => {
        const sectionResponses = {
            scenario: section.scenario,
            answers: []
        };
        
        section.questions.forEach((question, questionIndex) => {
            const radioName = `vviq_${sectionIndex}_${questionIndex}`;
            const selectedRadio = document.querySelector(`input[name="${radioName}"]:checked`);
            
            if (selectedRadio) {
                sectionResponses.answers.push({
                    question: question,
                    rating: parseInt(selectedRadio.value)
                });
            } else {
                allAnswered = false;
            }
        });
        
        vviqResponses.push(sectionResponses);
    });
    
    if (!allAnswered) {
        alert('Please answer all VVIQ survey questions.');
        return;
    }
    
    // Calculate VVIQ total score
    const vviqTotal = vviqResponses.reduce((total, section) => {
        return total + section.answers.reduce((sum, answer) => sum + answer.rating, 0);
    }, 0);
    
    const finalResults = {
        student_id: studentId,
        name: name,
        description: description,
        timestamp: new Date().toISOString(),
        step_order: stepOrder,
        step1: results.step1,
        step2: results.step2,
        step3: results.step3,
        vviq_survey: {
            responses: vviqResponses,
            total_score: vviqTotal
        }
    };
    
    try {
        const response = await fetch('/api/save_results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(finalResults)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showScreen('completion-screen');
        } else {
            alert('Error saving results. Please try again.');
        }
    } catch (err) {
        alert('Error saving results: ' + err.message);
        console.error('Save error:', err);
    }
}
