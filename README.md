# Mental Arithmetic Experiment Web App

A Flask-based web application to measure mental arithmetic performance across three experimental conditions.

## Features

- **Step 1**: Normal problem display
- **Step 2**: Audio interruptions with random spoken problems (using gTTS)
- **Step 3**: Visual interruptions with moving text and random shapes

## Measurements

For each problem, the app measures:
- Time from problem display to first input (reaction time)
- Time from problem display to answer submission (total time)
- Input duration
- User's answer vs. correct answer

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser and navigate to:
```
http://localhost:5000
```

## Data Collection

- Each participant's results are saved in the `results/` directory
- Data is saved as JSON with timing information for all 60 problems (20 per step)
- Files include participant ID, student ID, name, methodology description, and all timing data

## Experiment Structure

1. 20 problems with normal display
2. 20 problems with audio interruptions
3. 20 problems with visual interruptions
4. Post-experiment questionnaire

All problems are loaded from `addition_sets.json`.
