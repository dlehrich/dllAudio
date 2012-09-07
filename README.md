dllAudio **WORK IN PROGRESS**
===========================
easy javascript access to the HTML5 Web Audio API

Sample use of dllAudio:
```
//create audio context
var context;
try {context = new webkitAudioContext();}
catch(e) {alert("Web Audio not supported in this browser.");}

//Sample Audio
mySound = dllBuffAudio(context, "..path/to/sound.wav");
mySound.setGain(0.5); set gain to 50%
mySound.isLoop = true; //support for looping sounds
mySound.Play();

//Oscillator
mySynth = dllOsc(context, "SINE"); //Wavetypes - SINE, SQUARE, SAW, TRI
mySynth.setAttack(.05);//support for attack and release time in seconds
mySynth.Play(frequency, duration);

```

by Dan Lehrich  
DLehrich@gmail.com  
www.onthedll.com  
@ontheDLL
