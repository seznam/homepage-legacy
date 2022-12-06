/**
 * @class
 * Sprava nastaveni vzhledu (skinu) a layoutu (2, 3 sloupce)
 * @augments JAK.Homepage.AbstractSetting
 * @see JAK.Homepage.AbstractSetting
 * @param {object} html odkaz na HTML strukturu
 * @param {int} activeColumn pocet sloupcu - aktualni
 * @param {int} activeSkin ID vybraneho skinu
 * @property {object} settings
 * @property {int} settings.columns pocet sloupcu na HP
 * @property {int} settings.skin ID vybraneho skinu
 * @property {int} visibleCount.pocet viditelnych skinu
 */
JAK.Homepage.LookNFeel = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.LookNFeel",
	VERSION:"1.0",
	EXTEND: JAK.Homepage.AbstractSetting
})

/**
 * pole obsahujici informace o skinech ze kterych se pak vyrabi HTML kod
 * @static
 * @type object[]
 */
JAK.Homepage.LookNFeel.SKINS = [
	{
		id : '0',
		name : Homepage.DICT.skin_0_title,
		url : 'http://www.seznam.' + _tld + '/',
		author : 'Seznam.cz, a.s.'
	},

	{
		id : '1',
		name : Homepage.DICT.skin_1_title,
		url : 'http://www.seznam.' + _tld + '/',
		author : 'Seznam.cz, a.s.'
	},

	{
		id : '2',
		name : Homepage.DICT.skin_2_title,
		url : 'http://www.seznam.' + _tld + '/',
		author : 'Seznam.cz, a.s.'
	},

	{
		id : '3',
		name : Homepage.DICT.skin_3_title,
		url : 'http://www.seznam.' + _tld + '/',
		author : 'Seznam.cz, a.s.'
	}

];

JAK.Homepage.LookNFeel.prototype.$constructor = function (html, activeColumn, activeSkin) {
	this.dom = {};
	this.ev = {};
	this.settings = {};
	this.requestCount = 2;
	this.html = JAK.gel(html);
	this.visibleCount = 6;

	this.settings.columns = this.activeColumn = activeColumn;
	this.settings.skin = this.activeSkin = activeSkin;
	// FIXME SKIN

	this._build();
}

/**
 * @see JAK.Homepage.InterfaceSettings#submit
 */
JAK.Homepage.LookNFeel.prototype.submit = function (_submitCallBack) {
	this._submitCallBack = _submitCallBack;
	// odesle data rq
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_response');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsSetupOtherProcess', 'hashId=' + Homepage.CONF.HASHID + '&columns=' + this.settings.columns);

	var cols = JAK.Homepage.Settings.feedsToString();
	if (cols != '') {
		var rq2 = new JAK.Request(JAK.Request.TEXT, {method:"post"});
		rq2.setCallback(this, '_response');
		//nahodim loader
		JAK.loader.show();
		rq2.send('/jsFeedMove', 'hashId=' + Homepage.CONF.HASHID + '&columns=' + cols);
	}

	/*var externalCSSURL = this.dom.externalCSSInput ? this.dom.externalCSSInput.value : '';
	if (externalCSSURL != '') {
		var rq3 = new JAK.Request(JAK.Request.TEXT, {method:"post"});
		rq3.setCallback(this, '_response');
		//nahodim loader
		JAK.loader.show();
		rq3.send('/jsSetupSkinProcess', 'hashId=' + Homepage.CONF.HASHID + '&externalSkin=' + encodeURIComponent(externalCSSURL))
	} else {
		var rq4 = new JAK.Request(JAK.Request.TEXT, {method:"post"});
		rq4.setCallback(this, '_response');
		//nahodim loader
		JAK.loader.show();
		rq4.send('/jsSetupSkinProcess', 'hashId=' + Homepage.CONF.HASHID + '&skin=' + this.settings.skin);
	}*/
}

/**
 * @see JAK.Homepage.InterfaceSettings#submit
 * @private
 */
JAK.Homepage.LookNFeel.prototype._createHTML = function () {
	this._createHTMLLayout();
	//this._createHTMLSkin();
};

/**
 * vyrobi html kod pro nastaveni layoutu
 * @private
 */
JAK.Homepage.LookNFeel.prototype._createHTMLLayout = function () {
	this.dom.html =
		'<div class="section-title">'+
			'<h2>'+
				'Rozvržení stránky:'+
			'</h2>'+
			/*'<p>'+
				'Vyberte si svůj osobitý vzhled Seznamu, stačí kliknout na náhled!'+
				'<br /><a id="video-looknfeel" class="video-link" href="#">Video návod</a>'+
			'</p>'+*/
			'<p>'+
				'Upravte si rozložení Seznamu podle vašich představ.'+
			'</p>'+
		'</div>'+
		'<div class="section-cnt">'+
			'<a name="rozvrzeni"></a>'+
			'<h3>Rozvržení stránky</h3>'+
			'<div id="layout-2" class="l-item">'+
				'<img src="' + Homepage.CONF.PATH_IMG + '/layout-2.gif" width="150" height="75" alt="" id="img-layout-2" />'+
				'<div class="selected"></div>'+
				'<h4>2 sloupce</h4>'+
			'</div>'+
			'<div id="layout-3" class="l-item">'+
				'<img src="' + Homepage.CONF.PATH_IMG + '/layout-3.gif" width="150" height="75" alt="" id="img-layout-3" />'+
				'<div class="selected"></div>'+
				'<h4>3 sloupce</h4>'+
			'</div>'+
			'<div class="clear"></div>'+
			/*'<a name="vzhled"></a>'+
			'<h3>Vzhledy</h3>'+*/
		'</div>'+
		'<div class="clear"></div>';

	this.html.innerHTML = this.dom.html;
	this.dom.layout2 = JAK.gel('layout-2');
	this.dom.layout3 = JAK.gel('layout-3');

	this.ev.layout2Click = JAK.Events.addListener(this.dom.layout2, 'click', this, this._saveSettingsLayout);
	this.ev.layout2Click = JAK.Events.addListener(this.dom.layout3, 'click', this, this._saveSettingsLayout);

	/* nastavi aktivni layout */
	this._setActiveLayout();
};


/**
 * ukazuje video napovedu
 * @private
 */
JAK.Homepage.LookNFeel.prototype._showVideo = function (e, elm) {
	JAK.Events.cancelDef(e);
	if (this.w.container.style.display == 'none') {
		var pos = JAK.DOM.getBoxPosition(elm);
		this.w.container.style.top = (pos.top-80)+'px';
		this.w.container.style.left = (pos.left+elm.offsetWidth+5)+'px';
		this.w.show();
	} else {
		this.w.hide();
	}
}


/**
 * vyrobi html kod pro nastaveni skinu
 * @private
 */
JAK.Homepage.LookNFeel.prototype._createHTMLSkin = function () {
	this.dom.cont = JAK.cel('div');
	this.dom.cont.className = 'section-cnt';
	this.html.appendChild(this.dom.cont)

	this.dom.skins = {};

	// vyrobim itemy
	for (var i = 0; i < JAK.Homepage.LookNFeel.SKINS.length; i++) {
		var id = JAK.Homepage.LookNFeel.SKINS[i].id;
		var item = this._createItem(JAK.Homepage.LookNFeel.SKINS[i], i);

		if (this.settings.skin == id) {
			this.dom.cont.insertBefore(item, this.dom.cont.firstChild);
		}
		else {
			this.dom.cont.appendChild(item);
		}

		// ulozime do zasobniku
		this.dom.skins['item-' + id] = item;

		// aktualni dostane podbarveni
		if (Homepage.EXTERNALSKIN == '' && this.activeSkin == id) {
			this._setActiveSkin(id);
		}
	}

	// cistic
	this.dom.clear = JAK.cel('div', 'clear');
	this.dom.cont.appendChild(this.dom.clear);

	/*this.dom.externalCont = JAK.cEl('div','externalCSS');
	this.dom.externalCont.innerHTML =
		'<h3>Externí CSS</h3>' +
		'<p>Do tohoto políčka zadejte odkaz na svůj CSS soubor ve formátu <em>http://xxx.xx/.../xx/xxx.css</em>.<br />Pozor: tato funkce je určena pouze pro webmastery a designery,<br> kteří chtějí otestovat vlastní skin pro Seznam Homepage.'+
		*/
	this.dom.showLink = JAK.cel('a', null, 'showLink');
	this.dom.showLink.innerHTML = 'Zobrazit další vzhledy &raquo;';
	this.dom.showLink.href="#";

	this.dom.cont.appendChild(this.dom.showLink);


	/*this.dom.cont.appendChild(this.dom.externalCont);
	this.dom.externalCSSInput = JAK.gel('externalSkin');*/

	this.allShown = false;
	JAK.Events.addListener(this.dom.showLink, 'click', this, this._showAll);

}

/**
 * vyrobi html kod pro jeden skin
 * @private
 * @param {object} skin objekt z pole <b>JAK.Homepage.LookNFeel.SKINS</b>
 * @ returns {object} item HTML reprezentace jednoho skinu
 */
JAK.Homepage.LookNFeel.prototype._createItem = function (skin, i) {
	var item = JAK.cel('div',null, 'skin-'+skin.id);
	var html =
		'<img class="skin-img" id="skin-img-' + skin.id +'" src="' + Homepage.CONF.PATH_IMG + '/settings/skin-' + skin.id + '.gif" width="150" height="75" alt="" />'+
		'<p>'+
			' <strong class="skin-name">' + skin.name + '</strong>' +
			' <a class="author" href="' + skin.url + '" target="_blank">' + skin.author + '</a>'+
		'</p>';
	item.innerHTML = html;
	JAK.DOM.addClass(item,'l-item');

	if (i+1 > this.visibleCount) {
		JAK.DOM.addClass(item, 'hide');
	}

	JAK.Events.addListener(item, 'click', this, this._saveSettingsSkin);
	JAK.Events.addListener(JAK.DOM.getElementsByClass('author', item, 'a')[0], 'click', JAK.Events.stopEvent);

	return item;
}

/**
 * zobrazuje/schovava vsechny skiny
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
*/
JAK.Homepage.LookNFeel.prototype._showAll = function (e, elm) {
	JAK.Events.cancelDef(e);

	for (var i = 0; i < JAK.Homepage.LookNFeel.SKINS.length; i++) {
		var item = this.dom.skins['item-' + JAK.Homepage.LookNFeel.SKINS[i].id];
		if (this.allShown == false) {
			JAK.DOM.removeClass(item,'hide');
		} else if(i+1 > this.visibleCount) {
			JAK.DOM.addClass(item,'hide');
		}
	}
	this.dom.showLink.innerHTML = !this.allShown ? 'Skrýt vzhledy &raquo;' : 'Zobrazit další vzhledy &raquo;';
	this.allShown = (this.allShown ? false : true);

};

/**
 * nastavi vzhled vybraneho layoutu pomoci CSS
 * @private
 */
JAK.Homepage.LookNFeel.prototype._setActiveLayout = function () {
	if (this.activeColumn == 2) {
		JAK.DOM.addClass(this.dom.layout2, 'active');
		JAK.DOM.removeClass(this.dom.layout3, 'active');
	} else {
		JAK.DOM.addClass(this.dom.layout3, 'active');
		JAK.DOM.removeClass(this.dom.layout2, 'active');
	}

	// vysle signal o zmene
	this._change();
}

/**
 * nastavi vzhled vybraneho skinu pomoci CSS
 * @param {int} newItem ID noveho skinu (prave vybraneho)
 * @param {int} oldItem ID stareho skinu
 * @private
 */
JAK.Homepage.LookNFeel.prototype._setActiveSkin = function (newItem, oldItem) {
	if(this.dom.externalCSSInput) {
		this.dom.externalCSSInput.value = '';
	}

	if (oldItem) {
		JAK.DOM.removeClass(this.dom.skins['item-' + oldItem], 'active');
	}

	JAK.DOM.addClass(this.dom.skins['item-' + newItem], 'active');
	// vysle signal o zmene
	this._change();
}

/*
 * ulozi do setting objektu aktualne vybrane rozlozeni
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 * @private
 */
JAK.Homepage.LookNFeel.prototype._saveSettingsSkin = function (e, elm) {
	var old = this.activeSkin;
	// ulozeni vybraneho layoutu
	this.settings.skin = this.activeSkin = elm.id.split('-')[1];

	// nasteni grafiky aktivniho
	this._setActiveSkin(this.activeSkin, old);
}

/*
 * ulozi do setting objektu aktualne vybrany pocet sloupecku
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 * @private
 */
JAK.Homepage.LookNFeel.prototype._saveSettingsLayout = function (e, elm) {
	// 	 vybraneho layoutu
	this.settings.columns = this.activeColumn = elm.id.split('-')[1];

	// staticka metoda ze Settings upravi pole feedu
	JAK.Homepage.Settings.feedsRemoveColumn(this.activeColumn);
	// nasteni grafiky aktivniho
	this._setActiveLayout();

	// nastaveni zobrazeni reklamy/skryti
	var commercialGadget = JAK.gel("feed-94888");

	if (commercialGadget)
	{
		if (elm.id.split('-')[1] != 2)
		{
			JAK.DOM.addClass(commercialGadget,"hiddenElement");
		}
		else
		{
			JAK.DOM.removeClass(commercialGadget,"hiddenElement");
		}
	}
	
}
