/* -------------------------------------------
 * Po najeti na radio stanici se zobrazi jeho nazev
 *
 * --------------------------------------------*/
JAK.ShowMusicChannel = JAK.ClassMaker.makeClass({
	NAME: "ShowMusicChannel",
	VERSION: "2.0",
	CLASS: "class"
});

JAK.ShowMusicChannel.prototype.$constructor = function(opt) {
	this._opt = {};
	this._ec = [];

	for (var i in opt) {
		this._opt[i] = opt[i];
	}

	this._playlists = this._opt.playlists;
	for (var i=0; i<this._playlists.length; i++) {
		var playlist = this._playlists[i];

		// - pokud existuje cesta k nahledu, tak si nahled prednactu;
		if (playlist.thumb && playlist.thumb != "") {
			var prevImg = new Image();
			prevImg.src = playlist.thumb;
			playlist.thumbImg = prevImg;
		} else {
			console.warn('nektery z kanalu nema prirazen nahled');
		}
	}

	this._previewLink = this._opt.previewLink;
	this._previewImg = this._opt.previewImg;
	this._previewTextBox = this._opt.previewTextBox;

	if (this._opt.channelTag) {
		var channels = this._opt.channelsBox.getElementsByTagName(this._opt.channelTag); 	/* bublinky s playlisty */
	} else {
		console.warn('neni definovan channelTag');
	}

	this._defaultChannel = null;
	for (var i=0; i<channels.length; i++) {
		var channel = channels[i];
		channel.index = i;

		// - zjistuj, ktery z kanalu je defaultni;
		if (this._opt.selectedClass) {
			if (JAK.DOM.hasClass(channel, this._opt.selectedClass)) {
				this._defaultChannel = channel;
			}
		} else {
			console.warn('neni definovan selectedClass');
		}

		this._ec.push(JAK.Events.addListener(channel, 'mouseover', this, '_overChannel'));
	}

	this._selectedChannel = this._defaultChannel;

	if (!this._defaultChannel) {
		console.warn('neni defaultne vybrany zadny kanal');
	}
};

/*  */
JAK.ShowMusicChannel.prototype._overChannel = function(e, elm) {
	if (this._opt.selectedClass) {
		if (this._selectedChannel) {
			JAK.DOM.removeClass(this._selectedChannel, this._opt.selectedClass);
		}
		JAK.DOM.addClass(elm, this._opt.selectedClass);
	} else {
		console.warn('neni definovan selectedClass');
	}
	this._selectedChannel = elm;

	var channel = this._playlists[elm.index];
	this._changePreview(channel);
}

/* Nastaveni nahledoveho obrazku, popisu a url */
JAK.ShowMusicChannel.prototype._changePreview = function(channel) {
	if (channel.thumbImg) {
		this._previewImg.src = channel.thumbImg.src;
	} else {
		console.warn('tento kanal nema nahled');
	}
	this._previewLink.href = channel.url;
	this._previewTextBox.innerHTML = channel.name;
}
