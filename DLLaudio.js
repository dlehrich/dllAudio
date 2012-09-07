/*
 *  dllAudio
 *  easy access to HTML5 Web Audio API
 *  
 *  by Dan Lehrich
 *  DLehrich@gmail.com
 *  www.onthedll.com
 *
 *  Source.Types
 *      - dllBuffAudio: load and play an audio file. one-shot/looping, volume & pan (w/ randomization)
 *      - dllOsc: monophonic oscillator. waveform type, frequency, attack/release time, volume & pan (w/ randomization)
 *
 *  DSP (***not yet implemented***)
 *      - Filter
 *      - Delay
 *      - Convolve
 *      - Analyze
 *      - Split
 *      - Merge
 *      - Dynamics
 *      - Waveshape
 *
 *  NEXT TASKS:
 *  - create first effect
 *  - fill in missing functions on BuffAudio and Osc
 *  - consolidate Pan/Gain into standalone object?
 *
 */

/**************************************************
 * SOURCE: dllBuffAudio
 *************************************************/
function dllBuffAudio(context, filepath) {
    this.context = context;
    this.isLoaded = false;
    this.curGain = 1.0;//0.0 <==> 1.0
    this.curPitch = 1.0;//playback speed
    this.curPan = 0.0;//-1.0 (L) <=== 0.0 ===> 1.0 (R)
    this.isLoop = false;
    this.isLooping = false;
    this.buffer = null; //nodes...
    this.gain = null;
    this.pan = null;
    var source = null; //private buffer audio data
    
    //////////////////////////////////////////////
    //File load via BufferLoader
    this.setBuffSource = function(buf) { //callback declared first...
        source = buf[0];
        this.isLoaded = 1;
    }
    var buf = new BufferLoader( //...so we can get audio file from server...
        context,
        [filepath,],
        this.setBuffSource
        )
    buf.load(); //...& load

    //////////////////////////////////////////////
    //Play/Stop - optional time to play in future
    this.Play = function(time) {
        this.buffer = this.context.createBufferSource(); //audio data
        this.buffer.buffer = source;
        this.buffer.loop = this.isLoop; //looping
        if(this.isLoop===true){this.isLooping=true;console.log("set true");}
        this.buffer.playbackRate.value = this.curPitch; //pitch
        this.gain = this.context.createGainNode(); //gain
        this.gain.gain.value = this.curGain;
        this.pan = this.context.createPanner(); //pan
        this.context.listener.setPosition(0,0,0);
        this.pan.setPosition(this.curPan,0,-0.5);      
        this.buffer.connect(this.gain); //routing
        this.gain.connect(this.pan);
        this.pan.connect(this.context.destination);
        if(typeof time === "undefined") {time=0;}    //play immediately by default
        this.buffer.noteOn(time);
    }
    //Stop is for looping sounds only, one-shots aren't tracked
    this.Stop = function(time) {
        if(this.isLooping===true) {
            this.buffer.noteOff(0);
            this.isLooping = 0;
        }
    }
    //////////////////////////////////////////////
    //Gain - 1 arg sets val, 2 args sets random range
    this.setGain = function(min,max) {
        if(typeof min != "undefined") { //assuming there is at least 1 argument
            if(typeof max != "undefined") { //if there is a second argument
               this.curGain = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2)); //random rounded to 2 decimal places
            }
            else {this.curGain = min;} //otherwise, set to min
            if(this.gain){
                this.gain.gain.setValueAtTime(this.curGain,this.context.currentTime);
            }
        }
        else{console.log("dllError: setGain() needs an argument");}
    }
    //change the gain over time (in seconds)
    //  optional curve - LINEAR (default) or EXPONENTIAL
    this.changeGain = function(val,time,curve) {
        if(typeof curve === "undefined") {curve="LINEAR";} //default
        if(curve==="LINEAR") {
            this.gain.gain.linearRampToValueAtTime(this.curGain, this.context.currentTime);
            this.gain.gain.linearRampToValueAtTime(val, this.context.currentTime+time);
        }
        if(curve==="EXPONENTIAL"){
            this.gain.gain.exponentialRampToValueAtTime(this.curGain, this.context.currentTime);
            this.gain.gain.exponentialRampToValueAtTime(val, this.context.currentTime+time);
        }
    }
    //////////////////////////////////////////////
    //Pan - 1 arg sets val, 2 args sets random range
    //TODO - support more sophisticated 3d placement
    //TODO - automated change over time
    this.setPan = function(min,max) {
        if(typeof min != "undefined") { //assuming there is at least 1 argument
            if(typeof max != "undefined") { //if there is a second argument
               this.curPan = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2)); //random rounded to 2 decimal places
            }
            else {this.curPan = min;} //otherwise, set to min
            if(this.pan){
                this.pan.setPosition(this.curPan,0,-0.5);
            }
        }
        else{console.log("dllError: setPan() needs an argument");}
    }
    //////////////////////////////////////////////
    //Pitch - 1 arg sets val, 2 args sets random range
    this.setPitch = function(min,max) {
        if(typeof min != "undefined") { //assuming there is at least 1 argument
            if(typeof max != "undefined") { //if there is a second argument
               this.curPitch = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2)); //return random rounded to 2 decimal places
            }
            else {this.curPitch = min;} //otherwise, set to min
            if(this.buffer){
                this.buffer.playbackRate.setValueAtTime(this.curPitch,this.context.currentTime);
            }
        }
        else{console.log("dllError: setPitch() needs an argument");}
    }
    //change the gain over time (in seconds)
    //  optional curve - LINEAR (default) or EXPONENTIAL
    this.changePitch = function(val,time,curve) {
        if(typeof curve === "undefined") {curve="LINEAR";} //default
        if(curve==="LINEAR") {
            this.buffer.playbackRate.linearRampToValueAtTime(this.curPitch, this.context.currentTime);
            this.buffer.playbackRate.linearRampToValueAtTime(val, this.context.currentTime+time);
        }
        if(curve==="EXPONENTIAL"){
            this.buffer.playbackRate.exponentialRampToValueAtTime(this.curPitch, this.context.currentTime);
            this.buffer.playbackRate.exponentialRampToValueAtTime(val, this.context.currentTime+time);
        }
    } 
}

/**************************************************
 * SOURCE: dllOsc
 *************************************************/
function dllOsc(context,waveform) {
    this.context = context;
    this.type = waveform; //sine,square,saw,tri
    this.curGain = 1.0;//0.0 <==> 1.0
    this.curFreq = 440.0;//Hz
    this.curPan = 0.0;//-1.0 (L) <=== 0.0 ===> 1.0 (R)
    this.osc = null; //nodes
    this.gain = null;
    this.pan = null;
    this.envelope = null;
    this.attackTime = .01; //attack time in milliseconds
    this.releaseTime = .01; //release time in milliseconds
    
    //create oscillator, set envelope gain to Null, and turn it on by default
    this.osc = context.createOscillator();
    this.osc.waveform = this.waveform;
    this.curFreq = freq;
    this.osc.frequency.value = this.curFreq;
    this.env = this.context.createGainNode();//envelope (internal gain for note-on/off)
    this.env.gain.value = 0.0; //(note off) by default
    this.gain = this.context.createGainNode(); //main gain
    this.gain.gain.value = this.curGain;
    this.pan = this.context.createPanner(); //pan
    this.context.listener.setPosition(0,0,0);
    this.pan.setPosition(this.curPan,0,-0.5);
    this.osc.connect(this.env); //Routing - oscillator to envelope...
    this.env.connect(this.gain);//...to gain
    this.gain.connect(this.pan);//...to panner
    this.pan.connect(this.context.destination);//...to output
    this.osc.noteOn && this.osc.noteOn(0); //turn on note with envelope at 0
    
    //////////////////////////////////////////////
    //Play a note - Feequency, Duration (optional) in ms
    this.Play = function(freq,duration) {
        this.curFreq = freq; //set frequency
        this.osc.frequency.value = this.curFreq;
        this.env.gain.linearRampToValueAtTime(0.0, this.context.currentTime); //turn on envelope
        this.env.gain.linearRampToValueAtTime(1.0, this.context.currentTime+this.attackTime);
        
        if(typeof duration != "undefined") { //if duration specified, schedule Stop event
            var _this = this; //workaround for weird JS scoping in setTimeout()
            setTimeout(function(){_this.Stop();}, duration); 
        }
    }
    //////////////////////////////////////////////
    //Stop a note, immediately
    this.Stop = function() {
        this.env.gain.linearRampToValueAtTime(1.0, this.context.currentTime); //turn off envelope
        this.env.gain.linearRampToValueAtTime(0.0, this.context.currentTime+this.releaseTime);
    }
    //////////////////////////////////////////////
    //Gain - 1 arg sets val, 2 args sets random range
    this.setGain = function(min,max) {
        if(typeof min != "undefined") { //assuming there is at least 1 argument
            if(typeof max != "undefined") { //if there is a second argument
               this.curGain = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2)); //random rounded to 2 decimals
            }
            else {this.curGain = min;} //otherwise, set to min
            if(this.gain){
                this.gain.gain.setValueAtTime(this.curGain,this.context.currentTime);
            }
        }
        else{console.log("dllError: setGain() needs an argument");}
    }
    //change the gain over time (in seconds)
    //  optional curve - LINEAR (default) or EXPONENTIAL
    this.changeGain = function(val,time,curve) {
        if(typeof curve === "undefined") {curve="LINEAR";} //default
        if(curve==="LINEAR") {
            this.gain.gain.linearRampToValueAtTime(this.curGain, this.context.currentTime);
            this.gain.gain.linearRampToValueAtTime(val, this.context.currentTime+time);
        }
        if(curve==="EXPONENTIAL"){
            this.gain.gain.exponentialRampToValueAtTime(this.curGain, this.context.currentTime);
            this.gain.gain.exponentialRampToValueAtTime(val, this.context.currentTime+time);
        }
    }
    //////////////////////////////////////////////
    //Pan - 1 arg sets val, 2 args sets random range
    //TODO - support more sophisticated 3d placement
    //TODO - automated change over time
    this.setPan = function(min,max) {
        if(typeof min != "undefined") { //assuming there is at least 1 argument
            if(typeof max != "undefined") { //if there is a second argument
               this.curPan = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2)); //random rounded to 2 decimals
            }
            else {this.curPan = min;} //otherwise, set to min
            if(this.pan){
                this.pan.setPosition(this.curPan,0,-0.5);
            }
        }
        else{console.log("dllError: setPan() needs an argument");}
    }
    //////////////////////////////////////////////
    //Freq - 1 arg sets val, 2 args sets random range
    this.setFreq = function(min,max) {
        if(typeof min != "undefined") { //assuming there is at least 1 argument
            if(typeof max != "undefined") { //if there is a second argument
               this.curFreq = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2)); //random rounded to 2 decimals
            }
            else {this.curFreq = min;} //otherwise, set to min
            if(this.osc){
                this.osc.frequency.setValueAtTime(this.curFreq,this.context.currentTime);
            }
        }
        else{console.log("dllError: setFreq() needs an argument");}
    }
    //change the gain over time (in seconds)
    //  optional curve - LINEAR (default) or EXPONENTIAL
    this.changePitch = function(val,time,curve) {
        if(typeof curve === "undefined") {curve="LINEAR";} //default
        if(curve==="LINEAR") {
            this.osc.frequency.linearRampToValueAtTime(this.curFreq, this.context.currentTime);
            this.osc.frequency.linearRampToValueAtTime(val, this.context.currentTime+time);
        }
        if(curve==="EXPONENTIAL"){
            this.osc.frequency.exponentialRampToValueAtTime(this.curFreq, this.context.currentTime);
            this.osc.frequency.exponentialRampToValueAtTime(val, this.context.currentTime+time);
        }
    }
    this.setWaveform = function(wave) {
        if (wave==="SINE"){
            this.waveform = 0;
        }
        else if (wave==="SQUARE"){
            this.waveform = 1;
        }
        else if (wave==="SAW"){
            this.waveform = 2;
        }
        else if (wave==="TRI"){
            this.waveform = 3;
        }
        else{console.log("dllError: setWaveform() - invalid waveform", wave);}
        this.osc.type = this.waveform;
    }
    this.setWaveform(waveform);
}

/**************************************************
 * HELP FUNCTIONS
 *************************************************/
//source - http://www.html5rocks.com/en/tutorials/webaudio/intro/js/buffer-loader.js
function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}
BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    var loader = this;
    request.onload = function() {
        var buffer;
        try {
            buffer = loader.context.createBuffer(request.response, false);
        } catch(e) {
            alert('error decoding file data: ' + url);
        }
        try {
            loader.bufferList[index] = buffer;
            if (++loader.loadCount == loader.urlList.length){
                loader.onload(loader.bufferList);
            }
        } catch(e) {
            console.log(e);
            alert('BufferLoader: callback problem');
        }
    }
    request.onerror = function() {
        alert('BufferLoader: XHR error');        
    }
    request.send();
}
BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i)
        this.loadBuffer(this.urlList[i], i);
}
