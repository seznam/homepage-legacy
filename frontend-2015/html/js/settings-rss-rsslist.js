/**
 * @class
 * JAK.Homepage.RSS.RSSList seznam listu
 * @param {object} parent odkaz na nadrizenou tridu
 * @param {object} html odkaz na HTML strukturu
 * @property {JAK.Homepage.RSS.Group[]} groups pole skupin
 * @property {string[]} groupNames pole jmen skupin
 * @property {int} countOfHiddenGroups pocet skupin ktere se schovaji
 */
JAK.Homepage.RSS.RSSList = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.RSS.RSSList",
	VERSION:"1.0",
	IMPLEMENT: [JAK.ISignals]
})

JAK.Homepage.RSS.RSSList.prototype.$constructor = function (parent, html) {
	this.parent = parent;
	this.html = html;
	this.groups = [];
	this.dom = {};
	this.groupNames = ["seznam", "komunikace", "zpravodajstvi", "sport", "ekonomika", "technika", "spolecnost", "hry", "auto", "weblogy", "region"]
	this.countOfHiddenGroups = 3;
}

/**
 * vyhleda skupinu
 * @returns {JAK.Homepage.RSS.Group}  vrati naleznou skupinu nebo null
 * @param {int} groupId id hledane skupiny
 */
JAK.Homepage.RSS.RSSList.prototype.getGroup = function (groupId) {
	for (var i = 0; i < this.groups.length; i++) {
		if (groupId == this.groups[i].groupId) {
			return this.groups[i];
		}
	}
	return null;
}

/**
 * vyrobi html strukturu pro seznam skupin a ziska data pro feedy (skupiny) ze serveru <b>(/jsGetFeedList)</b>
 */
JAK.Homepage.RSS.RSSList.prototype.build = function () {
	this.html.innerHTML = '';

	var groups = '';
	for (var i = 0; i < this.groupNames.length; i++) {
		groups += 'groupId=' + this.groupNames[i] + '&'
	}
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_buildGroups');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsGetFeedList', 'hashId=' + Homepage.CONF.HASHID + '&' + groups);
}

/**
 * zavola submit nad skupinami feedu
 */
JAK.Homepage.RSS.RSSList.prototype.submit = function (_submitCallBack) {
	this._submitCallBack = _submitCallBack;
	var _submit = function (element, index, array) {
		if (typeof element.submit != 'undefined') {
			element.submit();
		}
	}

	this.groups.forEach(_submit, this);
}

/**
 * vyrobi jednotlive skupiny
 * @private
*/
JAK.Homepage.RSS.RSSList.prototype._buildGroups = function (data) {
	eval('var data = ('+data+')');
	JAK.loader.quickHide();
	for (var i = 0; i < data.groups.length; i++) {
		this.groups.push(new JAK.Homepage.RSS.Group(this, data.groups[i], this.html));
	}

	this._createHide(this.countOfHiddenGroups);

	this.makeEvent('pageReady', {id:this.constructor.NAME});
}

/**
 * vyrobi schovani rss skupin a schova skupiny s poradim vyssim nez <b>countOfHiddenGroups</b>
 * @private
*/
JAK.Homepage.RSS.RSSList.prototype._createHide = function (count) {
	var groups = JAK.DOM.getElementsByClass('group', this.html, 'div');
	this.dom.groups = groups;
	for (var i = 0; i < groups.length; i++) {
		if (i >= count) {
			groups[i].style.display = 'none';
		}
	}

	this.dom.hideLink = JAK.cel('a', null, 'hidelink-rss');
	this.dom.hideLink.innerHTML = 'Zobrazit další obsah &raquo;';
	this.dom.hideLink.href = "#";
	this.html.parentNode.insertBefore(this.dom.hideLink, this.html.nextSibling);
	this.groupsVisible = false;
	JAK.Events.addListener(this.dom.hideLink, 'click', this, this._show);
}

/**
 * meni viditelnost skupiny
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek s navesenou udalosti
 */
JAK.Homepage.RSS.RSSList.prototype._show = function (e, elm) {
	if (e) {
		JAK.Events.cancelDef(e);
	}
	for (var i = this.countOfHiddenGroups; i < this.dom.groups.length; i++) {
		// kdyz volam metodu jen pro zobrazeni
		if (!e && this.groupsVisible) {
			break;
		}
		if (this.groupsVisible) {
			this.dom.groups[i].style.display = 'none';
			this.dom.hideLink.innerHTML = 'Zobrazit další obsah &raquo;';
		} else {
			this.dom.groups[i].style.display = 'block';
			this.dom.hideLink.innerHTML = 'Skrýt další obsah &raquo;';
		}
	}
	this.groupsVisible = this.groupsVisible ? false : true;
}

/**
 * meni viditelnost skupiny
 * @public
 */
JAK.Homepage.RSS.RSSList.prototype.show = function () {
	this._show();
}
