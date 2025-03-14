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

    let isProcessing = false; // Prevent multiple requests

    // Event Listener for Start Button
    startButton.addEventListener("click", function () {
        if (isProcessing) return; // Prevent spam clicking

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
        if (isProcessing) return; // Prevent multiple API calls

        let speechText = event.results[0][0].transcript.trim();
        console.log("User Said:", speechText);

        // Display User Speech
        addMessage(speechText, "user-message");

        // Send Speech to Backend API
        await processSpeech(speechText);
    };

    // Handle Recognition End
    recognition.onend = function () {
        if (!isProcessing) {
            startButton.disabled = false;
            startButton.innerText = "🎤 Start Listening";
        }
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
        addMessage("❌ Error: " + event.error, "error-message");
        startButton.disabled = false;
        startButton.innerText = "🎤 Start Listening";
    };

    // Send Speech to Flask Backend
    async function processSpeech(speechText) {
        isProcessing = true; // Lock processing
        startButton.innerText = "🤖 Thinking..."; // Indicate processing
        addMessage("🤖 Thinking...", "ai-message");

        try {
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
            updateLastMessage(result.response);
            await speak(result.response); // AI Reads Out Response

        } catch (error) {
            console.error("AI Error:", error);
            updateLastMessage("❌ " + error.message, true);
        } finally {
            isProcessing = false;
            startButton.innerText = "🎤 Start Listening";
            startButton.disabled = false;

            // Restart recognition after AI speaks
            setTimeout(() => recognition.start(), 1500);
        }
    }

    // AI Text-to-Speech
    async function speak(text) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                console.error("Speech synthesis not supported.");
                resolve();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = resolve; // Ensure function waits until speech ends
            utterance.onerror = () => {
                console.error("Speech synthesis error.");
                resolve();
            };

            speechSynthesis.speak(utterance);
        });
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

    // Function to Update Last Message (for loading animation replacement)
    function updateLastMessage(newText, isError = false) {
        const messages = document.querySelectorAll(".chat-box .ai-message");
        if (messages.length > 0) {
            messages[messages.length - 1].innerText = newText;
            if (isError) messages[messages.length - 1].classList.add("error-message");
        }
    }
});


