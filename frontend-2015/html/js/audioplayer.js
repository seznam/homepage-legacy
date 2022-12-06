
JAK.AudioPlayer = JAK.ClassMaker.makeClass({
	NAME: "AudioPlayer",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals]
});

JAK.AudioPlayer.prototype.$constructor = function(options) {
	options = options || {};
	this._options = {
		autoplay: typeof options.autoplay !== "undefined" ? options.autoplay : false
	};
	this._ready = false;
	this._audio = null;
	this._ec = [];
	this._flags = {
		loadendFired: false,
		lastChangeTime: 0,
		stopped: true
	};

	this._init();
};

JAK.AudioPlayer.prototype.$destructor = function() {
	this._ready = false;
	for (var i = this._ec.length - 1; i >= 0; i--) {
		JAK.Events.removeListener(this._ec[i]);
	};
	this._audio.pause();
	this._audio.src = "";
	for (var p in this) { this[p] = null; }
};

JAK.AudioPlayer.prototype.isReady = function() {
	return this._ready;
};

JAK.AudioPlayer.prototype.isSetMedia = function() {
	return this._audio.src != "";
};

JAK.AudioPlayer.prototype.isPlaying = function() {
	return !this._audio.paused;
};

JAK.AudioPlayer.prototype.isMute = function() {
	return this._audio.muted;
};

JAK.AudioPlayer.prototype.setMedia = function(data) {
	if (!data || !data.media) {
		throw new Error("Invalid argument: argument 'data' must be object and contain at least one item in media attribute");
	}

	this._set(data);

	if (!this._audio.src) {
		throw new Error("Invalid state: there is no source");
	}

	this.makeEvent("setedmedia");
};

JAK.AudioPlayer.prototype.setVolume = function(level) {
	if (level < 0 || level > 1) {
		throw new Error("Invalid argument: invalid volume level");
	}

	this._audio.volume = level;
};

JAK.AudioPlayer.prototype.setMute = function(on) {
	this._audio.muted = !!on;
};

JAK.AudioPlayer.prototype.getElm = function() {
	return this._audio;
};

JAK.AudioPlayer.prototype.getVolume = function() {
	return this._audio.volume;
};

JAK.AudioPlayer.prototype.getCurrentTime = function() {
	return this._audio.currentTime;
};

JAK.AudioPlayer.prototype.getDuration = function() {
	return this._audio.duration;
};

JAK.AudioPlayer.prototype.play = function() {
	this._flags.stopped = false;
	this._audio.play();
};

JAK.AudioPlayer.prototype.pause = function() {
	this._audio.pause();
};

JAK.AudioPlayer.prototype.stop = function() {
	this._flags.stopped = true;
	this._audio.pause();
	this._audio.currentTime = 0;
	this.makeEvent("stop");
};

JAK.AudioPlayer.prototype.seek = function(time) {
	if (time < 0) {
		time = 0;
	} else if (time > this._audio.duration) {
		time = this._audio.duration;
	}

	this.makeEvent("seekstart", { time:this._audio.currentTime });
	this._audio.currentTime = time;
};

JAK.AudioPlayer.prototype._init = function() {
	this._build();
	this._addListeners();

	this._ready = true;
	this.makeEvent("ready");
};

JAK.AudioPlayer.prototype._build = function() {
	this._audio = JAK.cel("audio");
	if (this._options.autoplay) {
		this._audio.setAttribute("autoplay", "");
	}
};

JAK.AudioPlayer.prototype._addListeners = function() {
	// loading
	this._ec.push(JAK.Events.addListener(this._audio, "progress", this, "_eProgress"));
	this._ec.push(JAK.Events.addListener(this._audio, "loadedmetadata", this, "_eLoadedmetadata"));
	this._ec.push(JAK.Events.addListener(this._audio, "canplay", this, "_eCanplay"));
	this._ec.push(JAK.Events.addListener(this._audio, "stalled", this, "_eStalled"));
	// playback
	this._ec.push(JAK.Events.addListener(this._audio, "play", this, "_ePlay"));
	this._ec.push(JAK.Events.addListener(this._audio, "pause", this, "_ePause"));
	// position
	this._ec.push(JAK.Events.addListener(this._audio, "timeupdate", this, "_eTimeupdate"));
	this._ec.push(JAK.Events.addListener(this._audio, "seeked", this, "_eSeeked"));
	this._ec.push(JAK.Events.addListener(this._audio, "ended", this, "_eEnded"));
	// other
	this._ec.push(JAK.Events.addListener(this._audio, "volumechange", this, "_eVolumechange"));
	this._ec.push(JAK.Events.addListener(this._audio, "error", this, "_eError"));
};

JAK.AudioPlayer.prototype._eProgress = function() {
	/* pokud se video prehrava, webkit neustale generuje progress i kdyz je video jiz cele nacteno */
	if (this._flags.loadendFired) {
		return;
	}

	var buffered = 0;
	var percent = 0;
	if (this._audio.readyState > this._audio.HAVE_NOTHING) {
		var ranges = this._audio.buffered;
		/* hotfix: obcas vznikne chyba IndexSizeError */
		try {
			buffered = ranges.length > 0 ? ranges.end(ranges.length-1) : ranges.end(0);
		} catch (error) {
			console.error(error);
			buffered = 0;
		}
		percent = Math.round(buffered/this._audio.duration*100);
	}

	this.makeEvent("progress", { buffered:buffered, percent:percent });
	if (buffered >= this._audio.duration) {
		this._flags.loadendFired = true;
		this.makeEvent("loadend");
	}
};

JAK.AudioPlayer.prototype._eLoadedmetadata = function() {
	this.makeEvent("loadedmetadata");

	/* pokud ma IE(10) jiz cele video zacachovane (z minula) nevygeneruje zadnou udalost progress,
	obdobne Opera (Presto) sice jednou vygeneruje udalost progress ale jeste pred loadedmetadata (takze je buffered 0) */
	var ranges = this._audio.buffered;
	/* ve webkitu obcas vznikne chyba IndexSizeError */
	try {
		var buffered = ranges.length > 0 ? ranges.end(ranges.length-1) : ranges.end(0);
	} catch (error) {
		console.error(error);
		var buffered = 0;
	}
	if (!this._flags.loadendFired && buffered >= this._audio.duration) {
		this._flags.loadendFired = true;
		var percent = Math.round(buffered/this._audio.duration*100);
		this.makeEvent("progress", { buffered:buffered, percent:percent });
		this.makeEvent("loadend");
	}
};

JAK.AudioPlayer.prototype._eCanplay = function() {
	this.makeEvent("canplay");
};

JAK.AudioPlayer.prototype._eStalled = function() {
	this.makeEvent("stalled");
};

JAK.AudioPlayer.prototype._ePlay = function() {
	this.makeEvent("play");
};

JAK.AudioPlayer.prototype._ePause = function() {
	/* na konci videa vetsinou vznikne udalost pause, aniz by pausnuti bylo vyzadovano, proto je vznik signalu podminen hodnotou atributu ended */
	if (!this._audio.ended && !this._flags.stopped) {
		this.makeEvent("pause");
	}
};

JAK.AudioPlayer.prototype._eTimeupdate = function() {
	/* webkit vygeneruje tuto udalost (jednou) i kdyz prehravani jeste nezacalo */
	if (this._audio.paused) {
		return;
	}

	this.makeEvent("timeupdate", {
		currentTime: this._audio.currentTime,
		duration: this._audio.duration
	});
	var time = Math.floor(this._audio.currentTime);
	if (time > this._flags.lastChangeTime) {
		this._flags.lastChangeTime = time;
		this.makeEvent("normtimeupdate", {
			currentTime: time,
			duration: this._audio.duration
		});
	}
};

JAK.AudioPlayer.prototype._eSeeked = function() {
	this._flags.lastChangeTime = this._audio.currentTime;
	this.makeEvent("seekend", { currentTime:this._audio.currentTime });
};

JAK.AudioPlayer.prototype._eEnded = function() {
	this.makeEvent("ended");
};

JAK.AudioPlayer.prototype._eVolumechange = function() {
	var level = this._audio.muted ? 0 : this._audio.volume;
	this.makeEvent("volumechange", { level:level });
};

JAK.AudioPlayer.prototype._eError = function(e, elm) {
	console.error(e);
};

JAK.AudioPlayer.prototype._set= function(data) {
	this._clear();
	var instance = this._getInstance(data.media);
	this._audio.poster = data.poster ? data.poster : "";
	this._audio.src = instance ? instance.source : "";
	this._audio.load();

	/* Pokud by se k nastaveni zdroje pouzili elementy source (pro kazdy typ jeden) a nechali prohlizec vybrat si,
	vybral by si prvni v seznamu, o kterem by si rekl "maybe". Pri testovani to navic »nejak« rozhodilo player */
};

JAK.AudioPlayer.prototype._clear= function() {
	this._flags.loadendFired = false;
	this._flags.lastChangeTime = 0;
	this._flags.stopped = true;
};

JAK.AudioPlayer.prototype._getInstance = function(sources) {
	var found = -1;
	var canPlay = "";
	for (var i = 0, len = sources.length; i < len; i++) {
		canPlay = this._audio.canPlayType(sources[i].type);
		if (canPlay == "probably") {
			found = i;
			break;
		} else if (canPlay == "maybe" && found == -1) {
			found = i;
		}
	}

	return found > -1 ? sources[found] : null;
};



/**
 * Player s ovladacim panelem
 */

JAK.NovinkyAudioPlayer = JAK.ClassMaker.makeClass({
	NAME: "NovinkyAudioPlayer",
	VERSION: "1.0",
	EXTEND: JAK.AudioPlayer
});

JAK.NovinkyAudioPlayer.prototype.$constructor = function(options) {
	options = options || {};
	this._dom = {};
	this._sc = [];
	this.$super(options);
	this._options.imgPath = typeof options.imgPath !== "undefined" ? options.imgPath : "";
	this._addControlsListeners();
};

JAK.NovinkyAudioPlayer.prototype._build = function() {
	this.$super();

	this._dom.container = JAK.cel("div", "audioPlayer");
	this._dom.container.appendChild(this._audio);

		this._dom.controls = JAK.cel("div", "controls");
		this._dom.container.appendChild(this._dom.controls);

			this._dom.toggle = JAK.cel("div", "toggle");
			this._dom.toggle.style.display = "none";
			this._dom.controls.appendChild(this._dom.toggle);

			this._dom.tButton = JAK.cel("button", "tButton");
			this._dom.toggle.appendChild(this._dom.tButton);

			this._dom.progress = JAK.cel("div", "progress");
			this._dom.controls.appendChild(this._dom.progress);

			this._dom.pWrapper = JAK.cel("div", "pWrapper");
			this._dom.progress.appendChild(this._dom.pWrapper);

			this._dom.barContent = JAK.cel("div", "barContent");
			this._dom.bar = JAK.cel("div", "bar");

			// Volume
			this._dom.volumeWrapper = JAK.cel("div", "volumeWrapper");

			this._dom.volume = JAK.cel("div", "volume");
			this._dom.volumeWrapper.appendChild(this._dom.volume);
			
			this._dom.volumeMute = JAK.cel("div", "volumeMute");
			this._dom.volume.appendChild(this._dom.volumeMute);

			this._dom.volumeMuteMask = JAK.cel("div", "volumeMuteMask");
			this._dom.volumeMute.appendChild(this._dom.volumeMuteMask);

			this._dom.volumeMuteSel = JAK.cel("div", "volumeMuteSelect");
			this._dom.volumeMute.appendChild(this._dom.volumeMuteSel);

			this._dom.volumeCtl = JAK.cel("div", "volumeControl");
			this._dom.volume.appendChild(this._dom.volumeCtl);

			this._dom.volumeMask = JAK.cel("div", "volumeMask");
			this._dom.volumeCtl.appendChild(this._dom.volumeMask);
			
			this._dom.volumeSel = JAK.cel("div", "volumeSelect");
			this._dom.volumeCtl.appendChild(this._dom.volumeSel);

			this._dom.bar.appendChild(this._dom.volumeWrapper);
			// ~ Volume

			this._dom.bar.appendChild(this._dom.barContent);
			this._dom.pWrapper.appendChild(this._dom.bar);

			this._dom.timeCurrent = JAK.cel("div", "time timeOut timeCurrent");
			this._dom.timeCurrent.innerHTML = this._formatTime(0);
			this._dom.timeCurrent.style.display = "none";
			this._dom.barContent.appendChild(this._dom.timeCurrent);

			this._dom.timeDuration = JAK.cel("div", "time timeIn timeDuration");
			this._dom.timeDuration.innerHTML = this._formatTime(0);
			this._dom.timeDuration.style.display = "none";
			this._dom.barContent.appendChild(this._dom.timeDuration);

			this._dom.loading = JAK.cel("div", "loading");
			this._dom.loading.innerHTML = 'načítám ...';
			this._dom.loading.style.display = "none";
			this._dom.barContent.appendChild(this._dom.loading);

			this._dom.pbLoad = JAK.cel("div", "pbLoad");
			this._dom.barContent.appendChild(this._dom.pbLoad);

			this._dom.pbPlay = JAK.cel("div", "pbPlay");
			this._dom.barContent.appendChild(this._dom.pbPlay);

			this._dom.pbCtl = JAK.cel("div", "pbControl");
			this._dom.barContent.appendChild(this._dom.pbCtl);
};

JAK.NovinkyAudioPlayer.prototype.getElm = function() {
	return this._dom.container;
};

JAK.NovinkyAudioPlayer.prototype._formatTime = function(time) {
	var fullSeconds = parseInt(time, 10);
	var hours   = Math.floor(fullSeconds / 3600);
	var minutes = Math.floor((fullSeconds - (hours * 3600)) / 60);
	var seconds = fullSeconds - (hours * 3600) - (minutes * 60);

	if (isNaN(seconds) || isNaN(minutes)) { return "00:00"; }
	
	var finalTime = (minutes > 9 ? minutes : "0" + minutes) + ":" + (seconds > 9 ? seconds : "0" + seconds);
	if (hours > 0) {
		finalTime = hours + ":" + finalTime;
	}
	return finalTime;
};

JAK.NovinkyAudioPlayer.prototype._syncToggle = function() {
	if (this.isPlaying()) {
		JAK.DOM.removeClass(this._dom.tButton, "play");
		JAK.DOM.addClass(this._dom.tButton, "pause");
		//this._dom.tImg.src = this._options.imgPath + JAK.NovinkyAudioPlayer.IMG_PAUSE;
		//this._dom.tImg.alt = "pause";
	} else {
		JAK.DOM.removeClass(this._dom.tButton, "pause");
		JAK.DOM.addClass(this._dom.tButton, "play");
		//this._dom.tImg.src = this._options.imgPath + JAK.NovinkyAudioPlayer.IMG_PLAY;
		//this._dom.tImg.alt = "play";
	}
};

JAK.NovinkyAudioPlayer.prototype._syncProgress = function() {
	var time = this.getCurrentTime();
	var duration = this.getDuration();
	var percent = ((time / duration) * 100);
	this._dom.pbPlay.style.width = percent + "%";
	//this._dom.pbPlay.value = time / duration;
};

JAK.NovinkyAudioPlayer.prototype._syncVolume = function() {
	var percent = 0;

	if (!this.isMute()) {
		var volume = this.getVolume();
		percent = volume * 100;
		this._dom.volumeMuteSel.style.opacity = 1;
	} else {
		this._dom.volumeMuteSel.style.opacity = 0;
	}

	this._dom.volumeSel.style.width = percent + "%";
};

JAK.NovinkyAudioPlayer.prototype._addControlsListeners = function() {
	this._sc.push(this.addListener("setedmedia", "_sSetedmedia"));
	this._sc.push(this.addListener("play", "_sPlayPause"));
	this._sc.push(this.addListener("pause", "_sPlayPause"));
	this._sc.push(this.addListener("ended", "_sEnded"));
	this._sc.push(this.addListener("loadedmetadata", "_sLoadedmetadata"));
	this._sc.push(this.addListener("timeupdate", "_sTimeupdate"));
	this._sc.push(this.addListener("seekend", "_sSeekend"));
	
	this._ec.push(JAK.Events.addListener(this._audio, "loadeddata", this, "_eLoadeddata"));
	this._ec.push(JAK.Events.addListener(this._dom.tButton, "click", this, "_eToggle"));
	this._ec.push(JAK.Events.addListener(this._dom.pbCtl, "click", this, "_eBarClick"));
	this._ec.push(JAK.Events.addListener(this._dom.volume, "click", this, "_eVolumeClick"));
	this._ec.push(JAK.Events.addListener(this._dom.volumeMute, "click", this, "_eMuteClick"));
};

JAK.NovinkyAudioPlayer.prototype._eLoadeddata = function() {
	this._dom.bar.style.width = '99%';
	this._dom.loading.style.display = 'none';
	this._dom.timeCurrent.style.display = "block";
	JAK.DOM.addClass(this._dom.bar, 'loaded');
	setTimeout(function(){
		this._dom.volumeWrapper.style.opacity = 1;
		this._dom.bar.style.borderColor = "transparent";
		this._dom.bar.style.background = "none";
		this._dom.timeDuration.style.display = "block";
		this._dom.toggle.style.display = "block";
	}.bind(this), 500);
	
};

JAK.NovinkyAudioPlayer.prototype._sSetedmedia = function() {
	var c = this._formatTime(0);
	var d = this._formatTime(this.getDuration());
	this._dom.timeCurrent.innerHTML = c;
	this._dom.timeDuration.innerHTML = d;
	this._syncToggle();
	this._syncProgress();
};

JAK.NovinkyAudioPlayer.prototype._sPlayPause = function() {
	if(this._dom.bar.offsetWidth < 40) {
		this._dom.bar.style.width = '80%';
		if (JAK.Browser.client == 'ie' && parseFloat(JAK.Browser.version) <= 9) {
			this._dom.loading.style.display = 'block';
			this._dom.bar.style.width = '99%';
		}
	}
	this._syncToggle();
};

JAK.NovinkyAudioPlayer.prototype._sEnded = function() {
	this.stop();
	this._syncToggle();
};

JAK.NovinkyAudioPlayer.prototype._sLoadedmetadata = function() {
	var d = this._formatTime(this.getDuration());
	this._dom.timeDuration.innerHTML = d;
};

JAK.NovinkyAudioPlayer.prototype._sTimeupdate = function() {
	var c = this._formatTime(this.getCurrentTime());
	this._dom.timeCurrent.innerHTML = c;
	this._syncProgress();
};

JAK.NovinkyAudioPlayer.prototype._sSeekend = function() {
	var c = this._formatTime(this.getCurrentTime());
	this._dom.timeCurrent.innerHTML = c;
	this._syncProgress();
};

JAK.NovinkyAudioPlayer.prototype._eToggle = function(e) {
	if(e){
		JAK.Events.cancelDef(e);
	}
	
	if (this.isPlaying()) {
		this.pause();
	} else {
		this.play();
	}
};

JAK.NovinkyAudioPlayer.prototype._eBarClick = function(e) {
	JAK.Events.cancelDef(e);
	var client = this._dom.pbCtl.getBoundingClientRect();
	var clickPos = e.clientX - client.left;
	var percent = clickPos / this._dom.pbCtl.clientWidth;
	percent = Math.max(0, Math.min(1, percent));
	this.seek(parseInt(this.getDuration(), 10) * percent);
};

JAK.NovinkyAudioPlayer.prototype._eVolumeClick = function(e) {
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
	this.setMute(false);
	var client = this._dom.volumeCtl.getBoundingClientRect();
	var clickPos = e.clientX - client.left;
	var percent = clickPos / this._dom.volumeCtl.clientWidth;
	percent = Math.max(0, Math.min(1, percent));
	if (percent == 0) {
		this.setMute(true);
	}
	this.setVolume(percent);
	this._syncVolume();
};

JAK.NovinkyAudioPlayer.prototype._eMuteClick = function(e) {
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
	this.setMute(!this.isMute());
	this._syncVolume();
};
