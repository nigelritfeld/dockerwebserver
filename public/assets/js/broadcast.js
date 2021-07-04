window.addEventListener("load", init)
/**
 * Global variables
 */
let goLiveButton = document.getElementById('go-live-btn')
let stopStreamButton;
let buttonStartRecording = document.getElementById("start-recording-button");
let buttonStopRecording = document.getElementById("btn-stop-recording");
let onAir = document.getElementById("live-tag");
const videoElement = document.querySelector("video");
const audioSelect = document.querySelector("select#audioSource");
const videoSelect = document.querySelector("select#videoSource");

let recordButton;
let videoRecorder;
let recordedChunks = []
let recorderHandler;
let broadcaster;

/**
 * Peer connections object
 * @type {{}}
 */
const peerConnections = {};
const config =
    {
        iceServers: [
            {
                "urls": "stun:stun.l.google.com:19302",
            },
            // If using own TURN Server
            // {
            //   "urls": "turn:TURN_IP?transport=tcp",
            //   "username": "TURN_USERNAME",
            //   "credential": "TURN_CREDENTIALS"
            // }
        ]
    };


/**
 * Socket IO
 * Creating a peer connection between Broadcaster and the client.
 * There are two scripts one for the Broadcaster and the client.
 * Via those scripts & the socket connection the peer connection will be established.
 */

const socket = io.connect(window.location.origin);

// When the peer receives a answer insert the id and description to Remote Description
socket.on("answer", (id, description) => {
    peerConnections[id].setRemoteDescription(description);
});
// When some one visits create new peer connection
socket.on("watcher", id => {
    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;

    // Creating stream
    let stream = videoElement.srcObject;
    stream
        .getTracks()
        .forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", id, event.candidate);
        }
    };

    peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit("offer", id, peerConnection.localDescription);
        });
});
/**
 * When received new ICE Candidate from peer create new ICE Candidate
 */
socket.on("candidate", (id, candidate) => {
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});
/**
 * Deletes peer connection when a peer disconnects
 */
socket.on("disconnectPeer", id => {
    peerConnections[id].close();
    delete peerConnections[id];
});
window.onunload = window.onbeforeunload = () => {
    socket.close();
};
/**
 * On change of source input the getStream function will be re-initializing the stream
 */

audioSelect.onchange = getStream;
videoSelect.onchange = getStream;


/**
 * Starting the code
 */
function init() {
    getDevices()
        .then(gotDevices)
    setListeners()
}

/**
 * Creating event listeners
 */
function setListeners() {
    buttonStartRecording.addEventListener("click", recording);
    buttonStopRecording.addEventListener('click', stopRecording);
    goLiveButton.addEventListener("click", () => {
        getStream()
            .then(gotStream)

        goLiveButton.innerHTML = "Stop livestream"
        goLiveButton.setAttribute('id', 'stop-stream-button')
        onAir.classList.toggle('not-live-tag')
        onAir.classList.toggle('live-tag')
        onAir.innerHTML = 'On air'
        toggleLiveButton()
        recorderHandler = videoRecorder.ondataavailable = handleDataAvailable;

    });
}

/**
 * Initializing the buttons and event listeners
 */
function toggleLiveButton() {
    stopStreamButton = document.getElementById('stop-stream-button')
    stopStreamButton.addEventListener('click', () => {
            window.location = '/'
            window.stream.getTracks().forEach(function (track) {
                track.stop();
                onAir.classList.toggle('not-live-tag')
                onAir.classList.toggle('live-tag')
                onAir.innerHTML = 'Not streaming'
            });
            onAir.classList.toggle('not-live-tag')
            onAir.classList.toggle('live-tag')
            onAir.innerHTML = 'Not streaming'
        }
    )
}


/**
 * starts de recording
 */
function recording() {
    console.log("start recording")
    buttonStartRecording.setAttribute('disabled', 'disabled');
    // console.log(buttonStartRecording)
    buttonStopRecording.toggleAttribute('disabled', '');
    videoRecorder.start()
    console.log('media Recorder werkt');
    console.log('eventlistener stop recording aangemaakt');
}

/**
 * stops the recording
 */
function stopRecording() {

    console.log("stop recording")
    buttonStartRecording.toggleAttribute('disabled', '');
    buttonStopRecording.setAttribute('disabled', '');
    console.log(buttonStopRecording)
    console.log(buttonStartRecording)

    videoRecorder.stop()
    console.log(videoRecorder)
    download()

}

/**
 * pushes data to array
 * @param event
 */
function handleDataAvailable(event) {
    console.log(event)
    console.log("data-available");
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
        console.log(recordedChunks);
    } else {
        // ...
    }
}

/**
 * Downloads recorded media to computer
 */
function download() {
    const blob = new Blob(recordedChunks, {
        type: "video/webm"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = `stream-${Date.now()}.webm`;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * uploads data to database
 */
function upload() {
    const blob = new Blob(recordedChunks, {
        type: "video/webm"
    });
    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/uploadVideo", true);
    xhttp.setRequestHeader("Content-type", 'Content-Transfer-Encoding: base64');
    xhttp.send(blob);
}

/**
 * Get devices returns all the available devices
 * @returns {Promise<MediaDeviceInfo[]>}
 */
function getDevices() {
    return navigator.mediaDevices.enumerateDevices();
}

/**
 * Handler to create a stream from selected device
 * @returns {Promise<MediaStream>}
 */

function getStream() {

    // Stopping stream is there is one active
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }

    // Initializing the devices
    const audioSource = audioSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
        audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
        video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };

    return navigator.mediaDevices
        .getUserMedia(constraints)
        .then(gotStream)
        .catch(handleError);
}

/**
 * Returns the stream to the peers
 * @param stream
 */
function gotStream(stream) {
    window.stream = stream;
    audioSelect.selectedIndex = [...audioSelect.options].findIndex(
        option => option.text === stream.getAudioTracks()[0].label
    );
    videoSelect.selectedIndex = [...videoSelect.options].findIndex(
        option => option.text === stream.getVideoTracks()[0].label
    );
    videoElement.srcObject = stream;
    createRecorder(stream)

    socket.emit("broadcaster");
}

/**
 * For every detected device create a list item.
 * @param deviceInfos
 */

function gotDevices(deviceInfos) {
    window.deviceInfos = deviceInfos;
    for (const deviceInfo of deviceInfos) {
        const option = document.createElement("option");
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === "audioinput") {
            option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
            audioSelect.appendChild(option);
        } else if (deviceInfo.kind === "videoinput") {
            option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        }
    }
}

/**
 * Creating a mediaRecorder
 * @param stream
 * @returns {MediaRecorder}
 */
function createRecorder(stream) {
    console.log(stream)
    // Creating new video recorder
    videoRecorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000,
        mimeType: 'video/webm'
    })
    console.log(videoRecorder)
    // returning the video recorder to the global variable
    return videoRecorder
}

/**
 * Error handler
 * @param error
 */
function handleError(error) {
    console.error("Error: ", error);
}

