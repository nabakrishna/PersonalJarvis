document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("startButton");
    const responseBox = document.getElementById("responseBox");
    const chatBox = document.getElementById("chatBox");

    // Ensure SpeechRecognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser. Please use Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false; // Stops after a single speech input

    startButton.addEventListener("click", function () {
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
    });

    // Capture Speech
    recognition.onresult = async function (event) {
        const speechText = event.results[0][0].transcript.trim();

        // Display User Message
        addMessage(speechText, "user-message");

        responseBox.innerText = "🤖 Processing...";

        try {
            // Send speech text to AI API (Flask backend)
            const response = await fetch("/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: speechText }),
            });

            if (!response.ok) throw new Error(`Server Error: ${response.status}`);

            const result = await response.json();
            const aiResponse = result.response;

            // Display AI Response
            addMessage(aiResponse, "ai-message");

            // AI speaks the response
            speak(aiResponse);
        } catch (error) {
            console.error("AI Error:", error);
            responseBox.innerText = "❌ Error processing request.";
        }

        startButton.disabled = false;
    };

    recognition.onspeechend = function () {
        recognition.stop(); // Stop listening when user stops talking
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

