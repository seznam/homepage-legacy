/* nstaveni jednotlivych okynek */
/* Email */
JAK.Gadget.EmailSetting = JAK.ClassMaker.makeClass({
	NAME:"EmailSetting",
	VERSION:"2.0"
});
JAK.Gadget.EmailSetting.prototype.$constructor = function (feedId,parent, emailId) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
		return;
	}

	this.eventsCache = new Object();
	this.feedId = feedId;
	this.parent = parent;
	this.emailId = emailId;

	// zabrana proti nahrani obsahu, pokud jsou zadany neplatne prihlas. udaje NEBO probiha synchronizace s Gmailem
	this.selfLoadContentAllowed = true;
	this.externalFinalizeBlocked = false;

	/* gmail, centrum, ....*/
	this._lastLogin = '';
	var form = JAK.DOM.getElementsByClass('login-form', this.parent.htmlGadget, 'FORM')[0];
	if (typeof form != 'undefined') {
		/*var login = JAK.DOM.getElementsByClass('login',  form, 'INPUT')[0].value;
		var passwd = JAK.DOM.getElementsByClass('passwd',  form, 'INPUT')[0].value;*/
		this.eventsCache.submitForm = JAK.Events.addListener(form, 'submit', this, '_send', false, true);
	}

	this.stopFlag = false;

	this._finalizeTimeout = this._finalize.bind(this);

	this._getContentBind = this._getContent.bind(this);
	this.syncFrequency = 2000;
	this._skipFinalizeStarter = false;

	var cont = this.parent.settings.htmlSettings;
	this.form = cont.getElementsByTagName('FORM')[0];
	/* naveseni akci */
	var submitB = JAK.DOM.getElementsByClass('submit', this.form, 'INPUT')[0];
	var resetB = JAK.DOM.getElementsByClass('reset', this.form, 'INPUT')[0];
	this.eventsCache.submitForm = JAK.Events.addListener(this.form, 'submit', this, '_send', false, true);
	this.eventsCache.resetB = JAK.Events.addListener(resetB, 'click', this, '_close', false, true);

	this.emlCnt = JAK.DOM.getElementsByClass('eml-cnt', this.parent.htmlGadget)[0];

	/* button pro odhlaseni z gmailu */
	var logoutButton = JAK.gel('foreignemail' + this.feedId + '-logout');
	if (logoutButton) {
		this.eventsCache.logoutButton = JAK.Events.addListener(logoutButton, 'click', this, '_logout');
	}
};

JAK.Gadget.EmailSetting.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Gadget.EmailSetting.prototype.init = function () {};

JAK.Gadget.EmailSetting.prototype.showLoader = function() {
	this.parent.htmlGadget.style.minHeight = "125px";
	JAK.DOM.addClass(this.emlCnt, 'syncRuning');
	this.parent.htmlGadget.style.background = "url(/st/img/load.gif) center 80px no-repeat";
};

JAK.Gadget.EmailSetting.prototype.hideLoader = function() {
	this.parent.htmlGadget.style.minHeight = "";
	JAK.DOM.removeClass(this.emlCnt, 'syncRuning');
	this.parent.htmlGadget.style.background = "none";
};

JAK.Gadget.EmailSetting.prototype._send = function (e, elm) {
	JAK.Events.cancelDef(e);
	var option = JAK.DOM.getElementsByClass('emailCount',this.form,'SELECT')[0]; //this.form['emailCount'];
	var itemsNum = option.options[option.selectedIndex].value;
	if(this.feedId == 184) {
		var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
		rq.setCallback(this, '_process');
		rq.send('/jsSetupEmailProcess', 'hashId=' + Homepage.CONF.HASHID + '&feedId=' + this.feedId + '&emailCount=' + itemsNum + '&showPreview=1' + '&nocache=' + Math.round(Math.random() * 999));
	} else {
		/*  pro ostatni gmail, centrum, ...  */
		this._lastLogin = JAK.DOM.getElementsByClass('login', elm, 'INPUT')[0].value;
		var passwd = JAK.DOM.getElementsByClass('passwd', elm, 'INPUT')[0].value;

		/* kdyz vyplnim v okne -> dam do nataveni*/
		JAK.DOM.getElementsByClass('login', this.form, 'INPUT')[0].value = this._lastLogin;

		// pokud jde o prihlasovaci formular, ktery neni vyplnen, nic nedelam
		if (JAK.DOM.hasClass(elm, 'login-form') && (!this._lastLogin || this._lastLogin == '' || !passwd || passwd == '')) {
			return;
		}

		var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
		rq.setCallback(this, '_process');
		rq.send('/jsSetupFeedProcess', 'hashId=' + Homepage.CONF.HASHID + '&feedId=' + this.feedId + '&rowCount=' + itemsNum + '&showPreview=' + 1 + '&username=' + this._lastLogin + '&password=' + passwd + '&nocache=' + Math.round(Math.random() * 999));
	}
};

JAK.Gadget.EmailSetting.prototype._close = function (e, elm) {
	this.parent.settings.closeSettings(e,elm);
};

JAK.Gadget.EmailSetting.prototype._process = function(response) {
	try {
		var data = eval("("+response+")");
	} catch (err) {
		var data = null;
	}
	if(data == null) {
	} else if(data.status == 500) {
		
	} else if(data.status == 200) {
		this.data = data;
		/*  pro ostatni gmail, centrum, ...  - setupFeed */
		if(data.method == 'setupEmail' || data.method == 'setupFeed') {
			this._finalizeStarter(data);
		}
	} else if(data.status == 401) {
		alert('Něco je špatně!');
	}
};

JAK.Gadget.EmailSetting.prototype._setCursor = function (computing) {
	var elms = this.form.getElementsByTagName('input');
	if (computing == true) {
		document.body.style.cursor = 'wait';

		for (var k = 0; k < elms.length; k++) {
			elms[k].style.cursor = 'wait';
		}
	} else {
		document.body.style.cursor = 'default';

		for (var k = 0; k < elms.length; k++) {
			elms[k].style.cursor = 'default';
		}
	}

};

JAK.Gadget.EmailSetting.prototype._finalizeStarter = function (data) {
	if(data.method == 'setupFeed') {
		if (this._skipFinalizeStarter) {
			this._skipFinalizeStarter = false;
			this._finalize(data);
			return;
		}
		if(this.stopFlag == false) {
			this.stopFlag = true;
			this._setCursor(true);
			window.setTimeout(this._finalizeTimeout, 4000);
		} else {
			this.stopFlag = false;
			this._finalize(data);
		}
	} else {
		this._finalize();
		//this._close();
	}
};

JAK.Gadget.EmailSetting.prototype.refresh = function () {
	var option = JAK.DOM.getElementsByClass('emailCount',this.form,'SELECT')[0];
	var itemsNum = option.options[option.selectedIndex].value;
	this._lastLogin = JAK.DOM.getElementsByClass('login', this.form, 'INPUT')[0].value;
	var passwd = JAK.DOM.getElementsByClass('passwd', this.form, 'INPUT')[0].value;

	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsSetupFeedProcess', 'hashId=' + Homepage.CONF.HASHID + '&feedId=' + this.feedId + '&rowCount=' + itemsNum + '&showPreview=' + 1 + '&username=' + this._lastLogin + '&password=' + passwd + '&nocache=' + Math.round(Math.random() * 999));
};

JAK.Gadget.EmailSetting.prototype._getContent = function () {
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsForeignEmailGetContent', 'hashId=' + Homepage.CONF.HASHID + '&feedId=' + this.feedId + '&nocache=' + Math.round(Math.random() * 999));
};

JAK.Gadget.EmailSetting.prototype._buildLoginForm = function () {
	var target = JAK.DOM.getElementsByClass('g-cnt', this.parent.htmlGadget)[0];
	if (!target) {
		return;
	}

	var form = JAK.mel('div', { id:'login-form-'+this.feedId, className:'login-form', action:'/', method:'get' });

	var row = JAK.mel('p');
	label.setAttribute('for', 'login-'+this.feedId);
	label.innerHTML = 'Jméno:';
	var input = JAK.mel('input', { id:'login-'+this.feedId, className:'login'+(this.feedId == 190 ? ' sh' : ''), type:'text', name:'username' });
	var strong = JAK.mel('strong');
	if (this.feedId == 190) {
		strong.innerHTML = '@gmail.cz';
	} else if (this.feedId == 191) {
		strong.innerHTML = '@centrum.cz';
	}
	row.appendChild(label);
	row.appendChild(input);
	row.appendChild(strong);
	form.appendChild(row);

	row = JAK.mel('p');
	label = JAK.mel('label');
	label.setAttribute('for', 'password-'+this.feedId);
	label.innerHTML = 'Heslo:';
	input = JAK.mel('input', { id:'password-'+this.feedId, className:'passwd'+(this.feedId == 190 ? ' sh' : ''), type:'password', name:'password' });
	var button = JAK.mel('input', { className:'sub'+(this.feedId == 190 ? ' button' : ''), type:'submit', value:'Přihlásit se' });
	this.eventsCache.submitForm = JAK.Events.addListener(form, 'submit', this, '_send', false, true);
	row.appendChild(label);
	row.appendChild(input);
	row.appendChild(button);
	form.appendChild(row);

	target.appendChild(form);

	return form;
};

JAK.Gadget.EmailSetting.prototype._buildTextCont = function (text, user, linkURL, linkText, linkId) {
	if (!this.emlCnt) {
		return;
	}

	var cont = JAK.mel('div', { className:'g-text-cont' });

	var line1 = JAK.mel('p', { className:'indent' });
	line1.innerHTML = text + (user ? '<strong>' + user + '</strong>' : '');
	cont.appendChild(line1);

	if (linkURL && linkText) {
		var line2 = JAK.mel('p');
		var strong = JAK.mel('strong');
		var a = JAK.mel('a', { href:linkURL });
		if (linkId) {
			a.setAttribute('id', linkId);
		}
		a.innerHTML = linkText;
		strong.appendChild(a);
		line2.appendChild(strong);
		cont.appendChild(line2);
	}

	this.emlCnt.appendChild(cont);

	return cont;
};

JAK.Gadget.EmailSetting.prototype._removeTextCont = function () {
	var list = JAK.DOM.getElementsByClass('g-text-cont', this.parent.htmlGadget);
	for (var i = 0, len = list.length; i < len; i++) {
		list[i].parentNode.removeChild(list[i]);
	}
};

JAK.Gadget.EmailSetting.prototype._removeNotes = function () {
	var notes = JAK.DOM.getElementsByClass('note', this.parent.htmlGadget,'H4');
	for (var i = 0, len = notes.length; i < len; i++) {
		notes[i].parentNode.removeChild(notes[i]);
	}
};

JAK.Gadget.EmailSetting.prototype._removeMailCountMsg = function () {
	var list = JAK.DOM.getElementsByClass('mail-count-msg', this.parent.htmlGadget);
	for (var i = 0, len = list.length; i < len; i++) {
		list[i].parentNode.removeChild(list[i]);
	}
};

JAK.Gadget.EmailSetting.prototype._finalize = function () {
/*
data.statusCode:
	-1 = synchronizace s Gmailem
	 0 = OK
	 1 = spatne prihlasovaci udaje
	 2 = na Gmail uctu uzivatele neni povolen IMAP pristup
	 3 = Gmail vyzaduje dodatecny krok overeni
	 4 = odhlaseny
*/
	var data = this.data;
	var items = this.data.items;

	if (data.typeId && data.typeId == 'foreignemail' // podle tohoto identifikuji volani teto metody z objektu JAK.GadgetManager
	    && this.externalFinalizeBlocked) {           // a pokud neni nyni zadouci, zamezim vykonani
		return false;
	}
	if (this.stopFlag == true && this.selfLoadContentAllowed) {
		this._getContent();
		return 0;
	}
	if (!data || data.statusCode != -1) {
		this.hideLoader();
	}
	this._setCursor(false);
	this._close();
	
	if( this.feedId == 184 ){
		try {
			if( JAK.gadget3ec ){
				var option = JAK.DOM.getElementsByClass('emailCount',this.form,'SELECT')[0];
				var itemsNum = option.options[option.selectedIndex].value;
				if( JAK.gadget3ec.conf.emailCount != itemsNum ){
					JAK.gadget3ec.conf.emailCount = itemsNum;
					JAK.gadget3ec.sendRequest();
				}
			}
		} catch(e){}

		return false;
	};
	var tableCnt = this.emlCnt;
	var table = this.parent.htmlGadget.getElementsByTagName('TABLE')[0];
	var form = JAK.DOM.getElementsByClass('login-form', this.parent.htmlGadget, 'FORM')[0];

	if (typeof data.username != 'undefined') {
		if (data.username == '') {
			return 0;
		}
	}

	// vycistime si pudu
	this.selfLoadContentAllowed = true;
	this.externalFinalizeBlocked = false;
	this._removeNotes();
	this._removeTextCont();
	this._removeMailCountMsg();
	if (form) {
		form.style.display = 'none';
	}

	if (data.statusCode == 1) {
		this.selfLoadContentAllowed = false;
		var badpElm = JAK.cel('h4');
		badpElm.className = "note error";
		badpElm.innerHTML = "Vaše heslo není platné, akutalizace emailů neprobíhá!";

		if (typeof form != 'undefined') {
			form.style.display = 'block';
		} else {
			var form = this._buildLoginForm();
		}

		form.parentNode.insertBefore(badpElm, form);
		var passInput = JAK.DOM.getElementsByClass('passwd',form,'INPUT')[0];
		if (passInput) {
			passInput.value = '';
		}

	} else if (data.statusCode == -1) {
		this.showLoader();
		var badpElm = JAK.cel('h4');
		badpElm.className = "note";
		badpElm.innerHTML = "Probíhá synchronizace" + (this.feedId == 190 ? " s Gmailem" : "");

		if(tableCnt.firstChild) {
			tableCnt.firstChild.parentNode.insertBefore(badpElm,tableCnt.firstChild);
		} else {
			tableCnt.appendChild(badpElm);
		}

		this.selfLoadContentAllowed = false;
		this.externalFinalizeBlocked = true;
		this._skipFinalizeStarter = true;
		this._setCursor(false);
		setTimeout(this._getContentBind, this.syncFrequency);

	} else if (this.feedId == 190 && data.statusCode == 2) {
		this._buildTextCont(
			'Pro zobrazení zpráv je zapotřebí mít aktivní protokol IMAP ve Vaší schránce: ',
			this._lastLogin + '@gmail.com',
			'http://support.google.com/mail/bin/answer.py?hl=en&answer=77695',
			'Nápověda, jak aktivovat IMAP protokol'
		);

	} else if (this.feedId == 190 && data.statusCode == 3) {
		this._buildTextCont(
			'Pro zobrazení zpráv je zapotřebí provést dodatečné ověření ve Vaší schránce: ',
			this._lastLogin + '@gmail.com',
			'https://www.google.com/accounts/DisplayUnlockCaptcha',
			'Provést dodatečné ověření',
			'gmail-unlock'
		);
	} else {


		if (typeof table == 'undefined' && this.feedId != 184) {
			var table = JAK.cel('table');
			var tbody = JAK.cel('tbody');
			table.appendChild(tbody);
			tableCnt.appendChild(table);

			if (data.statusCode != 1) {
				if(typeof form != 'undefined') {
					form.style.display = 'none';
				}
			}
		}

		var h5 = tableCnt.getElementsByTagName('h5')[0];
		if(items.length != 0) {

			if (h5) {
				h5.parentNode.removeChild(h5);
			}

			if (!table) {
				var table = JAK.cel('table');
				tableCnt.appendChild(table);
			}

			// zrusime rozsireni vybarvujici radky
			if (this.parent.extGadg) {
				this.parent.extGadg.$destructor();
				this.parent.extGadg = false;
			}

			while(table.rows.length > 0) {
				table.deleteRow(table.rows.length-1);
			}

			for(var i = 0; i < items.length; i++) {
				//var td = table.insertCell()
				var tr = table.insertRow(table.rows.length);
				tr.className = (items[i].unread == 1 ? 'newMes' : '')+(i%2? ' odd':' even');
				var tdMain = tr.insertCell(0);
				tdMain.title = items[i].abstractText;
				if (this.feedId != 191) {
					// pro centrum a atlas musim udelat url
					if(this.feedId == 190 || this.feedId == 192) {
						var url = Homepage.CONF['mail_url_' + this.feedId].replace('%1', items[i].messageId);
					} else {
						var url = Homepage.CONF.SERVER_EMAIL + '/readMessageScreen?folderId=' + items[i].folderId + '&amp;messageId=' + items[i].messageId;
					}
					var _from = items[i].from;
					_from = _from.replace("<","&lt;");
					_from = _from.replace(">","&gt;");
					
					tdMain.innerHTML =
						'<div><strong><a href="' + url +'">'+
						_from + '</a></strong> <span>- ' + items[i].subject + '</span> <span class="perex"> ' + (items[i].abstractText != '' && this.feedId == 184 ? '- ' + items[i].abstractText : '') + '</span></div>';
				} else {
					tdMain.innerHTML =
					'<div><strong> ' + items[i].from + '</strong> <span>- ' + items[i].subject + '</span> <span class="perex"> ' + (items[i].abstractText != '' && this.feedId == 184 ? '- ' + items[i].abstractText : '') + '</span></div>';
				}
				var tdDate = tr.insertCell(1);
				tdDate.className = 'etime';
				tdDate.innerHTML = items[i].timestamp;
			}

			if (this.parent.extGadg == false) {
				this.parent.extGadg = new JAK.Email('gadget-' + (this.feedId == 184 ? '3' : this.feedId), this.feedId);
			}
		} else {
			if (table) {
				table.parentNode.removeChild(table);
			}

			if (!h5) {
				var h5 = JAK.cel('h5', 'mail-count-msg');
				tableCnt.appendChild(h5);
			}
			if (this.data.newMessages && data.newMessages != '0') {
				h5.innerHTML = 'Máte ' + this.data.newMessages + ' nových zpráv';
			} else if (data.statusCode == 0) {
				h5.innerHTML = 'Nemáte žádné nové zprávy';
			}
		}

		this._rebuildSettings(data);
	}
};

JAK.Gadget.EmailSetting.prototype._rebuildSettings = function (data) {
	if (data.statusCode !== 0) {
		/* pokud je uzivatel neprihlasen, nemame duvod zrusit moznost nastavit jej v nastaveni gadgetu */
		return;
	}

	this._lastLogin = JAK.DOM.getElementsByClass('login', this.form, 'INPUT')[0].value;

	// 1) ziskam nutne elementy
	var rows = JAK.DOM.getElementsByClass('row', this.form);
	var cont = rows[0].parentNode;
	var inputLogin = JAK.DOM.getElementsByClass('login', cont, 'INPUT')[0];
	var inputPasswd = JAK.DOM.getElementsByClass('passwd', cont, 'INPUT')[0];

	// 2) overim, jestli mam nastaveni prebuildit
	if (inputLogin.getAttribute('type') == 'hidden') {
		return;
	}

	// 3) odstranim nezadouci prvky
	cont.removeChild(rows[0]);
	cont.removeChild(rows[1]);

	// 4) vytvorim novy obsah
	// row
	var newRow = JAK.cel('div', 'row');
	cont.insertBefore(newRow, rows[2]);
	// text
	var p = JAK.cel('p');
	p.innerHTML = 'Přihlášený účet: <strong>' + this._lastLogin + '</strong>';
	newRow.appendChild(p);
	// inputy
	var newInputLogin = JAK.mel('input', { type:'hidden', name:inputLogin.name, value:inputLogin.value, id:inputLogin.id, className:inputLogin.className });
	newRow.appendChild(newInputLogin);
	var newInputPasswd = JAK.mel('input', { type:'hidden', name:inputPasswd.name, value:inputPasswd.value, id:inputPasswd.id, className:inputPasswd.className });
	newRow.appendChild(newInputPasswd);
	// tlacitko pro odhlaseni
	var divOut = JAK.cel('div', 'logoutButton');
	var logoutButton = JAK.mel('input', { type:'submit', value:'Odhlásit účet', className:'button', id:'foreignemail' + this.feedId + '-logout' });
	this.eventsCache.logoutButton = JAK.Events.addListener(logoutButton, 'click', this, '_logout');
	divOut.appendChild(logoutButton);
	newRow.appendChild(divOut);
}

JAK.Gadget.EmailSetting.prototype._reload = function () {
	window.location.reload();
};

JAK.Gadget.EmailSetting.prototype._logout = function (e, el) {
	JAK.Events.cancelDef(e);
	this._setCursor(true);
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_reload');
	rq.send('/jsForeignEmailLogout', 'hashId=' + Homepage.CONF.HASHID + '&feedId=' + this.feedId + '&emailId=' + this.emailId + '&nocache=' + Math.round(Math.random() * 999));

};
/* end nastaveni EMAIL */
