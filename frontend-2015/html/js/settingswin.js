/*nastaveni OKYNKO*/
JAK.SettingsWin = JAK.ClassMaker.makeClass({
	NAME:"SettingsWin",
	VERSION:"1.0"
});

JAK.SettingsWin.prototype.$constructor = function (parent) {
	this.parent = parent;
	this.eventsCache = new Object();
	this.opened = false;
	this.link = null;
};

JAK.SettingsWin.prototype.init = function () {
	/* pokud jde o zarizeni typu iPhone, iPad ci iPod, tak odstranim tlacitko "Nastavit Seznam jako domovskou stránku" */
	if ((navigator.userAgent.indexOf('iPhone') != -1) || (navigator.userAgent.indexOf('iPod') != -1) || (navigator.userAgent.indexOf('iPad') != -1)) {
		this.headHPLink = JAK.gel('set-as-HP');

		if (typeof(this.headHPLink) != "undefined") {
			this.headHPLink.parentNode.removeChild(this.headHPLink);
		}
	}

	if(this.parent.logged == true) {
		this.link = JAK.gel('settings-link');
		this.linkDown = JAK.gel('sett-sett-layout-link-href');
		this.linkDown.href = "/nove-nastaveni";
		this.link.href = "/nove-nastaveni";
		return 0;

		/* stare settings neni potreba
		this.eventsCache.openLink = JAK.Events.addListener(this.link, 'click', this, '_open', false, true);
		*/
		//this.cnt = JAK.cEl('sett-cnt-link');
		this.cnt = JAK.cel('div');
		this.cnt.className = 'sett-cnt';

		this.cnt.style.display = 'none';

		this.cnt.innerHTML =
			'<div class="close-link"><a href="" class="close-link-box" ><img src="' + Homepage.CONF.PATH_IMG + '/close-blue.gif" width="15" height="15" alt="" /></a></div>' +
			'<ul>'+
				'<li id="head-add-news-link"><a id="l-head-add-news-link" href="/nastaveni-zprav">Přidat obsah</a></li>'+
				'<li id="head-chng-skin-link"><a id="l-head-chng-skin-link" href="/zmena-vzhledu">Změnit vzhled</a></li>'+
				'<li id="head-add-seek-link"><a id="l-head-add-seek-link" href="/nastavit-hledani">Nastavit hledání</a></li>'+
				'<li id="head-chng-layout-link"><a id="l-head-chng-layout-link" href="/zmenit-layout">Změnit rozvržení</a></li>'+
				'<li id="head-set-as-HP"><a id="l-head-set-as-HP" href="http://napoveda.seznam.' + _tld + '/cz/nastaveni-domovske-stranky.html">Nastavit Seznam jako domovskou stránku</a></li>'+
			'</ul>';

		this.link.parentNode.insertBefore(this.cnt,this.link.nextSibling);
		this.eventsCache.stop = JAK.Events.addListener(this.cnt, 'mousedown', JAK.Events.stopEvent);

		this.clsLink = JAK.DOM.getElementsByClass('close-link-box', this.cnt, 'A')[0];

		this.eventsCache.clsLink = JAK.Events.addListener(this.clsLink, 'click', this, '_close', false, true);

		this.headAddLink = JAK.gel('l-head-add-news-link');
		this.headChngLink = JAK.gel('l-head-chng-skin-link');
		this.headSeekLink = JAK.gel('l-head-add-seek-link');
		this.headChngLLink = JAK.gel('l-head-chng-layout-link');
		this.headHPLink = JAK.gel('l-head-set-as-HP');


		this.headAddLink.boxId = this.parent.boxes['rss'];
		this.headChngLink.boxId = this.parent.boxes['skin'];
		this.headChngLLink.boxId = this.parent.boxes['layout'];
		this.headSeekLink.boxId = this.parent.boxes['seek'];

		this.eventsCache.headAddLink = JAK.Events.addListener(this.headAddLink, 'click', this, '_openSett', false, true);
		this.eventsCache.headChngLink = JAK.Events.addListener(this.headChngLink, 'click', this, '_openSett', false, true);
		this.eventsCache.headChngLLink = JAK.Events.addListener(this.headChngLLink, 'click', this, '_openSett', false, true);
		this.eventsCache.headSeekLink = JAK.Events.addListener(this.headSeekLink, 'click', this, '_openSett', false, true);

		// nastavit jako domovskou stranku
		if (JAK.Browser.client == 'ie' && this.headHPLink) {
			this.eventsCache.setButton = JAK.Events.addListener(this.headHPLink, 'click', this.parent, 'setHP', false, true);
		}
	}
};

JAK.SettingsWin.prototype._openSett = function (e, elm) {
	JAK.Events.cancelDef(e);
	this._close(e, elm);
	this.parent._openSettings(e, elm);
};

JAK.SettingsWin.prototype._open = function (e, elm) {
	JAK.Gadget.Settings.current = this;
	JAK.Events.cancelDef(e);

	if(this.opened == true) {
		this._close(e, elm);
	} else {
		this.cnt.style.display = 'block';
		this.opened = true;
	}
};

JAK.SettingsWin.prototype._close = function (e, elm) {
	JAK.Events.cancelDef(e);

	this.cnt.style.display = 'none';

	this.opened = false;
};
/* ed nastaveni Okynko*/
