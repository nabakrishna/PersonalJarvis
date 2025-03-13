from flask import Flask, render_template, request, jsonify
import speech_recognition as sr
import pyttsx3
import openai

app = Flask(__name__)

openai.api_key = "YOUR_OPENAI_API_KEY"
engine = pyttsx3.init()

def speak(text):
    engine.say(text)
    engine.runAndWait()

def recognize_speech():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source)
        try:
            return recognizer.recognize_google(audio).lower()
        except sr.UnknownValueError:
            return "Sorry, I couldn't understand that."
        except sr.RequestError:
            return "Network error. Please check your internet connection."

def ai_response(user_input):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful AI assistant."},
            {"role": "user", "content": user_input}
        ]
    )
    return response["choices"][0]["message"]["content"]

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/process', methods=['POST'])
def process_speech():
    command = recognize_speech()
    ai_reply = ai_response(command)
    speak(ai_reply)
    return jsonify({"user": command, "Jarvis": ai_reply})

if __name__ == '__main__':
    app.run(debug=True)

