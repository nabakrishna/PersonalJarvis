document.getElementById("startButton").addEventListener("click", async function () {
    try {
        const startButton = document.getElementById("startButton");
        const responseText = document.getElementById("response");

        // Check if the browser supports SpeechRecognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome.");
            return;
        }

        const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = true; // Allows capturing multiple lines
        recognition.maxAlternatives = 1;

        let speechText = "";

        startButton.disabled = true; // Disable button while listening
        document.getElementById("response").innerText = "🎙 Listening... Speak now!";

        // Start speech recognition
        recognition.start();

        // Capture recognized speech
        recognition.onresult = async function (event) {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                speechText += event.results[i][0].transcript + " "; // Append each recognized part
            }

            if (speechText.split(/\s+/).length >= 20) {
                recognition.stop(); // Stop listening if 20 words are reached
            }
        };

        recognition.onspeechend = function () {
            recognition.stop(); // Stop listening when the user stops talking
        };

        recognition.onend = async function () {
            startButton.disabled = false;
            document.getElementById("response").innerText = "Processing...";
            
            // Send the recognized speech to Flask backend
            try {
                const response = await fetch("/text", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: speechText.trim() }),
                });

                const result = await response.json();
                document.getElementById("response").innerText = "Jarvis: " + result.response;

                // Use Speech Synthesis API to read the response aloud
                const utterance = new SpeechSynthesisUtterance(result.response);
                speechSynthesis.speak(utterance);
            } catch (error) {
                console.error("Error:", error);
                document.getElementById("response").innerText = "❌ Failed to process your request.";
            }

            startButton.disabled = false; // Re-enable button
        };

        recognition.onend = function () {
            startButton.disabled = false;
        };

        recognition.onerror = function (event) {
            console.error("Speech recognition error:", event.error);
            document.getElementById("response").innerText = "❌ Error: " + event.error;
            startButton.disabled = false;
        };
    } catch (error) {
        console.error("Speech recognition not supported:", error);
        document.getElementById("response").innerText = "❌ Your browser doesn't support speech recognition.";
        startButton.disabled = false;
    }
});


