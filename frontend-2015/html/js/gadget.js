/* obecny objekt gadgetu */
JAK.Gadget = JAK.ClassMaker.makeClass({
	NAME:"Gadget",
	VERSION:"1.0"
});

JAK.Gadget = function (id,feedId) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}

	this.feedId = feedId;
	this.eventsCache = new Object();
	this.htmlGadget = JAK.gel(id);
	this.htmlGadget.feedId = feedId;
	this.htmlGadget.gadget = this;

	// typ gagdetu hodi se pro schvavani perexu
	this.feedType = null;
	if(arguments.length == 3) {
		this.feedType = 'rss';
	}

	this.hideTypes = {'rss' : 0, 'email' : 0}; // pouziti pro schovavani perexu, je nutne nastavit span class perex
	this.settings = new JAK.Gadget.Settings(this.htmlGadget);

	this._rssShowDescTimeout = this._rssShowDescTmp.bind(this);

	if(this.feedType in this.hideTypes) {
		this.eventsCache.rssShowDesc = JAK.Events.addListener(window, "resize", this, '_rssShowDesc', false, true);
	}
	this.eventsCache.rssShowDescOnload = JAK.Events.addListener(window, "load", this, this._rssShowDesc, false, true);
};

JAK.Gadget.prototype._rssShowDesc = function () {
	if(this.timer) {
		window.clearTimeout(this.timer);
		this.timer = null;
	}
	this.timer = window.setTimeout(this._rssShowDescTimeout, 20);
}

JAK.Gadget.prototype._rssShowDescTmp = function () {
	this.perexes = JAK.DOM.getElementsByClass('perex',this.htmlGadget,'SPAN');

	var doc = JAK.DOM.getDocSize();
	if(doc.width < 930) {
		for(var i = 0; i < this.perexes.length; i++) {
			if(this.perexes[i].className.indexOf(' hide-perex') == -1) {
				this.perexes[i].className += ' hide-perex';
			}
		}
	} else {
		for(var i = 0; i < this.perexes.length; i++) {
			this.perexes[i].className = this.perexes[i].className.replace(' hide-perex', '');
		}
	}
};

JAK.Gadget.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}

	this.settings.$destructor();
};
