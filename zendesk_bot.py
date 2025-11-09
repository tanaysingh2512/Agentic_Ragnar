from pinecone import Pinecone 
from pinecone_plugins.assistant.models.chat import Message 
import requests 


pc = Pinecone(api_key='pcsk_4LdCVu_7jaQYMbC7ShoNp7TVYawjz7BygYWUBdHbrEqD3XLmYzxpBQ12uMRYUL5XcDFGtf')
assistant = pc.assistant.Assistant(assistant_name="ragnar")


ZENDESK_DOMAIN = "uppsalauniversitet-61646.zendesk.com"
API_USER = "rishi.maniktala.7931@student.uu.se/token"
API_TOKEN = "jFCMXWe4jsAXmZtOCUkJ7nqMKerAGqNqhXUDp6xY"

def create_zendesk_ticket(subject, body, customer_name, customer_email):
    ticket = {
        "ticket": {
            "subject": subject,
            "comment": {"body": body},
            "requester": {"name": customer_name, "email": customer_email},
            "tags": ["ai-chatbot", "support"]
        }
    }
    resp = requests.post(
        f"https://{ZENDESK_DOMAIN}/api/v2/tickets.json",
        json=ticket,
        auth=(API_USER, API_TOKEN)
    )
    try:
        info = resp.json()
        if resp.status_code == 201 and "ticket" in info:
            print(f"\nZendesk ticket created! Ticket ID: {info['ticket']['id']}\n")
            return info["ticket"]["id"]
        else:
            print(f"\nFailed to create Zendesk ticket. Status: {resp.status_code}")
            print("Response:", info)
            return None
    except Exception as e:
        print("\nCould not parse Zendesk response:", e)
        return None

print("Chat with Ragnar (type 'exit' to quit):\n")
conversation = []
customer_name = "Customer" 
customer_email = "customer@example.com"

while True:
    user_input = input("You: ")
    if user_input.strip().lower() in ["exit", "quit"]:
        print("Ending chat.")
        break

    msg = Message(content=user_input)
    conversation.append(msg)
    resp = assistant.chat(messages=conversation)
    answer = resp["message"]["content"]
    print("Ragnar:", answer)

    
    if ("contact support" in answer.lower() or
        "i can't solve" in answer.lower() or
        "kan tyvärr inte hjälpa" in answer.lower()):
        subject = "Customer Needs Human Support (Auto)"
        body = f"User chat: {user_input}\nRagnar's answer: {answer}"
        ticket_id = create_zendesk_ticket(
            subject,
            body,
            customer_name,
            customer_email
        )
        if ticket_id:
            print(f"Your support request has been submitted to Impact Solution. Ticket ID: {ticket_id}")
        else:
            print("We could not create your support ticket automatically. Please contact support directly.")
