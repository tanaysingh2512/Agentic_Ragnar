from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import speech_recognition as sr
from gtts import gTTS
from pydub import AudioSegment
import tempfile
import os

app = Flask(__name__)
CORS(app)

@app.route("/voice", methods=["POST"])
def voice_endpoint():
    if "audio" not in request.files:
        return jsonify({"error": "No audio uploaded"}), 400

    audio_file = request.files["audio"]
    temp_path = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name
    audio_file.save(temp_path)

    try:
        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_path) as source:
            audio = recognizer.record(source)
        text = recognizer.recognize_google(audio)
        print("You said:", text)

        # convert text to speech
        tts = gTTS(text=f"You said: {text}")
        output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3").name
        tts.save(output_path)

        return send_file(output_path, mimetype="audio/mpeg")

    except Exception as e:
        print("Error processing audio:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
