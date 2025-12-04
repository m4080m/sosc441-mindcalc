from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

# Load problem data
with open('addition_sets.json', 'r') as f:
    addition_sets = json.load(f)

with open('grid_problems.json', 'r') as f:
    grid_problems = json.load(f)

# Create results directory if it doesn't exist
os.makedirs('results', exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/problems', methods=['GET'])
def get_problems():
    """Return all problem sets and grid data"""
    return jsonify({
        'addition_sets': addition_sets,
        'grid_problems': grid_problems
    })

@app.route('/api/save_results', methods=['POST'])
def save_results():
    """Save experiment results to a JSON file"""
    data = request.json
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    student_id = data.get('student_id', 'unknown')
    filename = f"results/{student_id}_{timestamp}.json"
    
    # Save to file
    with open(filename, 'w') as f:
        json.dump(data, indent=2, fp=f)
    
    return jsonify({'success': True, 'filename': filename})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 53318))
    
    # Check if SSL certificates exist
    cert_file = 'certs/cert.pem'
    key_file = 'certs/key.pem'
    
    if os.path.exists(cert_file) and os.path.exists(key_file):
        # Run with HTTPS
        print(f"Starting HTTPS server on https://0.0.0.0:{port}")
        app.run(host='0.0.0.0', debug=False, port=port, 
                ssl_context=(cert_file, key_file))
    else:
        # Run with HTTP (for development)
        print(f"Warning: SSL certificates not found. Running HTTP server.")
        print(f"Run ./generate_cert.sh to create SSL certificates for HTTPS.")
        print(f"Starting HTTP server on http://0.0.0.0:{port}")
        app.run(host='0.0.0.0', debug=False, port=port)
