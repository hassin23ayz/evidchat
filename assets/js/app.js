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
    // iceServers: [ { urls: "stun:littlechat.app:3478" }," } ]
    //iceServers: [ { urls: "stun.12connect.com:3478" }," } ]
	  iceServers: [
      // { urls: "stun:littlechat.app:3478" },
      { urls: "stun:smsdiscount.com:3478" },              
      { urls: "stun:stun3.l.google.com:19302" },               
      { urls: "stun:engineeredarts.co.uk:3478" },
      { urls: "stun:zadarma.com:3478" },
      { urls: "stun:radiojar.com:3478" },
      { urls: "stun:trainingspace.online:3478" },
      { urls: "stun:meetwife.com:3478" },
      { urls: "stun:stun-eu.3cx.com:3478" },
      { urls: "stun:verbo.be:3478" },
      { urls: "stun:goldfish.ie:3478" },
      { urls: "stun:demos.ru:3478" },
      { urls: "stun:draci.info:3478" },
      { urls: "stun:wtfismyip.com:3478" },
      { urls: "stun:openjobs.hu:3478" },
      { urls: "stun:mixvoip.com:3478" },
      { urls: "stun:124.64.206.224:8800" },
      { urls: "stun:medvc.eu:3478" },
      { urls: "stun:peeters.com:3478" },
      { urls: "stun:gigaset.net:3478" },
      { urls: "stun:callromania.ro:3478" },
      { urls: "stun:sippeer.dk:3478" },
      { urls: "stun:leibergmbh.de:3478" },
      { urls: "stun:yeymo.com:3478" },
      { urls: "stun:voipvoice.it:3478" },
      { urls: "stun:wifirst.net:3478" },
      { urls: "stun:otos.pl:3478" },
      { urls: "stun:piratecinema.org:3478" },
      { urls: "stun:bcs2005.net:3478" },
      { urls: "stun:vavadating.com:3478" },
      { urls: "stun:exoplatform.org:3478" },
      { urls: "stun:justvoip.com:3478" },
      { urls: "stun:foad.me.uk:3478" },
      { urls: "stun:ipfire.org:3478" },
      { urls: "stun:stun1.3cx.com:3478" },
      { urls: "stun:myvoipapp.com:3478" },
      { urls: "stun:steinbeis-smi.de:3478" },
      { urls: "stun:romancecompass.com:3478" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:business-isp.nl:3478" },
      { urls: "stun:kore.com:3478" },
      { urls: "stun:nonoh.net:3478" },
      { urls: "stun:it1.hr:3478" },
      { urls: "stun:voipplanet.nl:3478" },
      { urls: "stun:olimontel.it:3478" },
      { urls: "stun:epygi.com:3478" },
      { urls: "stun:kreis-bergstrasse.de:3478" },
      { urls: "stun:tele2.net:3478" },
      { urls: "stun:sonetel.com:3478" },
      { urls: "stun:poivy.com:3478" },
      { urls: "stun:sipdiscount.com:3478" },
      { urls: "stun:halonet.pl:3478" },
      { urls: "stun:levigo.de:3478" },
      { urls: "stun:tula.nu:3478" },
      { urls: "stun:londonweb.net:3478" },
      { urls: "stun:stun4.l.google.com:19305" },
      { urls: "stun:yesdates.com:3478" },
      { urls: "stun:allflac.com:3478" },
      { urls: "stun:spoiltheprincess.com:3478" },
      { urls: "stun:linuxtrent.it:3478" },
      { urls: "stun:voipconnect.com:3478" },
      { urls: "stun:jay.net:3478" },
      { urls: "stun:ippi.com:3478" },
      { urls: "stun:magyarphone.eu:3478" },
      { urls: "stun:openvoip.it:3478" },
      { urls: "stun:3deluxe.de:3478" },
      { urls: "stun:next-gen.ro:3478" },
      { urls: "stun:trivenet.it:3478" },
      { urls: "stun:crononauta.com:3478" },
      { urls: "stun:romaaeterna.nl:3478" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:nstelcom.com:3478" },
      { urls: "stun:ixc.ua:3478" },
      { urls: "stun:swrag.de:3478" },
      { urls: "stun:ortopediacoam.it:3478" },
      { urls: "stun:uabrides.com:3478" },
      { urls: "stun:cibercloud.com.br:3478" },
      { urls: "stun:easycall.pl:3478" },
      { urls: "stun:cope.es:3478" },
      { urls: "stun:megatel.si:3478" },
      { urls: "stun:bandyer.com:3478" },
      { urls: "stun:imp.ch:3478" },
      { urls: "stun:atagverwarming.nl:3478" },
      { urls: "stun:3cx.com:3478" },
      { urls: "stun:sipgate.net:10000" },
      { urls: "stun:mywatson.it:3478" },
      { urls: "stun:1cbit.ru:3478" },
      { urls: "stun:onthenet.com.au:3478" },
      { urls: "stun:dcalling.de:3478" },
      { urls: "stun:galeriemagnet.at:3478" },
      { urls: "stun:axeos.nl:3478" },
      { urls: "stun:voipstunt.com:3478" },
      { urls: "stun:stun-us.3cx.com:3478" },
      { urls: "stun:issabel.org:3478" },
      { urls: "stun:voipgate.com:3478" },
      { urls: "stun:telbo.com:3478" },
      { urls: "stun:cheapvoip.com:3478" },
      { urls: "stun:clickphone.ro:3478" },
      { urls: "stun:savemgo.com:3478" },
      { urls: "stun:ooma.com:3478" },
      { urls: "stun:syrex.co.za:3478" },
      { urls: "stun:sipgate.net:3478" },
      { urls: "stun:bitburger.de:3478" },
      { urls: "stun:obovsem.com:3478" },
      { urls: "stun:splicecom.com:3478" },
      { urls: "stun:jumblo.com:3478" },
      { urls: "stun:westtel.ky:3478" },
      { urls: "stun:synergiejobs.be:3478" },
      { urls: "stun:lowratevoip.com:3478" },
      { urls: "stun:katholischekirche-ruegen.de:3478" },
      { urls: "stun:stunprotocol.org:3478" },
      { urls: "stun:myvoiptraffic.com:3478" },
      { urls: "stun:3wayint.com:3478" },
      { urls: "stun:skydrone.aero:3478" },
      { urls: "stun:12voip.com:3478" },
      { urls: "stun:voipdiscount.com:3478" },
      { urls: "stun:heeds.eu:3478" },
      { urls: "stun:yollacalls.com:3478" },
      { urls: "stun:piratenbrandenburg.de:3478" },
      { urls: "stun:sewan.fr:3478" },
      { urls: "stun:jabbim.cz:3478" },
      { urls: "stun:arkh-edu.ru:3478" },
      { urls: "stun:voip.blackberry.com:3478" },
      { urls: "stun:aceweb.com:3478" },
      { urls: "stun:dunyatelekom.com:3478" },
      { urls: "stun:fmo.de:3478" },
      { urls: "stun:hoiio.com:3478" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:zottel.net:3478" },
      { urls: "stun:goldener-internetpreis.de:3478" },
      { urls: "stun:hosteurope.de:3478" },
      { urls: "stun:xtratelecom.es:3478" },
      { urls: "stun:threema.ch:3478" },
      { urls: "stun:voipbusterpro.com:3478" },
      { urls: "stun:waterpolopalermo.it:3478" },
      { urls: "stun:fathomvoice.com:3478" },
      { urls: "stun:bergophor.de:3478" },
      { urls: "stun:chaosmos.de:3478" },
      { urls: "stun:t-online.de:3478" },
      { urls: "stun:voipcheap.co.uk:3478" },
      { urls: "stun:istitutogramscisiciliano.it:3478" },
      { urls: "stun:fondazioneroccochinnici.it:3478" },
      { urls: "stun:technosens.fr:3478" },
      { urls: "stun:ringvoz.com:3478" },
      { urls: "stun:voip.eutelia.it:3478" },
      { urls: "stun:simlar.org:3478" },
      { urls: "stun:sylaps.com:3478" },
      { urls: "stun:freecall.com:3478" },
      { urls: "stun:sipnet.com:3478" },
      { urls: "stun:lebendigefluesse.at:3478" },
      { urls: "stun:voipxs.nl:3478" },
      { urls: "stun:netgsm.com.tr:3478" },
      { urls: "stun:tng.de:3478" },
      { urls: "stun:eoni.com:3478" },
      { urls: "stun:voztovoice.org:3478" },
      { urls: "stun:shadrinsk.net:3478" },
      { urls: "stun:f.haeder.net:3478" },
      { urls: "stun:cdosea.org:3478" },
      { urls: "stun:sketch.io:3478" },
      { urls: "stun:easyvoip.com:3478" },
      { urls: "stun:tel.lu:3478" },
      { urls: "stun:frozenmountain.com:3478" },
      { urls: "stun:funwithelectronics.com:3478" },
      { urls: "stun:ringostat.com:3478" },
      { urls: "stun:ppdi.com:3478" },
      { urls: "stun:baltmannsweiler.de:3478" },
      { urls: "stun:files.fm:3478" },
      { urls: "stun:signalwire.com:3478" },
      { urls: "stun:ru-brides.com:3478" },
      { urls: "stun:geesthacht.de:3478" },
      { urls: "stun:diallog.com:3478" },
      { urls: "stun:leucotron.com.br:3478" },
      { urls: "stun:sovtest.ru:3478" },
      { urls: "stun:wia.cz:3478" },
      { urls: "stun:schoeffel.de:3478" },
      { urls: "stun:intervoip.com:3478" },
      { urls: "stun:mobile-italia.com:3478" },
      { urls: "stun:miwifi.com:3478" },
      { urls: "stun:provectio.fr:3478" },
      { urls: "stun:zentauron.de:3478" },
      { urls: "stun:teamfon.de:3478" },
      { urls: "stun:studio71.it:3478" },
      { urls: "stun:ttmath.org:3478" },
      { urls: "stun:cloopen.com:3478" },
      { urls: "stun:acrobits.cz:3478" },
      { urls: "stun:ukh.de:3478" },
      { urls: "stun:wemag.com:3478" },
      { urls: "stun:siptrunk.com:3478" },
      { urls: "stun:framasoft.org:3478" },
      { urls: "stun:hide.me:3478" },
      { urls: "stun:internetcalls.com:3478" },
      { urls: "stun:eol.co.nz:3478" },
      { urls: "stun:syncthing.net:3478" },
      { urls: "stun:acronis.com:3478" },
      { urls: "stun:localphone.com:3478" },
      { urls: "stun:gntel.nl:3478" },
      { urls: "stun:lundimatin.fr:3478" },
      { urls: "stun:tel2.co.uk:3478" },
      { urls: "stun:demos.su:3478" },
      { urls: "stun:webcalldirect.com:3478" },
      { urls: "stun:thebrassgroup.it:3478" },
      { urls: "stun:hicare.net:3478" },
      { urls: "stun:1und1.de:3478" },
      { urls: "stun:kanojo.de:3478" },
      { urls: "stun:nextcloud.com:3478" },
      { urls: "stun:numb.viagenie.ca:3478" },
      { urls: "stun:linphone.org:3478" },
      { urls: "stun:voicetrading.com:3478" },
      { urls: "stun:surjaring.it:3478" },
      { urls: "stun:fitauto.ru:3478" },
      { urls: "stun:stun1.faktortel.com.au:3478" },
      { urls: "stun:myspeciality.com:3478" },
      { urls: "stun:powervoip.com:3478" },
      { urls: "stun:bluesip.net:3478" },
      { urls: "stun:selasky.org:3478" },
      { urls: "stun:marcelproust.it:3478" },
      { urls: "stun:qcol.net:3478" },
      { urls: "stun:voys.nl:3478" },
      { urls: "stun:alpirsbacher.de:3478" },
      { urls: "stun:highfidelity.io:3478" },
      { urls: "stun:wxnz.net:3478" },
      { urls: "stun:var6.cn:3478" },
      { urls: "stun:tichiamo.it:3478" },
      { urls: "stun:logic.ky:3478" },
      { urls: "stun:shy.cz:3478" },
      { urls: "stun:solcon.nl:3478" },
      { urls: "stun:textz.com:3478" },
      { urls: "stun:palava.tv:3478" },
      { urls: "stun:cablenet-as.net:3478" },
      { urls: "stun:stun4.3cx.com:3478" },
      { urls: "stun:sip.us:3478" },
      { urls: "stun:officinabit.com:3478" },
      { urls: "stun:bearstech.com:3478" },
      { urls: "stun:lovense.com:3478" },
      { urls: "stun:jowisoftware.de:3478" },
      { urls: "stun:ko2100.at:3478" },
      { urls: "stun:schulinformatik.at:3478" },
      { urls: "stun:beebeetle.com:3478" },
      { urls: "stun:carlovizzini.it:3478" },
      { urls: "stun:deepfinesse.com:3478" },
      { urls: "stun:ladridiricette.it:3478" },
      { urls: "stun:talkho.com:3478" },
      { urls: "stun:netappel.com:3478" },
      { urls: "stun:sma.de:3478" },
      { urls: "stun:net-mag.cz:3478" },
      { urls: "stun:voipinfocenter.com:3478" },
      { urls: "stun:bethesda.net:3478" },
      { urls: "stun:studio-link.de:3478" },
      { urls: "stun:eleusi.com:3478" },
      { urls: "stun:teliax.com:3478" },
      { urls: "stun:kitamaebune.com:3478" },
      { urls: "stun:1-voip.com:3478" },
      { urls: "stun:nexphone.ch:3478" },
      { urls: "stun:stun3.l.google.com:19305" },
      { urls: "stun:vomessen.de:3478" },
      { urls: "stun:siptraffic.com:3478" },
      { urls: "stun:smslisto.com:3478" },
      { urls: "stun:odr.de:3478" },
      { urls: "stun:bridesbay.com:3478" },
      { urls: "stun:annatel.net:3478" },
      { urls: "stun:taxsee.com:3478" },
      { urls: "stun:dls.net:3478" },
      { urls: "stun:deutscherskiverband.de:3478" },
      { urls: "stun:kiesler.at:3478" },
      { urls: "stun:training-online.eu:3478" },
      { urls: "stun:planetarium.com.br:3478" },
      { urls: "stun:peoplefone.ch:3478" },
      { urls: "stun:etoilediese.fr:3478" },
      { urls: "stun:stun1.l.google.com:19305" },
      { urls: "stun:leonde.org:3478" },
      { urls: "stun:sonetel.net:3478" },
      { urls: "stun:altar.com.pl:3478" },
      { urls: "stun:babelforce.com:3478" },
      { urls: "stun:symonics.com:3478" },
      { urls: "stun:ivao.aero:3478" },
      { urls: "stun:neomedia.it:3478" },
      { urls: "stun:streamnow.ch:3478" },
      { urls: "stun:voipia.net:3478" },
      { urls: "stun:commpeak.com:3478" },
      { urls: "stun:ippi.fr:3478" },
      { urls: "stun:sipthor.net:3478" },
      { urls: "stun:millenniumarts.org:3478" },
      { urls: "stun:rolmail.net:3478" },
      { urls: "stun:sparvoip.de:3478" },
      { urls: "stun:h4v.eu:3478" },
      { urls: "stun:plexicomm.net:3478" },
      { urls: "stun:totalcom.info:3478" },
      { urls: "stun:landvast.nl:3478" },
      { urls: "stun:webmatrix.com.br:3478" },
      { urls: "stun:mit.de:3478" },
      { urls: "stun:easter-eggs.com:3478" },
      { urls: "stun:voicetech.se:3478" },
      { urls: "stun:muoversi.net:3478" },
      { urls: "stun:siedle.com:3478" },
      { urls: "stun:lerros.com:3478" },
      { urls: "stun:expandable.io:3478" },
      { urls: "stun:futurasp.es:3478" },
      { urls: "stun:isp.net.au:3478" },
      { urls: "stun:alphacron.de:3478" },
      { urls: "stun:zepter.ru:3478" },
      { urls: "stun:stun2.3cx.com:3478" },
      { urls: "stun:sky.od.ua:3478" },
      { urls: "stun:stadtwerke-eutin.de:3478" },
      { urls: "stun:meowsbox.com:3478" },
      { urls: "stun:srce.hr:3478" },
      { urls: "stun:myhowto.org:3478" },
      { urls: "stun:optdyn.com:3478" },
      { urls: "stun:freeswitch.org:3478" },
      { urls: "stun:rockenstein.de:3478" },
      { urls: "stun:dus.net:3478" },
      { urls: "stun:dowlatow.ru:3478" },
      { urls: "stun:voipbuster.com:3478" },
      { urls: "stun:l.google.com:19305" },
      { urls: "stun:rackco.com:3478" },
      { urls: "stun:poetamatusel.org:3478" },
      { urls: "stun:stochastix.de:3478" },
      { urls: "stun:gravitel.ru:3478" },
      { urls: "stun:hot-chilli.net:3478" },
      { urls: "stun:vozelia.com:3478" },
      { urls: "stun:marble.io:3478" },
      { urls: "stun:stun3.3cx.com:3478" },
      { urls: "stun:senstar.com:3478" },
      { urls: "stun:actionvoip.com:3478" },
      { urls: "stun:nfon.net:3478" },
      { urls: "stun:voipgrid.nl:3478" },
      { urls: "stun:twt.it:3478" },
      { urls: "stun:anlx.net:3478" },
      { urls: "stun:sipglobalphone.com:3478" },
      { urls: "stun:m-online.net:3478" },
      { urls: "stun:schlund.de:3478" },
      { urls: "stun:nextcloud.com:443" },
      { urls: "stun:voippro.com:3478" },
      { urls: "stun:voztele.com:3478" },
      { urls: "stun:graftlab.com:3478" },
      { urls: "stun:sharpbai.com:3478" },
      { urls: "stun:imafex.sk:3478" },
      { urls: "stun:siplogin.de:3478" },
      { urls: "stun:solnet.ch:3478" },
      { urls: "stun:wcoil.com:3478" },
      { urls: "stun:junet.se:3478" },
      { urls: "stun:ctafauni.it:3478" },
      { urls: "stun:fbsbx.com:3478" },
      { urls: "stun:geonet.ro:3478" },
      { urls: "stun:kaseya.com:3478" },
      { urls: "stun:voipgain.com:3478" },
      { urls: "stun:uls.co.za:3478" },
      { urls: "stun:telnyx.com:3478" },
      { urls: "stun:telonline.com:3478" },
      { urls: "stun:labs.net:3478" },
      { urls: "stun:voipblast.com:3478" },
      { urls: "stun:uiltucssicilia.it:3478" },
      { urls: "stun:freevoipdeal.com:3478" },
      { urls: "stun:axialys.net:3478" },
      { urls: "stun:globalmeet.com:3478" },
      { urls: "stun:l.google.com:19302" },
      { urls: "stun:sipy.cz:3478" },
      { urls: "stun:coffee-sen.com:3478" },
      { urls: "stun:eaclipt.org:3478" },
      { urls: "stun:bernardoprovenzano.net:3478" },
      { urls: "stun:relay.webwormhole.io:3478" },
      { urls: "stun:connecteddata.com:3478" },
      { urls: "stun:vo.lu:3478" },
      { urls: "stun:edwin-wiegele.at:3478" },
      { urls: "stun:lineaencasa.com:3478" },
      { urls: "stun:dreifaltigkeit-stralsund.de:3478" },
      { urls: "stun:elitetele.com:3478" },
      { urls: "stun:smartvoip.com:3478" },
      { urls: "stun:nautile.nc:3478" },
      { urls: "stun:irishvoip.com:3478" },
      { urls: "stun:vivox.com:3478" },
      { urls: "stun:crimeastar.net:3478" },
      { urls: "stun:oncloud7.ch:3478" },
      { urls: "stun:lleida.net:3478" },
      { urls: "stun:liveo.fr:3478" },
      { urls: "stun:genymotion.com:3478" },
      { urls: "stun:faktortel.com.au:3478" },
      { urls: "stun:redworks.nl:3478" },
      { urls: "stun:voipcheap.com:3478" },
      { urls: "stun:godatenow.com:3478" },
      { urls: "stun:effexx.com:3478" },
      { urls: "stun:gmx.de:3478" },
      { urls: "stun:moonlight-stream.org:3478" },
      { urls: "stun:soho66.co.uk:3478" },
      { urls: "stun:acquageraci.it:3478" },
      { urls: "stun:kotter.net:3478" },
      { urls: "stun:voip.aebc.com:3478" },
      { urls: "stun:antisip.com:3478" },
      { urls: "stun:gmx.net:3478" },
      { urls: "stun:comrex.com:3478" },
      { urls: "stun:infra.net:3478" },
      { urls: "stun:ipshka.com:3478" },
      { urls: "stun:sipnet.ru:3478" },
      { urls: "stun:stun2.l.google.com:19305" },
      { urls: "stun:kedr.io:3478" },
      { urls: "stun:vadacom.co.nz:3478" },
      { urls: "stun:nanocosmos.de:3478" },
      { urls: "stun:callwithus.com:3478" },
      { urls: "stun:sipnet.net:3478" },
      { urls: "stun:voipraider.com:3478" },
      { urls: "stun:voipwise.com:3478" },
      { urls: "stun:voipzoom.com:3478" },
      { urls: "stun:rynga.com:3478" },
      { urls: "stun:cellmail.com:3478" },
      { urls: "stun:root-1.de:3478" },
      { urls: "stun:peethultra.be:3478" },
      { urls: "stun:komsa.de:3478" },
      { urls: "stun:innotel.com.au:3478" },
      { urls: "stun:grazertrinkwasseringefahr.at:3478" },
      { urls: "stun:eurosys.be:3478" },
      { urls: "stun:healthtap.com:3478" },
      { urls: "stun:nottingham.ac.uk:3478" },
      { urls: "stun:url.net.au:3478" },
      { urls: "stun:avigora.fr:3478" },
      { urls: "stun:thinkrosystem.com:3478" },
      { urls: "stun:iphone-stun.strato-iphone.de:3478" },
      { urls: "stun:fairytel.at:3478" },
      { urls: "stun:autosystem.com:3478" }    
	  // {
	  //   urls: "turn:139.59.27.84:3478" },?transport=udp",
	  //   username: "ayaz",
	  //   credential: "123456"
	  // }
    ]
  })

  users[fromUser].peerConnection = newPeerConnection;

  // Add each local track to the RTCPeerConnection.
  localStream.getTracks().forEach(track => newPeerConnection.addTrack(track, localStream))

  newPeerConnection.onicecandidate = async ({candidate}) => {
    // fromUser is the new value for toUser because we're sending this data back to the sender
    lv.pushEvent("new_ice_candidate", {toUser: fromUser, candidate});
    console.log("candidate details:", candidate);
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
  console.log("DBG: addUserConnection() called")
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
		console.log("DBG: initUser destroyed() called")
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
