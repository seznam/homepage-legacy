/* hlavni settings class */
JAK.Settings = JAK.ClassMaker.makeClass({
	NAME:"Settings",
	VERSION:"1.0"
});

JAK.Settings.prototype.$constructor = function (logged) {
	this.eventsCache = new Object();
	this.logged = logged;
	JAK.Events.addListener(window, 'load', this, this.init, false, false);

};

JAK.Settings.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Settings.prototype.init = function () {
	return; // tohle uz se nepouziva, tak se dalsi kod nespusti
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}
	// nastavit jako domovskou stranku
	this.setButton = JAK.gel('set-as-HP');
	/*this.servicesHPLink = JAK.gel('set-hp-services');*/ /* link v gadgetu services */
	/* detekce browseru a spravne odkazy na napovedu*/
	if (JAK.Browser.client == 'ie') {
		if (this.setButton) {
			this.eventsCache.setButton = JAK.Events.addListener(this.setButton.getElementsByTagName('a')[0], 'click', this, this.setHP);
		}

		if (this.servicesHPLink) {
			this.eventsCache.servicesHPLink = JAK.Events.addListener(this.servicesHPLink, 'click', this, this.setHP);
		}

	} else if (JAK.Browser.client == 'gecko') {
		if (this.setButton) {
			this.setButton.getElementsByTagName('a')[0].href = 'http://napoveda.seznam.' + _tld + '/cz/nastaveni-domovske-stranky-firefox-4.html';
		}
		if (this.servicesHPLink) {
			this.servicesHPLink.href = 'http://napoveda.seznam.' + _tld + '/cz/nastaveni-domovske-stranky-firefox-4.html';
		}
	} else if (JAK.Browser.client == 'opera') {
		if (this.setButton) {
			this.setButton.getElementsByTagName('a')[0].href = 'http://napoveda.seznam.' + _tld + '/cz/nastaveni-domovske-stranky-opera-9.html';
		}
		if (this.servicesHPLink) {
			this.servicesHPLink.href = 'http://napoveda.seznam.' + _tld + '/cz/nastaveni-domovske-stranky-opera-9.html';
		}
	} else if (JAK.Browser.client == 'chrome') {
		if (this.setButton) {
			this.setButton.getElementsByTagName('a')[0].href = 'http://napoveda.seznam.' + _tld + '/cz/nastaveni-domovske-stranky-chrome.html';
		}
		if (this.servicesHPLink) {
			this.servicesHPLink.href = 'http://napoveda.seznam.' + _tld + '/cz/nastaveni-domovske-stranky-chrome.html';
		}
	}

	/* zjisteni nastaveni domovske stranky */
	this.isHP();
};

JAK.Settings.prototype.setHP = function (e, elm) {
	JAK.Events.cancelDef(e);
	elm.style.behavior='url(#default#homepage)';
	elm.setHomePage(Homepage.CONF.SERVICE_URL);
};

JAK.Settings.prototype.isHP = function () {
	if (JAK.Browser.client == 'ie') {
		var link = JAK.gel('set-as-HP-link');
		link.style.behavior = 'url(#default#homepage)';
	}
};
