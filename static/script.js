document.getElementById("startButton").addEventListener("click", async function () {
    try {
        // Check if the browser supports speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        // Disable button while listening
        const startButton = document.getElementById("startButton");
        startButton.disabled = true;
        document.getElementById("response").innerText = "🎙️ Listening... Speak now.";

        // Start listening
        recognition.start();

        // When speech is recognized
        recognition.onresult = async function (event) {
            const userSpeech = event.results[0][0].transcript;
            document.getElementById("response").innerText = `You said: "${userSpeech}"`;

            // Send recognized speech to Flask backend
            const response = await fetch("/speak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: userSpeech }),
            });

            const data = await response.json();
            const aiResponse = data.response;
            document.getElementById("response").innerText = `Jarvis: "${aiResponse}"`;

            // Make AI speak the response
            speak(aiResponse);
        };

        // Handle errors
        recognition.onerror = function (event) {
            console.error("Speech recognition error:", event.error);
            document.getElementById("response").innerText = "❌ Error: " + event.error;
        };

        // Re-enable button after speech ends
        recognition.onend = function () {
            startButton.disabled = false;
        };

    } catch (error) {
        console.error("Error:", error);
        document.getElementById("response").innerText = "❌ Something went wrong.";
    }
});

// Function to make AI speak the response
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

