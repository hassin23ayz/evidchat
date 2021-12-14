import "../css/app.css"
import "phoenix_html"
import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import topbar from "../vendor/topbar"

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")
var localStream
var users = {}
/* 
   2 types of information get transacted between A & B : SDP & ICE candidates
   Live View Hook and Phx Pubsub plays as the Media (Signalling Server) to transact these 2 infos 

   ICE candidate: 
   	   Routing info for a client to communicate with another client
   	   Client A itself communicates with Stun server
       Client A gets ICE candidate info from STUN server [onicecandidate: callback]
       Client A sends it's ICE candidate info to another client B via the signalling server(Live view hook + Phx Pubsub)
       Client B itself communicates with Stun server
       Client B gets ICE candidate info from STUN server [onicecandidate: callback]
       Client B sends it's ICE candidate info to another client A via the signalling server(Live view hook + Phx Pubsub)
       After Several transaction ICE candidates are fixed between Client A and B 
	
	 
   SDP :
      SDP describes media communication Session : audio/video codecs supported 
			Client A creates RTC peer Connection -> triigers onnegotiationneeded: callback
			Client A creates a new SDP offer [onnegotiationneeded: callback]
			Client A sets the SDP offer as local description 
			Client A sends the SDP offer to Client B via the signalling server(Live view hook + Phx Pubsub)

			signalling server(Live view hook + Phx Pubsub) calls function createPeerConnection(lv, fromUser, offer= defined)
			Client B gets the SDP offer
      Client B sets the received SDP offer as remote Description
      Client B creates an SDP answer 
      Client B sends the SDP answer to Client A via the signalling server(Live view hook + Phx Pubsub)
      Client B sets the sent SDP answer as local Description

    After ICE candidates & SDP are transacted , Streaming starts 

    In a mesh architecture, each user has n - 1 peer connections to each other user. 
    So, if a User C were to enter the chat room, users A and B would need to send their offers, with User C responding, 
    and the rest of the steps taking place as layed out above.
*/ 

function createPeerConnection(lv, fromUser, offer) 
{

  let newPeerConnection = new RTCPeerConnection(
  {
    iceServers: [ { urls: "stun:littlechat.app:3478" } ]
  })

  users[fromUser].peerConnection = newPeerConnection;

  // Add each local track to the RTCPeerConnection.
  localStream.getTracks().forEach(track => newPeerConnection.addTrack(track, localStream))

  newPeerConnection.onicecandidate = async ({candidate}) => {
    // fromUser is the new value for toUser because we're sending this data back to the sender
    lv.pushEvent("new_ice_candidate", {toUser: fromUser, candidate})
  }

  if (offer === undefined) {
    newPeerConnection.onnegotiationneeded = async () => {
      try {
        newPeerConnection.createOffer()
          .then((offer) => {
            newPeerConnection.setLocalDescription(offer)
            console.log("Sending this OFFER to the requester:", offer)
            lv.pushEvent("new_sdp_offer", {toUser: fromUser, description: offer})
          })
          .catch((err) => console.log(err))
      }
      catch (error) {
        console.log(error)
      }
    }
  }

  // If creating an answer, rather than an initial offer.
  if (offer !== undefined) {
    newPeerConnection.setRemoteDescription({type: "offer", sdp: offer})
    newPeerConnection.createAnswer()
      .then((answer) => {
        newPeerConnection.setLocalDescription(answer)
        console.log("Sending this ANSWER to the requester:", answer)
        lv.pushEvent("new_answer", {toUser: fromUser, description: answer})
      })
      .catch((err) => console.log(err))
  }

  newPeerConnection.ontrack = async (event) => {
    console.log("Track received:", event)
    document.getElementById(`video-remote-${fromUser}`).srcObject = event.streams[0]
  }

  return newPeerConnection;
}

// user connections manipulation 
function addUserConnection(userUuid) {
	if (users[userUuid] == undefined) {
		users[userUuid] = { peerConnection: null}
	}
	return users
}

function removeUserConnection(userUuid) {
	delete users[userUuid]

	return users
}

async function initStream() {
	console.log("DBG: initStream() called")
	try {
		// Gets our local media from the browser and stores it as a const stream 
		const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true, width: "1280"})
		// Stores our stream in the global constant, localStream.
		localStream = stream
        // Sets our local video element to stream from the user's webcam (stream).
        document.getElementById("local-video").srcObject = stream
	}
	catch (e) {
		console.log(e)
	}
}

// hooks related 
/*
  A Phx-hook type element at Phx Elixir Render EEEx code 
  can make the js side client code do something 

  for example here when the html first gets rendered by liveview 
  calls the initStreamReq hook's mounted callback gets called via the hook 
*/
let Hooks = {}

// show_live.ex: phx-hook="initStremReq"
Hooks.initStremReq = {
  mounted () 
  {
  	console.log("DBG: initStremReq mount() called")
    initStream()
  }
}

// show_live.ex: phx-hook="InitUser" @ each connected_users video liveview
Hooks.InitUser = {
	mounted() {
		console.log("DBG: initUser mounted() called")
		addUserConnection(this.el.dataset.userUuid)
	},

	destroyed() {
		console.log("DBG: initUser mounted() called")
		removeUserConnection( this.el.dataset.userUuid)
	}
}

Hooks.HandleOfferRequest = {
  mounted () {
    console.log("new offer request from", this.el.dataset.fromUserUuid)
    let fromUser = this.el.dataset.fromUserUuid
    createPeerConnection(this, fromUser)
  }
}

Hooks.HandleIceCandidateOffer = {
  mounted () {
    let data = this.el.dataset
    let fromUser = data.fromUserUuid
    let iceCandidate = JSON.parse(data.iceCandidate)
    let peerConnection = users[fromUser].peerConnection

    console.log("new ice candidate from", fromUser, iceCandidate)

    peerConnection.addIceCandidate(iceCandidate)
  }
}

Hooks.HandleSdpOffer = {
  mounted () {
    let data = this.el.dataset
    let fromUser = data.fromUserUuid
    let sdp = data.sdp

    if (sdp != "") {
      console.log("new sdp OFFER from", data.fromUserUuid, data.sdp)

      createPeerConnection(this, fromUser, sdp)
    }
  }
}

Hooks.HandleAnswer = {
  mounted () {
    let data = this.el.dataset
    let fromUser = data.fromUserUuid
    let sdp = data.sdp
    let peerConnection = users[fromUser].peerConnection

    if (sdp != "") {
      console.log("new sdp ANSWER from", fromUser, sdp)
      peerConnection.setRemoteDescription({type: "answer", sdp: sdp})
    }
  }
}

// socket related

let liveSocket = new LiveSocket("/live", Socket, {hooks: Hooks, params: {_csrf_token: csrfToken}})

// Show progress bar on live navigation and form submits
topbar.config({barColors: {0: "#29d"}, shadowColor: "rgba(0, 0, 0, .3)"})
window.addEventListener("phx:page-loading-start", info => topbar.show())
window.addEventListener("phx:page-loading-stop", info => topbar.hide())

// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket
