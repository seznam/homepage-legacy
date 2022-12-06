(function(win) {


	/**
	 * Hlavni trida starajici se o nacitani a inicializaci reklamy.
	 * @param {[type]} externalFlag flag predavany z tengu
	 * @param {[type]} imArray      pole, do ktere se davaji vsechny volane reklamy. IM pak na konci index.html zavola vsechny reklamy najednou
	 */
	var Advert = function(externalFlag, imArray) {
		if (!imArray) {
			console.error("imArray is null or undefined. It must be array");
			return;
		}

		this._externalFlag  	= externalFlag;

		this._imArray 			= imArray;
		this._imObj 			= null;

		this._dom 				= {};
		this._dom.gadget 		= document.querySelector("#gadget-commercial-button");
		this._dom.target 		= this._dom.gadget.querySelector("#adButton");

		this._requestedType 	= Advert.TYPE.NONE;
		this._requestedTimes 	= 0;

		this._contentData 		= null;
		this._advert 			= null;
	};

	/* o jaky typ reklamy se jedna banner = obrazek, video = videoreklama */
	Advert.TYPE = {
		NONE   : 0,
		VIDEO  : 1,
		BANNER : 2
	};

	/* parametry pro DOT pro AB mereni */
	Advert.AB_DOT = {
		VIDEO 	: "video",
		BANNER 	: "banner"
	};

	/* nastavi parametr pro AB mereni - banner vs video */
	Advert.setABTestParam = function(param) {
		var dataDot 		= document.body.getAttribute("data-dot") || "";
		var updatedDataDot 	= "";

		if (dataDot) {
			updatedDataDot = dataDot + " " + param;
		} else {
			updatedDataDot = param;
		}

		document.body.setAttribute("data-dot", updatedDataDot);

		if (window.DOT) {
			window.DOT.hit("event", {
				d: {
					action: "ad_impress",
					adtype: param
				}
			});
		}
	};

	Advert.prototype.load = function(requestType) {
		if (this._requestedTimes > 2) {
			return;
		}

		var advert = this._getAdvertConf(requestType);

		if (this._imObj) {
			this._imObj.getAds([advert]);
		} else {
			this._imArray.push(advert);
		}

		this._requestedTimes++;
	};

	Advert.prototype._getAdvertConf = function(requestType) {
		var advert = {};

		advert.zoneId 	= "seznam.hp.button";
		advert.callback = this._processData.bind(this);

		this._addExternalFlagIfNeeded(advert);

		if (requestType) {
			this._requestedType = requestType;
		} else {
			this._requestedType = this._getRequestType();
		}

		this._addVideoFlagIfNeeded(advert);

		return advert;
	};

	Advert.prototype._addExternalFlagIfNeeded = function(ad) {
		if (this._externalFlag) {
			ad.flag = this._externalFlag;
		}
	};

	Advert.prototype._getRequestType = function() {
		var video           = document.createElement("video");
		var canVideo        = "canPlayType" in video;
		var canTransition   = "transition"  in video.style;
		var isModernBrowser = "MutationObserver" in win;
		var readyForVideo   = isModernBrowser && canVideo && canTransition;

		var allowedPlatform = ["and", "ios"].indexOf(JAK.Browser.platform) == -1;

		if (readyForVideo && allowedPlatform) {
			return Advert.TYPE.VIDEO;
		}

		return Advert.TYPE.BANNER;
	};

	Advert.prototype._addVideoFlagIfNeeded = function(ad) {
		if (this._requestedType == Advert.TYPE.VIDEO) {
			ad.collocation = "video";
		}
	};

	Advert.prototype._processData = function(data) {
		this._imObj = win.im;

		if (!data.impress) {
			this._processMiss(data);

			/* pokud jsme dostali miss a zazadali jsme o video, tak posleme request znova na banner */
			if (this._requestedType == Advert.TYPE.VIDEO) {
				this.load(Advert.TYPE.BANNER);
			}

			return;
		}

		var spot0 		= data.spots[0];
		var contentData = spot0.content;

		this._contentData = contentData;

		/* pokud jsme dostali videoreklamu a chteli jsme banner, posleme request znovu (v imku je spatne oznacena reklama) */
		if (Advert.Video.matchFormat(this._contentData) && this._requestedType == Advert.TYPE.BANNER) {
			this.load(Advert.TYPE.BANNER);
			return;
		}

		this._clearDOMTarget();
		this._createAdvert();

		this._dom.target.classList.add("adFull");
		this._dom.gadget.classList.add("adFull");
	};

	Advert.prototype._clearDOMTarget = function() {
		while(this._dom.target.firstChild) { this._dom.target.removeChild(this._dom.target.firstChild); }
	};

	Advert.prototype._createAdvert = function() {
		if (Advert.Video.matchFormat(this._contentData)) {
			this._advert = new Advert.Video(this._dom.target, this._contentData);
			Advert.setABTestParam(Advert.AB_DOT.VIDEO);
		} else {
			this._advert = new Advert.Banner(this._dom.target, this._contentData);
			Advert.setABTestParam(Advert.AB_DOT.BANNER);
		}
	};

	Advert.prototype._processMiss = function(data) {
		var missHTML = data.miss;

		if (missHTML) {
			this._makeMissHit(missHTML);
		}
	};

	Advert.prototype._makeMissHit = function(missHTML) {
		var temp = document.createElement("div");
			temp.innerHTML = missHTML;

		while(temp.firstChild) { this._dom.target.appendChild(temp.firstChild); }
	};



	/**
	 * Trida pro obsluhu banneru (obrazku)
	 * @param {HTMLElement} DOMTarget do jakeho elementu se ma banner vyrenderovat
	 * @param {Object} contentData data z IMka
	 */
	Advert.Banner = function(DOMTarget, contentData) {
		this._dom 			= {};
		this._dom.target 	= DOMTarget;

		this._contentData 	= contentData;

		this._build();
	};

	Advert.Banner.prototype._build = function() {
		var separated 		= JAK.DOM.separateCode(this._contentData);

		var html 			= separated[0];
		var js 				= separated[1];

		this._buildHtml(html);
		this._processJS(js);
	};

	Advert.Banner.prototype._buildHtml = function(html) {
		var div 			= document.createElement("div");
		div.innerHTML 		= html;

		while(div.firstChild) { this._dom.target.appendChild(div.firstChild); }

		var bannerPreview = document.createElement("div");
			bannerPreview.id = "bannerPreview";

		this._dom.target.appendChild(bannerPreview);
		this._dom.target.style.display = "block";
	};

	Advert.Banner.prototype._processJS = function(js) {
		eval(js);
	};



	/**
	 * Trida pro obsluhu video reklamy
	 * @param {HTMLElement} DOMTarget do jakeho elementu se ma banner vyrenderovat
	 * @param {Object} contentData data z IMka
	 */
	Advert.Video = function(DOMTarget, contentData) {
		this._contentData 	= contentData;
		this._videoData 	= null;

		this._dom			= {};
		this._dom.target 	= DOMTarget;

		this._renderer 		= null;

		var separated 	= JAK.DOM.separateCode(this._contentData);
		var html 		= separated[0];
		var js 			= separated[1];

		this._createVideoDataFromJS(js);
		this._build(html);
	};

	Advert.Video.VIDEO_REG_MATCH = /['"]video_source['"]/;

	Advert.Video.matchFormat = function(contentData) {
		return Advert.Video.VIDEO_REG_MATCH.test(contentData);
	};

	Advert.Video.prototype._createVideoDataFromJS = function(js) {
		var data = eval(js);

		this._videoData = new Advert.Video.Data(data);
	};

	Advert.Video.prototype._build = function(html) {
		this._renderer = new Advert.Video.Renderer(this._videoData);
		this._renderer.onFirstPlaying(this._makeImpressHit.bind(this, html));
		this._renderer.onFirstVideoEnlarged(this._makeActionHit.bind(this, html));
		this._renderer.onFirstVideoEnd(this._makeVideoEndHit.bind(this));
		this._renderer.renderTo(this._dom.target);
	};

	Advert.Video.prototype._makeImpressHit = function(html) {
		var div = document.createElement("div");
		div.innerHTML = html;

		while(div.firstChild) { this._dom.target.appendChild(div.firstChild); }

		var externalImpressImages = this._videoData.getExternalImpressImages();

		while(externalImpressImages.length) {
			var extImpress = externalImpressImages.pop();
			var img        = new Image();
				img.src    = extImpress;
		}
	};

	Advert.Video.prototype._makeActionHit = function() {
		var actionImage = this._videoData.getActionImpressImage();

		if (!actionImage) { return; }

		var img = new Image();
			img.src = actionImage;
	};

	Advert.Video.prototype._makeVideoEndHit = function() {
		var impressImage = this._videoData.getVideoEndImpressImage();

		if (!impressImage) { return; }

		var img = new Image();
			img.src = impressImage;
	};



	/**
	 * Datovy obal pro video data z IMka
	 * @param {object} data data z IMka
	 */
	Advert.Video.Data = function(data) {
		this._data = data;
	};

	Advert.Video.Data.prototype.getBackgroundImage = function() {
		return this._data.background_image || "";
	};

	Advert.Video.Data.prototype.getClickthruHref = function() {
		return this._data.clickthru || "";
	};

	Advert.Video.Data.prototype.getActionImpressImage = function() {
		return this._data.action_image || "";
	};

	Advert.Video.Data.prototype.getExternalImpressImages = function() {
		var externalPixels = [];

		if (this._data.ext_pixel) {
			externalPixels.push(this._data.ext_pixel);
		}

		if (this._data.ext_pixel1) {
			externalPixels.push(this._data.ext_pixel1);
		}

		if (this._data.ext_pixel2) {
			externalPixels.push(this._data.ext_pixel2);
		}

		return externalPixels;
	};

	Advert.Video.Data.prototype.getVideoEndImpressImage = function() {
		return this._data.ext_pixel3 || "";
	};

	Advert.Video.Data.prototype.getMP4Url = function(quality) {
		var mp4 = this._getVideo("mp4", quality);

		return mp4 ? mp4.url : "";
	};

	Advert.Video.Data.prototype.getWebmUrl = function(quality) {
		var webm = this._getVideo("webm", quality);

		return webm ? webm.url : "";
	};

	Advert.Video.Data.prototype._getVideo = function(format, quality) {
		var video = this._data.video_source.filter(function(source) {
			return source.format == format && source.quality == quality;
		})[0];

		return video;
	};



	/**
	 * Stara se o rendering video reklamy. Ma navesene udalosti.
	 * @param {Advert.Video.Data} videoData
	 */
	Advert.Video.Renderer = function(videoData) {
		this._videoData 				= videoData;

		this._dom 						= {};
		this._dom.target 				= null;

		this._timeoutEnlarging 			= null;
		this._enlargingEnabled  		= true;

		this._onFirstPlayingCbk 		= null;
		this._onFirstVideoEnlargedCbk 	= null;
		this._onFirstVideoEndCbk 		= null;

		this._enlargeVideo 			 	= this._enlargeVideo.bind(this);
		this._canReduceVideoSize 		= this._canReduceVideoSize.bind(this);
		this._onVideoEnd 				= this._onVideoEnd.bind(this);
		this._delayEnlargingVideo 		= this._delayEnlargingVideo.bind(this);
		this._replayVideo 				= this._replayVideo.bind(this);
		this._onPlayingStart 			= this._onPlayingStart.bind(this);
	};

	Advert.Video.Renderer.modifyUrl = function(url) {
		return url.replace(/^https?:/, "");
	};

	Advert.Video.Renderer.prototype.onFirstPlaying = function(cbk) {
		this._onFirstPlayingCbk = cbk;
	};

	Advert.Video.Renderer.prototype.onFirstVideoEnlarged = function(cbk) {
		this._onFirstVideoEnlargedCbk = cbk;
	};

	Advert.Video.Renderer.prototype.onFirstVideoEnd = function(cbk) {
		this._onFirstVideoEndCbk = cbk;
	};

	Advert.Video.Renderer.prototype.renderTo = function(targetElm) {
		this._dom.target 		= targetElm;

		this._build();
		this._hideReplayImage();
		this._createVolumeFadeControl();

		this._dom.target.appendChild(this._dom.container);
	};

	Advert.Video.Renderer.prototype.destroy = function() {
		this._dom.video.removeEventListener("playing", this._onPlayingStart);
		this._dom.video.removeEventListener("ended", this._onVideoEnd);
		this._dom.container.removeEventListener("mouseenter", this._delayEnlargingVideo);
	};

	Advert.Video.Renderer.prototype._build = function() {
		var blurredImgSrc = Advert.Video.Renderer.modifyUrl(this._videoData.getBackgroundImage());

		var container = document.createElement("div");
			container.classList.add("advert-container");
			container.style.backgroundImage = "url(" + blurredImgSrc + ")";

		this._dom.container = container;
		this._dom.container.addEventListener("mouseenter", this._delayEnlargingVideo);

		this._addVideo(this._dom.container);
		this._addCleaner(this._dom.container);
		this._addPointerImage(this._dom.container);
		this._addReplayImage(this._dom.container);
	};

	Advert.Video.Renderer.prototype._addVideo = function(container) {
		var mp4 	= Advert.Video.Renderer.modifyUrl(this._videoData.getMP4Url("360p"));
		var webm 	= Advert.Video.Renderer.modifyUrl(this._videoData.getWebmUrl("360p"));

		var videoWrapper = document.createElement("div");
			videoWrapper.classList.add("video-wrapper");

		var video = document.createElement("video");
			video.autoplay = true;
			video.classList.add("video-advert");

		var srcMp4 = document.createElement("source");
			srcMp4.type = "video/mp4";
			srcMp4.src = mp4;

		var srcWebm = document.createElement("source");
			srcWebm.type = "video/webm";
			srcWebm.src = webm;

		video.appendChild(srcMp4);
		video.appendChild(srcWebm);

		videoWrapper.appendChild(video);

		var overlay = document.createElement("a");
			overlay.href = this._videoData.getClickthruHref();
			overlay.classList.add("overlay");

		videoWrapper.appendChild(overlay);

		this._dom.overlay 		= overlay;
		this._dom.video 		= video;
		this._dom.video.addEventListener("ended", this._onVideoEnd);
		this._dom.video.addEventListener("playing", this._onPlayingStart);

		this._dom.videoWrapper 	= videoWrapper;

		container.appendChild(this._dom.videoWrapper);
	};

	Advert.Video.Renderer.prototype._addCleaner = function(container) {
		var cleaner = document.createElement("div");
			cleaner.classList.add("clear");

		container.appendChild(cleaner);
	};

	Advert.Video.Renderer.prototype._addPointerImage = function(container) {
		var pointerImage = document.createElement("span");
			pointerImage.classList.add("icon-image");

		var image = document.createElement("img");
			image.src = "/st/img/gadget-commercial/pointer.png";

		pointerImage.appendChild(image);

		this._dom.pointerImage = pointerImage;
		container.appendChild(this._dom.pointerImage);
	};

	Advert.Video.Renderer.prototype._addReplayImage = function(container) {
		var replayImage = document.createElement("span");
			replayImage.classList.add("icon-image");
			replayImage.classList.add("replay");

		var image = document.createElement("img");
			image.src = "/st/img/gadget-commercial/replay.png";

		replayImage.appendChild(image);

		var text = document.createElement("span");
			text.classList.add("image-text");
			text.appendChild(document.createTextNode("Přehrát znovu"));

		replayImage.appendChild(text);

		this._dom.replayImage = replayImage;
		this._dom.replayImage.addEventListener("click", this._replayVideo);

		container.appendChild(this._dom.replayImage);
	};

	Advert.Video.Renderer.prototype._createVolumeFadeControl = function() {
		this._volumeFadeControl	= new Advert.Video.VolumeFadeControl(this._dom.video);
		this._volumeFadeControl.mute();
	};

	Advert.Video.Renderer.prototype._showPointerImage = function() {
		this._dom.pointerImage.classList.remove("hidden");
	};

	Advert.Video.Renderer.prototype._hidePointerImage = function() {
		this._dom.pointerImage.classList.add("hidden");
	};

	Advert.Video.Renderer.prototype._showReplayImage = function() {
		this._dom.replayImage.classList.remove("hidden");
	};

	Advert.Video.Renderer.prototype._hideReplayImage = function() {
		this._dom.replayImage.classList.add("hidden");
	};

	Advert.Video.Renderer.prototype._delayEnlargingVideo = function() {
		if (!this._enlargingEnabled) { return; }
		this._timeoutEnlarging = setTimeout(this._enlargeVideo, 500);
		this._registerVideoReducingEvent();
	};

	Advert.Video.Renderer.prototype._registerVideoReducingEvent = function() {
		document.addEventListener("mousemove", this._canReduceVideoSize);
	};

	Advert.Video.Renderer.prototype._unregisterVideoReducingEvent = function() {
		document.removeEventListener("mousemove", this._canReduceVideoSize);
	};

	Advert.Video.Renderer.prototype._enlargeVideo = function() {
		this._resetEnlargingTimeout();
		this._enlargeVideoSize();
		this._volumeFadeControl.setDuration(1.5);
		this._volumeFadeControl.volumeUp();
	};

	Advert.Video.Renderer.prototype._enlargeVideoSize = function() {
		this._dom.container.classList.add("enlarged");
		this._onVideoEnlarged();
	};

	Advert.Video.Renderer.prototype._canReduceVideoSize = function(e) {
		var target = e.target;
		var isContainer = this._dom.container == target;
		var isInContainer = this._dom.container.contains(target);

		if (isContainer || isInContainer) { return; }

		this._unregisterVideoReducingEvent();

		if (this._timeoutEnlarging) {
			this._resetEnlargingTimeout();
			return;
		}

		this._reduceVideoSizeIfEnlarged();
		this._volumeFadeControl.setDuration(0.5);
		this._volumeFadeControl.volumeDown();
	};

	Advert.Video.Renderer.prototype._reduceVideoSizeIfEnlarged = function() {
		if (this._dom.container.classList.contains("enlarged")) {
			this._dom.container.classList.remove("enlarged");
		}
	};

	Advert.Video.Renderer.prototype._resetEnlargingTimeout = function() {
		clearTimeout(this._timeoutEnlarging);
		this._timeoutEnlarging = null;
	};

	Advert.Video.Renderer.prototype._onPlayingStart = function() {
		if (this._onFirstPlayingCbk) {
			this._onFirstPlayingCbk();
		}

		this._onFirstPlayingCbk = null;
	};

	Advert.Video.Renderer.prototype._onVideoEnlarged = function() {
		if (this._onFirstVideoEnlargedCbk) {
			this._onFirstVideoEnlargedCbk();
		}

		this._onFirstVideoEnlargedCbk = null;
	};

	Advert.Video.Renderer.prototype._onVideoEnd = function() {
		this._dom.video.currentTime = Math.max(this._dom.video.duration - 2, 0); /* magicka konstanta - namereno z praxe, dve sekundy pred koncem byva product message */
		this._dom.video.pause(); /* IE 11 potrebuje pause, jinak se video toci stale dokola */

		this._volumeFadeControl.mute();
		this._reduceVideoSizeIfEnlarged();
		this._hidePointerImage();
		this._showReplayImage();
		this._hideOverlay();

		this._enlargingEnabled = false;

		if (this._onFirstVideoEndCbk) {
			this._onFirstVideoEndCbk();
			this._onFirstVideoEndCbk = null;
		}
	};

	Advert.Video.Renderer.prototype._replayVideo = function() {
		this._dom.video.currentTime = 0;
		this._dom.video.play();
		this._hideReplayImage();
		this._showPointerImage();
		this._showOverlay();

		this._enlargingEnabled = true;

		this._registerVideoReducingEvent();
		this._enlargeVideo();
	};

	Advert.Video.Renderer.prototype._showOverlay = function() {
		this._dom.overlay.style.opacity = "";
	};

	Advert.Video.Renderer.prototype._hideOverlay = function() {
		this._dom.overlay.style.opacity = 0;
	};


	/**
	 * Ovladac hlasitosti. Umi zesilit i ztlumit hlasitost s fade efektem.
	 * @param {HTMLVideoElement} videoElm element videa, na ktery se ma hlasitost aplikovat
	 */
	Advert.Video.VolumeFadeControl = function(videoElm) {
		this._dom = {};
		this._dom.videoWrapper = videoElm;

		this._volume 	= 0;
		this._step 		= 0.05;
		this._up 	 	= false;

		this._interval = null;
	};

	Advert.Video.VolumeFadeControl.prototype.mute = function() {
		this._volume = 0;
		this._setVolume();
	};

	Advert.Video.VolumeFadeControl.prototype.setDuration = function(time) {
		this._step = 100 / (time * 1000);
	};

	Advert.Video.VolumeFadeControl.prototype.volumeUp = function() {
		this._resetInterval();
		this._up = true;
		this._interval = setInterval(this._volumeTick.bind(this), 100);
	};

	Advert.Video.VolumeFadeControl.prototype.volumeDown = function() {
		this._resetInterval();
		this._up = false;
		this._interval = setInterval(this._volumeTick.bind(this), 100);
	};

	Advert.Video.VolumeFadeControl.prototype._volumeTick = function() {
		this._volume = this._volume + (this._up ? this._step : -this._step);

		if (this._volume < 0 || this._volume > 1) {
			this._volume = Math.max(0, Math.min(this._volume, 1));
			this._resetInterval();
		}

		this._setVolume();
	};

	Advert.Video.VolumeFadeControl.prototype._setVolume = function() {
		this._dom.videoWrapper.volume = this._volume;
	};

	Advert.Video.VolumeFadeControl.prototype._resetInterval = function() {
		if (!this._interval) { return; }
		clearInterval(this._interval);
		this._interval = null;
	};

	win.GadgetCommercialAdvert = Advert;

})(window);