const socket = io('http://localhost:5000');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

let myVideoStream;
const currentUsers = {};

const peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '5000'
});

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  peer.on('call', call => {
    console.log('This peer is being connected');
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
  console.log("Calling new user");
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

// socket.on('error', function (err) {
//     console.log(err);
// });

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
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
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

let element = document.getElementsByClassName("videos__group")[0];

function toggleFullScreen() {
  console.log(element);
  if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullScreen) {
    element.webkitRequestFullScreen();
  }
}

invite.click((e) => {
  prompt(
    "Share this meeting link: ",
    window.location.href
  );
});

participants.click((e) => {
  console.log(currentUsers);
});
