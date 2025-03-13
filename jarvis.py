import os
import json
from flask import Flask, render_template, request, jsonify
import pyttsx3
import speech_recognition as sr
import openai
from flask_cors import CORS
import threading

# Initialize Flask App
app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

# Set OpenAI API Key (You must add this to your environment variables)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize Text-to-Speech engine
engine = pyttsx3.init()

# Function to Convert Text to Speech
def speak(text):
    """Convert text to speech using pyttsx3."""
    engine.say(text)
    engine.runAndWait()

# Function for Speech Recognition
def recognize_speech():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source)
        print("Listening... Speak now.")
        try:
            audio = recognizer.listen(source, timeout=5)
            return recognizer.recognize_google(audio).lower()
        except sr.UnknownValueError:
            return "Sorry, I couldn't understand that."
        except sr.RequestError:
            return "Network error. Please check your internet connection."

# Function to process user input using OpenAI
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

# Initialize Flask
app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/speak', methods=['POST'])
def process_speech():
    user_input = recognize_speech()
    if user_input:
        response = get_openai_response(user_input)
        speak(response)
        return jsonify({"response": response, "input": user_input})
    return jsonify({"response": "Sorry, I couldn't hear you. Try again."})

@app.route('/text', methods=['POST'])
def text_input():
    data = request.get_json()
    user_input = data.get("text", "")
    if user_input:
        response = get_ai_response(user_input)
        return jsonify({"response": response})
    return jsonify({"response": "No input received."})

@app.route('/voice', methods=['POST'])
def voice_input():
    user_speech = recognize_speech()
    if user_input:
        response = get_openai_response(user_speech)
        speak(response)  # Convert AI response to speech
        return jsonify({"response": response})
    return jsonify({"response": "No valid input received."})

@app.route('/')
def home():
    return render_template("index.html")

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

