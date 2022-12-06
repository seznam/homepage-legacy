/**
 * @class handluje odesilani dat a errory
 * @property {bool} settingsChanged urcuje zda doslo ke zmene v nastaveni
 * @property {JAK.Homepage.AbstractSetting[]} components obsahuje jednotlive podtridy pro jednotliva nastaveni
 * @property {object} messages obsahuje veskere odpovedi se serveru
 */

JAK.Homepage.Settings = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.Settings",
	VERSION:"1.0",
	IMPLEMENT: [JAK.ISignals]
})

/**
 * pole obsahujici ID uzivatelovych feedu (gadgetu)
 * @static
 * @type int[]
 */
JAK.Homepage.Settings.feeds = [];

/**
 * naplni pole feeeds
 * @static
 * @param {string} feeds retezec obsahujici id feedu a rozdeleny : na sloupce
 */
JAK.Homepage.Settings.addFeeds = function (feeds) {
	JAK.Homepage.Settings.feeds = feeds.split(':');
}

/**
 * vrati pole feeedu jako retezec
 * @static
 */
JAK.Homepage.Settings.feedsToString = function () {
	return JAK.Homepage.Settings.feeds.join(':');
}

/**
 * hleda v poli JAK.Homepage.Settings.feeds[] dane ID
 * @static
 * @param {int} id id Feedu
 * @return {bool} nalezeno/nenalezeno
 */
JAK.Homepage.Settings.searchFeed = function (id) {
	var feeedsArray = JAK.Homepage.Settings.feeds;
	for (var i = 0; i < feeedsArray.length; i++) {
		var tmp = feeedsArray[i].split(',');
		for (var j = 0 ; j < tmp.length; j++) {
			if (id == tmp[j]) {
				return true;
			}
		}
	}

	return false;
}

/**
 * nastavi spravne odskrolovani stranky podle kotvicky
 * @private
 */
JAK.Homepage.Settings.prototype._scrollToAnchor = function (event) {
	var hash = document.location.hash.substring(1,document.location.hash.length);
	if (hash.length > 0) {
		var links = JAK.gel('content').getElementsByTagName('a');
		var link = null;
		for (var i = 0; i < links.length; i++) {
			if (hash == links[i].name) {
				link = links[i];
				break;
			}
		}
		if (link != null) {
			var offsetTop = JAK.DOM.getBoxPosition(link).top;
			window.scroll(0, offsetTop-25);
		}
	}
}

/**
 * umoznuje odebiraní sloupce z pole JAK.Homepage.Settings.feeds[]
 * @static
 * @param {int} col cislo sloupce, ktery chceme odebrat
 */
JAK.Homepage.Settings.feedsRemoveColumn = function (col) {
	var feeedsArray = JAK.Homepage.Settings.feeds;
	if (col < feeedsArray.length) {
		removed = feeedsArray.splice(col,1);
		JAK.Homepage.Settings.feeds = feeedsArray;
		if (removed[0] != "") {
			var text = JAK.Homepage.Settings.feeds[JAK.Homepage.Settings.feeds.length-1];
			JAK.Homepage.Settings.feeds[JAK.Homepage.Settings.feeds.length-1] += (text.length > 0 ? ',' : '') + removed;
		}
	} else {
		JAK.Homepage.Settings.feeds.push('');
	}
}

/**
 * umoznuje odebiraní ID z pole JAK.Homepage.Settings.feeds[]
 * @static
 * @param {int} col ID feedu ktery chceme odebrat
 */
JAK.Homepage.Settings.feedsRemoveFeed = function (id) {
	var feeedsArray = JAK.Homepage.Settings.feeds;
	var  stop = false;

	for (var i = 0; i < feeedsArray.length; i++) {
		var hlp = feeedsArray[i].split(',');
		for (var j = 0; j < hlp.length; j++) {
			if (id == hlp[j]) {
				hlp.splice(j,1);
				feeedsArray[i] = hlp.join(',');
				stop = true;
				break;
			}
		}
		if (stop) {
			break;
		}
	}
	JAK.Homepage.Settings.feeds = feeedsArray;
}

/**
 * umoznuje pridani ID do pole JAK.Homepage.Settings.feeds[]
 * @static
 * @param {int} col ID feedu ktery chceme pridat
 */
JAK.Homepage.Settings.feedsAddFeed = function (id) {
	var feeedsArray = JAK.Homepage.Settings.feeds;
	var isAllreadyAdded = false;

	for (var i = 0; i < feeedsArray.length; i++) {
		var hlp = feeedsArray[i].split(',');
		for (var j = 0; j < hlp.length; j++) {
			if (hlp[j] == id) {
				var isAllreadyAdded = true;
				break;
			}
		}
	}

	if (!isAllreadyAdded) {
		var hlp = feeedsArray[0].split(',');
		if (hlp[0] != "") {
			hlp.push(id);
		} else {
			hlp[0] = id;
		}
		feeedsArray[0] = hlp.join(',');
	}

	JAK.Homepage.Settings.feeds = feeedsArray;
}

JAK.Homepage.Settings.prototype.$constructor = function () {
	this.ev = {};
	this.dom = {}
	this.settingsChanged = false;
	this.components = [];
	this.messages = [];
	this.errorFlag = false;

	this.body = document.getElementsByTagName('body')[0];

	var submits = JAK.DOM.getElementsByClass('button');
	this.dom.submit1Click = submits[1];
	//this.dom.submit2Click = submits[1];

	//var cancels = JAK.DOM.getElementsByClass('cancel-link');
	//this.dom.cancel1Click = cancels[0];
	//this.dom.cancel2Click = cancels[1];

	// navesi posluchace na tlacitko a link
	this.ev.submitAction = JAK.Events.addListener(this.dom.submit1Click, 'click', this, this.submit);
	//this.ev.submitAction = JAK.Events.addListener(this.dom.submit2Click, 'click', this, this.submit);

	//this.ev.cancelAction = JAK.Events.addListener(this.dom.cancel1Click, 'click', this, this.cancel);
	//this.ev.cancelAction = JAK.Events.addListener(this.dom.cancel2Click, 'click', this, this.cancel);

	/* posluchac zmen komponent */
	this.addListener('settingsChanged', '_saveState');

	/* posluchac ulozeni komponent */
	this.addListener('settingsSaved', '_continueSubmitting');

	/* posluchac nacteni (kompletni stranky) */
	this.addListener('pageReady', '_scrollToAnchor');
}

/**
 * pridava komponenty do pole components - jednotlive podtridy obsluhujici dane nastaveni
 * @param {object} component odkaz na komponentu
*/
JAK.Homepage.Settings.prototype.registerComponent = function (component) {
	this.components.push(component);
};

/**
 * na jednotlivych komponentach zavola metodu submit a nastavi counter XHR requestu <b>remaining</b>
*/
JAK.Homepage.Settings.prototype.submit = function () {
	// zavolat vsechny submity z jednotlivych komponent
	this.iterator = 0;
	this.components[this.iterator].submit(this._submitCallBack.bind(this));
	this.remaining = this.components[this.iterator].requestCount;
	/*for (var i=0; i < this.components.length; i++) {
		remaining += this.components[i].requestCount;
		this.components[i].submit();
	}*/
	//this.remaining = remaining;
};

JAK.Homepage.Settings.prototype._submitCallBack = function () {
	if (this.iterator < this.components.length-1) {
		this.iterator++;
		this.components[this.iterator].submit(this._submitCallBack.bind(this));
		this.remaining += this.components[this.iterator].requestCount;
	}
}

/**
 * vystornuje odeslani formulare a provede presmerovani na / (HP)
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
*/
JAK.Homepage.Settings.prototype.cancel = function (e, elm) {
	JAK.Events.cancelDef(e);

	if (this.settingsChanged) {
		if (window.confirm('Některá nastavení byla změněna, opravdu chcete tuto stránku opustit?')) {
			document.location.href = "/";
		}
	} else {
		document.location.href = "/";
	}
}

/**
 * pokud dojde ke zmene v komponentach nastavi flag zmeny na true
 * @private
 */
JAK.Homepage.Settings.prototype._saveState = function () {
	this.settingsChanged = true;
};

/**
 * pri vyvolani udalosti <b>settingsSaved</b> komponentou, se vola tato metoda,
 * ktera kontroluje prubeh XHR requestu a snizuje citac <b>remaining</b> o jedna nize,
 * pokud je roven 0 vola metodu <b>_finalize()</b>
 * @param {object} event udalost
 * @private
 */
JAK.Homepage.Settings.prototype._continueSubmitting = function (event) {
	//debugger;
	this.remaining--;
	this.messages.push(event.data);
	if (!this.remaining) {
		this._finalize();
	}
};

/**
 * prochazi pole messages a pokud nalezne odpoved s chybovym kodem 500 zavola metodu <b>_showError()</b>
 * @private
 */
JAK.Homepage.Settings.prototype._finalize = function () {
	// zobrazim error pokud je
	for (var i = 0; i < this.messages.length; i++) {
		if (this.messages[i].message && this.messages[i].message.status && this.messages[i].message.status == '500') {
			this.errorFlag = true;
		}
	}
	/*for (var m in this.messages) {
		console.log(this.messages[m].message.status)
		if (this.messages[m].message && this.messages[m].message.status && this.messages[m].message.status == '500') {
			this.errorFlag = true;
		}
	}*/

	// po uspesnem ulozei presmeruje na hp
	if (this.errorFlag == false) {
		document.location.href = "/";
	} else {
		this._showError();
	}
};

/**
 * obarvi prouzek s cudlikem na cerveno a meni texty
 * @private
 */
JAK.Homepage.Settings.prototype._showError = function () {
	JAK.DOM.addClass(this.body, 'error');
	if (!this.dom.errorText1) {
		this.dom.errorText1 = JAK.cel('span');
		this.dom.errorText1	.innerHTML = 'Na stránce nastala chyba, zkuste ';
		this.dom.errorText2 = this.dom.errorText1.cloneNode(true);
		this.dom.submit1Click.value = 'Uložit změny znovu';
		this.dom.submit1Click.parentNode.insertBefore(this.dom.errorText1, this.dom.submit1Click);
		//this.dom.submit2Click.parentNode.insertBefore(this.dom.errorText2, this.dom.submit2Click);
	}
}
