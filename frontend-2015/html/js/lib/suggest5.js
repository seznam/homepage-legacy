/**
 * @overview Suggest NG - naseptavac nove generace
 * @version 5.1.2 Highlight JSON correction cache
 */

/**
 * @class Trida, poskytujici "naseptavac" z dane adresy pro zadany inputbox
 * @signal suggest-submit Pouzito
 * @signal suggest-keyboard Nastala nejaka forma interakce s uzivatelem
 * @signal suggest-touch Nastala nejaka forma interakce s uzivatelem
 * @signal suggest-mouse Nastala nejaka forma interakce s uzivatelem
 * @signal suggest-query-changed Nastala změna hodnoty vyhledávacího políčka (searchbox)
 * @signal suggest-results Vrátí výsledky vrácené našeptávačem
 */
JAK.Suggest5 = JAK.ClassMaker.makeClass({
	NAME: "JAK.Suggest5",
	VERSION: "5.1.2",
	IMPLEMENT: JAK.ISignals
});

/**
 * statická metoda - vrací {start,end} rozsah uživatelského výběru v inputu nebo textarey. V případě, že start==end, tak to znamená, že není nic vybráno, pouze umístěn kurzor.
 * UPOZORNĚNÍ: Ke korektnímu chování pod IE8 a níže je potřeba ručně provést na input focus().
 * @param {node} input element, se kterým chceme pracovat (musí být input typu text nebo textarea)
 * @returns {object {integer start&#44 integer end}} objekt obsahující začátek a konec výběru v inputu
 */
JAK.Suggest5.getCaret = function(inputNode) {
	var _contextWindow = (inputNode.ownerDocument.defaultView || inputNode.ownerDocument.parentWindow);
	var caret = {};
	var OLD_IE = (document.selection && !window.getSelection);
	if (OLD_IE) {
		var selection = _contextWindow.document.selection.createRange();
		var bm = selection.getBookmark();
		var sel = inputNode.createTextRange();
		sel.moveToBookmark(bm);
		var sleft = inputNode.createTextRange();
		sleft.collapse(true);
		sleft.setEndPoint("EndToStart", sel);
		caret.start = sleft.text.length;
		caret.end = sleft.text.length + sel.text.length;
	} else {
		caret.start = inputNode.selectionStart;
		caret.end = inputNode.selectionEnd;
	}
	return caret;
};

/**
 * @param {node} searchbox - element vyhledávacího políčka, typicky input
 * @param {node} wrapper - element, do kterého se vloží container
 * @param {object} [options] Hash s dodatečnými nastaveními
 * @param {string} [options.dict=""] nazev slovniku
 * @param {int} [options.count=10] pocet vysledku
 * @param {bool} [options.highlight=false] ma-li se ve vysledcich zvyraznit hledany (pod)retezec
 * @param {int} [options.timeout=80] jak dlouho po zastaveni psani poslat request
 * @param {int} [options.correction=3] (correction * timeout) jak dlouho po zastavení psaní poslat žádost o korekci
 * @param {int} [options.valueCheckDelay=100] interval kontroly vstupního inputu v případě, že nepodporuje událost onInput
 * @param {bool} [options.autoSubmit=true] Odeslat formular po aktivaci?
 * @param {object} [options.submitButton=null] tlačítko pro odeslání formuláře
 * @param {string} [options.suggestClassName="suggest"] název css třídy pro našeptávač
 * @param {bool} [debug=false] logování do konzole
 * @param {object} [options.cache] nastavení cache
 * @param {object} [options.cache.limit: 40] počet záznamů v cache
 * @param {object} [options.cache.caseSensitive: false] ignorovat velikost písmen
 * @param {object} [options.itemMap={slovnik: JAK.Suggest5.Dictionary, item: JAK.Suggest5.Term}] druhy položek v našeptávači
 * @param {object} [options.postParams={}] Vlastní hodnoty posílané na server jako parametry v url ({sId: "abc"} => ?sId=abc)
 */
JAK.Suggest5.prototype.$constructor = function(searchbox, wrapper, options) {
	this._ec = []; /* event cache */
	this._dom = {
		wrapper: wrapper,
		searchbox: searchbox
	};
	this._url = (options.url.charAt(options.url.length - 1) != "/") ? options.url + "/" : options.url;

	/* Výchozí nastavení předvoleb */
	this._options = {
		dict: "",
		count: 10,
		highlight: false,
		timeout: 80,
		correction: 3,
		valueCheckDelay: 150,
		autoSubmit: true,
		submitButton: null,
		suggestClassName: "suggest",
		debug: false,
		cache: {
			limit: 40,
			caseSensitive: false
		},
		itemMap: {
			item: JAK.Suggest5.Term
		},
		postParams: {
			sId: JAK.idGenerator()
		}
	};

	/* Předvolby předané scriptu (přepíšeme ty výchozí) */
	this.setOptions(options);

	this._items = [];
	this._navigableItems = [];

	this._query = "";			/* aktualne polozeny a poslany dotaz */
	this._rq = null;			/* poslany pozadavek, aby se dal abortnout */
	this._timeout = false;		/* zpozdeni poslani pozadavku pri psani */
	this._activeItem = null;	/* prave modra polozka */
	this._opened = false;		/* jsme videt? */
	this._request = this._request.bind(this); /* metoda na poslani pozadavku; zbindovana, aby se dala volat v timeoutu */
	this._stepUpDown = false;	/* pomocná proměnná pro prohlížeče nepodporující oninput (IE8 a nižší), zabraňuje poslání requestu při procházení položek */
	this._correction = false;	/* budeme volat korekci? */
	this._touched = false;
	this._params = {};	/* speciální parametry, které se našeptávač získává z backendu a pamatuje si je */

	/* hover lock: po zobrazeni suggestu nesmi nastat hover/mouseover na polozce; tato promenna to zakaze (a povoli az po skutecne posunu mysi) */
	this._hoverLock = false;

	this._cache = new JAK.Suggest5.Cache(this._options.cache);

	this._build();
};

JAK.Suggest5.prototype.$destructor = function() {
	this._clear();
	JAK.Events.removeListeners(this._ec);
};

JAK.Suggest5.prototype.log = function() {
	if (this._options.debug) {
		console.log.apply(console, arguments)
	}
};

/**
 * Za behu zmeni opsny
 */
JAK.Suggest5.prototype.setOptions = function(options) {
	for (var p in options) { this._options[p] = options[p]; }
};

/**
 * Vratí nastavení
 */
JAK.Suggest5.prototype.getOption = function(option) {
	return this._options[option];
};

/**
 * @returns {string} vrací query, ktere bylo hledano
 */
JAK.Suggest5.prototype.getQuery = function() {
	return this._query;
};

/**
 * @returns {string} vrací query, ktere bylo hledano
 */
JAK.Suggest5.prototype.setQuery = function(q) {
	if (this._dom.searchbox.value != q) {
		this._dom.searchbox.value = q;
		this.makeEvent("suggest-query-changed");
		this._dom.searchbox.dispatchEvent(new CustomEvent("change"));
	}
};

/**
 * @returns {object} parametr(y) nasbírané suggestem
 */
JAK.Suggest5.prototype.getParams = function(p) {
	return (p === undefined) ? this._params : this._params[p];
};

/**
 * @returns {node} vrací hledací políčko
 */
JAK.Suggest5.prototype.getInput = function() {
	return this._dom.searchbox;
};

/**
 * @returns {node} vrací kontejner našeptávaných slov
 */
JAK.Suggest5.prototype.getContainer = function() {
	return this._dom.container;
};

/**
 * @returns {bool} vrací zda je zobrazen našeptávač či nikoliv
 */
JAK.Suggest5.prototype.isOpen = function() {
	return this._opened;
};

/**
 * Zavola se pri "aktivaci" vybrane polozky (kliknuti, enter). Defaultne submitne formular.
 */
JAK.Suggest5.prototype.action = function(e) {
	if (this._timeout) {
		clearTimeout(this._timeout);
		this._timeout = false;
	}

	var bound = function() {
		this._hide();
		this._dom.searchbox.blur();
	};
	bound = bound.bind(this);

	if ("ontouchend" in window) {
		/* pockame se schovavanim; kdyby nekdo delal doubletouch, aby nekliknul na to pod nami */
		var t = setTimeout(bound, 400);
	} else {
		this._hide();
	}

	var parent = this._dom.searchbox.form;
	/* pro zpětnou kompatibilitu */
	if ( this._options.parentForm ) {
		parent = this._options.parentForm;
	}

	this._params.oq = this.getQuery();
	this._params.aq = this.getActiveIndex();

	this.makeEvent("suggest-submit");

	if (this._options.autoSubmit && parent && parent.submit) { parent.submit(); }
};

/**
 * Vrati prave vybranou polozku (instance JAK.Suggest5.Item/JAK.Suggest5.Term)
 */
JAK.Suggest5.prototype.getActive = function() {
	return this._activeItem;
};

/**
 * Vrátí index pravě vybrané položky (instance JAK.Suggest5.Item/JAK.Suggest5.Term)
 */
JAK.Suggest5.prototype.getActiveIndex = function() {
	if (!this._activeItem) { return -1; }
	return this._navigableItems.indexOf(this._activeItem);
};

/**
 * Vrati posledni korigovany vyraz
 * @param {string} hledany vyraz
  */
JAK.Suggest5.prototype.getCorrected = function(query){
	var lastCorrection = this._lastCorrection,
		corrected;

	if (
		query && query.length && lastCorrection &&
		lastCorrection.query && lastCorrection.query.length &&
		lastCorrection.correction && lastCorrection.correction.length
	){
		// zkontrolujeme, jestli posledni korekce pasuje do hledaneho vyrazu
		if ( lastCorrection.query === query.substring(0, lastCorrection.query.length) ){
			// pribyla nova pismenka > vratime korigovany tvar obohaceny o nova pismenka
			corrected = lastCorrection.correction + query.substring(lastCorrection.query.length);
		}
	}

	this.log( 'SUGGEST', 'Corrected query: ' + (corrected ? ('Found ("' + corrected + '")') : 'Not found') );

	return corrected;
};

/**
 * Vytvoření html elementů
 */
JAK.Suggest5.prototype._build = function() {
	var input = this._dom.searchbox;

	if (this._options.submitButton) {
		this._ec.push(JAK.Events.addListener(this._options.submitButton, "click", this, "_submitButton"));
	}

	var container = JAK.mel("div", {className: this._options.suggestClassName}, {display: "none"});
	this._dom.wrapper.appendChild(container);

	var content = JAK.mel("ul", {className:"content"});
	container.appendChild(content);

	this._dom.container = container;
	this._dom.content = content;

	this._ec.push(JAK.Events.addListener(input, "keydown", this, "_keydown"));
	this._ec.push(JAK.Events.addListener(input, "focus", this, "_focus"));

	/* Pokud nemáme k dispozici událost oninput, musíme kontrolovat pole v intervalu */
	if ("oninput" in input) {
		this._ec.push(JAK.Events.addListener(input, "input", this, "_valueCheck"));
	} else {
		setInterval(this._valueCheck.bind(this), this._options.valueCheckDelay); /* IE8 a nižší */
	}

	if ("autocorrect" in input) {
		/* This is a nonstandard attribute supported by Safari
		that is used to control whether autocorrection should be
		enabled when the user is entering/editing the text
		value of the <input>. */
		input.setAttribute("autocorrect", "off");
	}
	input.autocomplete = "off";

	var touchBlur = function(e, elm) {
		if (JAK.DOM.getStyle(this._dom.container, "position") == "absolute") {
			this._blur(e, elm);
		} else {
			return;
		}
	}

	this._ec.push(JAK.Events.addListener(container, "mousedown", function(e) {
		JAK.Events.stopEvent(e);
		JAK.Events.cancelDef(e);
	})); /* aby nedobublal az nahoru, kde to zavre suggest */
	this._ec.push(JAK.Events.addListener(container, "touchstart", JAK.Events.stopEvent));
	this._ec.push(JAK.Events.addListener(container, "mousemove", this, "_unlock")); /* viz _hoverLock; povoli hoverovani polozek */
	this._ec.push(JAK.Events.addListener(document, "mousedown", this, "_blur")); /* schovat */
	this._ec.push(JAK.Events.addListener(document, "touchstart", touchBlur.bind(this))); /* schovat pouze tehdy když našeptávač floatuje */
};

JAK.Suggest5.prototype._submitButton = function(e, elm) {
	JAK.Events.cancelDef(e);
	this.makeEvent("suggest-button");
	this.action(e);
};

/**
 * Je-li políčko pro dotaz prázdné, skryjeme suggest
 */
JAK.Suggest5.prototype._valueCheck = function(e, elm) {
	var query = this._dom.searchbox.value,
		cached;

	if (this._timeout || /*this._stepUpDown || */this._dom.searchbox != document.activeElement) { return };

	if ( !query ){
		this._hide();
		this._clear();
		this._query = "";
		return;
	}

	/* zašleme request, pokud došlo ke změně vyhledávacího pole, například po smazání části dotazu myší (výběrem) */
	if ( query != this._query && !this._stepUpDown ){
		this._correction = false;
		cached = this._cache.get(query);
		corrected = this.getCorrected(query);

		if ( cached ){
			// vysledek vezmeme z cache
			this._responseCached(cached);

		} else if ( corrected ){
			// udelame request na posledni opraveny hledany vyraz (obohaceny o nove znaky)
			this._startRequest(corrected);

		} else {
			// standardni request
			this._startRequest();
		}
	}
};

JAK.Suggest5.prototype._show = function() {
	this._hoverLock = true;
	if (this._opened) { return; }
	this._opened = true;
	this._dom.container.style.display = "";
};

/**
 * Skryje našeptávač
 */
JAK.Suggest5.prototype._hide = function() {
	if (this._rq) { this._rq.abort(); }
	if (this._timeout && !this._correction) { clearTimeout(this._timeout); }
	if ( !this._opened ) { return; }
	this._dom.container.style.display = "none";
	this._stepUpDown = false;
	this._opened = false;
};

JAK.Suggest5.prototype._clear = function() {
	JAK.DOM.clear(this._dom.content);
	while (this._items.length) { this._items.shift().$destructor(); }
	this._navigableItems = [];
	this._activeItem = null;
};

JAK.Suggest5.prototype._startRequest = function(query) {
	if (this._timeout) { this.log("SUGGEST", "storno"); clearTimeout(this._timeout); }
	if (this._correction) { return; }

	this._timeout = setTimeout(
		this._request.bind(this, query),
		this._options.timeout
	);
};

JAK.Suggest5.prototype._startRequestCorrection = function(timeout) {
	if (this._timeout) { this.log("SUGGEST", "storno"); clearTimeout(this._timeout); }
	if (timeout === undefined) { timeout = (this._options.timeout * this._options.correction); }
	this._correction = true;
	this._timeout = setTimeout(this._request, timeout);
};

/**
 * Posle XMLHttpRequest
 */
JAK.Suggest5.prototype._request = function(query) {
	this._timeout = false;

	if ( this._dom.searchbox.value.trim().length == 0 ){
		this._hide();
		this._clear();
		return;
	}

	/* pokud request jiz bezi, zrusime ho */
	if (this._rq) {
		this._rq.abort();
		this.log('SUGGEST', 'Request: aborted');
	}

	this._query = query || this._dom.searchbox.value;

	if ( query ){
		this.log('SUGGEST', 'Request (C): last corrected query');

	} else if ( this._correction ){
		this.log('SUGGEST', 'Request (B): get corrected results');

	} else {
		this.log('SUGGEST', 'Request (A): default');
	}

	var url = this._buildUrl(this._query, this._correction);

	this._rq = new JAK.Request(JAK.Request.TEXT, {
		withCredentials: true
	});

	this._rq.setCallback(this, "_response");
	this._rq.send(url);
};

JAK.Suggest5.prototype._response = function(xmlDoc, status) {
	var isCached = ('CACHED' === status),
		data, len, cached;

	if ( !isCached ){
		data = (xmlDoc ? JSON.parse(xmlDoc) : null);
	} else {
		data = xmlDoc;
	}

	len = (data && data.result) ? data.result.length : 0;

	if ( !isCached ){
		this.log('SUGGEST', 'Request: finished (' + len + ' items)');
	} else {
		this.log('SUGGEST', 'Showing cached result (' + len + ' items)');
	}

	this._rq = null;
	this._timeout = false;
	if (len == 0) { this._hide(); }
	this._clear();

	if (data) {
		this.makeEvent("suggest-results", data);

		if (data.id) {
			this._params.sgId = data.id;
		}

		if (len == 0) {
			if ( !this._correction && !isCached ) {
				// pokud standardni request nic nevrati, udelame pozadavek na korekci
				this._startRequestCorrection(0);
				return;
			}

		} else {
			// ulozeni stavu posledni korekce
			if ( this._correction && !isCached ){
				this._lastCorrection = {
					query: this._query,
					correction: data.correction
				};

				this.log('SUGGEST', 'New correction saved:', this._lastCorrection);
			}

			this._correction = false;

			this._buildItems(data);
			this._show();
		}
	}

	if ( !isCached ){
		this._cache.put(this._query, data);
	}

	// vrátíme všechna data, kdyby je někdo chtěl...
	return data;
};

/**
 * Vyrederuje cachovany vysledek
  * @param {object} JSON vysledek
 */
JAK.Suggest5.prototype._responseCached = function(data){
	if (this._rq) { this._rq.abort(); }
	this._query = this._dom.searchbox.value;
	this._correction = true;
	this._response(data, 'CACHED');
};

JAK.Suggest5.prototype._buildItems = function(data) {
	var appName, itemCtor;
	var items = data.result;

	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		this._buildItem(this._options.itemMap.item, item);
	}

	for (var i = 0; i < this._items.length; i++) {
		this._dom.content.appendChild(this._items[i].getContainer());
	}
};

JAK.Suggest5.prototype._buildItem = function(constructor, node) {
	var item = new constructor(this, node);
	this._items.push(item);
	if (item.isNavigable()) { this._navigableItems.push(item); }
};

JAK.Suggest5.prototype._buildUrl = function(query, correction) {
	var arr = [];
	var url = this._url;

	arr.push("phrase=" + encodeURIComponent(query));
	arr.push("format=json");
	arr.push("highlight=" + (this._options.highlight ? "1" : "0"));
	arr.push("count=" + this._options.count);
	arr.push("cursor=" + JAK.Suggest5.getCaret(this._dom.searchbox).end);
	if (this._options.format) { arr.push("result=" + this._options.format); }
	if (correction) { arr.push("correction=1"); }
	for (var i in this._options.postParams) {
		arr.push(i + "=" + this._options.postParams[i]);
	}

	url += this._options.dict + "?" + arr.join("&");

	return url;
};

JAK.Suggest5.prototype._highlight = function(item) {
	this._activeItem = item;
	for (var i = 0; i < this._navigableItems.length; i++) {
		var it = this._navigableItems[i];
		var node = it.getContainer();
		if (it == item) {
			node.classList.add("active");
		} else {
			node.classList.remove("active");
		}
	}
};

/**
 * Handler pro keydown na hledacím inputu
 */
 JAK.Suggest5.prototype._keydown = function(e, elm) {
	var code = e.keyCode,
		isChar = true,//(e.key == undefined) ? true : (e.key.length == 1);
		cached;

	if ( e.ctrlKey && code ) { return; }
	this.makeEvent("suggest-keyboard", {code: code});
	this._stepUpDown = false;
	switch (code) {
		case 13: /* enter */
			JAK.Events.cancelDef(e);
			if (this._activeItem && this._activeItem.getValue() == this.getQuery()) {
				this._activeItem.action(e);
			} else {
				this.action(e);
			}
		break;

		case 40: /* sipka dolu */
			if (this._navigableItems.length) { this._stepDown(); this._stepUpDown = true; }
		break;

		case 38: /* sipka nahoru */
			JAK.Events.cancelDef(e); /* aby se kurzor nepřesunul */
			if (this._navigableItems.length) { this._stepUp(); this._stepUpDown = true; }
		break;

		case 9: /* tab */
		case 27: /* esc */
			this._hide();
		break;

		default: /* nevime co ty kody znaci */
			if (((code < 33) || (code > 39)) && [27,44,45,16,17,18,19,20].indexOf(code) == -1 && isChar) {
				if (this._correction && /[^A-Za-z0-9]/.test(String.fromCharCode(code))) {
					cached = this._cache.get(this._dom.searchbox.value);

					if ( cached ){
						// vysledek vezmeme z cache
						this._responseCached(cached);

					} else {
						// request korekce
						this._startRequestCorrection();
					}
				}
			}
		break;
	}
};

/**
 * Handler pro focus na hledacím inputu
 */
JAK.Suggest5.prototype._focus = function(e, elm) {
	/* Máme-li nějaké výsledky a ve vyhledávacím poli je stejný dotaz jako před focusem, zobrazíme našeptávač */
	if (this._items.length && this._query == this._dom.searchbox.value) {
		this._show();
	} else {
		this._valueCheck(e, elm); /* focus na již vyplněný input zavolá request na suggest */
	}
	this.log("SUGGEST", "focus");
};

JAK.Suggest5.prototype._stepUp = function() {
	var index = this._navigableItems.indexOf(this._activeItem);
	var cnt = this._navigableItems.length;
	if (index == 0) {
		this._highlight();
		this._setCaretToEnd();
		this.setQuery(this.getQuery());
		return;
	} else if (index == -1) {
		index = cnt - 1
	} else {
		index = (index == -1 || index == 0 ? 0 : index-1);
	}
	this._highlight(this._navigableItems[index]);
	this._activeItem.highlightNavigateAction();
};

JAK.Suggest5.prototype._stepDown = function() {
	var index = this._navigableItems.indexOf(this._activeItem);
	var cnt = this._navigableItems.length;
	if (index == cnt - 1) {
		this._highlight();
		this._setCaretToEnd();
		this.setQuery(this.getQuery());
		return;
	} else if (index == -1) {
		index = 0;
	} else {
		index++;
	}
	this._highlight(this._navigableItems[index]);
	this._activeItem.highlightNavigateAction();
};

JAK.Suggest5.prototype._setCaretToEnd = function() {
	var input = this._dom.searchbox;
	var chars = input.value.length;
	if (input.setSelectionRange) {
		chars *= 2;
		input.focus();
		input.setSelectionRange(chars, chars);
	} else if (input.createTextRange) {
		var range = input.createTextRange();
		range.collapse(true);
		range.moveEnd('character',chars);
		range.moveStart('character',chars);
		range.select();
	}
};

/**
 * Uzivatel hnul mysi, cili je povolen hover polozek (po prvnim zobrazeni byl zamceny, viz _hoverLock)
 */
JAK.Suggest5.prototype._unlock = function() {
	this._hoverLock = false;
};

/**
 * Blur inputu. Pokud mame suggest, tak nic nedelame; pokud nemame a bezi request, zrusime ho.
 */
JAK.Suggest5.prototype._blur = function(e, elm) {
	if (JAK.Events.getTarget(e) == this._dom.searchbox) { return; } /* klikneme-li do hledacího pole, nebudeme provádět blur */

	this._hide();
	this._dom.searchbox.blur();//blur na vyhledávací pole kvůli mobilnícm zařízením (skrývá virtuální klávesnici)

	if (this._timeout) {
		clearTimeout(this._timeout);
		this._timeout = false;
	}

	if (this._rq) {
		this._rq.abort();
		this._rq = null;
	}

	if ( elm.focus ) {
		elm.focus();
	} else {
		window.focus();
	}
};

/* --- --- */

/**
 * @class Cache
 */
JAK.Suggest5.Cache = JAK.ClassMaker.makeClass({
	NAME: "JAK.Suggest5.Cache",
	VERSION: "1.1",
	IMPLEMENT: JAK.Suggest5
});

JAK.Suggest5.Cache.prototype.$constructor = function(options) {
	this._options = {
		limit: 40,
		caseSensitive: false
	}
	this.setOptions(options);

	this._cache = []; /* cache vysledku naseptavani */

	// metoda, která (ne)upravuje vtupní dotaz dle nastavení
	this._caseSensitive = (this._options.caseSensitive == false) ? function (q) { return (typeof q == "string") ? q.toLowerCase() : q; } : function (q) { return q; };
};

/**
 * Vratí cache vysledku naseptavani
 * @returns {array}
 */
JAK.Suggest5.Cache.prototype._getCache = function() {
	return this._cache || [];
};

/**
 * Vrati vysledek naseptavace podle hledaneho vyrazu
 * @param {string} hledany vyraz
 * @returns {object} navratova hodnota JSON vysledku
 */
JAK.Suggest5.Cache.prototype.get = function(query) {
	var cache = this._getCache(),
		res;

	query = this._caseSensitive(query);

	this.log('CACHE', 'Standard check for: ' + query);

	// kontrola podle query
	for ( var i = 0, imax = cache.length; i < imax; i++ ){
		if ( !res && query === cache[i][0] ){
			res = cache[i][1];
		}
	}

	this.log('CACHE', 'Check result: ' + (res ? 'Found' : 'Not found'));

	return res;
};

/**
 * Prida vysledek naseptavace do cache
 * @param {string} hledany vyraz
 * @param {object} hledany vyraz
 */
JAK.Suggest5.Cache.prototype.put = function(query, data) {
	var cache = this._getCache(),
		max = this._options.limit || 0;

	query = this._caseSensitive(query);

	this.log('CACHE', 'Trying to add: (query: "' + query + '", items: ' + ((data && data.result) ? data.result.length : '"N/A"') + ', corrected query: ' + (data && data.correction ? data.correction : '"N/A"') + ')');

	if ( query && query.length && !this.get(query) ){
		cache.push([ query, data ]);

		if ( cache.length > max){
			cache.shift();
		}

		this.log('CACHE', 'Query results added');

	} else {
		this.log('CACHE', 'Query results not added');
	}
};

/* --- --- */

/**
 * @class Naseptana polozka
 */
JAK.Suggest5.Item = JAK.ClassMaker.makeClass({
	NAME: "JAK.Suggest5.Item",
	VERSION: "3.0",
	IMPLEMENT: JAK.ISignals
});

JAK.Suggest5.Item.prototype.$constructor = function(owner, node) {
	this._owner = owner;
	this._node = node;

	this._dom = {
		container: JAK.mel("li", {className: "item"})
	};
	this._ec = [];
	this._queryUrl = null;

	this._value = node.sentence;

	this._build();
	this._addEvents();
};

JAK.Suggest5.Item.prototype.isNavigable = function() { return true; };

JAK.Suggest5.Item.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
};

JAK.Suggest5.Item.prototype.getContainer = function() {
	return this._dom.container;
};

/**
 * Hodnota teto polozky
 * @returns {string}
 */
JAK.Suggest5.Item.prototype.getValue = function() {
	return this._value;
};

/**
 * XML uzel patrici teto polozce
 * @returns {node}
 */
JAK.Suggest5.Item.prototype.getNode = function() {
	return this._node;
};

JAK.Suggest5.Item.prototype._build = function() {
	this._dom.container.innerHTML = "<span>" + this._dom.container.innerHTML + "</span>";
};

JAK.Suggest5.Item.prototype.action = function() {
	if (this._queryUrl) { window.location = this._queryUrl; }
};

JAK.Suggest5.Item.prototype._addEvents = function() {
	if ("ontouchend" in window) {
		this._ec.push(JAK.Events.addListener(this._dom.container, "touchstart", this, "_touchstart"));
		this._ec.push(JAK.Events.addListener(this._dom.container, "touchmove", this, "_touchmove"));
		this._ec.push(JAK.Events.addListener(this._dom.container, "touchend", this, "_touchend"));
	}
	this._ec.push(JAK.Events.addListener(this._dom.container, "click", this, "_click"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "mousemove", this, "_move"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "mouseover", this, "_over"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "mouseout", this, "_out"));
}

JAK.Suggest5.Item.prototype._touchstart = function(e, elm) {
	this._touched = true;
};

JAK.Suggest5.Item.prototype._touchmove = function(e, elm) {
	this._touched = false;
};

JAK.Suggest5.Item.prototype._touchend = function(e, elm) {
	if (this._touched) {
		this._touched = true;
		this._owner.makeEvent("suggest-touch", {elm: elm, action: "click"});
		this._owner._highlight(this);
		this.action(e);
	}
};

JAK.Suggest5.Item.prototype._click = function(e, elm) {
	if ( this._touched ) {
		this._touched = false;
		return;
	}

	this._owner.makeEvent("suggest-mouse", {elm: elm, action: "click"});
	this.action(e);
};

JAK.Suggest5.Item.prototype._over = function(e, elm) {
	if (this._owner._hoverLock) { return; }
	this._owner._highlight(this);
};

JAK.Suggest5.Item.prototype._move = function(e, elm) {
	if (e.currentTarget.classList.contains("active")) { return; }
	this._over(e, elm);
};

JAK.Suggest5.Item.prototype._out = function(e, elm) {
	this._owner._highlight();
};

/**
 * Highlight klavesnici
 */
JAK.Suggest5.Item.prototype.highlightNavigateAction = function() {
	this._owner.getInput().value = this._owner.getQuery();
};

/* --- --- */

/**
 * @class Interaktivni naseptany termin
 * @augments JAK.Suggest5.Item
 */
JAK.Suggest5.Term = JAK.ClassMaker.makeClass({
	NAME: "JAK.Suggest5.Term",
	VERSION: "2.1",
	EXTEND: JAK.Suggest5.Item
});

JAK.Suggest5.Term.prototype.action = function(e) {
	this._owner.setQuery(this._value);
	this._owner.action(e);
};

JAK.Suggest5.Term.prototype.highlightNavigateAction = function() {
	this._owner.setQuery(this.getValue());
};

JAK.Suggest5.Term.prototype._build = function() {
	this._dom.container.appendChild(JAK.mel("span", {innerHTML: this._highlight(this._value)}));
};

JAK.Suggest5.Term.prototype._highlight = function(what) {
	var value = what;
	var highlight = this._node.highlight;

	if ( !highlight || highlight.length == 0 ) { return value; }

	var start, end;
	for (var i = highlight.length - 1; i > 0; i -= 2) {
		start = highlight[i-1];
		end = highlight[i];
		value = value.substring(0, start) + "<span class=\"highlight\">" + value.substring(start, end) + "</span>" + value.substring(end);
	}

	return value;
};

/**
 * @class Slovnikova polozka
 * @augments JAK.Suggest5.Item
 */
JAK.Suggest5.Dictionary = JAK.ClassMaker.makeClass({
	NAME:'JAK.Suggest5.Dictionary',
	VERSION: "1.1",
	EXTEND: JAK.Suggest5.Item
});

/**
 * @constant
 * Url adresa k adresáři vlaječek, které musí být ve formátu ico-flag-<lang>.png
 */
JAK.Suggest5.Dictionary.FLAGS_URL = "http://slovnik.seznam.cz/img/flags/";

/**
 * @constant
 * Url adresa ke slovníku
 */
JAK.Suggest5.Dictionary.URL = "http://slovnik.seznam.cz/";

JAK.Suggest5.Dictionary.prototype._build = function() {
	var translation = this._node.getElementsByTagName("string")[0].firstChild.nodeValue,
		flagUrl = JAK.Suggest5.Dictionary.FLAGS_URL + "ico-flag-" + translation.split("_")[0] + ".png",
		queryUrl = JAK.Suggest5.Dictionary.URL + translation.replace("_", "-") + "/word/?q="+this._owner.getQuery()+"&thru=sug&type="+translation,
		a = JAK.mel("a", {href: queryUrl});

	this._queryUrl = queryUrl;

	a.innerHTML = "<img src='"+ flagUrl +"' /><strong>" + this._owner.getQuery() + "</strong> – " + this._value + " …";

	this._dom.container.classList.add("dictionary");
	this._dom.container.classList.add("miniapps");
	this._dom.container.appendChild(a);
};

/**
 * @class Položka miniappky
 * @augments JAK.Suggest5.Item
 */
JAK.Suggest5.Miniapps = JAK.ClassMaker.makeClass({
	NAME:'JAK.Suggest5.Miniapps',
	VERSION: "1.0",
	EXTEND: JAK.Suggest5.Item
});

/**
 * @constant
 * Url k jednotlivým nápovědám miniaplikací
 */
JAK.Suggest5.Miniapps.APPS = {
	converter: "http://napoveda.seznam.cz/cz/hledani-fulltext-miniaplikace.html?thru=sug#prevod_jednotek",
	calculator: "http://napoveda.seznam.cz/cz/hledani-fulltext-miniaplikace.html?thru=sug#kalkulacka",
	exchange: "http://napoveda.seznam.cz/cz/hledani-fulltext-miniaplikace.html?thru=sug#prevod_men"
};

JAK.Suggest5.Miniapps.prototype._build = function() {
	var type = this._node.getElementsByTagName("string");
	if (!type.length) { return; }

	type = type[0].textContent || type[0].firstChild.nodeValue; /* IE9+ */
	this._queryUrl = JAK.Suggest5.Miniapps.APPS[type];
	if (!this._queryUrl) { return; }

	var span = JAK.mel("span", {innerHTML: this._value});
	this._dom.container.classList.add("help")
	this._dom.container.classList.add("miniapps");
	this._dom.container.title = "Dozvědět se více o této funkci?";
	this._dom.container.appendChild(span);
};
