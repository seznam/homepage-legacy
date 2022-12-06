/**
 * @class
 * nastaveni ikony webmastera
 * @augments JAK.Homepage.AbstractSetting
 * @see JAK.Homepage.AbstractSetting
 * @param {object} html odkaz na HTML strukturu
 */
JAK.Homepage.Advanced.Promote = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.Advanced.Promote",
	VERSION:"1.0",
	EXTEND: JAK.Homepage.AbstractSetting
})

JAK.Homepage.Advanced.Promote.prototype.$constructor = function (html) {
	this.textHTML = null;
	this.rssName = null;
	this.rssSource = null;
	this.iconCont = null;
	this.radios = null;
	this.step3 = null;

	this.dom = {};
	this.ev = {};
	this.html = html;

	this._build();
}

/**
 * vyrobi HTML strukturu a navesi posluchace
 * @private
 */
JAK.Homepage.Advanced.Promote.prototype._build = function () {
	this.dom.html =
		'<p>Pokud na svých stránkách poskytujete obsah formou RSS, usnadněte uživatelům<br /> Seznam.cz přístup na Vaše stránky.</p>'+
		'<a href="#" id="showLinkPromote">Nabídněte svůj obsah</a>'+
		'<div id="promoteHider">'+
			'<h4>1. Vyberte si ikonu na Vaše stránky:</h4>'+
			'<div id="icons">'+
				'<div>'+
					'<input type="radio" checked="checked" value="/st/img/ico/1_ico_add_seznam_black.gif" id="icon0" name="icon"/>'+
					'<label for="icon0">'+
						'<img height="17" width="76" alt="Přidej RSS na Seznam" src="/st/img/ico/1_ico_add_seznam_black.gif"/>'+
					'</label>'+
				'</div>'+
				'<div>'+
					'<input type="radio" value="/st/img/ico/1_ico_add_seznam_black2.gif" id="icon1" name="icon"/>'+
					'<label for="icon1">'+
						'<img height="17" width="76" alt="Přidej RSS na Seznam" src="/st/img/ico/1_ico_add_seznam_black2.gif"/>'+
					'</label>'+
				'</div>'+
				'<div>'+
					'<input type="radio" value="/st/img/ico/1_ico_add_seznam_blue.gif" id="icon2" name="icon"/>'+
					'<label for="icon2">'+
						'<img height="17" width="76" alt="Přidej RSS na Seznam" src="/st/img/ico/1_ico_add_seznam_blue.gif"/>'+
					'</label>'+
				'</div>'+
				'<div>'+
					'<input type="radio" value="/st/img/ico/1_ico_add_seznam_white.gif" id="icon3" name="icon"/>'+
					'<label for="icon3">'+
						'<img height="22" width="77" alt="Přidej RSS na Seznam" src="/st/img/ico/1_ico_add_seznam_white.gif"/>'+
					'</label>'+
				'</div>'+
				'<div>'+
					'<input type="radio" value="/st/img/ico/1_ico_rss_seznam_black.gif" id="icon4" name="icon"/>'+
					'<label for="icon4">'+
						'<img height="22" width="79" alt="Přidej RSS na Seznam" src="/st/img/ico/1_ico_rss_seznam_black.gif"/>'+
					'</label>'+
				'</div>'+
				'<div>'+
					'<input type="radio" value="/st/img/ico/1_ico_rss_seznam_black2.gif" id="icon5" name="icon"/>'+
					'<label for="icon5">'+
						'<img height="22" width="77" alt="Přidej RSS na Seznam" src="/st/img/ico/1_ico_rss_seznam_black2.gif"/>'+
					'</label>'+
				'</div>'+
				'<div>'+
					'<input type="radio" value="/st/img/ico/1_ico_rss_seznam_blue.gif" id="icon6" name="icon"/>'+
					'<label for="icon6">'+
						'<img height="21" width="83" alt="Přidej RSS na Seznam" src="/st/img/ico/1_ico_rss_seznam_blue.gif"/>'+
					'</label>'+
				'</div>'+
				'<div>'+
					'<input type="radio" value="/st/img/ico/1_ico_rss_seznam_white.gif" id="icon7" name="icon"/>'+
					'<label for="icon7">'+
						'<img height="21" width="42" alt="Přidej RSS na Seznam" src="/st/img/ico/1_ico_rss_seznam_white.gif"/>'+
					'</label>'+
				'</div>'+
			'</div>'+
			'<div class="clear"></div>'+
			'<h4>2. Vložte údaje o RSS zdroji</h4>'+
			'<div id="icon-page">'+
				'<div class="row">'+
					'<label for="rsssource">URL RSS zdroje:</label>'+
					'<input type="text" value="http://" id="rsssource" name="rsssource"/>'+
				'</div>'+
				'<div class="row">'+
					'<label for="rssname">Název zdroje:</label>'+
					'<input type="text" value="" id="rssname" name="rssname"/>'+
				'</div>'+
				'<p class="button">'+
					'<input type="submit" id="generateHTML" value="Generuj HTML"/>'+
				'</p>'+
			'</div>'+
			'<div class="clear"></div>'+
			'<div id="third-step">'+
			'<h4>3. Zkopírujte si vygenerovaný kód</h4>'+
				'<div>'+
					'<textarea readonly="readonly" id="html" name="html" cols="50" rows="6"></textarea>'+
				'</div>'+
				'<div>'+
					'<h4>Umístěte ikonu na své WWW stránky.</h4>'+
					'<p> Zkopírovaný HTML kód vložte na vhodné místo do své stránky, např. do hlavičky, paticky nebo<br/> navigační lišty. </p>'+
					'<p>'+
						'<strong>Poznámka: </strong>Pokud chcete umístit obrázek ikonky na svoje WWW stránky klikněte pravým<br /> tlačítkem myši na vybranou ikonku a uložte obrázek ma svůj disk. <br/> Následně ho zkopírujte na svůj server a změnte URL obrázku ve vygenerovaném HTML kódu. </p>'+
				'</div>'+
			'</div>'+
		'</div>';

		this.html.innerHTML = this.dom.html;
		this.dom.radios = JAK.gel('icons').getElementsByTagName('input');
		this.dom.rssSource = JAK.gel('rsssource');
		this.dom.rssName = JAK.gel('rssname');
		this.dom.txthtml = JAK.gel('html');
		this.dom.step3 = JAK.gel('third-step');

		/* ukaz schovej link */
		this.dom.showLink = JAK.gel('showLinkPromote');
		this.dom.promoteHider = JAK.gel('promoteHider');
		this.allShown = false;
		JAK.Events.addListener(this.dom.showLink, 'click', this, this._showAll);

		this.dom.button = JAK.gel('generateHTML');
		JAK.Events.addListener(this.dom.button, "click", this,this._generate);
}

/**
 * zobrazuje/schovava nastaveni ikonky
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 * @private
*/
JAK.Homepage.Advanced.Promote.prototype._showAll = function (e, elm) {
	JAK.Events.cancelDef(e);
	if (this.allShown == true) {
		JAK.DOM.removeClass(this.dom.promoteHider,'show');
		JAK.DOM.removeClass(this.dom.showLink,'show');
	} else {
		JAK.DOM.addClass(this.dom.promoteHider,'show');
		JAK.DOM.addClass(this.dom.showLink,'show');
	}
	//this.dom.showLink.innerHTML = 'Zobrazit další vzhledy &raquo;' ? 'Skrýt vzhledy &raquo;' : 'Zobrazit další vzhledy &raquo;';
	this.allShown = (this.allShown ? false : true);

};

/**
 * vygeneruje html kod pro ikonku na stranky
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 */
JAK.Homepage.Advanced.Promote.prototype._generate = function (e, elm) {
	JAK.Events.cancelDef(e);

	var both = false;
	var err = false;

	var imgSrc = '';
	for(i=0;i<this.dom.radios.length;i++) {
		if(this.dom.radios[i].checked == true) {
			imgSrc = this.dom.radios[i].value;
		}
	}
	if(imgSrc == '') {
		alert("Není vybrána žádná ikonka!");
		err = true;
		return false;
	}

	if(this.dom.rssSource.value.substring(7, this.dom.rssSource.value.length) == '' && this.dom.rssName.value == '') {
		alert("Není vyplněn \"Název\" a \"URL\" RSS zdroje!");
		both = true; err = true;
	}
	if(both == false) {
		if(this.dom.rssName.value == '')  { alert("Není vyplněn \"Název\" RSS zdroje!"); err = true;};

		if(this.dom.rssSource.value == '') { alert("Není vyplněno \"URL\" RSS zdroje!"); err = true;};
	}

	if(err == false) {
		var url = 'http://www.seznam.' + _tld + '/pridej-zpravy?url='+encodeURI(this.dom.rssSource.value)+'&title='+encodeURI(this.dom.rssName.value);
		var html = '<a href="'+url+'"><img src="'+Homepage.CONF.PATH_IMG_WEB_ICO+imgSrc+'" border="0" alt="Přidej na Seznam" title="Přidej na Seznam"></a>';
		this.dom.txthtml.value = html;
		this.dom.step3.className = 'display';
	}
	return false;
}
