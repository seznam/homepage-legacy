/* schovava okno s vyznamnym dnem dle cookie */
Homepage.BigDayOff = JAK.ClassMaker.makeClass({
	NAME:"Homepage.BigDayOff",
	VERSION:"1.0"
});

Homepage.BigDayOff.prototype.$constructor = function (parent,feedId) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}

	this._feedId = feedId;
	this._parent = parent;
	this._htmlObject = JAK.gel(parent);
	this._ec = {};
	this._dom = {};

	this._init();
};

Homepage.BigDayOff.prototype._init = function () {
	this._dom.a  = JAK.DOM.getElementsByClass('edit-text', this._htmlObject, 'a')[0];
	this._ec.close = JAK.Events.addListener(this._dom.a, 'click', this, this._close);

	if (document.cookie.indexOf('sznbddhp') != -1) {
		this._htmlObject.style.display = 'none';
	}
}

Homepage.BigDayOff.prototype._close = function (e,elm) {
	JAK.Events.cancelDef(e);
	/*if (!window.confirm('Opravdu chcete skrýt tuto informaci?')) {
		return 0;
	}*/
	var next24hours = new Date();
	next24hours.setDate(next24hours.getDate()+1);
	document.cookie = 'sznbddhp='+new Date().getTime() + ';expires='+next24hours.toGMTString();

	if (document.cookie.indexOf('sznbddhp') != -1) {
		this._htmlObject.style.display = 'none';
	}
};
