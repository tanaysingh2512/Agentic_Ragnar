#Impact Solution RAGNAR

Ragnar AI is an intelligent, voice-enabled support assistant designed to enhance customer service for a vending machine company or similar businesses. It combines live chat, voice interactions, and optional automation to provide 24/7 assistance, leveraging knowledge bases and AI-driven responses.
*Table of Contents*
Features
Installation
Usage
Project Ideas
Tech Stack

##Features
1. After-Hours Voice Assistant
Accepts incoming “calls” from users outside business hours.
Leverages Ragnar’s knowledge base to answer common queries accurately.
Can hand off to a human agent when queries cannot be resolved automatically.
Supports real-time speech-to-text (STT) and text-to-speech (TTS) streaming via ElevenLabs.

2. Chat-Based Support
Provides a web chat interface for text-based customer support.
Suggestion buttons guide users with predefined questions for quick responses.
Sends messages to an LLM backend for dynamic responses.
Optionally records and streams user audio for voice-enabled chat.

3. Zendesk Automation Agent (Optional)
Automatically creates and updates support tickets based on interactions.
Drafts follow-up emails for ongoing cases.
Reduces manual workload for support staff.

##Installation**

1. Clone
```
git clone <repo-url>
cd ragnar-ai
```

2. Create and activate virtual environment
```
python3 -m venv .venv
source .venv/bin/activate
```

3. Install Python dependencies
```
pip install -r requirements.txt
```

4. Install OS-level dependencies
```
brew install portaudio
pip install pyaudio
```
5. Run servers
```
# Chatbot backend
python chat_server.py

# Voicecall server
python voice.py
```
##Tech Stack
Frontend: HTML, TailwindCSS, JavaScript, Socket.IO

Backend: Python, Flask, Flask-SocketIO, ElevenLabs SDK

Audio: Web Audio API, MediaRecorder API, ElevenLabs TTS

Optional: Zendesk API for ticket automation

Environment: macOS / Linux, Python 3.13+
