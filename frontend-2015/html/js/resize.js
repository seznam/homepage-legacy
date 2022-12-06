JAK.Resize = JAK.ClassMaker.makeClass({
	NAME:"Resize",
	VERSION:"1.0"
});

JAK.Resize = function () {
	this.eventsCache = new Object();
	this._recalcTimer = this._recalcTMP.bind(this);
};

JAK.Resize.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Resize.prototype._recalc = function () {
	if(this.timer) {
		window.clearTimeout(this.timer);
		this.timer = null;
	}
	this.timer = window.setTimeout(this._recalcTimer, 20);
}

JAK.Resize.prototype.init = function () {
	return;
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
		return;
	}

	this._recalcTMP();
	this.eventsCache['resize'] = JAK.Events.addListener(window, 'resize', this, '_recalcTimer', false, true);
};

JAK.Resize.prototype._recalcTMP = function () {
	var pg = JAK.gel('page');
	var hd = JAK.gel('head');
	var docSize = JAK.DOM.getDocSize();
	if (docSize.width > 1024) {
		pg.className = pg.className.replace(/\s{0,1}min-width/g,'').replace(/\s{0,1}max-width/g,'');
		pg.className = pg.className + ' max-width';
		hd.className = hd.className.replace(/\s{0,1}min-width/g,'').replace(/\s{0,1}max-width/g,'');
		hd.className = hd.className + ' max-width';
	} else if (docSize.width < 770) {
		pg.className = pg.className.replace(/\s{0,1}min-width/g,'').replace(/\s{0,1}max-width/g,'');
		pg.className = pg.className + ' min-width';
		hd.className = hd.className.replace(/\s{0,1}min-width/g,'').replace(/\s{0,1}max-width/g,'');
		hd.className = hd.className + ' min-width';
	} else {
		pg.className = pg.className.replace(/\s{0,1}min-width/g,'').replace(/\s{0,1}max-width/g,'');
		hd.className = hd.className.replace(/\s{0,1}min-width/g,'').replace(/\s{0,1}max-width/g,'');
	}
};

JAK.resize = new JAK.Resize();
