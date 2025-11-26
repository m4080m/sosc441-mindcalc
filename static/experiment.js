// Configuration
const PROBLEMS_PER_STEP = 5;

// Experiment state
let currentStep = 0;
let currentProblem = 0;
let problemData = null;
let gridData = null;
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
let micCheckInterval = null;
let lowVolumeTimer = null;
const LOW_VOLUME_THRESHOLD = 30;
const LOW_VOLUME_WARNING_TIME = 2000; // 2 seconds

// Grid state
let currentGridProblem = null;
let gridRecallState = null;

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
    currentStep = 1;
    currentProblem = 0;
    showStepIntro();
}

// Show step introduction
function showStepIntro() {
    const stepTitle = document.getElementById('step-title');
    const stepDescription = document.getElementById('step-description');
    const startButton = document.getElementById('start-step-button');
    
    if (currentStep === 1) {
        stepTitle.textContent = 'Step 1: Basic Addition';
        stepDescription.textContent = `Solve ${PROBLEMS_PER_STEP} addition problems. Enter your answer and press Enter.`;
        startButton.textContent = 'Start Step 1';
        startButton.onclick = () => startStep(1);
    } else if (currentStep === 2) {
        stepTitle.textContent = 'Step 2: Addition with Verbal Task';
        stepDescription.textContent = `Solve ${PROBLEMS_PER_STEP} addition problems while saying a word repeatedly. Your microphone will monitor your voice.`;
        startButton.textContent = 'Start Microphone Check';
        startButton.onclick = startMicCheck;
    } else if (currentStep === 3) {
        stepTitle.textContent = 'Step 3: Addition with Grid Memorization';
        stepDescription.textContent = 'Memorize a 5x5 grid for 5 seconds, then solve the problem and recall the grid.';
        startButton.textContent = 'Start Step 3';
        startButton.onclick = () => startStep(3);
    }
    
    showScreen('step-intro-screen');
}

// Start microphone check for Step 2
async function startMicCheck() {
    showScreen('mic-check-screen');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        alert('Microphone access denied. Please allow microphone access for Step 2.');
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
                    lowVolumeTimer = null;
                }, LOW_VOLUME_WARNING_TIME);
            }
        } else {
            if (lowVolumeTimer) {
                clearTimeout(lowVolumeTimer);
                lowVolumeTimer = null;
            }
        }
        
        setTimeout(checkVolume, 100);
    };
    
    checkVolume();
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
    
    infoDisplay.textContent = `Step ${currentStep} - Problem ${currentProblem + 1}/${PROBLEMS_PER_STEP}`;
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
    
    // Create 5x5 grid with filled cells based on indices
    // currentGridProblem contains indices (0-24) of cells that should be filled
    const filledIndices = new Set(currentGridProblem);
    
    for (let i = 0; i < 25; i++) {
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
    gridRecall.style.gridTemplateColumns = 'repeat(5, 60px)';
    gridRecall.style.gridGap = '5px';
    
    // Initialize recall state (all empty)
    gridRecallState = Array(25).fill(false);
    
    // Create clickable grid
    for (let i = 0; i < 25; i++) {
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
    let correct = 0;
    
    for (let i = 0; i < 25; i++) {
        const shouldBeFilled = filledIndices.has(i);
        const recalled = gridRecallState[i];
        
        if (recalled === shouldBeFilled) {
            correct++;
        }
    }
    
    const accuracy = (correct / 25) * 100;
    
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
    }
    
    if (currentStep < 3) {
        currentStep++;
        showStepIntro();
    } else {
        // All steps complete, show info form
        showInfoForm();
        
        // Clean up microphone
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
    }
}

// Show info form
function showInfoForm() {
    showScreen('info-form-screen');
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
    
    const finalResults = {
        student_id: studentId,
        name: name,
        description: description,
        timestamp: new Date().toISOString(),
        step1: results.step1,
        step2: results.step2,
        step3: results.step3
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
