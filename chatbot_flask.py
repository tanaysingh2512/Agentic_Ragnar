# chatbot.py (Updated)
from flask import Flask, request, jsonify
from flask_cors import CORS
from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message

# --- Flask Setup ---
app = Flask(__name__)
# Enable CORS for all routes, allowing your frontend to connect
CORS(app) 

# --- Pinecone Setup ---
# Initialize Pinecone and your Assistant (use environment variables or securely load keys in a real app)
# NOTE: Replace with your actual API Key
PC_API_KEY = 'pcsk_4LdCVu_7jaQYMbC7ShoNp7TVYawjz7BygYWUBdHbrEqD3XLmYzxpBQ12uMRYUL5XcDFGtf' 
ASSISTANT_NAME = "ragnar"

try:
    pc = Pinecone(api_key=PC_API_KEY)
    assistant = pc.assistant.Assistant(assistant_name=ASSISTANT_NAME)
    print(f"Successfully connected to Pinecone Assistant: {ASSISTANT_NAME}")
except Exception as e:
    print(f"Error connecting to Pinecone: {e}")
    assistant = None

# --- API Endpoint ---
@app.route('/chat', methods=['POST'])
def chat_endpoint():
    # 1. Check if the assistant is ready
    if not assistant:
        return jsonify({"error": "Assistant not initialized"}), 500

    # 2. Get the message from the frontend's POST request
    data = request.get_json()
    user_message_content = data.get('message')
    
    if not user_message_content:
        return jsonify({"error": "No message provided"}), 400

    print(f"User message received: {user_message_content}")

    try:
        # 3. Create a Message object
        msg = Message(content=user_message_content)
        
        # 4. Call the Pinecone Assistant
        # NOTE: You'll typically want to pass conversation history here.
        # For simplicity, we'll just send the new message for now.
        resp = assistant.chat(messages=[msg])
        
        # 5. Extract the assistant's response
        assistant_reply = resp["message"]["content"]
        
        # 6. Return the response as JSON to the frontend
        return jsonify({"reply": assistant_reply})

    except Exception as e:
        print(f"Error during Pinecone chat: {e}")
        return jsonify({"error": "An error occurred during chat processing"}), 500

# --- Run the server ---
if __name__ == '__main__':
    # Running on localhost port 5000
    app.run(debug=True, port=5000)