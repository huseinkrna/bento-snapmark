// DOM elements
const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const timestampDiv = document.getElementById('timestamp');
const countdownDiv = document.getElementById('countdown');
const captureBtn = document.getElementById('capture');
const switchCamBtn = document.getElementById('switchCam');
const modePhotoBtn = document.getElementById('modePhoto');
const modeVideoBtn = document.getElementById('modeVideo');
const timerSelect = document.getElementById('timerSelect');
const previewDiv = document.getElementById('preview');
const previewImg = document.getElementById('previewImg');
const shareBtn = document.getElementById('shareWA');
const retakeBtn = document.getElementById('retake');

// State
let stream = null;
let currentFacing = 'environment'; // 'environment' = belakang, 'user' = depan
let currentMode = 'photo';
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let photoBlob = null;

// Update live timestamp
function updateTimestamp() {
    const now = new Date();
    timestampDiv.textContent = now.toLocaleTimeString();
}
setInterval(updateTimestamp, 1000);
updateTimestamp();

// Init camera
async function initCamera(facingMode) {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    try {
        const constraints = {
            video: { facingMode: { exact: facingMode } }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        await video.play();
        currentFacing = facingMode;
    } catch (err) {
        // fallback: minta kamera default
        console.warn(err);
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream = fallbackStream;
        video.srcObject = fallbackStream;
        await video.play();
    }
}

// Switch camera
function switchCamera() {
    const newFacing = currentFacing === 'environment' ? 'user' : 'environment';
    initCamera(newFacing);
}

// Capture photo with timestamp
async function capturePhoto() {
    if (!video.videoWidth) {
        alert("Kamera belum siap, tunggu sebentar");
        return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Draw timestamp
    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(dateStr, 20, canvas.height - 40);
    
    canvas.toBlob(blob => {
        photoBlob = blob;
        const url = URL.createObjectURL(blob);
        previewImg.src = url;
        previewDiv.classList.remove('hidden');
    }, 'image/jpeg');
}

// Timer for photo
let timerInterval = null;
function startPhotoTimer(seconds) {
    if (timerInterval) clearInterval(timerInterval);
    if (seconds <= 0) {
        capturePhoto();
        return;
    }
    let remaining = seconds;
    countdownDiv.textContent = remaining;
    countdownDiv.classList.remove('hidden');
    timerInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            countdownDiv.classList.add('hidden');
            capturePhoto();
        } else {
            countdownDiv.textContent = remaining;
        }
    }, 1000);
}

// Share to WhatsApp
async function shareToWA() {
    if (!photoBlob) return;
    const file = new File([photoBlob], 'bento-snap.jpg', { type: 'image/jpeg' });
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Bento SnapMark',
                files: [file]
            });
            previewDiv.classList.add('hidden');
        } catch (err) {
            if (err.name !== 'AbortError') alert("Gagal share: " + err.message);
        }
    } else {
        // fallback download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(photoBlob);
        link.download = 'bento-snap.jpg';
        link.click();
        alert("File diunduh. Silakan kirim manual ke WhatsApp.");
    }
}

// Reset preview
function retake() {
    previewDiv.classList.add('hidden');
    URL.revokeObjectURL(previewImg.src);
    photoBlob = null;
}

// Mode switch
modePhotoBtn.addEventListener('click', () => {
    currentMode = 'photo';
    modePhotoBtn.classList.add('active');
    modeVideoBtn.classList.remove('active');
    captureBtn.textContent = '📸 Ambil';
    if (isRecording) stopRecording();
});
modeVideoBtn.addEventListener('click', () => {
    currentMode = 'video';
    modeVideoBtn.classList.add('active');
    modePhotoBtn.classList.remove('active');
    captureBtn.textContent = '🎥 Rekam';
});
captureBtn.addEventListener('click', () => {
    if (currentMode === 'photo') {
        const timerVal = parseInt(timerSelect.value);
        startPhotoTimer(timerVal);
    } else {
        // Video: untuk versi sederhana, kita kasih alert dulu
        alert("Fitur video akan menyusul. Untuk sekarang, gunakan foto dulu.");
    }
});
switchCamBtn.addEventListener('click', switchCamera);
shareBtn.addEventListener('click', shareToWA);
retakeBtn.addEventListener('click', retake);

// Start kamera
initCamera('environment');