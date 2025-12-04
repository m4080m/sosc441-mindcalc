# Mental Arithmetic Experiment

A Flask web application for conducting mental arithmetic experiments with three different testing conditions.

## Quick Start with Docker (Recommended)

**HTTPS is required for microphone access!**

1. Generate SSL certificate:
```bash
./generate_cert.sh
```

2. Start the application:
```bash
./deploy.sh start
```

3. Open your browser to: **https://localhost:53318**
   - Accept the self-signed certificate warning
   - Grant microphone permission when prompted

For detailed Docker deployment instructions, see [DOCKER_DEPLOY.md](DOCKER_DEPLOY.md)

## Development Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Generate SSL certificate (for microphone access):
```bash
./generate_cert.sh
```

3. Run the application:
```bash
python app.py
```

4. Open your browser to: **https://localhost:53318**

**Note:** Modern browsers require HTTPS to access the microphone. See [HTTPS_SETUP.md](HTTPS_SETUP.md) for details.

## Data Collection

- All timing data is measured in milliseconds
- Results are saved in the `results/` directory
- Each participant's data is saved as: `{student_id}_{timestamp}.json`


## Browser Requirements

- Modern browser with Web Audio API support (Chrome, Firefox, Edge, Safari)
- Microphone access required for Step 2
