# Mental Arithmetic Experiment

A Flask web application for conducting mental arithmetic experiments with three different testing conditions.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser to: http://localhost:53318

## Data Collection

- All timing data is measured in milliseconds
- Results are saved in the `results/` directory
- Each participant's data is saved as: `{student_id}_{timestamp}.json`


## Browser Requirements

- Modern browser with Web Audio API support (Chrome, Firefox, Edge, Safari)
- Microphone access required for Step 2
