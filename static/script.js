document.getElementById("startButton").addEventListener("click", async function () {
    try {
        const startButton = document.getElementById("startButton");
        const responseContainer = document.getElementById("response");
        const copyButton = document.getElementById("copyButton");

        // Check if browser supports SpeechRecognition
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

        let speechText = "";
        startButton.disabled = true;
        responseContainer.innerHTML = `<span class="listening">🎙️ Listening... Speak now!</span>`;

        recognition.start();

        // Capture recognized speech
        recognition.onresult = async function (event) {
            speechText = event.results[0][0].transcript;
            responseContainer.innerHTML = `<span class="user-input">You: "${speechText}"</span>`;

            // Show loading animation
            responseContainer.innerHTML += `<div class="loading">Jarvis is thinking...</div>`;

            // Send recognized speech to Flask backend
            try {
                const response = await fetch("/text", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: speechText.trim() }),
                });

                const result = await response.json();
                responseContainer.innerHTML = `
                    <span class="user-input">You: "${speechText}"</span>
                    <span class="ai-response">Jarvis: "${result.response}"</span>
                `;

                copyButton.style.display = "block"; // Show copy button

                // Make AI speak the response
                speak(result.response);
            } catch (error) {
                console.error("Error:", error);
                responseContainer.innerHTML = `<span class="error">❌ Failed to process your request.</span>`;
            }

            startButton.disabled = false;
        };

        recognition.onspeechend = function () {
            recognition.stop();
        };

        recognition.onend = function () {
            startButton.disabled = false;
        };

        recognition.onerror = function (event) {
            console.error("Speech recognition error:", event.error);
            responseContainer.innerHTML = `<span class="error">❌ Error: ${event.error}</span>`;
            startButton.disabled = false;
        };
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("response").innerText = "❌ Your browser doesn't support speech recognition.";
        document.getElementById("startButton").disabled = false;
    }
});

// Function to make AI speak the response
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; // Normal speaking speed
    utterance.pitch = 1.0; // Normal pitch
    window.speechSynthesis.speak(utterance);
}

// Copy Response Feature
document.getElementById("copyButton").addEventListener("click", function () {
    const responseText = document.querySelector(".ai-response").innerText.replace("Jarvis: ", "");
    navigator.clipboard.writeText(responseText);
    alert("Response copied to clipboard!");
});



