import speech_recognition as sr
import pyttsx3
import datetime
import webbrowser
import openai
import requests

# Initialize OpenAI API (Replace 'YOUR_API_KEY' with your actual OpenAI API key)
OPENAI_API_KEY = "YOUR_API_KEY"
openai.api_key = OPENAI_API_KEY

# Function to speak

def speak(text):
    engine = pyttsx3.init()
    engine.say(text)
    engine.runAndWait()

# Function to recognize voice command
def listen():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening...")
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source)
    
    try:
        command = recognizer.recognize_google(audio).lower()
        print("You said:", command)
        return command
    except sr.UnknownValueError:
        speak("Sorry, I couldn't understand that.")
        return ""
    except sr.RequestError:
        speak("Network error. Please try again.")
        return ""

# Function to fetch AI response from OpenAI API
def get_ai_response(prompt):
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": "You are an AI assistant."},
                  {"role": "user", "content": prompt}]
    )
    return response["choices"][0]["message"]["content"]

# Function to fetch weather details
def get_weather(city):
    API_KEY = "YOUR_WEATHER_API_KEY"  # Replace with your OpenWeather API key
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
    response = requests.get(url).json()
    if response["cod"] == 200:
        temp = response["main"]["temp"]
        weather_desc = response["weather"][0]["description"]
        return f"The temperature in {city} is {temp}°C with {weather_desc}."
    else:
        return "Sorry, I couldn't get the weather details."

# Function to process commands
def respond_to_command(command):
    if "time" in command:
        now = datetime.datetime.now().strftime("%I:%M %p")
        speak(f"The time is {now}")
    elif "open youtube" in command:
        speak("Opening YouTube")
        webbrowser.open("https://www.youtube.com")
    elif "open google" in command:
        speak("Opening Google")
        webbrowser.open("https://www.google.com")
    elif "weather" in command:
        speak("Which city's weather do you want to check?")
        city = listen()
        weather_info = get_weather(city)
        speak(weather_info)
    elif "search" in command:
        query = command.replace("search", "").strip()
        speak(f"Searching for {query}")
        webbrowser.open(f"https://www.google.com/search?q={query}")
    elif "ai" in command or "chat" in command:
        speak("What do you want to ask?")
        question = listen()
        ai_response = get_ai_response(question)
        speak(ai_response)
    elif "exit" in command or "stop" in command:
        speak("Goodbye!")
        exit()
    else:
        speak("I'm not sure how to do that yet.")

# Main loop
if __name__ == "__main__":
    speak("Hello! How can I assist you today?")
    while True:
        command = listen()
        if command:
            respond_to_command(command)
