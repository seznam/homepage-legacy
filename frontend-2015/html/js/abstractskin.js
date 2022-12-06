/**
 * @class
 * zakladni trida pro skin (reprezentujici jeden skin)
 * @augments JAK.ISignals
 * @property {int} sync 0/1 ne/synchronizovat s neprihlasenym userem prihlaseneho
 * @property {object} owner odkaz na instanci Skin Managera
 * @property {string} name jmeno skinu
 * @property {int} type prepinani typu 0/1 normal/tematicky
 * @property {int} id id skinu
 * @property {int} selected 0/1 zda ma uzivatel dany skin vybran
 * @property {string} imgSrc url na nahledovy obrazek nebo url na css
 * @property {string} imgBig url na velky obrazek nebo url na css
 * @property {string} skinType img/css
 * @property {string} border 0/1 border kolem hledaciho okna
 * @property {string} cssText doplnkove css k obrazkovym skinum
 * @signal firstShow prvni spusteni
 */

Homepage.BaseSkin = JAK.ClassMaker.makeClass({
	NAME:"Homepage.BaseSkin",
	VERSION:"1.0",
	IMPLEMENT: JAK.ISignals
})

Homepage.BaseSkin.cssLink = null;
Homepage.BaseSkin.bckImage = {};
Homepage.BaseSkin.bckImage.img = null;
Homepage.BaseSkin.bckImage.resizer = null;

Homepage.BaseSkin.activeSkin = null;
Homepage.BaseSkin.cssText = null;


Homepage.BaseSkin.prototype.$constructor = function (sync, owner, name, type, id, selected, imgSrc, imgBig, skinType, border, cssText, staticCssId) {
	this._dom = {};
	this._ec = {};

	this._owner = owner;
	// pokud je skin vybrany nastavime globalni promenne pouzivane pro prepinani
	this._selected = selected;
	if (this._selected == 1) {
		Homepage.BaseSkin.activeSkin = this;
		Homepage.BaseSkin.activeSkinFirst = this;
	}
	this._imgSrc = imgSrc;
	this._imgBig = imgBig;
	this._name = name;
	this._type = type;
	this.id = id;
	this.staticCssId = staticCssId;
	this._skinType = skinType;
	this._border = border;
	this._sync = sync;
	this.cssText = cssText;

	// pozadi na elementech, ktera se animuji pri zobrazovani filmoveho pasu se skiny
	this.movedBackgrounds = [document.documentElement, document.body, JAK.gel('head-cont'), JAK.gel('head')];
	this.moveStep = 120;

	// flag prvniho nacteni - nezobrazujemem loader (tocice se kolecko)
	this._onLoadSetSkin = false;
	this._init();
	this._elemsToChange = {};
}

/**
 *  nastavi a vyrobi zakladni html
 */
Homepage.BaseSkin.prototype._init = function () {
	this._dom.cont = JAK.mel('div', {className: 'skin'});
	this._dom.a = JAK.mel('a', {href:'#', title: this._name});
	this._dom.img = JAK.mel('img', {src: '', width:'99', height:'100', alt:''});

	// cerveny tercik
	this._dom.activeMark = JAK.mel('div', {className: 'active'});

	JAK.DOM.append([this._dom.cont, this._dom.a], [this._dom.a, this._dom.img]);

	this._ec.clik = JAK.Events.addListener(this._dom.a, "click", this, this._click);


	if (this._selected == 1) {
		this._onLoadSetSkin = true;
		JAK.DOM.append([this._dom.cont, this._dom.activeMark]);
		if (this._skinType != 'css') { // pac css skin je rovnou pripnuty v tengu
			JAK.Events.onDomReady(this, this._switchSkin);
		} else {
			var actLink = JAK.gel('link');
			var actAditionalLink = JAK.gel('aditional-link');
			Homepage.BaseSkin.cssLink = actAditionalLink;
			JAK.Events.onDomReady(this, this._changeBorder);
			JAK.Events.onDomReady(this, this._setAdvertExclusive);
		}
	}

	// tematicky skin ma jmeno
	if (this._type == 1) {
		this._dom.name = JAK.mel('div', {className: 'skinName'});
		this._dom.name.innerHTML = this._name;
		this._dom.cont.appendChild(this._dom.name);
	}

	// prvni zobrazeni nacti obrazky
	this.addListener('firstShow', this._setImgSrc.bind(this));

	if (this._selected == 1) {
		this._setOpacity(0);
	}
}

/**
 * nastavuje url obrazku obrazkoveho skinu
 */
Homepage.BaseSkin.prototype._setImgSrc = function () {
	this._dom.img.src = this._imgSrc;
}

/**
 * vrati hlavni obal skinu
*/
Homepage.BaseSkin.prototype.getConteinerDom = function () {
	return this._dom.cont;
}

/**
 * vraci odkaz na aktivni skin
 */
Homepage.BaseSkin.prototype.isActive = function () {
	return this._selected;
}

/**
 * metoda navesena na cliknuti na preview skinu
 * @property {obect} e eventa
 * @property {obect} elm zdrojovy element
 */
Homepage.BaseSkin.prototype._click = function (e, elm) {
	JAK.Events.stopEvent(e);
	JAK.Events.cancelDef(e);

	this._setSelectedMark();
	this._setOpacity(0);
	this._switchSkin();
}

/**
 * dle typu skinu provede volani spravne fce
 */
Homepage.BaseSkin.prototype._switchSkin = function () {
	if (this.movedBackgrounds) {
		for (var i = 0; i < this.movedBackgrounds.length; i++) {
			if (this.movedBackgrounds[i]) {
				if (this.movedBackgrounds[i].style.removeProperty) {
					this.movedBackgrounds[i].style.removeProperty('background-position-y');
					this.movedBackgrounds[i].style.removeProperty('background-position-x');
					this.movedBackgrounds[i].style.removeProperty('background-position');
					this.movedBackgrounds[i].style.removeProperty('background-position');
				}
				this.movedBackgrounds[i].style.backgroundPositionY = '0';
				this.movedBackgrounds[i].style.backgroundPositionX = '0';
				this.movedBackgrounds[i].style.backgroundPosition = '0 0';
				this.movedBackgrounds[i].style.backgroundPosition = '0 0';
			}
		}
	}

	// proces prepnuti mezi css/img skinem
	if (this._skinType ==  'img') {
		this._imageSkinActivate();
	} else {
		this._cssSkinActivate();
	}
	
	this.makeEvent('actualSkin', { 'staticCssId': this.staticCssId });

	this._setAdvertExclusive();
}

/**
 * Nastavuje exkluzivní reklamu podle vybraného skinu.
 */
Homepage.BaseSkin.prototype._setAdvertExclusive = function() {
	if (this.id != 1) {
		JAK.DOM.addClass(JAK.gel('adExclusive'), 'moveDown');
	} else {
		JAK.DOM.removeClass(JAK.gel('adExclusive'), 'moveDown');
	}
}

/**
 * v DOMu provede oznaceni skinu cervenym tercikem
 */
Homepage.BaseSkin.prototype._setSelectedMark = function () {
	var act = Homepage.BaseSkin.activeSkin;
	// prepnuti tercicku vypbrano a ulozeni noveho skinu do Homepage.BaseSkin.activeSkin
	if (act != null && act !== this) {
		this._selected = 1;
		act._dom.activeMark.parentNode.removeChild(act._dom.activeMark);
		act._selected = 0;
		Homepage.BaseSkin.activeSkin = this;
		JAK.DOM.append([this._dom.cont, this._dom.activeMark]);
	} else {
		Homepage.BaseSkin.activeSkin = this;
		JAK.DOM.append([this._dom.cont, this._dom.activeMark]);
	}
}

/**
 * odeslani dat na server pri zmene skinu (css, img skiny)
 */
Homepage.BaseSkin.prototype._send = function () {
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsSkinSetId','hashId=' + Homepage.CONF.HASHID + '&id=' + Homepage.BaseSkin.activeSkin.id);
}

/**
 * zpracovani navratovych hodnot a volani metody ze skin managera
 * @property {obect} data JSON odpoved
 */
Homepage.BaseSkin.prototype._process = function (data) {
	Homepage.BaseSkin.activeSkinFirst = this;
	this._owner.setActiveSkinPos(this);
}

/**
 * zpracovani navratovych hodnot a volani metody ze skin managera
 */
Homepage.BaseSkin.prototype._changeBorder = function () {
	// musim zmenit grafiku u hledaciho okna
	this._elemsToChange.searchTail = JAK.gel('tail');
	this._elemsToChange.searchCnt = JAK.gel('search-cnt');

	if (!this._border) {
		JAK.DOM.removeClass(this._elemsToChange.searchCnt, 'std');
	} else {
		JAK.DOM.addClass(this._elemsToChange.searchCnt, 'std');
	}
}

/**
 * nastavi classy pro skiny s opacity
 * @property {int} set 0/1 bezpruhlednosti/pruhledne
 */
Homepage.BaseSkin.prototype._setOpacity = function (set) {
	/*if (this.id == 1 || this.id == 952) {
		set = 1;
	}*/

	if (set) {
		JAK.DOM.addClass(document.body, 'opacity-80');
	} else {
		JAK.DOM.removeClass(document.body, 'opacity-80');
	}
}

/**
 * nastaveni obrazkoveho skinu
 */
Homepage.BaseSkin.prototype._imageSkinActivate = function () {
	var actLink = JAK.gel('link');
	var actAditionalLink = JAK.gel('aditional-link');

	// zkusim jestli nebyl vyroben style
	if (actAditionalLink == null) {
		if (Homepage.BaseSkin.cssLink != null && Homepage.BaseSkin.cssLink.nodeName.toLowerCase() == 'style') {
			actAditionalLink = Homepage.BaseSkin.cssLink;
		}
	}

	Homepage.BaseSkin.cssLink = actAditionalLink;
	this._changeBorder();

	if (Homepage.BaseSkin.cssLink != null) {
		Homepage.BaseSkin.cssLink.parentNode.removeChild(Homepage.BaseSkin.cssLink);
		Homepage.BaseSkin.cssLink = null;
	}

	if (Homepage.BaseSkin.cssText == null) {
		Homepage.BaseSkin.cssText = JAK.mel('style', {type:'text/css'});
		if (Homepage.BaseSkin.cssText.styleSheet) { /* ie */
			Homepage.BaseSkin.cssText.styleSheet.cssText = this.cssText;
		} else { /* non-ie */
			JAK.DOM.clear(Homepage.BaseSkin.cssText);
			Homepage.BaseSkin.cssText.appendChild(JAK.ctext(this.cssText));
		}
		var actLink = JAK.gel('link');
		actLink.parentNode.insertBefore(Homepage.BaseSkin.cssText, actLink.nextSibling);

	} else {
		if (Homepage.BaseSkin.cssText.styleSheet) { /* ie */
			Homepage.BaseSkin.cssText.styleSheet.cssText = this.cssText;
		} else { /* non-ie */
			JAK.DOM.clear(Homepage.BaseSkin.cssText);
			Homepage.BaseSkin.cssText.appendChild(JAK.ctext(this.cssText));
		}
	}

	if (Homepage.BaseSkin.bckImage.img == null) {
		if (this._onLoadSetSkin == false) {
			JAK.loader.show();
		}

		Homepage.BaseSkin.bckImage.img = JAK.mel('img', {src:this._imgBig, alt:'', id:'bckimg'}, {zIndex:'-1', position: 'fixed', top: '0', left:'0', marginTop: (this._onLoadSetSkin ? '0':'120px')});
		this._ec.hideTimerOnload = JAK.Events.addListener(Homepage.BaseSkin.bckImage.img, 'load', JAK.loader.hideTimer);
		document.body.insertBefore(Homepage.BaseSkin.bckImage.img,document.body.firstChild);
		// zastaveni resize
		if (Homepage.BaseSkin.bckImage.resizer != null) {
			Homepage.BaseSkin.bckImage.img.style.width = 'auto';
			Homepage.BaseSkin.bckImage.img.style.height = 'auto';
			Homepage.BaseSkin.bckImage.resizer.stop();
		}
	} else {
		if (this._onLoadSetSkin == false) {
			JAK.loader.show();
		}
		Homepage.BaseSkin.bckImage.img.src = '#'; // pokud se nastavi hodnota, jez je shodna s predchozi hodnotou, nevyvola se onload ve webkitu
		Homepage.BaseSkin.bckImage.img.src = this._imgBig;
		this._ec.hideTimerOnload = JAK.Events.addListener(Homepage.BaseSkin.bckImage.img, 'load', JAK.loader.hideTimer);
		// zastaveni resize
		if (Homepage.BaseSkin.bckImage.resizer != null) {
			Homepage.BaseSkin.bckImage.img.style.width = 'auto';
			Homepage.BaseSkin.bckImage.img.style.height = 'auto';
			Homepage.BaseSkin.bckImage.resizer.stop();
		}
	}
	this._onLoadSetSkin = false; //kdyz se obrazek nastavi - tak uz to neni shlednuti po nacteni

	// u boxu firem se meni trida kvuli tmavym skinum, aby se spravne vymenila i ikonka
	var firmyBox = JAK.gel('firmy-trends');
	JAK.DOM.addClass(firmyBox, 'firmy-light');
	JAK.DOM.removeClass(firmyBox, 'firmy-dark');
}

Homepage.BaseSkin.prototype._writeStyle = function (data) {
	Homepage.BaseSkin.cssLink = JAK.DOM.writeStyle(data);

	if (Homepage.BaseSkin.cssLink != null) {
		if (JAK.Browser.client != 'ie') { // tahle podminka je jen docasna, aby to slo pustit ven, i kdyz IE jeste stavkuje
				this._pollCSSw3c();
		}
	}

	this._changeBorder();
}

/**
 * nastaveni css skinu
 */
Homepage.BaseSkin.prototype._cssSkinActivate = function () {
	var actLink = JAK.gel('link');
	var actAditionalLink = JAK.gel('aditional-link');

	// zkusim jestli nebyl vyroben style
	if (actAditionalLink == null) {
		if (Homepage.BaseSkin.cssLink != null && Homepage.BaseSkin.cssLink.nodeName.toLowerCase() == 'style') {
			actAditionalLink = Homepage.BaseSkin.cssLink;
		}
	}

	Homepage.BaseSkin.cssLink = actAditionalLink;

	// musim zmenit grafiku u hledaciho okna
	this._elemsToChange.searchTail = JAK.gel('tail');
	this._elemsToChange.searchCnt = JAK.gel('search-cnt');

	if (this.id != 1) { // pokud neni original od Seznamu
		if (Homepage.BaseSkin.cssLink == null) {
			//Homepage.BaseSkin.cssLink = JAK.mel('link', {id: 'aditional-link', href:this._imgBig, rel:'stylesheet', type:'text/css', media:'all'})
			var rq = new JAK.Request(JAK.Request.TEXT);
			rq.setCallback(this, "_writeStyle");
			rq.send(this._imgBig);

			//actLink.parentNode.insertBefore(Homepage.BaseSkin.cssLink, actLink.nextSibling);
		} else {
			//Homepage.BaseSkin.cssLink.href = this._imgBig; // zpusobuje "zaseknuti" skinu ve webkitu
			Homepage.BaseSkin.cssLink.parentNode.removeChild(Homepage.BaseSkin.cssLink);
			var rq = new JAK.Request(JAK.Request.TEXT);
			rq.setCallback(this, "_writeStyle");
			rq.send(this._imgBig);
			// pripojit novy skin a ulozit do cssLink
		}
	} else {
		if (Homepage.BaseSkin.cssLink != null) {
			Homepage.BaseSkin.cssLink.parentNode.removeChild(Homepage.BaseSkin.cssLink);
			Homepage.BaseSkin.cssLink = null;
		}
		/*this._pollCSSw3c();*/
		this._changeBorder();
	}


	if (Homepage.BaseSkin.cssText != null) {
		Homepage.BaseSkin.cssText.parentNode.removeChild(Homepage.BaseSkin.cssText);
		Homepage.BaseSkin.cssText = null;
	}

	if (Homepage.BaseSkin.bckImage.img != null) {
		//vypnuti resizeru vlastniho obrazku
		if (Homepage.BaseSkin.bckImage.resizer != null) {
			Homepage.BaseSkin.bckImage.img.style.width = 'auto';
			Homepage.BaseSkin.bckImage.img.style.height = 'auto';
			Homepage.BaseSkin.bckImage.resizer.stop();
			Homepage.BaseSkin.bckImage.resizer.$destructor();
			Homepage.BaseSkin.bckImage.resizer = null;
		}

		if (this._ec.hideTimerOnload != null) {
			JAK.Events.removeListener(this._ec.hideTimerOnload);
			this._ec.hideTimerOnload = null;
		}
		document.body.removeChild(Homepage.BaseSkin.bckImage.img);
		Homepage.BaseSkin.bckImage.img = null;
		this._changeBorder();
	}

	// u boxu firem se meni trida kvuli tmavym skinum, aby se spravne vymenila i ikonka
	var firmyBox = JAK.gel('firmy-trends');

	if (this.staticCssId == 4 || this.staticCssId == 6 || this.staticCssId == 8 || this.staticCssId == 9 || this.staticCssId == 14){
		JAK.DOM.addClass(firmyBox, 'firmy-dark');
		JAK.DOM.removeClass(firmyBox, 'firmy-light');
	}else{
		JAK.DOM.addClass(firmyBox, 'firmy-light');
		JAK.DOM.removeClass(firmyBox, 'firmy-dark');
	}
}

/**
 * animace pozadi
 */
Homepage.BaseSkin.prototype._pollCSSNoRecurse = function () {
	if (typeof(JAK.DOM.getStyle(document.documentElement, 'backgroundPositionY')) != 'undefined') {
		window.setTimeout(this._pollCSSms.bind(this), 50);
	} else {
		window.setTimeout(this._pollCSSw3c.bind(this), 50);
	}
}

/**
 * animace pozadi old MS
 */
Homepage.BaseSkin.prototype._pollCSSms = function () {
	try {
		var sheets = document.styleSheets;
		for(var j = 0, k = sheets.length; j < k; j++) {
			sheets[j].rules;
		}
		if (JAK.gel('skins').style.display == 'block') {
			for (var i = 0; i < this.movedBackgrounds.length; i++) {
				if (this.movedBackgrounds[i]) {
					if (this.movedBackgrounds[i].style.removeProperty) {
						this.movedBackgrounds[i].style.removeProperty('background-position-y');
						this.movedBackgrounds[i].style.removeProperty('background-position-x');
					}
					var coordy = JAK.DOM.getStyle(this.movedBackgrounds[i], 'backgroundPositionY');
					var coordx = JAK.DOM.getStyle(this.movedBackgrounds[i], 'backgroundPositionX');
					this.movedBackgrounds[i].style.backgroundPositionY = ((isNaN(parseInt(coordy))?0:parseInt(coordy))+this.moveStep)+'px';
					this.movedBackgrounds[i].style.backgroundPositionX = coordx;
				}
			}
		}
	} catch(e) {
	}
}

/**
 * animace pozadi ostatni browsery
 */
Homepage.BaseSkin.prototype._pollCSSw3c = function () {
	try {

		var sheets = document.styleSheets;
		if (sheets.length > 1) { // kvuli webkit-based prohlizecum
			for(var j = 0, k = sheets.length; j < k; j++) {
				if (sheets[j].ownerNode.id == 'aditional-link') {
					sheets[j].cssRules;
				}
			}
			if (JAK.gel('skins').style.display == 'block') {
				for (var i = 0; i < this.movedBackgrounds.length; i++) {
					if (this.movedBackgrounds[i]) {
						if (this.movedBackgrounds[i].style.removeProperty) {
							this.movedBackgrounds[i].style.removeProperty('background-position');
						}
						var coords = JAK.DOM.getStyle(this.movedBackgrounds[i], 'backgroundPosition').split(' ');
						this.movedBackgrounds[i].style.backgroundPosition = coords[0]+' '+((isNaN(parseInt(coords[1]))?0:parseInt(coords[1]))+this.moveStep)+'px';
					}
				}
			}
		} else {
			window.setTimeout(this._pollCSSw3c.bind(this), 50);
		}
	} catch(e) {
		if (JAK.Browser.client != 'opera') {
			window.setTimeout(this._pollCSSw3c.bind(this), 50);
		}
	}
}

