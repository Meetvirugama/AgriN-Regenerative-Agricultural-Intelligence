import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Send, Square, Volume2, Bot, Loader2 } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import "./AIAssistant.css";

function AIAssistant() {
    const navigate = useNavigate();
    const chatEndRef = useRef(null);
    const { accessToken } = useAuth();

    // ==================================================
    // TEXT / AI STATE
    // ==================================================
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { role: "ai", text: "Hello! I am AgriMesh AI. How can I help you with your fields today?" }
    ]);

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
    const [sessionId] = useState(() => crypto.randomUUID());

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, processingAudio]);

    // ==================================================
    // TEXT CHAT
    // ==================================================
    async function sendMessage(text = message) {
        if (!text || !text.trim()) return;

        // Add user message to history
        setChatHistory(prev => [...prev, { role: "user", text }]);
        setMessage("");

        try {
            setChatHistory(prev => [...prev, { role: "system", text: "Thinking..." }]);

            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
            const res = await fetch(`${apiUrl}/voice/chat`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ session_id: sessionId, message: text })
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();

            // Replace thinking with actual response
            setChatHistory(prev => {
                const newHist = [...prev];
                newHist.pop(); // remove thinking
                newHist.push({ role: "ai", text: data.message || "I didn't quite get that." });
                return newHist;
            });

            // Navigation action
            if (data.action && data.action.action === "NAVIGATE") {
                navigate(data.action.path);
            }

            // Speak response
            if (data.message) {
                speakText(data.message);
            }

        } catch (error) {
            console.error("AI Error:", error);
            setChatHistory(prev => {
                const newHist = [...prev];
                newHist.pop(); // remove thinking
                newHist.push({ role: "system", text: "Could not connect to the AI server." });
                return newHist;
            });
        }
    }

    // ==================================================
    // START RECORDING
    // ==================================================
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            let mimeType = "";
            if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                mimeType = "audio/webm;codecs=opus";
            } else if (MediaRecorder.isTypeSupported("audio/webm")) {
                mimeType = "audio/webm";
            } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
                mimeType = "audio/mp4";
            }

            const mediaRecorder = mimeType 
                ? new MediaRecorder(stream, { mimeType }) 
                : new MediaRecorder(stream);

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const actualMimeType = mediaRecorder.mimeType || "audio/webm";
                const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                await sendAudio(audioBlob);
            };

            mediaRecorder.start(1000);
            setRecording(true);
            setProcessingAudio(false);
            setChatHistory(prev => [...prev, { role: "system", text: "Listening... (Speak now)" }]);

        } catch (error) {
            console.error("Microphone error:", error);
            setRecording(false);
            setProcessingAudio(false);
            alert("Could not access microphone. Please allow microphone permission.");
        }
    }

    // ==================================================
    // STOP RECORDING
    // ==================================================
    function stopRecording() {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            setRecording(false);
            setProcessingAudio(true);
            
            // Update the "Listening..." message to "Processing..."
            setChatHistory(prev => {
                const newHist = [...prev];
                if (newHist[newHist.length - 1]?.role === "system") {
                    newHist[newHist.length - 1].text = "Processing audio...";
                }
                return newHist;
            });
            recorder.stop();
        }
    }

    // ==================================================
    // SEND AUDIO TO BACKEND
    // ==================================================
    async function sendAudio(audioBlob) {
        try {
            setProcessingAudio(true);

            if (!audioBlob || audioBlob.size === 0) {
                setChatHistory(prev => {
                    const newHist = [...prev];
                    newHist.pop();
                    newHist.push({ role: "system", text: "No audio was recorded." });
                    return newHist;
                });
                setProcessingAudio(false);
                return;
            }

            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
            const res = await fetch(`${apiUrl}/voice/stt`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                },
                body: formData
            });

            if (!res.ok) throw new Error(`Transcription error: ${res.status}`);
            
            const data = await res.json();
            setProcessingAudio(false);

            // Remove the "Processing audio..." system message
            setChatHistory(prev => {
                const newHist = [...prev];
                if (newHist[newHist.length - 1]?.role === "system") {
                    newHist.pop();
                }
                return newHist;
            });

            if (!data.success || !data.transcript) {
                setChatHistory(prev => [...prev, { role: "system", text: data.error || "Could not understand audio." }]);
                return;
            }

            const transcript = data.text.trim();
            // We got the transcript! Now send it as a message
            await sendMessage(transcript);

        } catch (error) {
            console.error("Audio processing error:", error);
            setProcessingAudio(false);
            setChatHistory(prev => {
                const newHist = [...prev];
                if (newHist[newHist.length - 1]?.role === "system") {
                    newHist.pop();
                }
                newHist.push({ role: "system", text: "Could not process the voice input." });
                return newHist;
            });
        }
    }

    // ==================================================
    // TEXT TO SPEECH
    // ==================================================
    async function speakText(text) {
        if (!text || !text.trim()) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
            const res = await fetch(`${apiUrl}/voice/tts`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ text: text })
            });

            if (!res.ok) throw new Error(`TTS server error: ${res.status}`);

            const data = await res.json();
            if (!data.audioContent) throw new Error("TTS returned empty audio");
            
            const byteCharacters = atob(data.audioContent);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const audioBlob = new Blob([byteArray], { type: data.format || "audio/mpeg" });

            if (audioBlob.size === 0) throw new Error("TTS returned empty audio");

            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.onended = () => URL.revokeObjectURL(audioUrl);
            audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                console.error("Audio playback failed");
            };

            await audio.play();
        } catch (error) {
            console.error("TTS error:", error);
        }
    }

    // ==================================================
    // TEST TTS
    // ==================================================
    async function testTTS() {
        await speakText("Voice system is working properly!");
    }

    // ==================================================
    // UI
    // ==================================================
    return (
        <div className="ai-assistant-container">
            <div className="ai-assistant-header">
                <div className="ai-header-icon">
                    <Bot size={24} />
                </div>
                <div>
                    <h2 className="ai-header-title">AgriMesh AI</h2>
                    <p className="ai-header-subtitle">Voice Assistant</p>
                </div>
            </div>

            <div className="ai-chat-window">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`ai-chat-bubble ${msg.role}`}>
                        {msg.text}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <div className="ai-input-area">
                <div className="ai-input-row">
                    <input
                        type="text"
                        className="ai-text-input"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") sendMessage();
                        }}
                        placeholder="Type or speak..."
                        disabled={recording || processingAudio}
                    />

                    {message.trim() ? (
                        <button
                            className="ai-action-btn ai-btn-send"
                            onClick={() => sendMessage()}
                            disabled={recording || processingAudio}
                            aria-label="Send message"
                        >
                            <Send size={18} />
                        </button>
                    ) : (
                        <button
                            className={`ai-action-btn ${recording ? 'ai-btn-stop' : 'ai-btn-mic'}`}
                            onClick={recording ? stopRecording : startRecording}
                            disabled={processingAudio}
                            aria-label={recording ? "Stop recording" : "Start recording"}
                        >
                            {processingAudio ? <Loader2 size={18} className="tts-loading-icon" /> : (recording ? <Square size={16} fill="currentColor" /> : <Mic size={18} />)}
                        </button>
                    )}
                </div>
                <div className="ai-tools-row">
                    <button className="ai-tts-btn" onClick={testTTS} disabled={recording || processingAudio}>
                        <Volume2 size={14} /> Test Speaker
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AIAssistant;