
document.addEventListener("DOMContentLoaded", function () {
    const micButton = document.getElementById("micButton");
    const sendButton = document.getElementById("sendButton");
    const userInput = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");
    const loader = document.getElementById("loader");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
    } else {
        alert("Speech recognition is not supported in this browser. Please use Chrome.");
    }

    let isProcessing = false;

    micButton.addEventListener("click", function () {
        if (!recognition || isProcessing) return;

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                micButton.disabled = true;
                micButton.innerHTML = "🎙 Listening...";
                recognition.start();
            })
            .catch((error) => {
                alert("Microphone access denied! Please allow access.");
                console.error("Mic Error:", error);
            });
    });

    recognition.onresult = async function (event) {
        let speechText = event.results[0][0].transcript.trim();
        addMessage(speechText, "user-message");
        await processMessage(speechText);
    };

    recognition.onend = function () {
        micButton.disabled = false;
        micButton.innerHTML = "🎤";
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
        addMessage("❌ Error: " + event.error, "error-message");
        micButton.disabled = false;
        micButton.innerHTML = "🎤";
    };

    async function processMessage(text) {
        isProcessing = true;
        addMessage("🤖 Thinking...", "ai-message");
        loader.style.display = "block";

        try {
            const response = await fetch("/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error("Server Error: " + response.status);
            const result = await response.json();
            if (result.error) throw new Error(result.error);

            updateLastMessage(result.response);
            await speak(result.response);
        } catch (error) {
            console.error("AI Error:", error);
            updateLastMessage("❌ " + error.message, true);
        } finally {
            isProcessing = false;
            loader.style.display = "none";
        }
    }

    async function speak(text) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) return resolve();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = resolve;
            utterance.onerror = () => {
                console.error("Speech synthesis error.");
                resolve();
            };
            speechSynthesis.speak(utterance);
        });
    }

    function addMessage(text, className) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", className);
        messageDiv.innerText = text;

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

    function updateLastMessage(newText, isError = false) {
        const messages = chatBox.querySelectorAll(".ai-message");
        if (messages.length > 0) {
            messages[messages.length - 1].innerText = newText;
            if (isError) messages[messages.length - 1].classList.add("error-message");
        }
    }

    sendButton.addEventListener("click", function () {
        let text = userInput.value.trim();
        if (text !== "") {
            addMessage(text, "user-message");
            userInput.value = "";
            processMessage(text);
        }
    });

    userInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendButton.click();
    });
});
