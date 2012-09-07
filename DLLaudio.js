/*
 *  Source
 *      Functions
 *      - Play/Stop
 *      - Gain (randomized)
 *      - Pitch (radomized)
 *      - Pan (randomized)
 *      Params
 *      - isLoop
 *      - isPlaying
 *      - curGain
 *      - curPitch
 *      - curPan
 *      
 *
 *  Source.Types
 *      - Buffer
 *      - Oscillator
 *
 *  DSP
 *      - Filter
 *      - Delay
 *      - Convolve
 *      - Analyze
 *      - Split
 *      - Merge
 *      - Dynamics
 *      - Waveshape
 *
 */

/***********************************************************
 * CLASSES
 **********************************************************/

/**************************************************
 * MAIN AUDIO SOURCE
 *************************************************/
/*
function dllSource(context){
    this.context = context; //audio context
    this.isPlaying = 0; //1 for currently playing
    this.curGain = 1.0; //0.0 <==> 1.0
    this.curPitch = 1.0;//playback speed
    this.curPan = 0.0;// -1.0 (L) <=== 0.0 ===> 1.0 (R)
    
    //////////////////////////////////////////////
    //Play/Stop - optional time to play in future
    this.Play = function(time) {
        if(typeof time === "undefined") {time=0;} //play immediately by default
        this.noteOn(time);
        this.isPlaying = 1;
    }
    this.Stop = function(time) {
        if(typeof time === "undefined") {time=0;} //stop immediately by default
        this.noteOff(time);
        this.isPlaying = 0;
    }
    
    //////////////////////////////////////////////
    //Gain - 1 arg sets val, 2 args sets random range
    this.setGain = function(min,max) {
        if(typeof min != "undefined") { //assuming there is at least 1 argument
            if(typeof max != "undefined") { //if there is a second argument
                //return random rounded to 2 decimal places
               this.curGain = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2));
            }
            else {
                this.curGain = min; //otherwise, set to min
            }
        }
    }
    //change the gain over time
    //  value 0.0<=>1.0
    //  time (in seconds)
    //  optional curve - LINEAR (default) or EXPONENTIAL
    this.changeGain = function(val,time,curve) {
        if(typeof curve === "undefined") {curve="LINEAR";} //default
        if(curve==="LINEAR") {
            this.curGain.linearRampToValueAtTime(this.context.currentTime,curGain);
            this.curGain.linearRampToValueAtTime(this.context.currentTime+time, val);
        }
        if(curve==="EXPONENTIAL"){
            this.curGain.exponentialRampToValueAtTime(this.context.currentTime,curGain);
            this.curGain.exponentialRampToValueAtTime(this.context.currentTime+time, val);
        }
    }
    
    //////////////////////////////////////////////
    //Pitch - 1 arg sets val, 2 args sets random range
    this.setPitch = function(min,max) {
        if(typeof min != "undefined") { //assuming there is at least 1 argument
            if(typeof max != "undefined") { //if there is a second argument
                //return random rounded to 2 decimal places
               this.curPitch = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2));
            }
            else {
                this.curPitch = min; //otherwise, set to min
            }
        }
    }
    //change the pitch over time
    //  value 0.0<=>1.0
    //  time (in seconds)
    //  optional curve - LINEAR (default) or EXPONENTIAL
    this.changePitch = function(val,time,curve) {
        if(typeof curve === "undefined") {curve="LINEAR";} //default
        if(curve==="LINEAR") {
            this.curPitch.linearRampToValueAtTime(this.context.currentTime,curGain);
            this.curPitch.linearRampToValueAtTime(this.context.currentTime+time, val);
        }
        if(curve==="EXPONENTIAL"){
            this.curPitch.exponentialRampToValueAtTime(this.context.currentTime,curGain);
            this.curPitch.exponentialRampToValueAtTime(this.context.currentTime+time, val);
        }
    }
    
    //////////////////////////////////////////////
    //Pan
    this.setPan = function(min,max) {
        if(typeof min != "undefined") { //assuming there is at least 1 argument
            if(typeof max != "undefined") { //if there is a second argument
                //return random rounded to 2 decimal places
               this.curPan = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2));
            }
            else {
                this.curPan = min; //otherwise, set to min
            }
        }
    }
    //change pan over time
    //  value 0.0<=>1.0
    //  time (in seconds)
    //  optional curve - LINEAR (default) or EXPONENTIAL
    this.changePan = function(val,time,curve) {
        if(typeof curve === "undefined") {curve="LINEAR";} //default
        if(curve==="LINEAR") {
            this.curPan.linearRampToValueAtTime(this.context.currentTime,curGain);
            this.curPan.linearRampToValueAtTime(this.context.currentTime+time, val);
        }
        if(curve==="EXPONENTIAL"){
            this.curPan.exponentialRampToValueAtTime(this.context.currentTime,curGain);
            this.curPan.exponentialRampToValueAtTime(this.context.currentTime+time, val);
        }
    }
}
*/
/**************************************************
 * SOURCE BUFFAUDIO
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
    //callback declared first...
    this.setBuffSource = function(buf) {
        source = buf[0];
        this.isLoaded = 1;
    }
    //...so we can get audio file from server...
    var buf = new BufferLoader(
        context,
        [filepath,],
        this.setBuffSource
        )
    //...& load
    buf.load();

    
    //////////////////////////////////////////////
    //Play/Stop - optional time to play in future
    this.Play = function(time) {
        //audio data
        this.buffer = this.context.createBufferSource();
        this.buffer.buffer = source;
        //looping
        this.buffer.loop = this.isLoop;
        if(this.isLoop===true){this.isLooping=true;console.log("set true");}
        //pitch
        this.buffer.playbackRate.value = this.curPitch;
        //gain
        this.gain = this.context.createGainNode();
        this.gain.gain.value = this.curGain;
        //pan
        this.pan = this.context.createPanner();
        this.context.listener.setPosition(0,0,0);
        this.pan.setPosition(this.curPan,0,-0.5);      
        //routing
        this.buffer.connect(this.gain);
        this.gain.connect(this.pan);
        this.pan.connect(this.context.destination);
        //playback
        if(typeof time === "undefined") {time=0;} //play immediately by default
        this.buffer.noteOn(time);
        
    }
    this.Stop = function(time) {
        if(this.isLooping===true) {
            console.log("Stop");
            //if(typeof time === "undefined") {time=0;} //stop immediately by default
            this.buffer.noteOff(0);
            
            console.log("off");
            this.isLooping = 0;
        }
    }
    
    //////////////////////////////////////////////
    //Gain - 1 arg sets val, 2 args sets random range
    this.setGain = function(min,max) {
        if(typeof min != "undefined") { //assuming there is at least 1 argument
            if(typeof max != "undefined") { //if there is a second argument
                //return random rounded to 2 decimal places
               this.curGain = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2));
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
                //return random rounded to 2 decimal places
               this.curPan = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2));
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
                //return random rounded to 2 decimal places
               this.curPitch = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2));
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
 * SOURCE OSCILLATOR
 *************************************************/

function dllOsc(context,waveform) {
    this.context = context;
    this.waveform = waveform; //sine,square,saw,tri
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
        //envelope (internal gain for note-on/off)
    this.env = this.context.createGainNode();
    this.env.gain.value = 0.0; //(note off) by default
        //main gain
    this.gain = this.context.createGainNode();
    this.gain.gain.value = this.curGain;
        //pan
    this.pan = this.context.createPanner();
    this.context.listener.setPosition(0,0,0);
    this.pan.setPosition(this.curPan,0,-0.5);
        //routing
    this.osc.connect(this.env); //oscillator to envelope...
    this.env.connect(this.gain);//...to gain
    this.gain.connect(this.pan);//...to panner
    this.pan.connect(this.context.destination);//...to output
    
    //now turn it on - don't worry the envelope is at 0 - it will stay on for the life of the osc
    this.osc.noteOn && this.osc.noteOn(0);
    
    //////////////////////////////////////////////
    //Play a note - Feequency, Duration (optional) in ms
    this.Play = function(freq,duration) {
        console.log("Playing...");
        //set frequency
        this.curFreq = freq;
        this.osc.frequency.value = this.curFreq;
        //turn on envelope
        this.env.gain.linearRampToValueAtTime(0.0, this.context.currentTime);
        this.env.gain.linearRampToValueAtTime(1.0, this.context.currentTime+this.attackTime);
        //if there is a duration specified, schedule Stop event
        if(typeof duration != "undefined") {
            var _this = this; //workaround for weird JS scoping in setTimeout()
            setTimeout(function(){_this.Stop();}, duration); 
        }
    }
    
    //////////////////////////////////////////////
    //Stop a note, immediately
    this.Stop = function() {
        console.log("Stopping...");
        //turn off envelope
        this.env.gain.linearRampToValueAtTime(1.0, this.context.currentTime);
        this.env.gain.linearRampToValueAtTime(0.0, this.context.currentTime+this.releaseTime);
    }
    
    /*************************************
     *V1 - using noteOn() and disconnect()
    this.context = context;
    this.waveform = waveform; //sine,square,saw,tri
    this.curGain = 1.0;//0.0 <==> 1.0
    this.curFreq = 440.0;//Hz
    this.curPan = 0.0;//-1.0 (L) <=== 0.0 ===> 1.0 (R)
    this.osc = null; //nodes...
    this.gain = null;
    this.pan = null;
    
    //create oscillator

    //////////////////////////////////////////////
    //Play a note - Feequency, Duration in ms
    this.Play = function(freq,duration) {
        this.osc = context.createOscillator();
        this.osc.waveform = this.waveform;
        this.curFreq = freq;
        this.osc.frequency.value = this.curFreq;
        //gain
        this.gain = this.context.createGainNode();
        this.gain.gain.value = this.curGain;
        //pan
        this.pan = this.context.createPanner();
        this.context.listener.setPosition(0,0,0);
        this.pan.setPosition(this.curPan,0,-0.5);      
        //routing
        this.osc.connect(this.gain);
        this.gain.connect(this.pan);
        this.pan.connect(this.context.destination);
        //note on
        this.osc.noteOn && this.osc.noteOn(0);
        //schedule note off
        var _this = this; //workaround for weird JS scoping in setTimeout()
        setTimeout(function(){_this.Stop();}, duration); 
    }
    
    //Panic Stop
    this.Stop = function() {
        console.log("Stopping");
        this.osc.disconnect();
    }
    */
    
    //////////////////////////////////////////////
    //Gain - 1 arg sets val, 2 args sets random range
    this.setGain = function(min,max) {
        if(typeof min != "undefined") { //assuming there is at least 1 argument
            if(typeof max != "undefined") { //if there is a second argument
                //return random rounded to 2 decimal places
               this.curGain = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2));
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
                //return random rounded to 2 decimal places
               this.curPan = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2));
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
                //return random rounded to 2 decimal places
               this.curFreq = parseFloat(Math.min(min +(Math.random()*(max-min)),max).toFixed(2));
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
        else if (wave==="SAWTOOTH"){
            this.waveform = 2;
        }
        else if (wave==="TRIANGLE"){
            this.waveform = 3;
        }
        else{console.log("dllError: setWaveform() - invalid waveform", wave);}
        this.osc.waveform = this.waveform;
    }
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
            console.log("1");
            loader.bufferList[index] = buffer;
            
            console.log("2");
            if (++loader.loadCount == loader.urlList.length){
                console.log("3");
                console.log(loader.bufferList);
                console.log("onload",onload);
                console.log("test",loader.onload);
                loader.onload(loader.bufferList);
                console.log(loader.bufferList);
                
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

/*
function BufferLoader(context,urlList,callback){
    this.context=context;
    this.urlList=urlList;
    this.onload=callback;
    this.bufferList=new Array();
    this.loadCount=0;}
    
BufferLoader.prototype.loadBuffer=function(url,index){
    var request=new XMLHttpRequest();
    request.open("GET",url,true);
    request.responseType="arraybuffer";
    var loader=this;
    request.onload=function(){
        loader.context.decodeAudioData(request.response,function(buffer){
        if(!buffer){
            alert('error decoding file data: '+url);
            return;}
        loader.bufferList[index]=buffer;
        if(++loader.loadCount==loader.urlList.length)
            {loader.onload(loader.bufferList);}
            })
    ;}
    request.onerror=function(){
        alert('BufferLoader: XHR error')
        ;}
    request.send();
}

BufferLoader.prototype.load=function(){
    for(var i=0;i<this.urlList.length;++i)
    {this.loadBuffer(this.urlList[i],i);}
}
*/
