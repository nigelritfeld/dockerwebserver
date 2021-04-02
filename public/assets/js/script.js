let videoObjs = document.getElementsByClassName("videoElement");
let v;

function streamHandler(stream) {
    for (let i = 0; i < videoObjs.length; i++) {
        v = videoObjs[i];
        console.log(i);
        v.srcObject = stream;
    }
}
// let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
let constraintObject = {
    audio: false,
    video: {
        facingMode: "user",
        width: { min: 640, ideal: 1280, max: 1920 },
        height: {min: 480, ideal: 720, max:1080 }
    },
    controls: false,
    autoplay: true
}

function initObjs() {
    for (let i = 0; i < videoObjs.length; i++) {
        v = videoObjs[i];
        // v.setAttribute('controls','false');
        v.setAttribute('autoplay','');
        v.setAttribute('playsinline','');
        v.setAttribute('allow','true');
}
}
camera = navigator.mediaDevices.getUserMedia

if (camera) {
    // default
    navigator.mediaDevices.getUserMedia(constraintObject)
        .then((stream) => {
            console.log(stream)
    })
        .then(function (stream) {
            streamHandler(stream)
        })
        .catch(function (err0r) {
            console.log("Something went wrong!");
        });
}
console.log(videoObjs)
initObjs();
