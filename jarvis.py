import os
import json
import logging
from flask import Flask, render_template, request, jsonify
import speech_recognition as sr
import openai
from flask_cors import CORS

# Initialize Flask App
app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
CORS(app)

# Configure Logging
logging.basicConfig(level=logging.INFO)

# Load OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("❌ OpenAI API Key is missing! Set OPENAI_API_KEY in environment variables.")

openai.api_key = OPENAI_API_KEY

# Function for Speech Recognition (Using Google Web Speech API)
def recognize_speech():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source)
        logging.info("🎤 Listening...")
        try:
            audio = recognizer.listen(source, timeout=5)
            text = recognizer.recognize_google(audio)
            return text.strip() if text else "Error: No speech detected."
        except sr.UnknownValueError:
            return "Error: Unable to understand speech."
        except sr.RequestError:
            return "Error: Network issue. Check your internet."

# Function to process user input using OpenAI GPT-4
def get_ai_response(user_input):
    if not user_input.strip():
        return "Error: No input provided."

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": user_input}
            ]
        )
        return response["choices"][0]["message"]["content"]
    except openai.error.OpenAIError as e:
        logging.error(f"❌ OpenAI API Error: {e}")
        return f"Error: OpenAI API issue - {str(e)}"
    except Exception as e:
        logging.error(f"❌ General Error: {e}")
        return f"Error: {str(e)}"

# Home Route
@app.route('/')
def index():
    return render_template("index.html")

# Speech Input Route (Voice to Text + AI Response)
@app.route('/speak', methods=['POST'])
def process_speech():
    logging.info("🔄 Processing Speech...")

    user_input = recognize_speech()
    logging.info(f"🎙 Recognized: {user_input}")

    if "Error" in user_input:
        return jsonify({"error": user_input}), 400

    ai_response = get_ai_response(user_input)
    logging.info(f"🤖 AI Response: {ai_response}")

    return jsonify({"response": ai_response, "input": user_input})

# Text Input Route (Text to AI Response)
@app.route('/text', methods=['POST'])
def text_input():
    try:
        data = request.get_json()
        user_input = data.get("text", "").strip()

        if not user_input:
            return jsonify({"error": "No input received."}), 400

        ai_response = get_ai_response(user_input)
        logging.info(f"📩 Text Input: {user_input} → 🤖 Response: {ai_response}")

        return jsonify({"response": ai_response})

    except Exception as e:
        logging.error(f"❌ Server Error: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Run the Flask app
if __name__ == '__main__':
    logging.info("🚀 Starting Flask server...")
    app.run(host="0.0.0.0", port=5000, debug=True)

