/**
 * @class JAK.Homepage.Seek.Search
 * trida reprezentujici jedno hledani
 * @param {int} pos pozice hledani
 * @param {object} html odkaz na HTML strukturu
 * @param {object} data data pro vytvoreni hledani ze serveru
 * @param {object} parent odkaz na rodicovskou tridu
 */
JAK.Homepage.Advanced.Seek.Search = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.Advanced.Seek.Search",
	VERSION:"1.0"
})

JAK.Homepage.Advanced.Seek.Search.prototype.$constructor = function (pos, html, data, parent, newMyItem) {
	this.pos = pos--;
	this.dom = {};
	this.ev = {};
	this.html = html;
	this.data = data;
	this.parent = parent;
	this.animate = null;

	this.newAdded = newMyItem;

	this._build();
}

JAK.Homepage.Advanced.Seek.Search.prototype.$destructor = function () {
	for (var i in this.ev) {
		JAK.Events.removeListener(this.ev[i]);
	}

	while (this.dom.cont.firstChild) {
		this.dom.cont.removeChild(this.dom.cont.childNodes[0]);
	}
	this.dom.cont.parentNode.removeChild(this.dom.cont);

	for (var p in this) { this[p] = null; }
}

/**
 * oznaci a fadne presunutou polozku
 */
JAK.Homepage.Advanced.Seek.Search.prototype.startFade = function () {
	this.dom.cont.style.backgroundColor = '#cacaeb';

	// po probehnuti interpolatoru musime vymazat atribut style
	var _removeStyle = function () {
		this.dom.cont.removeAttribute('style');
	}
	_removeStyle = _removeStyle.bind(this);

	if (this.animate != null) {
			this.animate.stop();
	}
	this.animate = new JAK.CSSInterpolator(this.dom.cont, 2000, {interpolation:JAK.Interpolator.ASIN, endCallback: _removeStyle});
	this.animate.addColorProperty('backgroundColor', '#cacaeb', '#f7f7ff');
	this.animate.start();
}

/**
 * schvova hledani, ktere uzivatel nema videt
 */
JAK.Homepage.Advanced.Seek.Search.prototype.hide = function () {
	this.dom.cont.style.display = 'none';
}

/**
 * obolduje polozku
 */
JAK.Homepage.Advanced.Seek.Search.prototype.setBold = function (bold) {
	this.dom.lbl.className = (bold ? 'bold': '');
}

/**
 * vyrobi HTML strukturu hledani
 * @private
 */
JAK.Homepage.Advanced.Seek.Search.prototype._build = function () {
	this.dom.cont = JAK.cel('div', 'seek-item');
	this.dom.leftcont = JAK.cel('div', 'seek-left');

	this.dom.chckbx = JAK.cel('input', null, 'seek-' + this.data.searchId);
	this.dom.chckbx.type = 'checkbox';
	if (this.data.isHidden == 0) {
		this.dom.chckbx.checked = 'checked';
	}

	this.dom.lbl = JAK.cel('label');
	this.dom.lbl.htmlFor = 'seek-'+ this.data.searchId;
	this.dom.lbl.innerHTML = this.data.title;

	this.dom.dragNum = JAK.cel('div', 'seek-drag');
	this.dom.dragNum.innerHTML = this.pos;

	this.dom.clear = JAK.cel('div', 'clear');

	if (this.data.groupId == 'user') {
		this.dom.deleteLink = JAK.cel('a');
		this.dom.deleteLink.className = 'delete-text';
		this.dom.deleteLink.href="#";
		this.dom.deleteLink.innerHTML = 'Odstranit';
		JAK.DOM.append([this.html, this.dom.cont], [this.dom.leftcont, this.dom.chckbx, this.dom.lbl], [this.dom.cont, this.dom.dragNum, this.dom.leftcont, this.dom.deleteLink, this.dom.clear]);
		this.ev.deleteLink = JAK.Events.addListener(this.dom.deleteLink, 'click', this, this._delete);
	} else {
		JAK.DOM.append([this.html, this.dom.cont], [this.dom.leftcont, this.dom.chckbx, this.dom.lbl], [this.dom.cont, this.dom.dragNum, this.dom.leftcont, this.dom.clear]);
	}

	if (typeof this.newAdded != 'undefined') {
		// fade fce pro zvyrazneni pridaneho feedu
		function fade (x) {
			var out = Math.abs(Math.cos((Math.pow(x,2))/2 * Math.PI));
			return out;
		}

		if (this.animate != null) {
			this.animate.stop();
		}
		this.animate = new JAK.CSSInterpolator(this.dom.cont, 10000, {interpolation:fade});
		this.animate.addColorProperty('backgroundColor', '#f7f7ff', '#bae497');
		this.animate.start();
	}

	this.ev.click = JAK.Events.addListener(this.dom.chckbx, 'click', this, this._click);
	//JAK.Events.addListener(this.dom.dragNum, 'mouseover', this, this._showHelp);
	//JAK.Events.addListener(this.dom.dragNum, 'mouseout', this, this._hideHelp);
}

/**
 * zavola metodu <b>deleteItem()</b> z managera
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 */
JAK.Homepage.Advanced.Seek.Search.prototype._delete = function (e, elm) {
	JAK.Events.cancelDef(e);
	this.parent.deleteItem(this);

}

/**
 * pri kliknuti na checkbox vola metodu <b>setVisibility()</b> z parenta
 * @private
 */
JAK.Homepage.Advanced.Seek.Search.prototype._click = function () {
	this.parent.setVisibility(this.data.searchId, this.dom.chckbx.checked == false ? '1' : '0');
}

/**
 * ukaze textovou napovedu k presunu
 * @private
 */
JAK.Homepage.Advanced.Seek.Search.prototype._showHelp = function () {
	this.dom.help.style.display = 'block';
}

/**
 * schova textovou napovedu k presunu
 * @private
 */
JAK.Homepage.Advanced.Seek.Search.prototype._hideHelp = function () {
	this.dom.help.style.display = 'none';
}
