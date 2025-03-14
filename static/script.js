document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("startButton");
    
    if (startButton) {
        startButton.addEventListener("click", function () {
            console.log("Start Listening button clicked!");
            startListening();
        });
    } else {
        console.error("Button with ID 'startButton' not found!");
    }
});

function startListening() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support microphone access.");
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            console.log("Microphone access granted!");
            startSpeechRecognition();
        })
        .catch(error => {
            console.error("Microphone access denied:", error);
            alert("Please allow microphone access.");
        });
}

function startSpeechRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";

    recognition.onstart = function () {
        console.log("Listening...");
    };

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        console.log("You said:", transcript);
        document.getElementById("response").innerText = "You said: " + transcript;
        
        // Send recognized text to Flask backend
        sendToBackend(transcript);
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
    };

    recognition.start();
}

function sendToBackend(text) {
    fetch('/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Jarvis Response:", data.response);
        document.getElementById("response").innerText = "Jarvis: " + data.response;
    })
    .catch(error => console.error("Error:", error));
}
