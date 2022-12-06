JAK.SkinSwitcher = JAK.ClassMaker.makeClass({
		NAME: "JAK.SkinSwitcher",
		VERSION: "1.0"
})

JAK.SkinSwitcher.prototype.$constructor = function () {
	this._skins = [0,2,4,8,9,14];
	this._skinURL = "/st/css/{number}-homepage.css";
	this._dom = {};
	this._init();
}

JAK.SkinSwitcher.prototype._init = function () {
	this._dom.button = JAK.gel("button");
	this._dom.link = JAK.gel("link");
	this._dom.skin = JAK.gel("skinNum");


	JAK.Events.addListener(this._dom.button, "click", this, this._change);
}

JAK.SkinSwitcher.prototype._change = function () {
	if (this._skins.indexOf(parseInt(this._dom.skin.value)) != -1) {
		this._dom.link.href = this._skinURL.replace("{number}", this._dom.skin.value);
	}
}

Homepage.FocusChanger = JAK.ClassMaker.makeClass({
	NAME:"Homepage.FocusChanger",
	VERSION:"1.0",
	IMPLEMENT: JAK.ISignals
});

Homepage.FocusChanger.prototype.$constructor = function () {
	this.addListener('onchange', this.focus.bind(this));
	this._fisrtRun = 2;
};
Homepage.FocusChanger.prototype.focus = function (evnt) {
	if(this._fisrtRun == 0) {
		if (evnt.target.dom.select.id == 'lang') {
			window.setTimeout(function () {JAK.gel('dict-field').focus()},100);
		} else if (evnt.target.dom.select.id == 'domain') {
			window.setTimeout(function () {JAK.gel('password').focus()},100);
		}
	} else {
		this._fisrtRun--;
	}
};
/*new Homepage.FocusChanger();*/


/* fake pokud by nekdo zapomnel */
function debug() {}

if (!window.console) {
  window.console = {
    log : function(){}
  }
}
/*
JAK.tab_im0 = new Image();
JAK.tab_im0.src = Homepage.CONF.PATH_IMG + '/z_fulltext_bottom.gif';
JAK.tab_im1 = new Image();
JAK.tab_im1.src = Homepage.CONF.PATH_IMG + '/z_firmy_bottom.gif';
JAK.tab_im2 = new Image();
JAK.tab_im2.src = Homepage.CONF.PATH_IMG + '/z_mapy_bottom.gif';
JAK.tab_im3 = new Image();
JAK.tab_im3.src = Homepage.CONF.PATH_IMG + '/z_slovnik_bottom.gif';
JAK.tab_im4 = new Image();
JAK.tab_im4.src = Homepage.CONF.PATH_IMG + '/z_zbozi_bottom.gif';
JAK.tab_im5 = new Image();
JAK.tab_im5.src = Homepage.CONF.PATH_IMG + '/z_obrazky_bottom.gif';
JAK.tab_im6 = new Image();
JAK.tab_im6.src = Homepage.CONF.PATH_IMG + '/z_clanky_bottom.gif';
JAK.tab_im7 = new Image();
JAK.tab_im7.src = Homepage.CONF.PATH_IMG + '/z_encyklopedie_bottom.gif';*/

JAK.isSupported = (JAK.Browser.client == 'ie' && parseFloat(JAK.Browser.version) <= 5) ? false : true;


JAK.log = function (link, x, ord, ord2, idRss, rusId) {
	/*- zakomentovani mereni prokliku z FEEDu
	var imgStat = new Image(1,1);
	var src = 'http://hp.dot.seznam' + _tld + '/?' +
					'sId=' +
					'&act=click' +
					'&x=' + x +
					'&ord=' + ord +
					'&idRss=' + idRss +
					'&url=' + encodeURIComponent(link.href) +
					'&rusId=' + rusId;
	imgStat.src = src;
	-*/
}

/**
 *	inicializace sugg pro Zbozi / volano v JAK.Tabs.prototype._buildForm a initSuggests
 */
function suggestZboziInit () {
	var zbozi = JAK.gel("goods-field");
	if (zbozi) {
		new JAK.Suggest(zbozi, "/suggest", {
			dict: "zbozi",
			count: Homepage.SUGGEST_LIMIT,
			highlight: true,
			parentElement: zbozi.form.querySelector(".suggest-container"),
			autoSubmit: false
		});
		JAK.signals.addListener(false, "suggestSubmit", function(e) {
			var used = e.target.used();
			if (used == 2) {
				JAK.gel("thrug").value = "sug";
			} else if (used == 1) {
				JAK.gel("thrug").value = "sugpart";
			}
		});
		var gcat = JAK.gel('g-categories');
		if (gcat != null) {
			JAK.Events.addListener(gcat, 'mousedown', function (e,elm) {DOT.hit("mousedown", e)});
			JAK.Events.addListener(gcat, 'mousedown', JAK.Events.stopEvent);
			JAK.Events.addListener(zbozi, 'mousedown', JAK.Events.stopEvent);
			gcat.style.width = (zbozi.offsetWidth + 'px');
			JAK.Events.addListener(zbozi, 'focus', window, showGCat);
			JAK.Events.addListener(document, 'mousedown', window, hideGCat);
		}
	}
}

/**
 z cookie cte informace pro ftxt a predava je nazpet
*/
function intiSearchId () {
	var start = document.cookie.indexOf('clientid=');
	if (start != -1) {
		var end = document.cookie.indexOf(';',start);
		if (end == -1) {
			end = document.cookie.length;
		}
		var value = document.cookie.substring(start+9, end);
		var form = JAK.gel('inet-f');
		var sourceidInput = document.getElementsByName('sourceid')[0];
		sourceidInput.value = "Homepage_" + value;
	}
}

function showGCat(e, elm) {
	var gcat = JAK.gel('g-categories');
	gcat.style.display = 'block';
}
function hideGCat(e, elm) {
	var gcat = JAK.gel('g-categories');
	gcat.style.display = 'none';
}

/**
 * Nahodit par suggestu
 */
function initSuggests(options) {
	/* Suggest pro fulltext */
	var fulltext = JAK.gel("inet-field");
	if (fulltext) {
		var suggestOptions = {
			dict: "fulltext/cs",
			count: Homepage.SUGGEST_LIMIT,
			highlight: true,
			url: options.suggestUrl,
			suggestClassName: "suggest5"
		};

		if ( window.getComputedStyle ) {
			/* Suggest s nadstavbou šedého našeptávání */
			sg = new JAK.Suggest5Words(fulltext, fulltext.form.querySelector(".suggest-container"), suggestOptions);
		} else {
			sg = new JAK.Suggest5(fulltext, fulltext.form.querySelector(".suggest-container"), suggestOptions);
		}

		var sgUsage = new JAK.SuggestUsage(sg);

		JAK.signals.addListener(false, "suggest-submit", function(e) {
			var form = fulltext.form;
			var using = sgUsage.getUsage();
			var sgParams = JAK.Events.getTarget(e).getParams();
			sgParams.thru = "";
			sgParams.su = sgUsage.getUsageString();

			if (using.CLICK_ON || using.TOUCH_ON || sgParams.aq!= -1) {
				sgParams.thru = "sug";
			} else if (using.SELECT_BY_KEYBOARD || using.EDIT_SWIPE || using.APPEND_RARROW || using.APPEND_CLICK || using.APPEND_TOUCH) {
				sgParams.thru = "sugpart";
			}

			for (var p in sgParams) {
				form.appendChild(JAK.mel("input", {type: "hidden", name: p, value: sgParams[p]}));
			}
		}, sg);
	}

	/* Suggest pro Slovník */
	var slovnik = JAK.gel("dict-field");
	if (slovnik) {
		var o = {
			dict: "hp_mix_cz_en",
			count: Homepage.SUGGEST_LIMIT,
			remoteMap: {
				slovnik: JAK.Suggest.Slovnik,
				item: JAK.Suggest.Item
			},
			highlight: true,
			parentElement: slovnik.form.querySelector(".suggest-container")
		};
		var s = new JAK.Suggest(slovnik, "/suggest", o);

		//JAK.signals.addListener(window, "suggestSubmit", "slovnikSuggest", s);
	}

	/* Suggest pro videa */
	var videoField = JAK.gel("video-field");
	if (videoField) {
		var videoSgOpt = {
			dict: "video",
			count: Homepage.SUGGEST_LIMIT,
			highlight: true,
			parentElement: videoField.form.querySelector(".suggest-container")
		};
		var videoSg = new JAK.Suggest(videoField, "/suggest", videoSgOpt);
	}

	/* Suggest pro Obrázky.cz */
	var picsField = JAK.gel("pics-field");
	var picsSgOpt = {
		dict: "pics",
		count: Homepage.SUGGEST_LIMIT,
		highlight: true,
		parentElement: picsField.form.querySelector(".suggest-container")
	};
	var picsSg = new JAK.Suggest(picsField, "/suggest", picsSgOpt);

	/* Suggest pro Zboží */
	suggestZboziInit();

	/* Suggest pro Mapy */
	var mapyField = JAK.gel("maps-field");
	var mapySgOpt = {
		dict: "region",
		count: Homepage.SUGGEST_LIMIT,
		highlight: true,
		parentElement: mapyField.form.querySelector(".suggest-container"),
		format: "json"
	};
	var mapySg = new JAK.Suggest(mapyField, "/suggest", mapySgOpt);
	//JAK.signals.addListener(window, "suggestSubmit", "mapySuggest", mapySg);

	/* Suggest pro Firmy.cz */
	var firmsField = JAK.gel("firms-field");
	var firmsSgOpt = {
		dict: "firms",
		count: Homepage.SUGGEST_LIMIT,
		highlight: true,
		parentElement: firmsField.form.querySelector(".suggest-container"),
		autoSubmit: false
	};
	var firmsSg = new JAK.Suggest(firmsField, "/suggest", firmsSgOpt);
}

/* obrazek psa vedle u vyhledavani */
function initDailyDog(dogURL, dogClass, url, name) {
	var cnt = JAK.gel('search-cnt');
	if (url != '') {
		var link = JAK.mel('a', {href:url, alt:''});
		cnt.appendChild(link)
		cnt = link;
	}

	var dog = JAK.mel('div', {className : 'dog'});
	if (name != '') {
		dog.title = name;
	}
	cnt.appendChild(dog);
	if (dogURL != '') {
		dog.style.backgroundImage = 'url('+dogURL+')';
	} else {
		JAK.DOM.addClass(dog, dogClass);
	}
}

function changeAction (e, elm) {
	var inetForm = JAK.gel('inet-f');
	if (elm.id == 'world') {
		inetForm.action = Homepage.CONF.SERVER_SEARCH_URL;
	} else {
		inetForm.action = ''//Homepage.CONF.SERVER_SEARCH_URL_WORLD;
	}
}

/**
 * Pri odeslani suggestu slovniku je treba specialni pece
 */
function slovnikSuggest(e) {
	var sender = e.target;
	var item = sender.getActive();
	if (!item) { return; }
	var node = item.getNode();
	var members = node.getElementsByTagName("member");
	for (var i=0;i<members.length;i++) {
		var member = members[i];
		if (member.getAttribute("name") == "dict") {
			JAK.gel("lang").value = member.getElementsByTagName("string")[0].firstChild.nodeValue; /* FIXME: je tohle vůbec třeba? A celkově celý cyklus for */
		}
	}
}

/**
 * Pri odeslani suggestu map je treba specialni pece
 */
function mapySuggest(e) {
	var sender = e.target;
	var item = sender.getActive();
	if (!item) { return; }

	/* nechceme odeslat formular, at si to suggest odesila jak chce */
	sender.setOptions({autoSubmit: false});

	var node = item.getNode();
	var entityName = node.getElementsByTagName("string")[0];
	var entityId = node.getElementsByTagName("i4")[0];
	var query = node.getAttribute("value");
	entityName = JAK.XML.textContent(entityName);
	entityId = JAK.XML.textContent(entityId);
	var url = "http://www.mapy."+_tld+"/?source=" + entityName + "&id=" + entityId + "&show=1";
	window.location = url;
}

function ms_setWidth(min, max) {
	min = min || 770;
	max = max || 1024;
	if (document.documentElement.clientWidth < min) {
		return min+'px';
	} else if (document.documentElement.clientWidth > max) {
		return max+'px';
	} else {
		return 'auto';
	}
};

function ms_setPadding(min, max) {
	min = min || 770;
	max = max || 1024;
	if (document.documentElement.clientWidth < min) {
		return '0 15px';
	} else if (document.documentElement.clientWidth > max) {
		return '0';
	} else {
		return '0 15px';
	}
};

function oldBrowserHint() {
	if(JAK.Browser.client == 'ie' && JAK.Browser.version < 7) {
		var searchBox = JAK.gel('search-cnt');
		var windowContainer = JAK.DOM.getElementsByClass('window-container');
		var elm = JAK.cel('div', '', 'oldBrowserHint');
		elm.innerHTML = "Váš internetový prohlížeč již není podporovaný. Pro korektní zobrazení stránky <a href=\"http://software.seznam."+_tld+"/ie\">aktualizujte svůj internetový prohlížeč</a>.";

		searchBox.insertBefore(elm, windowContainer[0]);
	}
};

// IE6 upozorneni
JAK.Events.onDomReady('document', oldBrowserHint);

JAK.tabs = new JAK.Tabs();
JAK.wmanager = new JAK.Wmanager();


/* Pridava k titulku gadgetu odkaz pro nastaveni */
JAK.GadgetNotice = JAK.ClassMaker.makeClass({
	NAME: 'GadgetNotice',
	VERSION: '2.0'
});

JAK.GadgetNotice.prototype.$constructor = function(titleBlockId, titleInlineId, elIdForMaxWidth, settings) {
	settings = settings || {};
	this.settings = {
		maxWidthCorrection : settings.maxWidthCorrection ? settings.maxWidthCorrection : 0,
		text: settings.text ? settings.text : '',
		callbackObj: settings.callbackObj ? settings.callbackObj : null,
		callbackMethod: settings.callbackMethod ? settings.callbackMethod : '',
		permanentShow: !!settings.permanentShow
	}
	this.titleBlock = JAK.gel(titleBlockId);
	this.titleInline = JAK.gel(titleInlineId);
	this.elForMaxWidth = JAK.gel(elIdForMaxWidth);
	this._show = false;
	this.notice = null;

	this._install();

	this._originalTitleText = this.titleInline.innerHTML;
	this.width = this.titleInline.offsetWidth;

	JAK.Events.addListener(this.titleBlock, 'mouseover', this, 'showNoticeDelay');
	JAK.Events.addListener(this.titleBlock, 'mouseout', this, 'hideNoticeDelay');

	// pro 3 sloupcovy layout na malem rozliseni hlasky nezobrazovat permanentne
	if (JAK.gel(titleBlockId).offsetWidth < 140) {
		this.settings.permanentShow = false;
	}

	if (this.settings.permanentShow) {
		JAK.Events.addListener(window, 'resize', this, 'updateShow');
		this.showNotice();
	}
}

JAK.GadgetNotice.prototype.showNoticeDelay = function(e) {
	if (this._timoutOver) {
		clearTimeout(this._timoutOver);
	}
	if (this._timoutOut) {
		clearTimeout(this._timoutOut);
	}
	this._timoutOver = setTimeout(this.showNotice.bind(this), 250);
}

JAK.GadgetNotice.prototype.hideNoticeDelay = function() {
	this._timoutOut = setTimeout(this.hideNotice.bind(this), 5);
}

JAK.GadgetNotice.prototype.showNotice = function() {
	if (!this._show) {
		//this._originalTitleText = this.titleInline.innerHTML;
		this.notice.style.display = 'block';

		if(this.time){clearTimeout(this.t)}
		this.time = setTimeout(this.updateShow.bind(this),0);

		this._show = true;
	}
}

JAK.GadgetNotice.prototype.updateShow = function() {
	if (this._show) {
		this.titleInline.innerHTML = this._cutText();
		/* Este raz po 10 ms to skontrolujeme, lebo mobilných zariadeniach sa layout
		    prepocita so spozdenim oroti resize eventu nad window */
		window.setTimeout(function () {
			this.titleInline.innerHTML = this._cutText();
		}.bind(this), 20);
	}
}

JAK.GadgetNotice.prototype.hideNotice = function() {
	if (this._timoutOver) {
		clearTimeout(this._timoutOver);
	}
	if (this._timoutOut) {
		clearTimeout(this._timoutOut);
	}
	if (this._show && !this.settings.permanentShow) {
		this.notice.style.display = 'none';
		this.titleInline.innerHTML = this._originalTitleText;
		this._show = false;
	}
}

JAK.GadgetNotice.prototype._install = function() {
	this.titleBlock.style.position = 'relative';
	this.notice = JAK.mel('a', { href:'#', innerHTML:this.settings.text }, { position:'absolute', top:'6px', right:'0', display:'none' });
	//this.notice.id = "weatherNotice";
	//this.notice = JAK.mel('a', { href:'#', innerHTML:this.settings.text }, { float:'left', display:'none' });
	JAK.Events.addListener(this.notice, 'click', this, '_run');
	this.titleBlock.appendChild(this.notice);

	//this.clear = JAK.cel('span', 'clear');
	//this.titleBlock.appendChild(this.clear);
}

JAK.GadgetNotice.prototype._run = function(e, el) {
	this.hideNotice();

	var obj = this.settings.callbackObj || window;
	var method = this.settings.callbackMethod;
	if (typeof(method) == 'string') {
		method = obj[method];
	}
	method.call(obj);

	JAK.Events.cancelDef(e);
}

JAK.GadgetNotice.prototype._getMaxWidth = function() {
	return Math.floor(this.titleInline.parentNode.offsetWidth - 80) + this.settings.maxWidthCorrection;
}

JAK.GadgetNotice.prototype._cutText = function() {

	var maxWidth = this._getMaxWidth();
	var s = this._originalTitleText;
	var width = this.width;

	if (width > (maxWidth + 10)) {
		console.log('cut - ano');
		var avg = Math.round(width/s.length);
		var maxLen = Math.floor(maxWidth/avg);
		s = s.substring(0, maxLen);
		if (s[s.length-1] == ' ') {
			s = s.substring(0, s.length-1);
		}
		s = s + '&hellip;';
	}

	return s;
}
/* END of JAK.GadgetNotice */

JAK.WeatherCookie = JAK.ClassMaker.makeClass({
	NAME: 'WeatherCookie',
	VERSION: '1.0'
});

JAK.WeatherCookie.prototype.$constructor = function(weatherLocality) {
	if (weatherLocality != ''){
		var jakCookie = JAK.Cookie.getInstance();
		var monthFromNow = new Date((new Date()).getTime() + 1000*60*60*24*30);

		options = { "path": "/", "expires": monthFromNow, "domain": "seznam.cz" };

		jakCookie.set("WeatherLocality", weatherLocality, options);
	}
}

/* EmailResizer */
JAK.SEmailResizer = JAK.ClassMaker.makeClass({
	NAME: 'SEmailResizer',
	VERSION: '1.0'
});

JAK.SEmailResizer.prototype.$constructor = function(feedId) {

	this.loginForm = JAK.gel('login-form');

	this.gCnt = JAK.DOM.getElementsByClass('g-cnt', JAK.gel('gadget-'+feedId))[0];
	this.login = JAK.gel('login');
	this.passwd = JAK.gel('password');
	this.labels = JAK.DOM.getElementsByClass('label');
	this.selectText = JAK.DOM.getElementsByClass('superSelFill')[1];
	this.superSelect = JAK.DOM.getElementsByClass('superSelect')[1];

	this._update();
	JAK.Events.addListener(window, 'resize', this, '_update');

};

JAK.SEmailResizer.prototype._update = function(feedId) {
	var gWidth = this.gCnt.offsetWidth;
	var wp = JAK.DOM.getDocSize().width;



	if (gWidth < 362 && wp < 400) {
		this.login.setAttribute("placeholder", "Jméno");
		this.passwd.setAttribute("placeholder", "Heslo");

		for (var i = 0; i < this.labels.length; i++) {
			JAK.DOM.addClass(this.labels[i], "blind");
		};

		JAK.DOM.addClass(this.loginForm, "mobile");

	} else {
		this.login.removeAttribute('placeholder');
		this.passwd.removeAttribute('placeholder');

		for (var i = 0; i < this.labels.length; i++) {
			JAK.DOM.removeClass(this.labels[i], "blind");
		};

		JAK.DOM.removeClass(this.loginForm, "mobile");

	}

};
/* END of JAK.SEmailResizer */


/* EmailResizer */
JAK.EmailResizer = JAK.ClassMaker.makeClass({
	NAME: 'EmailResizer',
	VERSION: '1.0'
});

JAK.EmailResizer.prototype.$constructor = function(feedId) {
	this.loginForm = JAK.gel('login-form-'+feedId);

	this.labels = JAK.DOM.getElementsByClass('label');

	this.gCnt = JAK.DOM.getElementsByClass('g-cnt', JAK.gel('gadget-'+feedId))[0];
	this.login = JAK.DOM.getElementsByClass('login', this.loginForm)[0];
	this.passwd = JAK.DOM.getElementsByClass('passwd', this.loginForm)[0];
	this.origLoginW = JAK.DOM.getStyle(this.login, 'width');
	this.origPasswdW = JAK.DOM.getStyle(this.passwd, 'width');

	if (this.origLoginW.indexOf('px') === -1
	    || this.origPasswdW.indexOf('px') === -1) {
		return;
	}
	this.origLoginW = parseInt(this.origLoginW);
	this.origPasswdW = parseInt(this.origPasswdW);

	this._update();
	JAK.Events.addListener(window, 'resize', this, '_update');
};

JAK.EmailResizer.prototype._update = function(feedId) {
	var gWidth = this.gCnt.offsetWidth;
	var wp = JAK.DOM.getDocSize().width;

	if (gWidth < 321 || wp < 390 ) {
		this.login.style.width = '119px';
		this.passwd.style.width = '119px';
		this.login.setAttribute("placeholder", "Jméno");
		this.passwd.setAttribute("placeholder", "Heslo");
		for (var i = 0; i < this.labels.length; i++) {
			JAK.DOM.addClass(this.labels[i], "blind");
		};
	} else if (gWidth < 347) {
		this.login.style.width = '107px';
		this.passwd.style.width = '107px';
		this.login.removeAttribute('placeholder');
		this.passwd.removeAttribute('placeholder');
		for (var i = 0; i < this.labels.length; i++) {
			JAK.DOM.removeClass(this.labels[i], "blind");
		};
	} else if (gWidth < 400) {
		this.login.style.width = '130px';
		this.passwd.style.width = '130px';
		this.login.removeAttribute('placeholder');
		this.passwd.removeAttribute('placeholder');
		for (var i = 0; i < this.labels.length; i++) {
			JAK.DOM.removeClass(this.labels[i], "blind");
		};
	} else if (gWidth < 475) {
		var correction = 0;
		if(wp < 517){
			correction = 35;
		}
		var diff = 470 - gWidth;

		this.login.style.width = (this.origLoginW - diff - correction) + 'px';
		this.passwd.style.width = (this.origPasswdW - diff) + 'px';
		this.login.removeAttribute('placeholder');
		this.passwd.removeAttribute('placeholder');
		for (var i = 0; i < this.labels.length; i++) {
			JAK.DOM.removeClass(this.labels[i], "blind");
		};
	} else {
		var correction = 0;
		if(wp < 517){
			correction = 35;
		}
		this.login.style.width = (this.origLoginW - correction) + 'px';
		this.passwd.style.width = this.origPasswdW + 'px';
		this.login.removeAttribute('placeholder');
		this.passwd.removeAttribute('placeholder');
		for (var i = 0; i < this.labels.length; i++) {
			JAK.DOM.removeClass(this.labels[i], "blind");
		};
	}
};

var bcClanek = {};

bcClanek.DEFAULT = null;

bcClanek._render = function(link, title, perex, className) {
	perex = perex || "";
	className = className || "";
	return '<div class="hlp"><div class="' + className + '"></div><a href="' + link + '">' + title + '</a><span class="perex">' + perex + '</span></div>';
};

bcClanek.process = function(ad, data, async) {
	var container = (typeof(data.id) == "string" ? document.getElementById(data.id) : data.id);
	if (!container) { return false; }
	data.container = container;
	data.ad = ad;
	if (ad.indexOf('/impress?spotId=') != -1) { container.className += " adFull"; }

	if (async) {
		var js = [];
		var s = ad.replace(/<script.*?>([\s\S]*?)<\/script>/g, function(tag, code) {
			js.push(code);
			return "";
		});
		container.innerHTML = s;

		var links = container.querySelectorAll("a");
		if (links && links.length) {
			links = Array.prototype.slice.call(links);
			for (var i = links.length - 1; i >= 0; i--) {
				links[i].href = links[i].href + "#utm_source=szn_hp&utm_campaign=var_B";
			};
		}

		while (js.length) { eval(js.shift()); }
	} else {
		console.warn(data.zoneId + " must be async!");
	}

	/* pokud obsahuje miss (nebo nejsou zadna data) je treba zobrazit clanek od redakce */
	var r = ad.match(/^\s*<img *src *= *(['"])(.*?)\1[^>]*\/>\s*$/);
	if (!ad || r) {
		if (!bcClanek.DEFAULT) {
			console.warn("No default data for " + data.zoneId);
			return;
		}
		container.innerHTML = bcClanek._render(bcClanek.DEFAULT.link, bcClanek.DEFAULT.title, bcClanek.DEFAULT.perex, bcClanek.DEFAULT.className);
	}
};


/* stara se zobrazeni vyzvy k prehrati audionovinky a zobrazeni prehravace */
JAK.AudioNewsManager = JAK.ClassMaker.makeClass({
	NAME : 'JAK.AudioNewsManager',
	VERSION : '1.1',
	IMPLEMENT: [JAK.ISignals]
});

/**
 * Spravce audio novinek
 *
 * @param  {string} item  ID elementu ve kterem je relevantni clanek
 * @param  {string} target  ID elementu kam vlozit vyzvu/prehravac
 * @param  {boolean} isPhone  priznak jestli jde o mobilni telefon
 * @param  {string} contentId ID audionovinky
 * @param  {object} mp3Sources pole odkazu na zdroje, serazene dle kvality (posledni polozka = nejvyssi kvalita)
 * @param  {object} oggSources pole odkazu na zdroje, serazene dle kvality (posledni polozka = nejvyssi kvalita)
 * @param  {object} options ruzne parametry
 */
JAK.AudioNewsManager.prototype.$constructor = function(item, target, isPhone, contentId, mp3Sources, oggSources, options) {
	options = options || {};
	this._item = JAK.gel(item);
	if (!this._item) {
		throw new Error("[JAK.AudioNewsManager] Invalid argument: item must be an existing element");
	}
	this._target = JAK.gel(target);
	if (!this._target) {
		throw new Error("[JAK.AudioNewsManager] Invalid argument: target must be an existing element");
	}
	if (!contentId) {
		throw new Error("[JAK.AudioNewsManager] Invalid argument: there is no contentId");
	}
	this._contentId = contentId;
	this._instances = [];
	for (var i = mp3Sources.length - 1; i >= 0; i--) {
		if (mp3Sources[i]) {
			this._instances.push({
				source: oggSources[i],
				type: "audio/ogg"
			}, {
				source: mp3Sources[i],
				type: "audio/mpeg"
			});
		}
	}
	if (this._instances.length === 0) {
		throw new Error("[JAK.AudioNewsManager] Invalid argument: there is no source");
	}
	if (!options.hitPath) {
		throw new Error("[SZN.AudioNewsManager] Invalid argument: there is no option hitPath");
	}
	this._options = options;

	if (document.createElement('audio').canPlayType) {
		this._dom = {};
		this._player = null;

		if (isPhone) {
			this._makeHpBox();
		} else {
			this._insertInvitation();
		}
	}
};

JAK.AudioNewsManager.prototype._makeHpBox = function() {
	//var tr = JAK.DOM.findParent(this._item, "tr");
	this._item.parentNode.removeChild(this._item);

	var gadget = JAK.cel("div", "s_win ud_an-feed", "gadget-UD_AN");
	gadget.innerHTML = '<div class="gagdet-cont">'
	      + '	<div class="main-cont">'
	      + '		<h3><h3 class="title s_win_title"><span class="text">Události dne:</span> <span class="bck"></span></h3>'
	      + '		<div class="g-cnt s_win_area" id="g-UD_AN-area"></div>'
	      + '	</div>'
	      + '</div>';

	var target = JAK.gel("col_1");
	if (target.firstChild.nodeType == 3) {
		target.firstChild.parentNode.insertBefore(gadget, target.firstChild.nextSibling)
	} else {
		target.insertBefore(gadget, target.firstChild);
	}

	var area = JAK.gel("g-UD_AN-area");
	this._dom.container = JAK.cel("div", "audioNewsContainer");
	area.appendChild(this._item);
	area.appendChild(this._dom.container);
	this._dom.button = JAK.cel("button", "anInvitation");
	this._dom.container.appendChild(this._dom.button);

	this._dom.txt = JAK.cel("span", "anTxt");
	this._dom.txt.innerHTML = "poslechnout události dne";
	this._dom.button.appendChild(this._dom.txt);
	JAK.Events.addListener(this._dom.button, "click", this, "_play");
};

JAK.AudioNewsManager.prototype._insertInvitation = function() {
	this._dom.container = JAK.cel("div", "audioNewsContainer");
	this._target.appendChild(this._dom.container);
	JAK.DOM.addClass(this._target, "full");

	this._dom.button = JAK.cel("button", "anInvitation");
	this._dom.container.appendChild(this._dom.button);

		this._dom.txt = JAK.cel("span", "anTxt");
		this._dom.txt.innerHTML = "poslechnout události dne";
		this._dom.button.appendChild(this._dom.txt);

		JAK.Events.addListener(this._dom.button, "click", this, "_play");
};

JAK.AudioNewsManager.prototype._createPlayer = function() {
	this._player = new JAK.NovinkyAudioPlayer({
		imgPath: "/st/img/audioplayer/"
	});

	this.addListener("play", "_ePlay", this._player);
	this._player.setMedia({ media:this._instances });
};

JAK.AudioNewsManager.prototype._play = function() {
	JAK.DOM.clear(this._dom.container);
	this._createPlayer();
	this._dom.container.appendChild(this._player.getElm());
	this._player.play();
};

JAK.AudioNewsManager.prototype._ePlay = function() {
	if (!this._alreadyPlayed) {
		this._alreadyPlayed = true;
		var img = new Image();
		img.src = this._options.hitPath + "?cdnaudioIdhp=" + this._contentId;
	}
};
/* END of JAK.AudioNewsManager */
