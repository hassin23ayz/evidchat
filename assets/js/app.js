// We import the CSS which is extracted to its own file by esbuild.
// Remove this line if you add a your own CSS build pipeline (e.g postcss).
import "../css/app.css"

// If you want to use Phoenix channels, run `mix help phx.gen.channel`
// to get started and then uncomment the line below.
// import "./user_socket.js"

// You can include dependencies in two ways.
//
// The simplest option is to put them in assets/vendor and
// import them using relative paths:
//
//     import "./vendor/some-package.js"
//
// Alternatively, you can `npm install some-package` and import
// them using a path starting with the package name:
//
//     import "some-package"
//

// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import "phoenix_html"
// Establish Phoenix Socket and LiveView configuration.
import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import topbar from "../vendor/topbar"

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")

// video stream
var localStream

// keeping track of our users
var users = {}

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
		addUserConnection(this.el.dataset.userUuid)
	},

	destroyed() {
		removeUserConnection( this.el.dataset.userUuid)
	}
}

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
