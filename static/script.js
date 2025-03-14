document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("startButton"); // Voice input button
    const sendButton = document.getElementById("sendButton");   // Send button (new)
    const userInput = document.getElementById("userInput");     // Text input field (new)
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
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let isProcessing = false;

    // Event Listener for Voice Input Button
    startButton.addEventListener("click", function () {
        if (isProcessing) return;

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
        if (isProcessing) return;

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

    // Process Speech or Text Query
    async function processSpeech(speechText) {
        isProcessing = true;
        addMessage("🤖 Thinking...", "ai-message");

        try {
            const response = await fetch("/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: speechText }),
            });

            if (!response.ok) throw new Error("Server Error: " + response.status);

            const result = await response.json();
            if (result.error) throw new Error(result.error);

            // Display AI Response
            updateLastMessage(result.response);
            await speak(result.response);

        } catch (error) {
            console.error("AI Error:", error);
            updateLastMessage("❌ " + error.message, true);
        } finally {
            isProcessing = false;
            startButton.innerText = "🎤 Start Listening";
            startButton.disabled = false;
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
            utterance.onend = resolve;
            utterance.onerror = () => {
                console.error("Speech synthesis error.");
                resolve();
            };

            speechSynthesis.speak(utterance);
        });
    }

    // Add Message to Chat Box
    function addMessage(text, className) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", className);
        messageDiv.innerText = text;

        // Add Copy Button for AI Messages
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
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Update Last Message (Replace "🤖 Thinking...")
    function updateLastMessage(newText, isError = false) {
        const messages = document.querySelectorAll(".chat-box .ai-message");
        if (messages.length > 0) {
            messages[messages.length - 1].innerText = newText;
            if (isError) messages[messages.length - 1].classList.add("error-message");
        }
    }

    // 📌 **NEW FEATURE**: Allow text input submission (ChatGPT-like input)
    sendButton.addEventListener("click", function () {
        let text = userInput.value.trim();
        if (text !== "") {
            addMessage(text, "user-message");
            userInput.value = "";
            processSpeech(text);
        }
    });

    userInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendButton.click();
    });
});
