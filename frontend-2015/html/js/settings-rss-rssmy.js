/**
 * @class
 * JAK.Homepage.RSS.RSSMy spravuje moje hledani
 * @param {object} parent odkaz na nadrizenou tridu
 * @param {object} html odkaz na HTML strukturu
 * property {object} actualyAddedItem odkaz na HTML prvek, na ktery kliknul uzivatel ve vysledcich hledani
 * property {int} oneFeedID ID pridavaneho feeedu, pokud clovek zadal cele url
 */
JAK.Homepage.RSS.RSSMy = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.RSS.RSSMy",
	VERSION:"1.0"
})

JAK.Homepage.RSS.RSSMy.prototype.$constructor = function (parent, html, option) {
	this.parent = parent;
	this.option = typeof option != 'undefined' ? option : null;
	this.html = html;
	this.dom = {};
	this.data = {};
	this.ev = {};
	this.ev.rsss = []; // pole posluchacu na feeedech
	this.defText = 'Zadejte URL adresu zdroje nebo klíčové slovo';
	this.oneFeedID = null; // pokud zadam primo URL obsahuje ID pridaneho feedu
	this.actualyAddedItem = null;
	this.feeds = [];
	this.tryAddFeedCounter = 0;
	this._updateMyFeedsUserBind = this._updateMyFeedsUser.bind(this);

	this.addForeignFeed = null;

	if (this.option != null) {
		this.addForeignFeed = new JAK.Homepage.RSS.AddForeignFeed(this, this.option);
	}
}

/**
 * vyrobi hledaci formular a kontejner pro moje rss
 */
JAK.Homepage.RSS.RSSMy.prototype.build = function () {
	this.dom.clear = JAK.cel('div', 'clear');
	this.html.innerHTML =
		'<form class="form" id="rss-search-form">'+
			'<input type="text" name="rss-search" class="gray" id="rss-search" value="' + this.defText + '" /> '+
			'<input type="submit" value="Přidej" id="rss-search-submit" /> '+
		'</form>'+
		'<div id="add-foreign-feed"></div>'+
		'<div id="my-search-list" class="noborder" style="overflow:hidden; height:0px;">'+
		'<h4 id="rss-search-title"><span id="close"><a href="#" id="rss-search-close">Zavřít</a></span><span id="search-text"></span></h4>'+
		'<div id="my-search-cnt"></div>'+
		'</div>'+
		'<div id="my-rss-list">'+'</div>';
	this.dom.rssSearchTitle = JAK.gel('rss-search-title');
	this.dom.rssSearchSubmit = JAK.gel('rss-search-submit');
	this.dom.rssSearchForm = JAK.gel('rss-search-form');
	this.dom.rssSearchH4 = JAK.gel('search-text');
	this.dom.rssSearch = JAK.gel('rss-search');
	this.dom.rssSearchClose = JAK.gel('rss-search-close');
	this.dom.myRSSList = JAK.gel('my-rss-list');
	this.dom.mySearchList = JAK.gel('my-search-list');
	this.dom.mySearchCnt = JAK.gel('my-search-cnt');
	this.dom.addForeignFeed = JAK.gel('add-foreign-feed');
	this._deleteFoundFeedsBind = this._deleteFoundFeeds.bind(this);

	JAK.Events.addListener(this.dom.rssSearchForm, 'submit', this, this._sendRss);
	JAK.Events.addListener(this.dom.rssSearch, 'focus', this, '_chngLabel', false, true);
	JAK.Events.addListener(this.dom.rssSearch, 'blur', this, '_chngLabelBye', false, true);
	JAK.Events.addListener(this.dom.rssSearchClose, 'click', this, '_close', false, true);

	if (this.option != null) {
		this.addForeignFeed.build(this.dom.addForeignFeed);
	}

	// nactu user feedy
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_buildFeeds');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsGetFeedList','hashId=' + Homepage.CONF.HASHID + '&groupId=user');
};

/**
 * zavola submit nad feedy
 */
JAK.Homepage.RSS.RSSMy.prototype.submit = function (_submitCallBack) {
	this._submitCallBack = _submitCallBack;
	var _submit = function (element, index, array) {
		element.updateFeeds();
	}
	this.feeds.forEach(_submit, this);
}

/**
 * vyrobi jednotlive skupiny
 * @private
*/
JAK.Homepage.RSS.RSSMy.prototype._buildFeeds = function (data) {
	eval('var data = ('+data+')');
	JAK.loader.quickHide();
	for (var i = 0; i < data.groups.length; i++) {
		if (data.groups[i].groupId == 'user' && typeof data.groups[i].feeds != 'undefined') {
			for(var j = 0; j < data.groups[i].feeds.length; j++) {
				this.feeds.push(new JAK.Homepage.RSS.Feed(this, data.groups[i].feeds[j], this.dom.myRSSList));
			}
			break;
		}
	}
	this.dom.myRSSList.appendChild(this.dom.clear);
}

/**
 * updatne vypis mych feedu
 * @param {int} groupId idecko skupiny ktera se bude aktualizovat
*/
JAK.Homepage.RSS.RSSMy.prototype.updateMyFeeds = function (groupId) {
	if (groupId != 'user' && groupId != null) {
		_this = this.parent.RSSComponents[1].getGroup(groupId).updateFeed(typeof arguments[1] != 'undefined' ? arguments[1] : this.data.feed.feedId);
	} else {

	}

	this._updateMyFeedsUser(groupId);
}

/**
 * updatne vypis mych feedu Userovskych
*/
JAK.Homepage.RSS.RSSMy.prototype._updateMyFeedsUser = function (groupId) {
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_updateMyFeedsBuild');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsGetFeedList', 'hashId=' + Homepage.CONF.HASHID + '&groupId=' + groupId);
}

/**
 * updatne vypis mych feedu
 * @private
 * @param {object} data objek obsahujici odpoved ze serveru
*/
JAK.Homepage.RSS.RSSMy.prototype._updateMyFeedsBuild = function (data) {
	eval('var data = ('+data+')');
	JAK.loader.quickHide();
	var isFeeds = false;
	var groupId = '';
	for (var i = 0; i < data.groups.length; i++) {
		if (data.groups[i].feeds) {
			var userArrayLen = data.groups[i].feeds.length;
			isFeeds = true;
			groupId = data.groups[i].groupId;
			break;
		}
	}

	if (this.feeds.length == userArrayLen) {
		this.tryAddFeedCounter++;
		if (this.tryAddFeedCounter < 4) {
			window.setTimeout(this._updateMyFeedsUserBind,3000);
			return 0;
		} else {
			this.tryAddFeedCounter = 0;
		}
	}

	if (groupId == 'user') {
		for (var i = 0; i < this.feeds.length; i++) {
			this.feeds[i].$destructor();
		}

		this.feeds = [];

		for (var i = 0; i < data.groups.length; i++) {
			if (data.groups[i].groupId == 'user' && typeof data.groups[i].feeds != 'undefined') {
				for (var j = 0; j < data.groups[i].feeds.length; j++) {
					var len = this.feeds.push(new JAK.Homepage.RSS.Feed(this, data.groups[i].feeds[j], this.dom.myRSSList));

					if (this.oneFeedId == data.groups[i].feeds[j].feedId) {
						this.oneFeedId = null;
						var d = this.feeds[len-1].dom.cnt;
						var ii = new JAK.CSSInterpolator(d, 10000, {interpolation:JAK.Homepage.RSS.fade});
						ii.addColorProperty('backgroundColor', '#f7f7ff', '#bae497');
						ii.start();
					}

					//nastavi fajfku
					this._setMark();
				}
				break;
			}
		}
		this.dom.myRSSList.appendChild(this.dom.clear);
	} else {
		//nastavi fajfku a zobrazi skupiny kdyz je treba
		var isVisible = this.parent.RSSComponents[1].getGroup(groupId).isVisible();
		if (!isVisible) {
			this.parent.RSSComponents[1].show();
		}
		this._setMark();
	}
}

JAK.Homepage.RSS.RSSMy.prototype._setMark = function (data) {
	if(this.actualyAddedItem != null) {
		JAK.DOM.addClass(this.actualyAddedItem, 'added');
		this.actualyAddedItem = null;
	}
}

/**
 * smazeme HTML nalezenych feedu
 * @private
*/
JAK.Homepage.RSS.RSSMy.prototype._deleteFoundFeeds = function () {
	var r = 0;
	while(this.dom.mySearchCnt.childNodes.length != 0) {
		// protoze tam muze byt jen info text nic nenalezeno
		if (this.ev.rsss[r]) {
			JAK.Events.removeListener(this.ev.rsss[r]);
		}
		r++;
		this.dom.mySearchCnt.removeChild(this.dom.mySearchCnt.lastChild);
	}
	JAK.DOM.addClass(this.dom.mySearchList, 'noborder');
};

/**
 * zavre nazelene feedy
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
*/
JAK.Homepage.RSS.RSSMy.prototype._close = function (e, elm) {
	JAK.Events.cancelDef(e);
	this._fadeFoundFeeds();
};

/**
 * provede odeslani zadanych informaci (hledana fraze, URL) na server
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
*/
JAK.Homepage.RSS.RSSMy.prototype._sendRss = function (e, elm) {
	JAK.Events.cancelDef(e);
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsFeedSearch', 'hashId=' + Homepage.CONF.HASHID + '&url=' + encodeURIComponent(this.dom.rssSearch.value));
};

/**
 * provede odeslani zadanych informaci (URL) na server
*/
JAK.Homepage.RSS.RSSMy.prototype.sendRss = function (url) {
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsFeedSearch', 'hashId=' + Homepage.CONF.HASHID + '&url=' + encodeURIComponent(url));
};

/**
 * vyrobi vysledky hledani a navesi na polozky pridavaci metodu
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
*/
JAK.Homepage.RSS.RSSMy.prototype._buildSearch = function () {
	this.dom.rssSearchH4.innerHTML = this._buildTitle(this.data.feedCount);

	// pokud byl search naplnen smazeme ho
	this._deleteFoundFeeds();
	this.dom.mySearchList.style.height = '0';
	this.dom.mySearchCnt.style.height = 'auto';
	JAK.DOM.removeClass(this.dom.mySearchList, 'noborder');

	if (this.data.feedCount > 0) {
		JAK.DOM.removeClass(this.dom.mySearchCnt, 'no-result');

		for (var i = 0; i < this.data.feeds.length; i++) {
			var div = JAK.cel('div', 'item', 'searchItem-' + this.data.feeds[i].id + '-' + this.data.feeds[i].groupId);
			var html =
				'<h5>' + this.data.feeds[i].title.replace(/</g,'&lt;') + '</h5>'+
				'<p class="url">' + this.data.feeds[i].href + '</p>';
			div.innerHTML = html;
			this.dom.mySearchCnt.appendChild(div);

			if (JAK.Homepage.Settings.searchFeed(this.data.feeds[i].id)) {
				JAK.DOM.addClass(div, 'added');
			} else {
				this.ev.rsss[this.ev.rsss.length] = JAK.Events.addListener(div, 'click', this, this._addRSS);
			}
		}
		/*this.dom.mySearchList.style.overflow = 'auto';*/

	} else if (this.data.status == 500) {
		this.dom.mySearchCnt.innerHTML = '<h5 class="no-result">Na zadané adrese se nepodařilo nalézt RSS zdroj. <a href="http://napoveda.seznam.cz/cz/services/">Kontaktujte nás</a>, prosím.</h5>';
		JAK.DOM.addClass(this.dom.mySearchCnt, 'no-result');

	} else {
		this.dom.mySearchCnt.innerHTML = '<h5 class="no-result">Nebyly nalezeny žádné zdroje.</h5>';
		JAK.DOM.addClass(this.dom.mySearchCnt, 'no-result');
	}

	//podle vysky nastavim parametry kontejneru
	if (this.dom.mySearchCnt.offsetHeight + this.dom.rssSearchTitle.offsetHeight > 400) {
		this.dom.mySearchCnt.style.height = '400px';
		this.dom.mySearchCnt.style.overflow = 'auto';
	} else {
		this.dom.mySearchCnt.style.height = 'auto';
		this.dom.mySearchCnt.style.overflow = 'auto';
	}

	this.dom.mySearchList.style.height = 'auto';
	this._unfadeFoundFeeds();
};

/**
 * vyrobi efekt pri aktualizaci feedu
 * @private
 */
JAK.Homepage.RSS.RSSMy.prototype._fadeFoundFeeds = function () {
	var eH = this.dom.mySearchList;
	var eC = this.dom.mySearchCnt;
	var eT = this.dom.rssSearchTitle;
	var height = eC.offsetHeight + eT.offsetHeight;
	var ii = new JAK.CSSInterpolator(eH, 400 - height + 1.5*height, {endCallback: this._deleteFoundFeedsBind});
	ii.addProperty('height', height, '0', 'px');
	ii.start();
}

/**
 * vyrobi efekt pri aktualizaci feedu
 * @private
 */
JAK.Homepage.RSS.RSSMy.prototype._unfadeFoundFeeds = function () {
	var eH = this.dom.mySearchList;
	var eC = this.dom.mySearchCnt;
	var eT = this.dom.rssSearchTitle;
	var height = eC.offsetHeight + eT.offsetHeight;
	var ii = new JAK.CSSInterpolator(eH, 400 - height + 2*height);
	ii.addProperty('height', '0', height, 'px');
	ii.start();
}

/**
 * maze defaultni text v inputu
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 */
JAK.Homepage.RSS.RSSMy.prototype._chngLabel = function (e, elm) {
	if (elm.value == this.defText) {
		elm.value = '';
		JAK.DOM.removeClass(elm, 'gray');
	}
};

/**
 * vraci defaultni text v inputu pokud je prazdny
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 */
JAK.Homepage.RSS.RSSMy.prototype._chngLabelBye = function (e, elm) {
	if (elm.value == '') {
		elm.value = this.defText;
		JAK.DOM.addClass(elm, 'gray');
	}
};

/**
 * prida feed do meho hledani
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
*/
JAK.Homepage.RSS.RSSMy.prototype._addRSS = function (e, elm) {
	this.actualyAddedItem = elm;
	this.actgroupId = elm.id.split('-')[2];
	this.actfeedId = elm.id.split('-')[1];
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsFeedAdd', 'hashId=' + Homepage.CONF.HASHID + '&id=' +elm.id.split('-')[1]);
}

/**
 * vyrobi text titulku a vrati jej
 * @private
 * @param {object} count pocet vysledku
 * @returns {string} vrati spravne vysklonovanou vetu
*/
JAK.Homepage.RSS.RSSMy.prototype._buildTitle = function (count) {
	var wordFnc = function (count) {
		var word = ['výsledek', 'výsledky', 'výsledků'];
		switch (count) {
			case '1': return word[0]; break;
			case '2':
			case '3':
			case '4': return word[1]; break;
			default : return word[2];
		}
	}
	var txt = 'Nalezli jsme <strong>' + count +'</strong> ' + wordFnc(count);
	return txt;
}

/**
 * provede zavolani spravne metody po stazeni dat ze serveru
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
*/
JAK.Homepage.RSS.RSSMy.prototype._process = function (data) {
	eval('var data = ('+data+')');
	JAK.loader.quickHide();
	if(data.status == 500) {
		this.data = data;
		this._buildSearch();
	} else if(data.status == 200) {
		this.data = data;
		if (data.method == 'feedSearch') {
			this._buildSearch();
		} else if (data.method == 'feedAdd') {
			this._finalize();
		} else if (data.method == 'feedSearchdAdd') {
			this._addedMyRSS();
		}
	} else if(data.status == 401) {
		alert('Něco je špatně!');
	} else if(data.status == 413) {
		alert('Velikost zdrojového RSS přesahuje naše bezpečnostní limity a není možné toto RSS momentálně přidat.');
	}
}

/**
 * pokud jsem zadal korektni URL updatuje moje feedy
 * @private
 */
JAK.Homepage.RSS.RSSMy.prototype._addedMyRSS = function () {
	this.oneFeedId = this.data.feed.feedId;
	this._deleteFoundFeeds();
	this.updateMyFeeds(this.data.feed.groupId);
}

/**
 * zavola metodu ktera zaaktualizuje moje feedy
 * @private
 */
JAK.Homepage.RSS.RSSMy.prototype._finalize = function () {
	this.updateMyFeeds(this.actgroupId,this.actfeedId); //null
	this.actgroupId = '';
	this.actfeedId = '';
}
