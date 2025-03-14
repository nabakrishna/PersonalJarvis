document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("startButton");
    const chatBox = document.querySelector(".chat-box");

    // Check SpeechRecognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser. Please use Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false; // Stops after one sentence
    recognition.maxAlternatives = 1;

    // Event Listener for Start Button
    startButton.addEventListener("click", function () {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                console.log("🎤 Microphone access granted.");
                startListening();
            })
            .catch((error) => {
                alert("Microphone access denied! Please allow access.");
                console.error("❌ Mic Error:", error);
            });
    });

    // Start Speech Recognition
    function startListening() {
        startButton.disabled = true;
        startButton.innerText = "🎙 Listening...";
        recognition.start();
    }

    // Process Speech Recognition Result
    recognition.onresult = async function (event) {
        let speechText = event.results[0][0].transcript.trim();
        console.log("User Said:", speechText);

        // Display User Speech
        addMessage(speechText, "user-message");

        // Send Speech to Backend API
        await processSpeech(speechText);
    };

    // Handle Recognition End
    recognition.onend = function () {
        startButton.disabled = false;
        startButton.innerText = "🎤 Start Listening";
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
        addMessage("❌ Error: " + event.error, "error-message");
    };

    // Send Speech to Flask Backend
    async function processSpeech(speechText) {
        try {
            // Show Typing Animation
            addMessage("🤖 Thinking...", "ai-message");

            const response = await fetch("/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: speechText }),
            });

            if (!response.ok) {
                throw new Error("Server Error: " + response.status);
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            // Display AI Response
            addMessage(result.response, "ai-message");
            speak(result.response); // AI Reads Out Response
        } catch (error) {
            console.error("AI Error:", error);
            addMessage("❌ " + error.message, "error-message");
        }
    }

    // AI Text-to-Speech
    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    }

    // Function to Add Messages to Chat Box
    function addMessage(text, className) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", className);
        messageDiv.innerText = text;

        // Copy Button for AI Response
        if (className === "ai-message") {
            const copyBtn = document.createElement("button");
            copyBtn.classList.add("copy-btn");
            copyBtn.innerText = "📋 Copy";
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(text);
                copyBtn.innerText = "✅ Copied!";
                setTimeout(() => (copyBtn.innerText = "📋 Copy"), 2000);
            };
            messageDiv.appendChild(copyBtn);
        }

        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
    }
});

