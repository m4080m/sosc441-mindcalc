# Mental Arithmetic Experiment

A Flask web application for conducting mental arithmetic experiments with three different testing conditions.

## Features

### Step 1: Basic Addition
- 30 three-digit addition problems
- Measures time to first input and total completion time

### Step 2: Addition with Verbal Task
- 30 addition problems while speaking continuously
- Microphone monitoring with beep warnings for low volume
- Microphone check before starting

### Step 3: Addition with Grid Memorization
- Memorize a 5x5 grid for 5 seconds
- Solve addition problem
- Recall grid configuration
- Measures grid recall accuracy

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser to: http://localhost:5000

## Data Collection

- All timing data is measured in milliseconds
- Results are saved in the `results/` directory
- Each participant's data is saved as: `{student_id}_{timestamp}.json`

## Result Format

```json
{
  "student_id": "string",
  "name": "string",
  "description": "string",
  "timestamp": "ISO 8601 timestamp",
  "step1": [/* 30 problem results */],
  "step2": [/* 30 problem results */],
  "step3": [/* 30 problem results with grid data */]
}
```

Each problem result includes:
- `problem_number`: Problem sequence number (1-30)
- `a`, `b`: The two addends
- `correct_answer`: Sum of a + b
- `user_answer`: User's answer
- `is_correct`: Boolean accuracy
- `time_to_first_input`: Milliseconds until first keystroke
- `time_to_completion`: Milliseconds until Enter pressed
- `difficulty`: Difficulty rating from problem set
- `grid_problem`: (Step 3 only) Original grid values
- `grid_recall`: (Step 3 only) User's recalled grid state
- `grid_accuracy`: (Step 3 only) Percentage accuracy of recall

## Browser Requirements

- Modern browser with Web Audio API support (Chrome, Firefox, Edge, Safari)
- Microphone access required for Step 2
