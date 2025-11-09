# chatbot.py (Updated)
from flask import Flask, request, jsonify
from flask_cors import CORS
from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message

# Flask Setup
app = Flask(__name__)
CORS(app) 

# Pinecone Setup
PC_API_KEY = 'pcsk_4LdCVu_7jaQYMbC7ShoNp7TVYawjz7BygYWUBdHbrEqD3XLmYzxpBQ12uMRYUL5XcDFGtf' 
ASSISTANT_NAME = "ragnar"

try:
    pc = Pinecone(api_key=PC_API_KEY)
    assistant = pc.assistant.Assistant(assistant_name=ASSISTANT_NAME)
    print(f"Successfully connected to Pinecone Assistant: {ASSISTANT_NAME}")
except Exception as e:
    print(f"Error connecting to Pinecone: {e}")
    assistant = None

# API Endpoint
@app.route('/chat', methods=['POST'])
def chat_endpoint():
    if not assistant:
        return jsonify({"error": "Assistant not initialized"}), 500

    data = request.get_json()
    user_message_content = data.get('message')
    
    if not user_message_content:
        return jsonify({"error": "No message provided"}), 400

    print(f"User message received: {user_message_content}")

    try:
        msg = Message(content=user_message_content)
        
        # 4. Call the Pinecone Assistant
        resp = assistant.chat(messages=[msg])
        
        assistant_reply = resp["message"]["content"]
        
        return jsonify({"reply": assistant_reply})

    except Exception as e:
        print(f"Error during Pinecone chat: {e}")
        return jsonify({"error": "An error occurred during chat processing"}), 500

# Run the server
if __name__ == '__main__':
    app.run(debug=True, port=5000)
