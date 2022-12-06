/**
 * @class
 * trida repr. manazera skinu - vyrobi a ovlada pas se skiny
 * @augments JAK.ISignals
 * @property {int} synched urcuje zda ma probehnout synchronizace
 * @signal firstShow
 */
Homepage.SkinManager = JAK.ClassMaker.makeClass({
	NAME: "Homepage.SkinManager",
	VERSION: "1.0",
	IMPLEMENT: JAK.ISignals
})

/**
 * prida instancni skinu do zasobniku skinu
 * @property {object} skinControler instance z tridy Homepage.BaseSkin || Homepage.OwnSkin
 */
Homepage.SkinManager.prototype.addSkinControler = function (skinControler) {
	// pridat do pole
	this._skins.push(skinControler);

	// vraceny obal pripojit do filmoveho pasu
	JAK.DOM.append([this._dom.strip, skinControler.getConteinerDom()]);
	if (skinControler.isActive() == true) {
		this._activeSkin = this._skins.length;
	}
	this._setWidthOfStrip();
}

/**
 * nastaveni vybraneho skinu jako aktivniho
 */
Homepage.SkinManager.prototype.setActiveSkinPos = function (skinControler) {
	this._activeSkin = this._skins.indexOf(skinControler)+1;

}

Homepage.SkinManager.prototype.$constructor = function (synched) {
	this._dom = {};
	this._ec = [];

	this._startPos = 0;
	this._shadowOffset = 23; // sirka gradientu
	this._step = 5;  // o kolik obrazku se posunu
	this._picW = 99;  // o kolik obrazku se posunu

	this._firstShow = true;

	this.synched = synched;

	this._skinsContDom = JAK.gel('skinsCont');
	this._chooseSkinDom = JAK.gel('choose-skin');
	this._searchCont = JAK.gel('search-cnt');

	this.movedBackgrounds = [document.documentElement, document.body, JAK.gel('head-cont'), JAK.gel('head')];

	this._skins = [];
	this._activeSkin = 0;
	this._moveFlag = false; // true pokud se hybe pas se skiny
	this._init();
}

/**
 * nahozeni manazera
 */
Homepage.SkinManager.prototype._init = function () {
	this._ec.push(JAK.Events.addListener(this._chooseSkinDom, 'click', this, this._click));
	this._build();
	// pokud je v url za hashem string urcujici automaticke zobrazeni - zobrazim
	if (document.location.hash.indexOf('vybrat-vzhled') != -1) {
		JAK.Events.onDomReady(this, this.show);
	}
}

/**
 * aktualizace delky filmoveho pasu
 */
Homepage.SkinManager.prototype._setWidthOfStrip = function () {
	this._dom.strip.style.width = (parseInt(this._dom.strip.style.width) + 99) + 'px';
}

/**
 * vyrobeni HTML kodu skin managera
 */
Homepage.SkinManager.prototype._build = function () {
	this._dom.cont = JAK.mel('div', {id:'skins'});
	this._dom.cont.style.display = "none";

	this._dom.scont = JAK.mel('div', {id:'scont'});
	this._dom.skinList = JAK.mel('div', {id:'skin-list'});
	this._dom.strip = JAK.mel('div', {id:'strip'});

	this._dom.larrow = JAK.mel('div', {id:'l-arrow'});
	this._dom.rarrow = JAK.mel('div', {id:'r-arrow'});
	this._dom.lshadow = JAK.mel('div', {id:'l-shadow'});
	this._dom.rshadow = JAK.mel('div', {id:'r-shadow'});
	this._dom.hlpr = JAK.mel('div', {}, { position:'absolute', top:'-1000', left:'-5000', visibility:'hidden'}); // kvuli oznacovani po tripleclicku

	this._dom.sclose = JAK.mel('a', {href:'#', id: 'sclose', innerHTML:'Uložit a zavřít'});
	this._ec.push(JAK.Events.addListener(this._dom.sclose, 'click', this, this._hide));
	//this._ec.close = JAK.Events.addListener(document, 'click', this, this._hide);

	this._ec.push(JAK.Events.addListener(this._dom.larrow, 'click', this, this._lmove));
	this._ec.push(JAK.Events.addListener(this._dom.rarrow, 'click', this, this._rmove));

	this._ec.push(JAK.Events.addListener(this._dom.cont, 'click', this, function (e,elm) {JAK.Events.stopEvent(e,elm);}));

	this._ec.push(JAK.Events.addListener(window, 'resize', this, this._resize));

	JAK.DOM.append([this._skinsContDom, this._dom.cont], [this._dom.cont, this._dom.scont, this._dom.sclose],  [this._dom.scont, this._dom.skinList, this._dom.hlpr, this._dom.lshadow, this._dom.rshadow, this._dom.larrow, this._dom.rarrow],[this._dom.skinList, this._dom.strip]);

	this._dom.strip.style.marginLeft = (this._startPos == 0 ? this._shadowOffset + 'px' : this._startPos + 'px');
	this._dom.strip.style.width = '0px';
}

/**
 * zobrazeni vyberu skinu
 */
Homepage.SkinManager.prototype.show = function () {
	this._showAction();
}

/**
 * zobrazeni vyberu skinu volane z elementu
 */
Homepage.SkinManager.prototype._show = function (e, elm) {
	JAK.Events.stopEvent(e);
	JAK.Events.cancelDef(e);
	this.showFlag = true;
	this._showAction();
}

/**
 * zobrazeni animace pasu, jeho spravne odskrolovani dle toho co je vybrano za skin
 */
Homepage.SkinManager.prototype._showAction = function () {
	var left = 1;
	var right = 1;

	if (this._searchCont == null) {
		this._searchCont = JAK.gel('search-cnt');
	}

	if (this._firstShow) {
		this._firstShow = false;
		this.makeEvent('firstShow');
	}
	this._dom.cont.style.height = "0px";
	this._dom.cont.style.display = "block";
	// vypocet napozicovani na vybrany skin
	this._startPos = (this._picW * this._activeSkin);
	var delta = Math.abs(this._dom.strip.offsetWidth - this._dom.skinList.offsetWidth + this._shadowOffset);

	if (this._startPos > this._dom.skinList.offsetWidth) {
		if (this._startPos > delta + (this._picW/2)) {
			this._startPos = -(delta);
		} else {
			this._startPos = -(this._startPos -this._dom.skinList.offsetWidth) - (Math.round(this._dom.skinList.offsetWidth/2) - this._picW);
		}
	} else {
		this._startPos =  this._shadowOffset;
		left = 0;
	}

	this._dom.strip.style.marginLeft = this._startPos + 'px';

	if(Math.abs(this._startPos) > (this._skins.length * this._picW) - this._dom.skinList.offsetWidth) {
		right = 0;
	}

	// nastaveni sipek po prvnim rozbaleni
	this._setArrows(left, right);

	var i = new JAK.CSSInterpolator(this._dom.cont, 500, {interpolation: JAK.Interpolator.SIN});
	i.addProperty('height', 0, 120, 'px');
	i.start();
	if (JAK.Browser.client != 'ie' && Homepage.BaseSkin.cssLink != null || Homepage.BaseSkin.activeSkin.id == 1) { // tahle podminka je jen docasna
		// animovani pozadi stranky (html, body + dva elementy nad menu se styly)
		for (var x = 0; x < this.movedBackgrounds.length; x++) {
			var elm = this.movedBackgrounds[x];
			if (elm) {
				if (typeof(JAK.DOM.getStyle(this.movedBackgrounds[x], 'backgroundPositionY')) != 'undefined') {
					var i = new JAK.Interpolator(0, 120, 500, function (val) {
						this.options.elm.style.backgroundPositionY = ((isNaN(parseInt(this.options.yCoord))?0:parseInt(this.options.yCoord))+val)+'px';
					}, {interpolation: JAK.Interpolator.SIN, elm: elm, yCoord: JAK.DOM.getStyle(elm, 'backgroundPositionY')});
					i.start();
				} else {
					var i = new JAK.Interpolator(0, 120, 500, function (val) {
						this.options.elm.style.backgroundPosition = this.options.coords[0]+' '+((isNaN(parseInt(this.options.coords[1]))?0:parseInt(this.options.coords[1]))+val)+'px';
					}, {interpolation: JAK.Interpolator.SIN, elm: elm, coords: JAK.DOM.getStyle(elm, 'backgroundPosition').split(' ')});
					i.start();
				}
			}
		}
	}

	// posun obrazkoveho pozadi pokud je
	if (Homepage.BaseSkin.bckImage.img != null) {
		var i = new JAK.CSSInterpolator(Homepage.BaseSkin.bckImage.img, 500, {interpolation: JAK.Interpolator.SIN});
		i.addProperty('marginTop', 0, 120, 'px');
		i.start();
	}

	var i = new JAK.CSSInterpolator(this._searchCont, 500, {interpolation: JAK.Interpolator.SIN});
	i.addProperty('marginTop', 0, 120, 'px');
	i.start();

	if (this._ec.close == null) {
		this._ec.close = JAK.Events.addListener(document, 'click', this, this._hide);
	}
}

/**
 * ukonceni animace
 */
Homepage.SkinManager.prototype._endMove = function () {
	this._moveFlag = false;
}

/**
 * schovani vyberu skinu z kliknuti na element
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.SkinManager.prototype._hide = function (e, elm) {
	JAK.Events.stopEvent(e);
	JAK.Events.cancelDef(e);
	this.showFlag = false;
	this._animateClose();
}

/**
 * schovani vyberu skinu
 */
Homepage.SkinManager.prototype.hide = function () {
	this._animateClose();
}

/**
 * samotna animace schovani
 */
Homepage.SkinManager.prototype._animateClose = function () {
	if (this._ec.close != null) {
		JAK.Events.removeListener(this._ec.close);
		this._ec.close= null;
	}
	var i = new JAK.CSSInterpolator(this._dom.cont, 500, {interpolation: JAK.Interpolator.SIN, endCallback: this._hideEnd.bind(this)});
	i.addProperty('height', 120, 0, 'px');
	i.start();

	if (JAK.Browser.client != 'ie') { // tahle podminka je jen docasna, aby to slo pustit ven, i kdyz IE jeste stavkuje
		// animovani pozadi stranky (html, body + dva elementy nad menu se styly)
		for (var x = 0; x < this.movedBackgrounds.length; x++) {
			var elm = this.movedBackgrounds[x];
			if (elm) {
				if (typeof(JAK.DOM.getStyle(this.movedBackgrounds[x], 'backgroundPositionY')) != 'undefined') {
					var i = new JAK.Interpolator(0, 120, 500, function (val) {
						this.options.elm.style.backgroundPositionY = ((isNaN(parseInt(this.options.yCoord))?0:parseInt(this.options.yCoord))-val)+'px';
					}, {interpolation: JAK.Interpolator.SIN, elm: elm, yCoord: JAK.DOM.getStyle(elm, 'backgroundPositionY')});
					i.start();
				} else {
					var i = new JAK.Interpolator(0, 120, 500, function (val) {
						this.options.elm.style.backgroundPosition = this.options.coords[0]+' '+((isNaN(parseInt(this.options.coords[1]))?0:parseInt(this.options.coords[1]))-val)+'px';
					}, {interpolation: JAK.Interpolator.SIN, elm: elm, coords: JAK.DOM.getStyle(elm, 'backgroundPosition').split(' ')});
					i.start();
				}
			}
		}
	}

	// posun obrazkoveho pozadi pokud je
	if (Homepage.BaseSkin.bckImage.img != null && parseInt(Homepage.BaseSkin.bckImage.img.style.marginTop) != 0) {
		var i = new JAK.CSSInterpolator(Homepage.BaseSkin.bckImage.img, 500, {interpolation: JAK.Interpolator.SIN});
		i.addProperty('marginTop', 120, 0, 'px');
		i.start();
	}

	var i = new JAK.CSSInterpolator(this._searchCont, 500, {interpolation: JAK.Interpolator.SIN});
	i.addProperty('marginTop', 120, 0, 'px');
	i.start();

	// pokud je z vlastniho skinu nahledovy obrazek pak ho animuji
	if (Homepage.OwnSkin.previewImg != null) {
		var i = new JAK.CSSInterpolator(Homepage.OwnSkin.previewImg, 500, {interpolation: JAK.Interpolator.SIN});
		i.addProperty('marginTop', 120, 0, 'px');
		i.start();
	}
}

/**
 * dokonceni schovani a zavolani ulozeni skinu
 */
Homepage.SkinManager.prototype._hideEnd = function () {
	this.makeEvent('closeSkinList');
	this._dom.cont.style.display = "none";
	if (Homepage.BaseSkin.activeSkin != null) {
		// musi nastat zmena skinu jinak nic neposilam
		if ((Homepage.BaseSkin.activeSkinFirst !== Homepage.BaseSkin.activeSkin) || this.synched || Homepage.OwnSkin.previewImg != null) {
			/*if (Homepage.OwnSkin.previewImg != null) {
				Homepage.BaseSkin.activeSkin.externalSaveProcess(this.synched);
			} else {*/
				Homepage.BaseSkin.activeSkin._send(this.synched);
			/*}*/
			this.synched = 0;
		}
	}
}

/**
 * kliknuti na odkaz zobraz vyber skinu
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.SkinManager.prototype._click = function (e,elm) {
	this._show(e,elm);
}

/**
 * posun skinu do leva
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.SkinManager.prototype._lmove = function (e, elm) {
	JAK.Events.stopEvent(e);
	if (!this._moveFlag) {
		this._moveLeft();
	}
}

/**
 * posun skinu do prava
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.SkinManager.prototype._rmove = function (e, elm) {
	JAK.Events.stopEvent(e);
	if (!this._moveFlag) {
		this._moveRight();
	}
}

/**
 * prepocitavani odsazeni film. pasu pri zmene sirky okna
 */
Homepage.SkinManager.prototype._resize = function () {
	var sC = this._dom.skinList;
	this.wC = sC.offsetWidth;
	var leftMargin = parseInt(this._dom.strip.style.marginLeft);
}

/**
 * samotny pohyb doprava
 */
Homepage.SkinManager.prototype._moveRight = function () {
	var s = this._dom.strip;
	this._w = s.offsetWidth;
	var sC = this._dom.skinList;
	this.wC = sC.offsetWidth;
	var delta = this._w -  this.wC;

	var delta = Math.abs(this._w - this.wC + this._shadowOffset);
	var leftMargin = parseInt(this._dom.strip.style.marginLeft);
	this._leftMovePart = delta + leftMargin;

	var move = parseInt(leftMargin) - Math.min(this._leftMovePart, this._step*this._picW);

	if (Math.abs(leftMargin) != delta) {
		this._moveFlag = true;
		var i = new JAK.CSSInterpolator(this._dom.strip, 500, {interpolation:JAK.Interpolator.SIN, endCallback: this._checkStateR.bind(this)});
		i.addProperty('marginLeft', leftMargin, move, 'px');
		i.start();
		this._setArrows(1,1);
	}
}

/**
 * samotny pohyb doleva
 */
Homepage.SkinManager.prototype._moveLeft = function () {
	var s = this._dom.strip;
	this.w = s.offsetWidth;
	var sC = this._dom.skinList;
	this.wC = sC.offsetWidth;

	var delta = Math.abs(this._w - this.wC - this._shadowOffset);
	var boxesInPort = this._picW - (this.wC % this._picW);

	var leftMargin = parseInt(this._dom.strip.style.marginLeft);
	this._leftMovePart = delta + leftMargin;
	// vypocet posunu na zaklade sirky pruhledu, delky pasu, sirky nahledu
	var move = leftMargin + ((Math.abs(leftMargin) == delta) ? this._step*this._picW + boxesInPort : Math.min(Math.abs(leftMargin-this._shadowOffset), this._step*this._picW));
	if (Math.abs(leftMargin) != this._shadowOffset) {
		this._moveFlag = true;
		var i = new JAK.CSSInterpolator(this._dom.strip, 500, {interpolation: JAK.Interpolator.SIN, endCallback: this._checkStateL.bind(this)});
		i.addProperty('marginLeft', leftMargin, (move), 'px');
		i.start();
		this._setArrows(1,1);
	}
}

/**
 * konrola omezeni pri pohybu doprava
 */
Homepage.SkinManager.prototype._checkStateR = function () {
	this._endMove();
	if (Math.abs(parseInt(this._dom.strip.style.marginLeft)) == Math.abs(this._w - this.wC + this._shadowOffset)) {
		this._setArrows(1,0);
	}
}

/**
 * konrola omezeni pri pohybu doleva
 */
Homepage.SkinManager.prototype._checkStateL = function () {
	this._endMove();
	if (parseInt(this._dom.strip.style.marginLeft) == this._shadowOffset) {
		this._setArrows(0,1);
	}
}

/**
 * nastaveni viditelnosti spipek v limitnich situacich
 */
Homepage.SkinManager.prototype._setArrows = function (left, right) {
	if (left == 1) {
		JAK.DOM.addClass(this._dom.larrow, 'active');
	} else {
		JAK.DOM.removeClass(this._dom.larrow, 'active');
	}

	if (right == 1) {
		JAK.DOM.addClass(this._dom.rarrow, 'active');
	} else {
		JAK.DOM.removeClass(this._dom.rarrow, 'active');
	}
}


