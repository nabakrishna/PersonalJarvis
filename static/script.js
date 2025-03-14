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

        // Start listening
        recognition.start();

        // When speech is recognized
        recognition.onresult = async function (event) {
            const userSpeech = event.results[0][0].transcript;
            document.getElementById("response").innerText = "You said: " + userSpeech;

            // Send the recognized speech to Flask backend
            const response = await fetch("/text", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: userSpeech }),
            });

            const data = await response.json();
            document.getElementById("response").innerText = "Jarvis: " + data.response;
        };

        // Handle errors
        recognition.onerror = function (event) {
            console.error("Speech recognition error:", event.error);
            document.getElementById("response").innerText = "Error: " + event.error;
        };
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("response").innerText = "Something went wrong.";
    }
});

