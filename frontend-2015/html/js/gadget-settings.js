/* defaultni setting objekt gadgetu*/
JAK.Gadget.Settings = JAK.ClassMaker.makeClass({
	NAME:"Settings",
	VERSION:"1.0"
});
JAK.Gadget.Settings.prototype.$constructor = function (htmlGadget) {
	this.htmlGadget = htmlGadget;
	this.eventsCache = new Object();
	this.init();
};


JAK.Gadget.Settings.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Gadget.Settings.close = function(e, elm) {
	var t = JAK.Gadget.Settings;
	if (!t.current) { return; }

	if (e.type == "mousedown" || e.keyCode == 27) {
		var method = t.current.closeSettings || t.current._close;
		method.call(t.current, e, elm);
		t.current = null;
	}
}

JAK.Gadget.Settings.current = null;
JAK.Events.addListener(document, "mousedown", JAK.Gadget.Settings.close);
JAK.Events.addListener(document, "keypress", JAK.Gadget.Settings.close);

JAK.Gadget.Settings.prototype._stop = function (e, elm) {
	JAK.Events.stopEvent(e);
};

JAK.Gadget.Settings.prototype.init = function () {
	this.htmlSettings = JAK.DOM.getElementsByClass('gadget-settings',this.htmlGadget,'div')[0];
	if(!this.htmlSettings) return false;

	this.htmlSettings.style.display = 'none';
	/* odkazy */

	this.openLink = JAK.DOM.getElementsByClass('edit-text',this.htmlGadget,'a')[0];
	this.closeLink = JAK.DOM.getElementsByClass('close-setting-link',this.htmlSettings,'a')[0];
	if(this.openLink) {
		this.eventsCache.openLink = JAK.Events.addListener(this.openLink, 'click', this, this.openSettings, false, true);
	}

	if(this.closeLink) {
		this.eventsCache.closeLink = JAK.Events.addListener(this.closeLink, 'click', this, this.closeSettings, false, true);
	}

	JAK.flags.addFlag('gagdetSettings', 'closed');

	this.eventsCache.stopEvnts = JAK.Events.addListener(this.htmlSettings, 'mousedown', this, '_stop', false, true);
	this.elems = this.htmlSettings.getElementsByTagName('input');
	for(var e = 0; e < this.elems.length; e++) {
		this.eventsCache['stopEvntsElm'+e] = JAK.Events.addListener(this.elems[e], 'mousedown', this, '_stop', false, true);
	}
};

JAK.Gadget.Settings.prototype.openSettings = function (e, elm) {
	JAK.Gadget.Settings.current = this;
	if(typeof e != 'undefined') {
		JAK.Events.cancelDef(e);
		JAK.Events.stopEvent(e);
	}
	if(JAK.flags.getFlagValue('gagdetSettings') == 'opened') {
		return 0;
	}
	JAK.flags.setFlagValue('gagdetSettings', 'opened');
	// nastaveni relative gadgetu kvuli pozicovani
	if(JAK.Browser.client == 'ie') {
		JAK.DOM.getElementsByClass('main-cont',this.htmlGadget,'div')[0].style.position = 'relative';
	} else {
		this.htmlGadget.style.position = 'relative';
		JAK.DOM.getElementsByClass('g-cnt',this.htmlGadget,'div')[0].style.overflow = 'visible';
	}

	this.htmlGadget.className += ' opensettings';
	this.htmlSettings.style.overflow = 'hidden';
	this.htmlSettings.style.display = 'block';

};

JAK.Gadget.Settings.prototype.closeSettings = function (e, elm) {
	if(typeof e != 'undefined') {
		JAK.Events.cancelDef(e);
		JAK.Events.stopEvent(e);
	}

	JAK.flags.setFlagValue('gagdetSettings', 'closed');

	//this.htmlGadget.style.position = 'static';
	if(JAK.Browser.client == 'ie') {
		JAK.DOM.getElementsByClass('main-cont',this.htmlGadget,'div')[0].style.position = 'static';
	} else {
		this.htmlGadget.style.position = 'static';
		JAK.DOM.getElementsByClass('g-cnt',this.htmlGadget,'div')[0].style.overflow = 'auto';
	}

	this.htmlSettings.style.display = 'none';

	this.htmlGadget.className = this.htmlGadget.className.replace(' opensettings', '');
};
