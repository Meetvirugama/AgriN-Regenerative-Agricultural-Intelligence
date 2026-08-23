import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

function AIAssistant() {

    const navigate = useNavigate();

    // ==================================================
    // TEXT / AI STATE
    // ==================================================

    const [message, setMessage] = useState("");
    const [response, setResponse] = useState("");

    // ==================================================
    // RECORDING STATE
    // ==================================================

    const [recording, setRecording] = useState(false);
    const [processingAudio, setProcessingAudio] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    // ==================================================
    // SESSION ID
    // ==================================================

    const [sessionId] = useState(
        () => crypto.randomUUID()
    );


    // ==================================================
    // TEXT CHAT
    // ==================================================

    async function sendMessage(text = message) {

        if (!text || !text.trim()) {
            return;
        }

        try {

            setResponse("Thinking...");

            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
            const res = await fetch(
                `${apiUrl}/voice/chat`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        session_id: sessionId,
                        message: text
                    })
                }
            );

            if (!res.ok) {

                throw new Error(
                    `Server error: ${res.status}`
                );
            }

            const data = await res.json();

            console.log(
                "AI response:",
                data
            );

            setResponse(
                data.message || ""
            );


            // -----------------------------------------
            // Navigation
            // -----------------------------------------

            if (
                data.action &&
                data.action.action === "NAVIGATE"
            ) {

                navigate(
                    data.action.path
                );

            }


            // -----------------------------------------
            // Text to Speech
            // -----------------------------------------

            if (data.message) {

                speakText(
                    data.message
                );

            }

        } catch (error) {

            console.error(
                "AI Error:",
                error
            );

            setResponse(
                "Could not connect to the AI server."
            );

        }

        setMessage("");
    }


    // ==================================================
    // START RECORDING
    // ==================================================

    async function startRecording() {

        try {

            // -----------------------------------------
            // Get microphone
            // -----------------------------------------

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });

            streamRef.current = stream;

            console.log(
                "Microphone permission granted"
            );


            // -----------------------------------------
            // Choose supported MIME type
            // -----------------------------------------

            let mimeType = "";

            if (
                MediaRecorder.isTypeSupported(
                    "audio/webm;codecs=opus"
                )
            ) {

                mimeType =
                    "audio/webm;codecs=opus";

            } else if (
                MediaRecorder.isTypeSupported(
                    "audio/webm"
                )
            ) {

                mimeType =
                    "audio/webm";

            } else if (
                MediaRecorder.isTypeSupported(
                    "audio/mp4"
                )
            ) {

                mimeType =
                    "audio/mp4";

            }


            console.log(
                "Selected MIME type:",
                mimeType
            );


            // -----------------------------------------
            // Create MediaRecorder
            // -----------------------------------------

            const mediaRecorder =
                mimeType
                    ? new MediaRecorder(
                        stream,
                        {
                            mimeType: mimeType
                        }
                    )
                    : new MediaRecorder(
                        stream
                    );


            mediaRecorderRef.current =
                mediaRecorder;

            audioChunksRef.current = [];


            console.log(
                "Actual recorder MIME type:",
                mediaRecorder.mimeType
            );


            // -----------------------------------------
            // Receive chunks
            // -----------------------------------------

            mediaRecorder.ondataavailable =
                (event) => {

                    console.log(
                        "Audio chunk:",
                        event.data.size,
                        "bytes"
                    );

                    if (
                        event.data &&
                        event.data.size > 0
                    ) {

                        audioChunksRef.current.push(
                            event.data
                        );

                    }

                };


            // -----------------------------------------
            // When recording stops
            // -----------------------------------------

            mediaRecorder.onstop =
                async () => {

                    console.log(
                        "Recording stopped"
                    );


                    // Use actual MIME type
                    const actualMimeType =
                        mediaRecorder.mimeType ||
                        "audio/webm";


                    // ---------------------------------
                    // Create final audio Blob
                    // ---------------------------------

                    const audioBlob =
                        new Blob(
                            audioChunksRef.current,
                            {
                                type: actualMimeType
                            }
                        );


                    console.log(
                        "Final audio MIME type:",
                        actualMimeType
                    );

                    console.log(
                        "Final audio size:",
                        audioBlob.size,
                        "bytes"
                    );


                    // ---------------------------------
                    // Stop microphone
                    // ---------------------------------

                    if (streamRef.current) {

                        streamRef.current
                            .getTracks()
                            .forEach(
                                track => track.stop()
                            );

                        streamRef.current =
                            null;

                    }


                    // ---------------------------------
                    // Send audio
                    // ---------------------------------

                    await sendAudio(
                        audioBlob
                    );

                };


            // -----------------------------------------
            // Start recording
            // -----------------------------------------

            // Generate chunks every 1 second.
            // This makes WebM recording much more reliable.

            mediaRecorder.start(1000);

            setRecording(true);

            setProcessingAudio(false);

            setResponse(
                "🎤 Listening..."
            );

            console.log(
                "🎤 Recording started"
            );

        } catch (error) {

            console.error(
                "Microphone error:",
                error
            );

            setRecording(false);

            setProcessingAudio(false);

            alert(
                "Could not access microphone. Please allow microphone permission."
            );

        }
    }


    // ==================================================
    // STOP RECORDING
    // ==================================================

    function stopRecording() {

        const recorder =
            mediaRecorderRef.current;


        if (
            recorder &&
            recorder.state !== "inactive"
        ) {

            console.log(
                "Stopping recording..."
            );

            setRecording(false);

            setProcessingAudio(true);

            setResponse(
                "🎧 Processing your voice..."
            );


            recorder.stop();

        }

    }


    // ==================================================
    // SEND AUDIO TO BACKEND
    // ==================================================

    async function sendAudio(audioBlob) {

        try {

            setProcessingAudio(true);

            setResponse(
                "🎧 Processing your voice..."
            );


            // -----------------------------------------
            // Check audio
            // -----------------------------------------

            if (
                !audioBlob ||
                audioBlob.size === 0
            ) {

                console.error(
                    "Empty audio blob"
                );

                setProcessingAudio(false);

                setResponse(
                    "No audio was recorded."
                );

                return;

            }


            console.log(
                "Sending audio:",
                audioBlob.size,
                "bytes"
            );


            console.log(
                "Audio type:",
                audioBlob.type
            );


            // -----------------------------------------
            // FormData
            // -----------------------------------------

            const formData =
                new FormData();


            formData.append(
                "audio",
                audioBlob,
                "recording.webm"
            );


            // -----------------------------------------
            // Send to FastAPI
            // -----------------------------------------

            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
            const res =
                await fetch(
                    `${apiUrl}/voice/stt`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            if (!res.ok) {

                throw new Error(
                    `Transcription error: ${res.status}`
                );

            }


            // -----------------------------------------
            // Read response
            // -----------------------------------------

            const data =
                await res.json();


            console.log(
                "Transcription response:",
                data
            );


            setProcessingAudio(false);


            // -----------------------------------------
            // Transcription failed
            // -----------------------------------------

            if (
                !data.success ||
                !data.transcript
            ) {

                console.error(
                    "Transcription failed:",
                    data.error
                );

                setResponse(
                    data.error ||
                    "I couldn't understand the audio."
                );

                return;

            }


            // -----------------------------------------
            // Transcript
            // -----------------------------------------

            const transcript =
                data.text.trim();


            console.log(
                "Transcript:",
                transcript
            );


            setMessage(
                transcript
            );


            // -----------------------------------------
            // Send transcript to AI
            // -----------------------------------------

            await sendMessage(
                transcript
            );


        } catch (error) {

            console.error(
                "Audio processing error:",
                error
            );

            setProcessingAudio(false);

            setResponse(
                "Could not process the voice input."
            );

        }

    }


    // ==================================================
    // TEXT TO SPEECH
    // ==================================================

    async function speakText(text) {

        if (
            !text ||
            !text.trim()
        ) {

            return;

        }


        try {

            console.log(
                "TTS request:",
                text
            );


            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
            const res =
                await fetch(
                    `${apiUrl}/voice/tts`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            text: text
                        })
                    }
                );


            if (!res.ok) {

                throw new Error(
                    `TTS server error: ${res.status}`
                );

            }


            // -----------------------------------------
            // Receive audio
            // -----------------------------------------

            const data = await res.json();
            if (!data.audioContent) {
                throw new Error("TTS returned empty audio");
            }
            // Decode base64 audio
            const byteCharacters = atob(data.audioContent);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const audioBlob = new Blob([byteArray], { type: data.format || "audio/mpeg" });


            console.log(
                "Received TTS audio:",
                audioBlob.size,
                "bytes"
            );


            if (
                audioBlob.size === 0
            ) {

                throw new Error(
                    "TTS returned empty audio"
                );

            }


            // -----------------------------------------
            // Create audio URL
            // -----------------------------------------

            const audioUrl =
                URL.createObjectURL(
                    audioBlob
                );


            const audio =
                new Audio(
                    audioUrl
                );


            audio.onended = () => {

                URL.revokeObjectURL(
                    audioUrl
                );

            };


            audio.onerror = () => {

                URL.revokeObjectURL(
                    audioUrl
                );

                console.error(
                    "Audio playback failed"
                );

            };


            await audio.play();


            console.log(
                "🔊 AI speaking"
            );


        } catch (error) {

            console.error(
                "TTS error:",
                error
            );

        }

    }


    // ==================================================
    // TEST TTS
    // ==================================================

    async function testTTS() {

        await speakText(
            "Hello! I am your AI assistant."
        );

    }


    // ==================================================
    // UI
    // ==================================================

    return (

        <div
            style={{
                padding: "20px",
                border: "1px solid #ddd",
                margin: "20px",
                borderRadius: "10px"
            }}
        >

            <h2>
                🤖 AI Assistant
            </h2>


            {/* ----------------------------------------
                Text input
            ----------------------------------------- */}

            <input
                type="text"

                value={message}

                onChange={(e) =>
                    setMessage(
                        e.target.value
                    )
                }

                onKeyDown={(e) => {

                    if (
                        e.key === "Enter"
                    ) {

                        sendMessage();

                    }

                }}

                placeholder="Ask me something..."

                disabled={
                    recording ||
                    processingAudio
                }

                style={{
                    padding: "10px",
                    width: "300px"
                }}
            />


            {/* ----------------------------------------
                Send button
            ----------------------------------------- */}

            <button
                onClick={() =>
                    sendMessage()
                }

                disabled={
                    recording ||
                    processingAudio
                }

                style={{
                    marginLeft: "10px",
                    padding: "10px"
                }}
            >

                Send

            </button>


            {/* ----------------------------------------
                Microphone button
            ----------------------------------------- */}

            <button
                onClick={
                    recording
                        ? stopRecording
                        : startRecording
                }

                disabled={
                    processingAudio
                }

                style={{
                    marginLeft: "10px",
                    padding: "10px"
                }}
            >

                {recording

                    ? "🛑 Stop Recording"

                    : processingAudio

                        ? "⏳ Processing..."

                        : "🎤 Start Recording"

                }

            </button>


            {/* ----------------------------------------
                TTS test
            ----------------------------------------- */}

            <button
                onClick={testTTS}

                disabled={
                    recording ||
                    processingAudio
                }

                style={{
                    marginLeft: "10px",
                    padding: "10px"
                }}
            >

                🔊 Test TTS

            </button>


            {/* ----------------------------------------
                AI response
            ----------------------------------------- */}

            <p>

                <strong>
                    AI:
                </strong>

                {" "}

                {response}

            </p>

        </div>

    );

}

export default AIAssistant;