// --- GLOBAL STATE AND VIEWS ---
let appState = 'chat';
let isMuted = false;
let timerInterval;
let seconds = 0;
let minutes = 0;

const chatView = document.getElementById('chat-view');
const callView = document.getElementById('call-view');
const bodyContainer = document.getElementById('body-container');
const chatInput = document.getElementById('chat-input');
const suggestionsContainer = document.getElementById('suggestions');
const callTimerEl = document.getElementById('call-timer');
const micIcon = document.getElementById('mic-icon');
const statusText = document.getElementById('status-text');
const pulseRing = document.getElementById('pulse-ring');
const callAvatar = document.getElementById('call-avatar');

// --- UI RENDERING LOGIC ---
function renderView() {
    if (appState === 'chat') {
        chatView.classList.remove('hidden');
        callView.classList.add('hidden');
        bodyContainer.classList.remove('bg-gray-900');
        bodyContainer.classList.add('bg-app-bg');
    } else {
        chatView.classList.add('hidden');
        callView.classList.remove('hidden');
        bodyContainer.classList.remove('bg-app-bg');
        bodyContainer.classList.add('bg-gray-900');
    }
}
document.addEventListener('DOMContentLoaded', renderView);

// --- CHAT LOGIC ---
const suggestionButtons = document.querySelectorAll('.suggestion-btn');
const baseClasses = 'px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors duration-150 shadow-sm whitespace-nowrap';
suggestionButtons.forEach(button => {
    button.className = baseClasses;
    button.addEventListener('click', () => {
        const query = button.getAttribute('data-query');
        chatInput.value = query;
        sendMessage(query);
    });
});

async function sendMessage(query = chatInput.value) {
    if (query.trim() === '') return;
    const chatContainer = document.getElementById('chat-messages');
    const suggestionSection = document.getElementById('suggestion-buttons');
    if (suggestionSection) suggestionSection.style.display = 'none';

    const userDiv = document.createElement('div');
    userDiv.className = "text-sm text-gray-500 mb-2";
    userDiv.innerHTML = `<span class="font-semibold text-primary">You:</span> ${query}`;
    chatContainer.appendChild(userDiv);

    const loadingDiv = document.createElement('div');
    loadingDiv.className = "text-base p-4 bg-gray-100 rounded-xl mb-4 shadow-sm";
    loadingDiv.id = "loading-response";
    loadingDiv.innerHTML = `<span class="font-semibold text-gray-800">Ragnar AI:</span> Thinking...`;
    chatContainer.appendChild(loadingDiv);

    chatInput.value = '';
    chatInput.focus();
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: query }),
        });
        const data = await response.json();
        loadingDiv.remove();

        const aiDiv = document.createElement('div');
        aiDiv.className = "text-base p-4 bg-gray-100 rounded-xl mb-4 shadow-sm";
        aiDiv.innerHTML = `<span class="font-semibold text-gray-800">Ragnar AI:</span> ${data.reply || data.error}`;
        chatContainer.appendChild(aiDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    } catch (error) {
        console.error(error);
        loadingDiv.remove();
        const errDiv = document.createElement('div');
        errDiv.className = "text-base p-4 bg-gray-100 rounded-xl mb-4 shadow-sm";
        errDiv.innerHTML = `<span class="font-semibold text-gray-800">Ragnar AI:</span> Sorry, I couldn't reach the server.`;
        chatContainer.appendChild(errDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// --- VOICE CALL LOGIC ---
let mediaRecorder;
let audioChunks = [];

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = sendAudioToServer;
        mediaRecorder.start();
        console.log("🎤 Recording started...");
        statusText.textContent = "Connected";
    } catch (err) {
        console.error("Mic access denied:", err);
        statusText.textContent = "Microphone not accessible.";
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        console.log("🛑 Recording stopped.");
        statusText.textContent = "Processing...";
    }
}

async function sendAudioToServer() {
    const blob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', blob, 'voice.wav');

    try {
        const res = await fetch('http://127.0.0.1:5001/voice', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        const chatContainer = document.getElementById('chat-messages');
        const userDiv = document.createElement('div');
        userDiv.className = "text-sm text-gray-500 mb-2";
        userDiv.innerHTML = `<span class="font-semibold text-primary">You (voice):</span> ${data.user_text}`;
        chatContainer.appendChild(userDiv);

        const aiDiv = document.createElement('div');
        aiDiv.className = "text-base p-4 bg-gray-100 rounded-xl mb-4 shadow-sm";
        aiDiv.innerHTML = `<span class="font-semibold text-gray-800">Ragnar AI:</span> ${data.reply_text}`;
        chatContainer.appendChild(aiDiv);

        const audio = new Audio(`http://127.0.0.1:5001${data.audio_url}`);
        audio.play();

        statusText.textContent = "Ragnar AI Speaking...";
        audio.onended = () => {
            statusText.textContent = "Connected";
            startRecording();
        };
    } catch (err) {
        console.error("Voice chat error:", err);
        statusText.textContent = "Error during voice chat.";
    }
}

async function makeCall() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const recorder = audioContext.createScriptProcessor(4096, 1, 1);

    const chunks = [];
    recorder.onaudioprocess = e => {
        const channelData = e.inputBuffer.getChannelData(0);
        const buffer = new Float32Array(channelData);
        chunks.push(buffer);
    };

    source.connect(recorder);
    recorder.connect(audioContext.destination);

    console.log("🎙️ Recording...");

    setTimeout(async () => {
        recorder.disconnect();
        source.disconnect();

        // Convert Float32Array chunks to WAV
        const wavBlob = encodeWAV(chunks, audioContext.sampleRate);
        const formData = new FormData();
        formData.append("audio", wavBlob, "voice.wav");

        const response = await fetch("http://127.0.0.1:5001/voice", {
            method: "POST",
            body: formData
        });

        const audioBlob = await response.blob();
        const audioURL = URL.createObjectURL(audioBlob);
        new Audio(audioURL).play();
    }, 5000); // record 5 seconds
}

// WAV encoder function
function encodeWAV(samples, sampleRate) {
    let bufferLength = samples.reduce((sum, arr) => sum + arr.length, 0);
    let buffer = new ArrayBuffer(44 + bufferLength * 2);
    let view = new DataView(buffer);

    // WAV header
    function writeString(view, offset, str) {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bufferLength * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bufferLength * 2, true);

    // Write PCM samples
    let offset = 44;
    samples.forEach(arr => {
        for (let i = 0; i < arr.length; i++) {
            let s = Math.max(-1, Math.min(1, arr[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }
    });

    return new Blob([view], { type: 'audio/wav' });
}


// --- CALL UI LOGIC ---
function makeCall() {
    appState = 'call';
    renderView();
    statusText.textContent = "Connecting...";
    pulseRing.classList.add('animate-pulse-ring');
    callAvatar.classList.add('border-gray-800');
    setTimeout(() => {
        statusText.textContent = "Connected — Say something!";
        pulseRing.classList.remove('animate-pulse-ring');
        callAvatar.classList.add('border-primary', 'shadow-2xl', 'shadow-primary/50');
        startTimer();
        startRecording();
    }, 1500);
}

function toggleMute() {
    isMuted = !isMuted;
    micIcon.classList.toggle('text-danger');
    micIcon.classList.toggle('bg-gray-800');
    micIcon.classList.toggle('text-white');
    console.log(isMuted ? "Microphone muted." : "Microphone unmuted.");
}

function endCall() {
    clearInterval(timerInterval);
    stopRecording();
    appState = 'chat';
    renderView();
    console.log(`📞 Call ended after ${minutes}m ${seconds}s.`);
}

function startTimer() {
    seconds = 0;
    minutes = 0;
    callTimerEl.textContent = "00:00";
    timerInterval = setInterval(() => {
        seconds++;
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }
        const min = minutes < 10 ? `0${minutes}` : minutes;
        const sec = seconds < 10 ? `0${seconds}` : seconds;
        callTimerEl.textContent = `${min}:${sec}`;
    }, 1000);
}
