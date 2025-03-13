import os
import json
from flask import Flask, render_template, request, jsonify
import speech_recognition as sr
import openai
from flask_cors import CORS

# Initialize Flask App
app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
CORS(app)

# Set OpenAI API Key (You must add this to your environment variables)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Function for Speech Recognition (Using Google Web Speech API)
def recognize_speech():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source)
        print("Listening... Speak now.")
        try:
            audio = recognizer.listen(source, timeout=5)
            return recognizer.recognize_google(audio)  # No need for PyAudio
        except sr.UnknownValueError:
            return "Sorry, I couldn't understand that."
        except sr.RequestError:
            return "Network error. Please check your internet connection."

# Function to process user input using OpenAI GPT-4
def get_ai_response(user_input):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": user_input}
            ]
        )
        return response["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error: {str(e)}"

# Home Route
@app.route('/')
def index():
    return render_template("index.html")

# Speech Input Route (Voice to Text + AI Response)
@app.route('/speak', methods=['POST'])
def process_speech():
    user_input = recognize_speech()
    if user_input:
        response = get_ai_response(user_input)
        return jsonify({"response": response, "input": user_input})
    return jsonify({"response": "Sorry, I couldn't hear you. Try again."})

# Text Input Route (Text to AI Response)
@app.route('/text', methods=['POST'])
def text_input():
    data = request.get_json()
    user_input = data.get("text", "")
    if user_input:
        response = get_ai_response(user_input)
        return jsonify({"response": response})
    return jsonify({"response": "No input received."})

# Voice Input Route (Voice to AI Response)
@app.route('/voice', methods=['POST'])
def voice_input():
    user_speech = recognize_speech()
    if user_speech:
        response = get_ai_response(user_speech)
        return jsonify({"response": response})
    return jsonify({"response": "No valid input received."})

# Run the Flask app
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

