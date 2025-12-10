# Running Emotion Service Locally

## Setup

1. Install dependencies:
```bash
pip install -r requirements_local.txt
```

2. Make sure PostgreSQL is running (from Docker):
```bash
docker-compose up -d db
```

3. Set your OpenAI API key:
```bash
# Option 1: Set environment variable
export OPENAI_API_KEY="your-api-key-here"

# Option 2: Or it will prompt you when you run the script
```

4. Run the service:
```bash
python run_local.py
```

The service will run on `http://localhost:8002`

## Notes

- The service will connect to the PostgreSQL database running in Docker
- Make sure the `uploads` directory exists or photos are accessible
- The service will automatically handle both Docker and local file paths

