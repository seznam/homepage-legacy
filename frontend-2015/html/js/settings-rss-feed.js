/**
 * @class
 * JAK.Homepage.RSS.Feed reprezentuje jeden feed
 * @param {object} parent odkaz na nadrizenou tridu
 * @param {object} data struktura dat pro feedy
 * @augments JAK.ISignals
 */
JAK.Homepage.RSS.Feed = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.RSS.Feed",
	VERSION:"1.0",
	IMPLEMENT: [JAK.ISignals]
})

JAK.Homepage.RSS.Feed.prototype.$constructor = function (parent, data, html) {
	this.parent = parent;
	this.html = html;
	this.data = data;
	this.ev = {};
	this.dom = {};

	this._build();
}

JAK.Homepage.RSS.Feed.prototype.$destructor = function (parent, data, html) {
	for (var i in this.ev) {
		JAK.Events.removeListener(this.ev[i]);
	}

	while (this.dom.cnt.firstChild) {
		this.dom.cnt.removeChild(this.dom.cnt.childNodes[0]);
	}
	this.dom.cnt.parentNode.removeChild(this.dom.cnt);

	for (var p in this) { this[p] = null; }
}

/**
 * vyrobi HTML strukturu feedu
 * @private
*/
JAK.Homepage.RSS.Feed.prototype._build = function () {
	this.dom.cnt = JAK.cel('div', "feed" + (this.data.selected == "1" ? " act" : "") + ((this.data.feedId == 94888 && JAK.Homepage.Settings.feeds.length != 2) ? " hiddenElement" : ""), "feed-" + this.data.feedId);

	this.dom.cnt.innerHTML =
		'<input ' + (this.data.selected == '1' ? 'checked="checked"' : '') + ' type="checkbox" name="feed" class="feed-input" id="f-' + this.data.feedId + '" />' +
		'<label for="f-' + this.data.feedId + '">' + this.data.title.replace(/</g,'&lt;') + '</label>';
	this.html.appendChild(this.dom.cnt);

	this.dom.input = JAK.DOM.getElementsByClass('feed-input', this.dom.cnt, 'input')[0];
	this.ev.input = JAK.Events.addListener(this.dom.input, 'click', this, this._change);
}

/**
 * meni vzhled pri zaskrtavani a vyvola udalost <b>settingsChanged</b>
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek s navesenou udalosti
 */
JAK.Homepage.RSS.Feed.prototype._change = function (e, elm) {
	if (JAK.DOM.hasClass(this.dom.cnt, 'act') == false) {
		JAK.DOM.addClass(this.dom.cnt, 'act');
		this.data.selected = '1';
	} else {
		JAK.DOM.removeClass(this.dom.cnt, 'act');
		this.data.selected = '0';
	}

	this.makeEvent('settingsChanged');
}

/**
 * meni vzhled pri zaskrtavani a vyvola udalost <b>settingsChanged</b> a zasktrne checkbox
 */
JAK.Homepage.RSS.Feed.prototype.change = function () {
	this._change();

	var ii = new JAK.CSSInterpolator(this.dom.cnt, 10000, {interpolation:JAK.Homepage.RSS.fade});
	ii.addColorProperty('backgroundColor', '#f7f7ff', '#bae497');
	ii.start();
	this.dom.input.checked = this.dom.input.checked ? false : true;
}


/**
 * provede update pole <b>JAK.Homepage.Settings.feeds[]</b> pomoci metody <b>JAK.Homepage.Settings.feedsRemoveFeed()</b>
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 */
JAK.Homepage.RSS.Feed.prototype.updateFeeds = function (e, elm) {
	if (this.data.selected == '0') {
		JAK.Homepage.Settings.feedsRemoveFeed(this.data.feedId);
	} else {
		JAK.Homepage.Settings.feedsAddFeed(this.data.feedId);
	}
}
