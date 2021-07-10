const socket = io();
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

let myVideoStream;
const currentUsers = {};

const peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
});

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);
  recognition.start();

  peer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    })
  });

  socket.on('user-connected', userId => {
    // user is joining
    setTimeout(() => {
      // user joined
      addNewUser(userId, stream)
    }, 1000)
  })


});

socket.on('user-disconnect', userId => {
  currentUsers[userId].close();
})


peer.on('open', user_id => {
  console.log('My peer ID is: ' + user_id);
  console.log(socket);
  socket.emit('join-room', room_id, user_id, user_name);
});

const addNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  });

  call.on('close', () => {
    video.remove();
  })

  currentUsers[userId] = call;

};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  })
  videoGrid.append(video);
};

let text = $("#chat_message");
let messages = $(".messages");
let invite = $("#invite-button");
let participants = $(".participants-button")

$("#send").click(function(e) {
  console.log(text.val());
  if (text.val().length !== 0) {
    socket.emit('message', text.val());
    text.val('');
  }
});

text.keydown((e) => {
  if (e.key === "Enter" && text.val().length !== 0) {
    socket.emit("message", text.val());
    text.val('');
  }
});

socket.on("createMessage", (message, userName) => {
  console.log("this is coming from server", userName);
  console.log(messages);
  $(".messages").append(`<div class="message">
        <span> ${
          userName === user_name ? "me" : userName
        }</span>
        <b><i class="far fa-user-circle"></i><span>${message}</span></b>
    </div>`);
  scrollToBottom();
})

const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
    recognition.stop();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
    recognition.start();
  }
}

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `<i class="fas fa-microphone"></i>`
  document.querySelector(".main__mute_button").innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `<i class="unmute fas fa-microphone-slash"></i>`
  document.querySelector(".main__mute_button").innerHTML = html;
}

const setStopVideo = () => {
  const html = `<i class="fas fa-video"></i>`
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `<i class="stop fas fa-video-slash"></i>`
  document.querySelector('.main__video_button').innerHTML = html;
}

const element = document.getElementsByClassName("main__center")[0];

function toggleFullScreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
    setFullScreen();
  } else {
    element.requestFullscreen();
    setExitScreen();
  }
}

const setFullScreen = () => {
  const html = `<i class="fas fa-expand"></i>`
  document.querySelector('.fullscreen_button').innerHTML = html;
}

const setExitScreen = () => {
  const html = `<i class="fas fa-compress"></i>`
  document.querySelector('.fullscreen_button').innerHTML = html;
}

participants.click((e) => {
  console.log(currentUsers);
});

const button = document.getElementById("speech-button");
result = document.getElementsByClassName("video-captions")[0];

socket.on('add-captions', (username, text) => {
  console.log("add-captions", username, text);
  if (listening) {
    result.innerHTML = `${username}: ${text}`;
  }

})

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let listening = false;
const recognition = new SpeechRecognition();

const onResult = event => {
  const n = event.results.length - 1;
  const text = event.results[n][0].transcript;
  socket.emit('liveCaptions', text);
};

recognition.continuous = true;
recognition.interimResults = true;
recognition.addEventListener("result", onResult);

button.addEventListener("click", () => {
  listening = !listening;
  if (!listening) {
    button.classList.add('captions');
    result.innerHTML = '';
  } else {
    button.classList.remove('captions');
  }


});
