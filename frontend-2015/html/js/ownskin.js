/**
 * @class
 * trida repr. vlastni skin - ten ktery je nahran od uzivatele; definuje nahravani obrazku pres AJAX
 * @augments Homepage.BaseSkin
 * @property {int} sync 0/1 ne/synchronizovat s neprihlasenym userem prihlaseneho
 * @property {object} owner odkaz na instanci Skin Managera
 * @property {string} name jmeno skinu
 * @property {int} type prepinani typu 0/1 normal/tematicky
 * @property {int} id id skinu
 * @property {int} selected 0/1 zda ma uzivatel dany skin vybran
 * @property {string} imgSrc url na nahledovy obrazek nebo url na css
 * @property {string} imgBig url na velky obrazek nebo url na css
 * @property {string} defImg url pro defaultni obrazek
 * @property {string} border 0/1 border kolem hledaciho okna
 * @property {string} opacity 0/1 pruhledny formular a gadgety
 */
Homepage.OwnSkin = JAK.ClassMaker.makeClass({
	NAME:"Homepage.OwnSkin",
	VERSION:"1.0",
	EXTEND: Homepage.BaseSkin
})

Homepage.OwnSkin.previewImg = null;

Homepage.OwnSkin.prototype.$constructor = function (sync, owner, name, type, id, selected, imgSrc, imgBig, defImg, border, opacity) {
	this._dom = {};
	this._ec = {};

	this.unSupportedBrowsers = ['opera', 'safari'];

	this._owner = owner;

	this._selected = selected;
	if (this._selected == 1) {
		Homepage.BaseSkin.activeSkin = this;
		Homepage.BaseSkin.activeSkinFirst = this;
	}

	this._imgSrc = imgSrc != '' ? imgSrc : null;
	this._imgBig = imgBig != ''? imgBig : null;
	this._defImg = defImg != '' ? defImg : null;
	this._name = name;
	this._type = type;
	this.id = id;
	this._saveFlag = true; // priznak rikajici kdy se v sendu zavola save

	this._border = border;
	this._sync = sync;
	this._opacity = opacity;
	this._opacityDefault = opacity;

	this._dom.parentCont = JAK.gel('skins');
	this._dom.scont = JAK.gel('scont');
	this._dom.bckImagePreview = null;//Homepage.BaseSkin.bckImage;
	this._dom.bckImagePreviewSmall = null;//Homepage.BaseSkin.bckImage;

	this._url = null;

	this._skinType = 'img';
	this._onLoadSetSkin = false;
	this._init();

	this._elemsToChange = {};

	// pomocna promena pro ulozeni std fce _send
	this._sendTMP = this._send;

}

/**
 * nahozeni vlastniho skinu
 */
Homepage.OwnSkin.prototype._init = function () {
	this._dom.cont = JAK.mel('div', {className: 'skin'});
	this._dom.a = JAK.mel('a', {href:'#', title: this._name});
	this._dom.img = JAK.mel('img', {src: this._defImg, width:'99', height:'100', alt:''});

	if (this._imgBig != null) {
		this._dom.bckImagePreviewSmall = JAK.mel('img', {alt:'', src:this._imgSrc}, {zIndex:'0', width:'60px', height:'40px', position: 'absolute', top: '13px', left:'20px'});
		this._dom.a.appendChild(this._dom.bckImagePreviewSmall);
	}

	this._dom.activeMark = JAK.mel('div', {className: 'active'});

	JAK.DOM.append([this._dom.cont, this._dom.a], [this._dom.a, this._dom.img]);

	this._ec.clik = JAK.Events.addListener(this._dom.a, "click", this, this._clickAction);

	// posluchac zavreni listu se skiny
	this.addListener('closeSkinList', this._setDefault.bind(this));

	if (this._selected == 1) {
		this._onLoadSetSkin = true;
		JAK.DOM.append([this._dom.cont, this._dom.activeMark]);
		JAK.Events.onDomReady(this, this._switchSkin);
	}

	this._dom.name = JAK.mel('div', {className: 'skinName'});
	this._dom.name.innerHTML = this._name;
	this._dom.cont.appendChild(this._dom.name);

	if (this._opacity && this._selected) {
		this._setOpacity(this._opacity);
	}

	this._buildForm();
}

/**
 * prepinani opacity - naveseno na checkboxu
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.OwnSkin.prototype._switchOpacity = function (e, elm) {
	this._setOpacity(elm.checked);
}

/**
 * pretizena metoda z Homepage.BaseSkin - bez ni to pry nefacha
 */
Homepage.OwnSkin.prototype._switchSkin = function () {
	this.$super();
}

/**
 * vyrobi html nahravaciho formulare a navesi udalosti
 */
Homepage.OwnSkin.prototype._buildForm = function () {
	document.domain = Homepage.CONF.DOMAIN; // data se budou posilat na subdomenu, je potreba ji povolit
	this._dom.form = {};
	this._dom.form.formCont = JAK.mel('div', {id:'formCont'});
	this._dom.form.form = JAK.mel('form', {action: Homepage.CONF.UPLOADURLIFRAME, method:'post', id: 'upload', target:'uploadIframe', enctype:'multipart/form-data', encoding:'multipart/form-data'});
	this._dom.form.form.innerHTML =
		'<h3>Vlastní obrázek</h3>'+
		'<div class="row">'+
			'<input type="file" name="skinImage" id="file" size="60" />'+
			'<div class="error" id="skin-error" style="display:none;">Došlo k chybě při zpracování.</div>'+
		'</div>'+
		'<div class="row">'+
			'<input type="hidden" name="hashId" value="' + Homepage.CONF.HASHID + '"/>'+
			'<input type="checkbox" id="opacity" name="opacity" ' + (this._opacity ? 'checked="checked"' : '') + ' />'+
			'<label for="opacity">Průhledné pozadí obsahu</label>'+
			'<input type="submit" name="sub" value="Uložit" />'+
			'<a href="#" id="nochange">&laquo; Zpět a neukládat</a>'+
			'<div class="clear"></div>'+
		'</div>';

	this._dom.parentCont.insertBefore(this._dom.form.formCont, this._dom.parentCont.firstChild);

	JAK.DOM.append([this._dom.form.formCont, this._dom.form.form]);

	this._dom.back = JAK.gel('nochange');
	this._dom.file = JAK.gel('file');
	this._dom.opacity = JAK.gel('opacity');
	this._ec.back = JAK.Events.addListener(this._dom.back, 'click', this, this._back);
	this._ec.file = JAK.Events.addListener(this._dom.file, 'change', this, this._detect);
	this._ec.opa = JAK.Events.addListener(this._dom.opacity, 'click', this, this._switchOpacity);

	this._dom.error = JAK.gel("skin-error");
	// dle podporovane funkcionality nahravani obrazku navesime spravnou metodu pro nahrani
	if (this._dom.file.files && this.unSupportedBrowsers.indexOf(JAK.Browser.client) == -1) {
		this._ec.upl = JAK.Events.addListener(this._dom.form.form, 'submit', this, this._uploadFileByAJAX);
	} else {
		this._ec.upl = JAK.Events.addListener(this._dom.form.form, 'submit', this, this._saveCustomSkinSubmit);
	}
}

/**
 * volano ze Skin managera - pri ukladani skinu
 */
Homepage.OwnSkin.prototype.externalSaveProcess = function () {
	if (Homepage.OwnSkin.previewImg != null) {
		if (this._dom.file.files && this.unSupportedBrowsers.indexOf(JAK.Browser.client) == -1) {
			this._uploadFileByAJAX();
		} else {
			this._saveCustomSkinSubmit();
		}
	}
}

/**
 * zobrazeni chyby pokud nahravany obrazek prekroci limity
 */
Homepage.OwnSkin.prototype._showError = function (txt) {
	this._dom.error.style.display = 'block';
	this._dom.error.innerHTML = txt;
}

/**
 * schovani chyby
 */
Homepage.OwnSkin.prototype._hideError = function () {
	this._dom.error.style.display = 'none';
}

/**
 * klinuti na nahled skinu
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.OwnSkin.prototype._clickAction = function (e, elm) {
	// skin neni vybrany a neni ani nahran obrazek
	if (this._imgBig != null && this._selected == 0) {
		this._click(e, elm);
		this._send = this._sendTMP;
		this._setOpacity(this._opacityDefault);
	// je nahran obrazek a skin nebyl vybran
	} else if (this._selected == 0) {
		this._showForm();
		this._send = this.externalSaveProcess;
	// skin je vybrany - zobrazime nahravaci form
	} else {
		this._showForm();
		this._send = this.externalSaveProcess;
	}
}

/**
 * zobrazeni nahravaciho formu - animace
 */
Homepage.OwnSkin.prototype._showForm = function () {
	var i = new JAK.CSSInterpolator(this._dom.form.formCont, 500, {interpolation:JAK.Interpolator.SIN});
	i.addProperty('marginTop', -7, 1.85, 'em');
	i.start();
}

/**
 * nastavi vse do puvodniho stavu pred nahranim obrazku
 */
Homepage.OwnSkin.prototype._setDefault = function () {
	//this._dom.form.formCont.style.marginTop = '-7em';
	var i = new JAK.CSSInterpolator(this._dom.form.formCont, 500, {interpolation:JAK.Interpolator.SIN});
	i.addProperty('marginTop', 1.85, -7, 'em');
	i.start();

	// smazu nahled pokud je
	if (this._dom.bckImagePreview != null) {
		if (this._ec.hideTimerOnload != null) {
			JAK.Events.removeListener(this._ec.hideTimerOnload);
			this._ec.hideTimerOnload = null;
		}
		this._dom.bckImagePreview.parentNode.removeChild(this._dom.bckImagePreview);
		this._dom.bckImagePreview = null;
		this._dom.bckImagePreviewSmall.src = this._imgSrc;
	}

	if (Homepage.BaseSkin.bckImage.img != null) {
		Homepage.BaseSkin.bckImage.img.style.display = 'inline';
	}

	if (Homepage.BaseSkin.activeSkin === this) {
		this._setOpacity(this._opacityDefault);
	}

	/* nahradime v searchi spravne rozky */
	/*if (!Homepage.BaseSkin.activeSkin._border) {
		JAK.DOM.removeClass(Homepage.BaseSkin.activeSkin._elemsToChange.searchCnt, 'std');
	} else {
		JAK.DOM.addClass(Homepage.BaseSkin.activeSkin._elemsToChange.searchCnt, 'std');
	}*/

	this._hideError();
}

/**
 * klinuti na odkaz zpet
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.OwnSkin.prototype._back = function (e,elm) {
	JAK.Events.cancelDef(e);
	this._setDefault();
}

/**
 * detekce spravne uploadovaci metody pri udalosti onchange inputu file
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.OwnSkin.prototype._detect = function (e, elm) {
	this._hideError();
	if (this._dom.file.files && this.unSupportedBrowsers.indexOf(JAK.Browser.client) == -1) {
		this._getFile();
	} else {
		this._createIframe();
		this._uploadFileByForm();
	}
}

/**
 * pres File API ziskame data pro zobrazeni obrazku
 */
Homepage.OwnSkin.prototype._getFile = function () {
	var f = this._dom.file.files[0];

	// velikost musi byt mensi nez 10MB
	if (f.size > 12328960) {
		this._showError('Obrázek obrazek je příliš velký. Maximální datová velikost je 10MB.');
		return 1;
	}
	// dekekujeme typ souboru
	if (f.type.match(/image.*/)) {
		this._createPreview(f);
	} else {
		this._showError('Obrázek je ve špatném formátu. Povolené formáty obrázku jsou gif, jpg, png.');
		return 1;
	};
}

/**
 * vyrobime preview pozadi
 * @property {object} f reference na soubor
 */
Homepage.OwnSkin.prototype._createPreview = function (f) {
	// musim zmenit grafiku u hledaciho okna
	this._elemsToChange.searchTail = JAK.gel('tail');
	this._elemsToChange.searchCnt = JAK.gel('search-cnt');
	JAK.DOM.removeClass(this._elemsToChange.searchCnt, 'std');

	if (Homepage.BaseSkin.bckImage.img != null) {
		Homepage.BaseSkin.bckImage.img.style.display = 'none';
	}

	if (this._dom.bckImagePreview == null) {
		this._dom.bckImagePreview = JAK.mel('img', {alt:'', id:'bckimg'}, {zIndex:'-1', width:'100%', position: 'fixed', top: '0', left:'0'});
		this._dom.bckImagePreview.style.marginTop = '120px';
		document.body.insertBefore(this._dom.bckImagePreview,document.body.firstChild);

		if (this._dom.bckImagePreviewSmall == null) {
			this._dom.bckImagePreviewSmall = JAK.mel('img', {alt:''}, {zIndex:'0', width:'60px', height:'40px', position: 'absolute', top: '12px', left:'20px'});
			this._dom.a.appendChild(this._dom.bckImagePreviewSmall);
		}
	}
	JAK.loader.show(true);
	this._ec.hideTimerOnload = JAK.Events.addListener(this._dom.bckImagePreview, 'load', JAK.loader.hideTimer);
	if (typeof f == 'string') {
		this._dom.bckImagePreview.src = f;
		this._dom.bckImagePreviewSmall.src = arguments[1];
	} else if (typeof window.URL != 'undefined') {
		this._url = window.URL.createObjectURL(f);
		this._dom.bckImagePreview.src = this._url;
		this._dom.bckImagePreviewSmall.src = this._url;
	} else if (typeof window.FileReader != 'undefined') {
		var reader = new FileReader();
		//JAK.Events.addListener(reader, 'load', this, this._readerload);
		reader.onload = this._readerload.bind(this); // Chrome
		reader.readAsDataURL(f);
	}
	Homepage.OwnSkin.previewImg = this._dom.bckImagePreview;
}

/**
 * callback metoda volana FileReaderem po uspesnem nahrani obrazku
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.OwnSkin.prototype._readerload = function (e, elm) {
	this._url = e.target.result;
	this._dom.bckImagePreview.src = this._url;
	this._dom.bckImagePreviewSmall.src = this._url;
}

/**
 * vyrobi iframe pro submit formu a odeslani obrazku klasickou cestou
 */
Homepage.OwnSkin.prototype._createIframe = function () {
	this._dom.iframe = JAK.mel('iframe', {name: 'uploadIframe'}, {width:'1px', height:'1px', visibility:'hidden'});
	document.body.appendChild(this._dom.iframe);
}

/**
 * submitnuti formulare klasickou cestou a zobrazeni loaderu
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.OwnSkin.prototype._uploadFileByForm = function (e, elm) {
	JAK.loader.show(true);
	this._dom.form.form.submit();
}

/**
 * "submitnuti" formulare a odeslani obrazku pres XHR na server
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.OwnSkin.prototype._uploadFileByAJAX = function (e, elm) {
	if (e) {
		JAK.Events.cancelDef(e);
	}
	var f = this._dom.file.files[0];
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_processUploadAndSave');
	JAK.loader.show(true);
	rq.send(Homepage.CONF.UPLOADURLAJAX, f);
}

/**
 * zpracovani odpovedi ze serveru a zobrazeni chyb nebo ulozeni noveho pozadi
 * @property {object} data AJAX odpoved ze serveu
 */
Homepage.OwnSkin.prototype._processUpload = function (data) {
	// tady ulozim obrazky
	var data = typeof data == 'object' ? data : JSON.parse(data);

	if (data.status == 200) {
		if (this._url != null) {
			this._imgSrcTmp = this._url;
			this._imgBigTmp = this._url;
			this._dataTMP = data;
			//this._imgSrc = this._url;
			//this._imgBig = this._url;
		} else {
			this._imgSrcTmp = data.picture;
			this._imgBigTmp = data.picture;
			//this._imgSrc = data.thumb;
			//this._imgBig = data.picture;
		}
		JAK.loader.quickHide();
		return 0;
	} else {
		JAK.loader.quickHide();
		switch(data.status) {
		case '400':;
		case '500': this._showError('Došlo k chybě při nahrávání obrázku.'); break;
		case '415': this._showError('Obrázek je ve špatném formátu. Povolené formáty obrázku jsou gif, jpg, png.') ;break;
		case '413':	this._showError('Obrázek je příliš velký. Maximální datová velikost je 10MB.'); break;
		}
		return 1;
	}
}

/**
 * zpracovani odpovedi ze serveru (primo HTTP status) a zobrazeni chyb nebo ulozeni noveho pozadi (NGINX)
 * @property {object} data AJAX odpoved ze serveu
 */
Homepage.OwnSkin.prototype._processUploadAndSave = function (data) {
	if (arguments[1] == 500) {
		this._showError('Při zpracování neočekávané chybě. Zkuste, prosím, Váš požadavek opakovat.');
	    JAK.loader.quickHide();
		return 1;
	}
	var exitCode = this._processUpload(data);
	if (exitCode == 0) {
		this._saveCustomSkin();
	}
}

/**
 * ulozeni a zobrazeni nahledu non AJAX verze
 * @property {object} data AJAX odpoved ze serveu
 */
Homepage.OwnSkin.prototype.processUploadAndCreatePrew = function (data) {
	this._processUpload(data);
	this._createPreview(this._imgBigTmp, this._imgSrcTmp);
}

/**
 * ulozeni skinu
 */
Homepage.OwnSkin.prototype._saveCustomSkin = function () {
	this._save(false);
}

/**
 * pri submitu formu a pri external save process ukladame
 * @property {object} e udalost
 * @property {object} elm zdrojovy element
 */
Homepage.OwnSkin.prototype._saveCustomSkinSubmit = function (e, elm) {
	if (e) {
		JAK.Events.cancelDef(e);
	}
	this._save(false);
}

/**
 * pri submitu formu a pri external save process ukladame
 * @property {boolean} onlySwitch ridi ulozeni nebo jen prepnuti vzhledu
 */
Homepage.OwnSkin.prototype._save = function (onlySwitch) {
	/*if (this._url != null) {
		this._imgSrc = this._url;
		this._imgBig = this._url;
	} else {*/
		this._imgSrc = this._imgSrcTmp ? this._imgSrcTmp : this._imgSrc;
		this._imgBig = this._imgBigTmp ? this._imgBigTmp : this._imgBig;
	/*}*/

	Homepage.OwnSkin.previewImg = null;
	var p = onlySwitch ? this._imgBig : this._imgBigTmp;
	p = this._dataTMP ? this._dataTMP.picture : p;

	p = p ? p : this._imgBig;
	var o = this._dom.opacity.checked ? 1: 0;
	this._opacityDefault = o;
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_processSave');
	JAK.loader.show(true);
	if (onlySwitch && !this._sync) {
		rq.send('/jsSkinSetCustom', 'hashId=' + Homepage.CONF.HASHID);
	} else if (this._sync == 1) {
		rq.send('/jsSkinSetSynched', 'hashId=' + Homepage.CONF.HASHID);
	} else {
		rq.send('/jsSkinSetUploaded','hashId=' + Homepage.CONF.HASHID + '&path=' + p + '&opacity=' + o);
	}
	this._owner.setActiveSkinPos(this);
	this._sync = 0;
}

/**
 * po nastaveni skinu na serveru provedeme schovani seznamu skinu
 */
Homepage.OwnSkin.prototype._processSave = function () {
	//zavreme nastaveni
	this._setSelectedMark();
	this._imageSkinActivate();
	if (this._owner.showFlag) {
		this._owner.hide();
	}

	this._saveFlag = false;
	JAK.loader.quickHide();
}

/**
 * po nastaveni skinu na serveru provedeme schovani seznamu skinu
 * @property {int} synched synchronizace s neprihlasenym uzivatelem
 */
Homepage.OwnSkin.prototype._send = function (synched) {
	this._sync = 0 || synched;
	Homepage.BaseSkin.activeSkinFirst = this;
	this._save(true);
	this._saveFlag = true;
}

/**
 * aktivace (zobrazeni) vlastniho skinu
 */
Homepage.OwnSkin.prototype._imageSkinActivate = function () {
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
		Homepage.BaseSkin.bckImage.img = JAK.mel('img', {alt:'', id:'bckimg'}, {zIndex:'-1', position: 'fixed', top: '0', left:'0'});
		if (!this._onLoadSetSkin) {
			Homepage.BaseSkin.bckImage.img.style.marginTop = '120px';
		}
		//this._onLoadSetSkin = true;
		Homepage.BaseSkin.bckImage.img.style.visibility = 'hidden';
		if (this._ec.imgOnload == null) {
			this._ec.imgOnload = JAK.Events.addListener(Homepage.BaseSkin.bckImage.img, 'load', this, this._onloadImgProcess);
		}
		Homepage.BaseSkin.bckImage.img.src = this._imgBig;
		if (JAK.Browser.client == 'ie') {
			Homepage.BaseSkin.bckImage.img.removeAttribute('width');
			Homepage.BaseSkin.bckImage.img.removeAttribute('height');
		}
		document.body.insertBefore(Homepage.BaseSkin.bckImage.img,document.body.firstChild);
	} else {
		Homepage.BaseSkin.bckImage.img.style.visibility = 'hidden';
		if (this._ec.imgOnload == null) {
			this._ec.imgOnload = JAK.Events.addListener(Homepage.BaseSkin.bckImage.img, 'load', this, this._onloadImgProcess);
		}
		Homepage.BaseSkin.bckImage.img.src = this._imgBig;
	}

	this._onLoadSetSkin = false; //kdyz se obrazek nastavi - tak uz to neni shlednuti po nacteni

}

Homepage.OwnSkin.prototype._onloadImgProcess = function () {
	Homepage.BaseSkin.bckImage.img.style.visibility = 'visible';
	/*if (!this._saveFlag) {
		Homepage.BaseSkin.bckImage.img.style.marginTop = '120px';
	}*/
	JAK.loader.hideTimer();
	if (this._ec.imgOnload != null) {
		JAK.Events.removeListener(this._ec.imgOnload);
		this._ec.imgOnload = null;
	}

	if (Homepage.BaseSkin.bckImage.resizer == null) {
		Homepage.BaseSkin.bckImage.resizer = new Homepage.BackgroundResizer(Homepage.BaseSkin.bckImage.img);
	} else {
		Homepage.BaseSkin.bckImage.resizer.start();
	}
}

