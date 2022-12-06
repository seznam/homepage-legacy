/*
 * pro zachovani refereru u odkazu na https
*/
JAK.HttpsLinks = JAK.ClassMaker.makeClass({
	NAME: 'HttpsLinks',
	VERSION: '1.0'
});

JAK.HttpsLinks.prototype.$constructor = function(patterns,domain) {
	this._patterns = patterns;
	this._domain = domain;

	JAK.Events.addListener(document, "mousedown",this, '_checkNode');
};

JAK.HttpsLinks.prototype._checkNode = function(e, elm) {
	this._target = e.target || window.event.srcElement;

	if (this._target.localName == 'a' || this._target.tagName == 'A') {
		if(JAK.DOM.hasClass(this._target, 'no-redirect')) { // odkazy s class no-redirect ignorujeme
			return;
		}
		this._checkLinkHref(this._target);
	}
	else {
		this._target = this._target.parentNode;
		this._checkLinkHref(this._target);
	}
};

JAK.HttpsLinks.prototype._checkLinkHref = function(elm) {
	var res = false;

	if (elm.href.indexOf("https://") === 0) {
		return;
	}

	for(var i = 0; i < this._patterns.length; i++ ) {
		var href = this._target.getAttribute('href');
		var patt = new RegExp(this._patterns[i]);
		res = patt.test(href);

		if(res) {
			href = encodeURIComponent(href);
			elm.href = 'http://www.seznam.'+ this._domain +'/refererfix?redir=' + href;
			break;
		}
	}
};
