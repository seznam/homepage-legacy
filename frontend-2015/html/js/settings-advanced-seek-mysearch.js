/**
 * @class
 * trida majici na starost moje hledani
 * @param {} html odkaz na HTML strukturu
 * @param {object} parent odkaz na rodicovskou tridu
 */
JAK.Homepage.Advanced.Seek.MySearch = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.Advanced.Seek.MySearch",
	VERSION:"1.0"
});

JAK.Homepage.Advanced.Seek.MySearch.prototype.$constructor = function (html, parent) {
	this.dom = {};
	this.ev = {};
	this.html = html;
	this.parent = parent;

	this._build();
}

/**
 * vyrobi HTML strukturu
 * @private
 */
JAK.Homepage.Advanced.Seek.MySearch.prototype._build = function () {
	this.dom.cnt = JAK.cel('div', null, 'myformseek');
	var html =
		'<a href="#" id="showMySearch">Přidat vlastní hledání</a>'+
		'<form id="add-form">'+
			'<label for="seek-title" class="blind">1. Název služby</label> '+
			'<input id="seek-title" type="text" name="title" value="Název služby" class="gray" />'+
			'<label for="seek-encoding" class="blind">2. Kódování</label> '+
			'<select id="seek-encoding" name="encoding" value="" class="gray" />'+
				'<option value="utf-8">Nastavit kódování </option>'+
				'<option value="utf-8">utf-8</option>'+
				'<option value="cp1250">windows-1250</option>'+
				'<option value="iso-8859-2">iso-8859-2</option>'+
			'</select> '+
			'<label for="seek-url" class="blind">3. URL hledání</label> '+
			'<input id="seek-url" type="text" name="url" value="Vložit URL hledání" class="gray" /> '+
			'<input type="submit" id="add-seek-button" value="Přidat hledání" />'+
		'</form>';

	this.dom.cnt.innerHTML = html;
	this.html.appendChild(this.dom.cnt);

	this.dom.showMySearch = JAK.gel('showMySearch');
	this.dom.addForm = JAK.gel('add-form');
	var title = this.dom.title = JAK.gel('seek-title');
	var encoding = this.dom.encoding = JAK.gel('seek-encoding');
	var url = this.dom.url = JAK.gel('seek-url');
	var button = JAK.gel('add-seek-button');

	/* ukaz/schovej odkaz */
	this.allShown = false;
	JAK.Events.addListener(this.dom.showMySearch, 'click', this, '_showAll', false, true);

	JAK.Events.addListener(title, 'focus', this, '_chngLabel', false, true);
	JAK.Events.addListener(title, 'blur', this, '_chngLabelBye', false, true);

	JAK.Events.addListener(encoding, 'focus', this, '_chngLabel', false, true);
	JAK.Events.addListener(encoding, 'blur', this, '_chngLabelBye', false, true);

	JAK.Events.addListener(url, 'focus', this, '_chngLabel', false, true);
	JAK.Events.addListener(url, 'blur', this, '_chngLabelBye', false, true);
	JAK.Events.addListener(this.dom.addForm, 'submit', this, '_sendSeek', false, true);

}

/**
 * zobrazuje/schovava pridani hledani
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 * @private
*/
JAK.Homepage.Advanced.Seek.MySearch.prototype._showAll = function (e, elm) {
	JAK.Events.cancelDef(e);
	if (this.allShown == true) {
		JAK.DOM.removeClass(this.dom.addForm, 'show');
		JAK.DOM.removeClass(this.dom.showMySearch, 'show');
	} else {
		JAK.DOM.addClass(this.dom.addForm, 'show');
		JAK.DOM.addClass(this.dom.showMySearch, 'show');
	}
	//this.dom.showLink.innerHTML = 'Zobrazit další vzhledy &raquo;' ? 'Skrýt vzhledy &raquo;' : 'Zobrazit další vzhledy &raquo;';
	this.allShown = (this.allShown ? false : true);

};

/**
 * odesila data na server po kliknuti na cudlik Pridat hledani
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 */
JAK.Homepage.Advanced.Seek.MySearch.prototype._sendSeek = function (e, elm) {
	JAK.Events.cancelDef(e);
	var title = this.dom.title;
	var encoding = this.dom.encoding;
	var url = this.dom.url;

	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsSearchAdd', 'hashId=' + Homepage.CONF.HASHID + '&title=' + title.value + '&encoding=' + encoding.options[encoding.selectedIndex].value + '&url=' + encodeURIComponent(url.value));
};

/**
 * maze defaultni text v inputu
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 */
JAK.Homepage.Advanced.Seek.MySearch.prototype._chngLabel = function (e, elm) {
	if(!elm.defaultLabel) {
		if(elm.nodeName.toLowerCase() == 'input') {
			elm.defaultLabel = elm.value;
		}
	}
	if (elm.defaultLabel == elm.value) {
		elm.value = '';
	}
	elm.className = '';

};

/**
 * vraci defaultni text v inputu pokud je prazdny
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
 */
JAK.Homepage.Advanced.Seek.MySearch.prototype._chngLabelBye = function (e, elm) {
	if(elm.nodeName.toLowerCase() == 'input') {
		if(elm.value == '') {
			elm.value = elm.defaultLabel;
			elm.className = 'gray';
		}
	} else {
		if(elm.selectedIndex == 0) {
			elm.className = 'gray';
		}
	}
};

/**
 * zpracuje odpoved ze serveru
 * @private
 */
JAK.Homepage.Advanced.Seek.MySearch.prototype._process = function (data) {
	var data = eval('('+data+')');
	JAK.loader.quickHide();
	if(data.status == 500) {
		this._displayError('Interní chyba systému.');
	} else if(data.status == 200) {
		this.data = data;
		if (data.method == 'searchAdd') {
			// pripojime na konec pole
			//this.searchArray[this.searchArray.length] = data.item;
			this._addSeek(data.item);
		}
	} else if(data.status == 401) {
		if(data.statusMessage == 'empty_title') {
			this._displayError('Není zadán název služby!');
		} else if(data.statusMessage == 'invalid_url') {

			this._displayError('Špatně zadané url!');
		} else if(data.statusMessage == 'too_much_search_services') {
			this._displayError('Dosažen maximální počet vlastních hledání!');
		} else if(data.statusMessage == 'too_long_title') {
			this._displayError('Název služby je příliš dlouhý!');
		} else if(data.statusMessage == 'already_added') {
			this._displayError('Toto hledání už máte přidané!');
		}

	}
};

/**
 * zavola metodu rodice pro pridani neveho hledani
 * @private
 */
JAK.Homepage.Advanced.Seek.MySearch.prototype._addSeek = function (item) {
	this.parent.addItem(item, true);
	this._showOK('Hledání úspěšně přidáno');
}

/**
 * zobrazi chybu pokud ji server vrátí
 * @private
 */
JAK.Homepage.Advanced.Seek.MySearch.prototype._displayError = function (message) {
	if (!this.dom.message) {
		this.dom.message = JAK.cel('div', null, 'seek-message');
		this.dom.cnt.appendChild(this.dom.message);
	}

	JAK.DOM.removeClass(this.dom.message, 'OK');

	this.dom.message.innerHTML = message;

};

/**
 * zobrazi chybu pokud ji server vrátí
 * @private
 */
JAK.Homepage.Advanced.Seek.MySearch.prototype._showOK = function (message) {
	if (!this.dom.message) {
		this.dom.message = JAK.cel('div', null, 'seek-message', 'OK');
		this.dom.cnt.appendChild(this.dom.message);
	}

	JAK.DOM.addClass(this.dom.message, 'OK');

	this.dom.message.innerHTML = message;

};
