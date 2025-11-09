import os
import sys
from elevenlabs.client import ElevenLabs
from elevenlabs.conversational_ai.conversation import Conversation
from elevenlabs.conversational_ai.default_audio_interface import DefaultAudioInterface

API_KEY = "sk_03f0c99bb4aa60916783c5cd745e9b5fe3a6b4f8798121f2"
AGENT_ID = "agent_9801k9hv74nsft591c9rjeq63c5v"

def run_conversation():
    client = ElevenLabs(api_key=API_KEY)

    audio_interface = DefaultAudioInterface()

    conversation = None

    def on_agent_response(text):
        print(f"Agent said: {text}")

    def on_user_transcript(text):
        nonlocal conversation
        print(f"You said: {text}")

        
        if any(word in text.lower() for word in ["goodbye", "bye", "exit", "stop talking", "end call"]):
            print("👋 Goodbye detected. Ending session…")
            if conversation:
                conversation.end_session()
            sys.exit(0)  

    conversation = Conversation(
        client=client,
        agent_id=AGENT_ID,
        requires_auth=True,
        audio_interface=audio_interface,
        callback_agent_response=on_agent_response,
        callback_user_transcript=on_user_transcript,
    )

    conversation.start_session()     # open connection
        # ⬅️ new: starts listening/talking loop

    print("🎧 Conversation started. Say 'goodbye' to end.")

    try:
        while True:
            pass  # or time.sleep(0.1)
    except KeyboardInterrupt:
        print("\n🛑 Keyboard interrupt — closing session…")
        conversation.end_session()

if __name__ == "__main__":
    run_conversation()