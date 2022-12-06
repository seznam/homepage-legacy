/**
 * @class
 * JAK.Homepage.RSS.Group reprezentuje jedenu skupinu
 * @param {object} parent odkaz na nadrizenou tridu
 * @param {object} data struktura dat pro feedy
 * @property {JAK.Homepage.RSS.Feed[]} feeds pole feedu
 */
JAK.Homepage.RSS.Group = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.RSS.Feed",
	VERSION:"1.0"
})

JAK.Homepage.RSS.Group.prototype.$constructor = function (parent, data, html) {
	this.parent = parent;
	this.groupId = data.groupId;
	this.data = data
	this.html = html;
	this.feeds = [];
	this.dom = {};

	this._build();
}

/**
 * vyhleda feed dle zadaneho feedId a zavola metodu change
 * @param {int} feedId id feedu k updatnuti
*/
JAK.Homepage.RSS.Group.prototype.updateFeed = function (feedId) {
	for (var i =0; i < this.feeds.length; i++ ) {
		if (this.feeds[i].data.feedId == feedId) {
			this.feeds[i].change();
		}
	}
}

/**
 * vyrobi HTML strukturu a jednotlive feedy ve skupine
 * @private
*/
JAK.Homepage.RSS.Group.prototype._build = function () {
	// protoze ty o ktere si reknu prijdou, ale maji feeds undefined
	if (typeof this.data.feeds != 'undefined') {
		this.dom = {
			group : JAK.cel('div', 'group'),
			title : JAK.cel('h3'),
			fList : JAK.cel('div', 'f-list'),
			clear : JAK.cel('div', 'clear')
		}
		this.dom.title.innerHTML = this.data.name;
		JAK.DOM.append([this.html, this.dom.group, this.dom.clear], [this.dom.group, this.dom.title, this.dom.fList])

		for (var i = 0; i < this.data.feeds.length; i++) {
			this.feeds.push(new JAK.Homepage.RSS.Feed(this, this.data.feeds[i], this.dom.fList));
		}
	}
}

/**
 * zavola metodu <b>updateFeeds</b> jednotlivych feedu
 */
JAK.Homepage.RSS.Group.prototype.submit = function (_submitCallBack) {
	this._submitCallBack = _submitCallBack;
	var _submit = function (element, index, array) {
		element.updateFeeds();
	}

	this.feeds.forEach(_submit, this);
}

/**
 * vraci viditelnost ci neviditelnost skupiny
 */
JAK.Homepage.RSS.Group.prototype.isVisible = function () {
	return (this.dom.group.style.display == 'none' ? false : true);
}
