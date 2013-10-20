var options = decodeURIComponent(window.location.search.slice(1))
      .split('&')
      .reduce(function _reduce (/*Object*/ a, /*String*/ b) {
        b = b.split('=');
        a[b[0]] = b[1];
        return a;
      }, {});
/////////////////////////////////////////////////////////

var son_eloigne = null;
var son_voix = null;

var DIST = 1.0;
var SEUIL = 5;
var SCALE = 1.0;
var THROTTLE = 500; // milliseconds
var TRANS = 3000; // transition for fade
var DOSCALE = false;

var TRYOUT = options.h ? 'headtrack':'movejs';
console.log("Trying: "+TRYOUT);



/////////////////////////////////////////////////////////
// tryoing headtrack.js
if(TRYOUT=='headtrack') {
	// set up video and canvas elements needed
	var videoInput = document.getElementById('vid');
	var canvasInput = document.getElementById('compare');
	var canvasOverlay = document.getElementById('overlay')
	var debugOverlay = document.getElementById('debug');
	var overlayContext = canvasOverlay.getContext('2d');
	canvasOverlay.style.position = "absolute";
	canvasOverlay.style.top = '0px';
	canvasOverlay.style.zIndex = '100001';
	canvasOverlay.style.display = 'block';
	debugOverlay.style.position = "absolute";
	debugOverlay.style.top = '0px';
	debugOverlay.style.zIndex = '100002';
	debugOverlay.style.display = 'none';

	// add some custom messaging

	statusMessages = {
		"whitebalance" : "checking for stability of camera whitebalance",
		"detecting" : "Detecting face",
		"hints" : "Hmm. Detecting the face is taking a long time",
		"redetecting" : "Lost track of face, redetecting",
		"lost" : "Lost track of face",
		"found" : "Tracking face"
	};

	supportMessages = {
		"no getUserMedia" : "Unfortunately, <a href='http://dev.w3.org/2011/webrtc/editor/getusermedia.html'>getUserMedia</a> is not supported in your browser. Try <a href='http://www.opera.com/browser/'>downloading Opera 12</a> or <a href='http://caniuse.com/stream'>another browser that supports getUserMedia</a>. Now using fallback video for facedetection.",
		"no camera" : "No camera found. Using fallback video for facedetection."
	};

	document.addEventListener("headtrackrStatus", function(event) {
		//console.log(event);
		if (event.status in supportMessages) {
			$("#messA").html(supportMessages[event.status]);
		} else if (event.status in statusMessages) {
			$("#messB").html(statusMessages[event.status]);
		}
	}, true);

	// the face tracking setup

	var htracker = new headtrackr.Tracker({altVideo : {ogv : "./media/capture5.ogv", mp4 : "./media/capture5.mp4"}, calcAngles : true, ui : false, headPosition : false, debug : debugOverlay});
	htracker.init(videoInput, canvasInput);
	htracker.start();

	// for each facetracking event received draw rectangle around tracked face on canvas

	document.addEventListener("facetrackingEvent", function( event ) {
		// clear canvas
		//console.log(event);

		overlayContext.clearRect(0,0,320,240);
		// once we have stable tracking, draw rectangle
		if (event.detection == "CS") {
			overlayContext.translate(event.x, event.y)
			overlayContext.rotate(event.angle-(Math.PI/2));
			overlayContext.strokeStyle = "#00CC00";
			overlayContext.strokeRect((-(event.width/2)) >> 0, (-(event.height/2)) >> 0, event.width, event.height);
			overlayContext.rotate((Math.PI/2)-event.angle);
			overlayContext.translate(-event.x, -event.y);
		}

	    var faceWidth   = event.width,
	    videoWidth  = videoInput.width;
	    DIST = videoWidth/faceWidth; //[1~10];
	    DIST = Math.max(1,Math.min(DIST,10));
	    SCALE = Math.max(1,20/DIST);
	    $("#messC").html("DISTANCE: "+DIST+"  ________  SCALE: "+SCALE);
	   	upupup(); 
	});

	// turn off or on the canvas showing probability
	function showProbabilityCanvas() {
		var debugCanvas = document.getElementById('debug');
		if (debugCanvas.style.display == 'none') {
			debugCanvas.style.display = 'block';
		} else {
			debugCanvas.style.display = 'none';
		}
	}
}

/////////////////////////////////////////////////////////
// trying movejs
if(TRYOUT=='movejs'){ 
	movejs.init();

	document.addEventListener("readyToMove", function() {
		console.log("OFFICIAL READY TO MOVE !");
	});

    setInterval(function(){
    	DIST = Math.max(window.realhumandiff/15000,1);
    	DIST = Math.min(DIST,10);
    	SCALE = Math.max(1,20/DIST);
    	$("#messC").html("REAL: "+window.realhumandiff+"  ________  DISTANCE: "+DIST+"  ________  SCALE: "+SCALE);
    	upupup(); 
    	//30000 a 200000
    },500);
}


document.addEventListener("cameraFound", function() {
	console.log("CAMERA FOUND !");
	nuit(function(){
		var path = 'data/eloigne.jpg';
		displayImage(path, function() {
			jour();
			son_eloigne = new Howl( {
				urls: ['data/eloigne.mp3'],
				loop: true
			} ).play();
		});	
	});
});


/////////////////////////////////////////////////////////
var R,W,H;
function jour(callb) {
	console.log("go to jour");
	d3.select("#mask").transition().duration(TRANS).style("opacity",0.1).each("end",callb);
}
function nuit(callb) {
	console.log("go to nuit");
	d3.select("#mask").transition().duration(TRANS).style("opacity",1).each("end",callb);
}
function init() {
	d3.select("#mask").style("opacity",1);
	displayImage('data/intro.jpg',jour);
}
/////////////////////////////////////////////////////////
function displayImage(path,callb) {
	preloadImage(path, function(s) {
		var s = {'height':this.height,'width':this.width,'ratio':this.width/this.height};
		$("#image")
			.attr('src',path)
			.attr("sr",s.ratio)
			.attr("sw",s.width)
			.attr("sh",s.height);
		//console.log("image loaded:");
		//console.log(s)
		resizeImg({anim:false});
		callb();
	});
}
/////////////////////////////////////////////////////////
function winResized(pos) {
    W = window.innerWidth || e.clientWidth || g.clientWidth;
    H = window.innerHeight|| e.clientHeight|| g.clientHeight;
    R = W/H;
    //console.log("resize: "+W+"/"+H);
    resizeImg({anim:false});
}
window.onresize = winResized;
/////////////////////////////////////////////////////////
function preloadImage(imgSrc,callb) {
    var newImg = new Image();
    newImg.onload = callb;
    //newImg.onerror = callb;
    newImg.src = imgSrc;
}
/////////////////////////////////////////////////////////
var BINGED = false;
function triggerBing() {
	BINGED = true;
	
	console.log("BING DANS TA FACE");

	nuit(function(){
		DOSCALE = true;
		son_eloigne.stop();
		son_voix = new Howl( {
			urls: ['data/parle.mp3'],
			loop:true,
		} ).play();
		displayImage('data/bar.jpg',jour);	
	});
}
/////////////////////////////////////////////////////////
function doRepetitiveThings() {
	//console.log("repet:"+BINGED+"/"+DIST);

	if(!BINGED & DIST>SEUIL) triggerBing();

	resizeImg({
		anim:true,
		scaling:DOSCALE,
	});
}
/////////////////////////////////////////////////////////
function resizeImg(options) {
	options = _.extend({
		anim:true,
		scaling:true,
	}, options)
	//console.log("... resizeImg()");
	var elem = d3.select("#image");
	var w,decX=0,decY=0;
	var wratio = elem.attr("sr");
    R = W/H;
    
    var ds = options.scaling;

    if(wratio<R) {
    	w = ds ? W*SCALE : W;
    	decX = (W-w)/2;
        decY = (H-w/wratio)/2;
    } else { // fill based on height
		w = ds ? H*wratio*SCALE : H*wratio;
        decX = (W-w)/2;
        decY = (H-w/wratio)/2;
    }
    if(options.anim)
    	elem.transition().duration(THROTTLE-10)
    		.style("width",w+"px")
    		.style("left",decX+"px")
    		.style("top",decY+"px");
    else
    	elem.style("width",w+"px")
    		.style("left",decX+"px")
    		.style("top",decY+"px");
}

init();
var upupup = _.throttle(doRepetitiveThings,THROTTLE);




