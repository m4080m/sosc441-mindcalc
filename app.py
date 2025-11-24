from flask import Flask, render_template, request, jsonify, session, send_file
import json
import os
import random
from datetime import datetime
from gtts import gTTS
import uuid

app = Flask(__name__)
app.secret_key = 'mindcalc_secret_key_2024'

# Load addition problems
with open('addition_sets.json', 'r') as f:
    ADDITION_DATA = json.load(f)

@app.route('/')
def index():
    """Main experiment page"""
    # Initialize session with unique ID for this participant
    session['participant_id'] = str(uuid.uuid4())
    session['timing_data'] = []
    return render_template('index.html')

@app.route('/get_problems/<int:step>')
def get_problems(step):
    """Get problems for a specific step (1, 2, or 3)"""
    if 1 <= step <= 3:
        problems = ADDITION_DATA[step - 1]['problems']
        return jsonify(problems)
    return jsonify({'error': 'Invalid step'}), 400

@app.route('/generate_audio', methods=['POST'])
def generate_audio():
    """Generate fake problem audio for step 2"""
    data = request.json
    a = data.get('a', random.randint(100, 999))
    b = data.get('b', random.randint(100, 999))
    
    text = f"{a} plus {b}"
    
    # Generate unique filename
    filename = f"audio_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join('static', 'audio', filename)
    
    # Ensure directory exists
    os.makedirs(os.path.join('static', 'audio'), exist_ok=True)
    
    # Generate audio
    tts = gTTS(text=text, lang='en', slow=False)
    tts.save(filepath)
    
    return jsonify({'audio_url': f'/static/audio/{filename}'})

@app.route('/save_timing', methods=['POST'])
def save_timing():
    """Save timing data for a single problem"""
    data = request.json
    if 'timing_data' not in session:
        session['timing_data'] = []
    
    session['timing_data'].append(data)
    session.modified = True
    return jsonify({'status': 'success'})

@app.route('/save_results', methods=['POST'])
def save_results():
    """Save final results with participant info"""
    data = request.json
    
    # Create results directory if it doesn't exist
    os.makedirs('results', exist_ok=True)
    
    # Prepare final data structure
    results = {
        'participant_id': session.get('participant_id'),
        'student_id': data.get('student_id'),
        'name': data.get('name'),
        'description': data.get('description'),
        'timestamp': datetime.now().isoformat(),
        'timing_data': session.get('timing_data', [])
    }
    
    # Save to file with unique filename
    filename = f"results_{session.get('participant_id')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    filepath = os.path.join('results', filename)
    
    with open(filepath, 'w') as f:
        json.dump(results, f, indent=2)
    
    return jsonify({'status': 'success', 'filename': filename})

@app.route('/cleanup_audio', methods=['POST'])
def cleanup_audio():
    """Clean up generated audio files"""
    data = request.json
    audio_url = data.get('audio_url')
    
    if audio_url:
        filepath = audio_url.replace('/static/', 'static/')
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except:
                pass
    
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('static/audio', exist_ok=True)
    os.makedirs('results', exist_ok=True)
    
    app.run(debug=True, port=5000)
