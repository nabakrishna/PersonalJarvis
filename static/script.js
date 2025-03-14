document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("startButton");
    const responseBox = document.getElementById("response");
    const chatBox = document.querySelector(".chat-box");

    // Ensure SpeechRecognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser. Please use Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true; // Allows longer input
    recognition.maxAlternatives = 1;

    let speechText = "";

    startButton.addEventListener("click", function () {
        try {
            // Request Microphone Permission
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    responseBox.innerText = "🎙 Listening... Speak now!";
                    startButton.disabled = true;
                    recognition.start();
                })
                .catch((error) => {
                    alert("Microphone access denied! Please allow access.");
                    console.error("Mic Error:", error);
                });
        } catch (error) {
            console.error("Speech recognition error:", error);
            responseBox.innerText = "❌ Error: " + error.message;
        }
    });

    // Capture Speech
    recognition.onresult = function (event) {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            speechText += event.results[i][0].transcript + " ";
        }

        if (speechText.split(/\s+/).length >= 50) {
            recognition.stop(); // Stop if too long
        }
    };

    recognition.onspeechend = function () {
        recognition.stop(); // Stop listening when user stops talking
    };

    recognition.onend = async function () {
        startButton.disabled = false;
        responseBox.innerHTML = "<span class='typing-animation'></span>";

        try {
            // Send input to AI API (Flask backend)
            const response = await fetch("/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: speechText.trim() }),
            });

            const result = await response.json();
            const aiResponse = result.response;

            // Display User Message
            addMessage(speechText, "user-message");

            // Display AI Response
            setTimeout(() => {
                addMessage(aiResponse, "ai-message");
                speak(aiResponse); // AI speaks
            }, 1000);

        } catch (error) {
            console.error("AI Error:", error);
            responseBox.innerText = "❌ Failed to process your request.";
        }

        startButton.disabled = false; // Re-enable button
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
        responseBox.innerText = "❌ Error: " + event.error;
        startButton.disabled = false;
    };

    // Function to Make AI Speak
    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    }

    // Function to Add Messages to Chat
    function addMessage(text, className) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", className);
        messageDiv.innerText = text;

        // Add Copy Button for AI Response
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
