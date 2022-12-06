/* class */

JAK.Tabs = JAK.ClassMaker.makeClass({
	NAME:"Tabs",
	VERSION:"1.1",
	IMPLEMENT : [JAK.ISignals]
});

JAK.Tabs.prototype.$constructor = function () {
	this.tabsCont = 'tabs';
	this.boxesCont = 'search-boxes';
	this.extTab = null;
	this.device = 'desktop';
	this._focus = this._focus.bind(this);

	this.extForms = new Object();

	this.eventsCache = new Object();
};

JAK.Tabs.prototype.init = function () {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
		return;
	}

	this.tabsCont = JAK.gel(this.tabsCont);
	this.tabs = this.tabsCont.getElementsByTagName('li');
	this.searches = new Array();
	this.otherFormActive = false;

	/* projdem zalozky ale posledni ne - to je vice */
	for(var i = 0; i < this.tabs.length; i++) {
		var id = this.tabs[i].id.split('-')[1];
		var box = JAK.gel(id);
		this.searches[this.searches.length] = {num:i, id:id, tab:this.tabs[i], box:box};

		var link = this.tabs[i].getElementsByTagName('a')[0];
		link.searchItem = this.searches[this.searches.length-1];
		this.eventsCache['searches'+i] = JAK.Events.addListener(link, 'click' , this, '_change', false, true);

		if (id == 'dict') {
			//JAK.Events.addListener(JAK.gel(id+'-f'), 'submit', suggestAction);
		}

		if(this.tabs[i].className == 'active') {
			this.active = this.searches[this.searches.length-1];
			if (JAK.Browser.client == 'ie' && JAK.Browser.version >= 8) {
				//window.setTimeout(this._focus, 1000);
				this._focus();
			} else {
				this._focus();
			}
		}
	};

	// extended
	this.extTab = JAK.gel('t-moreSearch');
	this.extTabCont = JAK.gel('moreSearch');
	this.boxesCont = JAK.gel(this.boxesCont);
	//this._initExtended();
};

JAK.Tabs.prototype._focus = function () {
	if(this.device == 'desktop') {
		JAK.Events.onDomReady(this, function() {
			/* focus nastavit jenom pokud neni stranka v tento moment odscrolovana - zamezi nezadouci pozici napr. pri history back */
			if (JAK.DOM.getScrollPos().y < 135) { /* 135 - hruba vzdalenost kdy jiz neni vyhledavaci input videt */
				JAK.gel(this.active.id + '-field').focus();
			}
		});
	}
};


JAK.Tabs.prototype._change = function (e, elm) {
	JAK.Events.cancelDef(e);
	var box = elm.searchItem.box;
	if (this.active.id != box.id) {
		var nameOfCLass = box.className;
		this.active.box.className = '';
		if(this.active.tab != null) {
			this.active.tab.className = '';
		}

		if(typeof this.active.a != 'undefined') {
			this.active.tab.className = 'with-choser';
		}

		if (!(nameOfCLass == 'active')) {
			/* reseni 3px bugu v IE u prvni zalozky*/
			if(JAK.Browser.client == 'ie' && JAK.Browser.version < 7 && elm.searchItem.num == 0) {
				elm.searchItem.tab.style.marginLeft = '0';
			}
			box.className = 'active';
			if (elm.searchItem.tab != null) {
				if(typeof elm.searchItem.a != 'undefined') {
					elm.searchItem.tab.className = 'act';
				} else {
					elm.searchItem.tab.className = 'active';
				}
			}
			var searchbox = JAK.gel(elm.searchItem.id + '-field');
			searchbox.value = JAK.gel(this.active.id + '-field').value;
			searchbox.focus();
			if (searchbox.setSelectionRange) {
				var len = searchbox.value.length * 2;
				searchbox.setSelectionRange(len, len);
			} else {
				searchbox.value = searchbox.value;
			}
		}

		// pokud je videt rozsirene hledani - schovam
		if (this.extendedVisibilityFlag == 1) {
			this.extTabCont.style.display = 'none';
			this.extendedVisibilityFlag = 0;
		}

		/* reseni 3px bugu v IE u prvni zalozky*/
		if(JAK.Browser.client == 'ie' && JAK.Browser.version < 7 && this.active.num == 0) {
			this.active.tab.style.marginLeft = '0px';
		}
		this.active = elm.searchItem;
		this.makeEvent('tabChange', { searchItem: elm.searchItem });

		if (elm.searchItem.id == 'goods') {
			var gcat = JAK.gel('g-categories');
			if (gcat != null) {
				gcat.style.width = ((JAK.gel('goods-field').offsetWidth - 28) + 'px');
			}
		}
	}
};

JAK.Tabs.prototype._initExtended = function moreSearch () {
	this.extTabCont.style.display = 'none';
	this.extendedVisibilityFlag = 0;
	this.eventTabClick = JAK.Events.addListener(this.extTab.getElementsByTagName('a')[0], 'click' , this, '_showExtend', false, true);

	/* presuneme v DOMu*/
	this.extTab.appendChild(this.extTabCont);

	var closeIMG =  JAK.cel('img');
	closeIMG.src = Homepage.CONF.PATH_IMG + '/2011/close.gif';
	closeIMG.id = 'extTab-close';

	this.seekBox = JAK.DOM.getElementsByClass('seek-sbox',this.extTabCont,'DIV')[0];
	this.seekBox.firstChild.parentNode.insertBefore(closeIMG,this.seekBox.firstChild);

	this.eventCloseClick = JAK.Events.addListener(closeIMG, 'click', this, this._showExtend, false, true);

	/* navesime na klik na odkaz cteni dat z formulare */
	this.links = JAK.DOM.getElementsByClass('service-url', this.seekBox, 'A');
	for (var i = 0; i < this.links.length; i++) {
		this.eventsCache['linkExt'+i] = JAK.Events.addListener(this.links[i], 'click', this, '_buildForm', false, true);
	}

	this.extCnt = JAK.gel('moreSearch-cnt');
};

JAK.Tabs.prototype._showExtend = function (e, elm){
	JAK.Events.cancelDef(e);

	if (this.extendedVisibilityFlag == 0) {
		this.extTabCont.style.display = 'block';
		this.extendedVisibilityFlag = 1;
	} else {
		this.extTabCont.style.display = 'none';
		this.extendedVisibilityFlag = 0;
	}
};

JAK.Tabs.prototype._buildForm = function (e, elm) {
	JAK.Events.cancelDef(e);
	var searchId = elm.id.split('-')[2];

	this.active.box.className = '';
	if(this.active.tab != null) {
		this.active.tab.className = '';
	}

	this.extTab.className = 'act';

	var val = JAK.gel(this.active.id + '-field').value;

	var a = this.extTab.getElementsByTagName('a')[0].innerHTML = elm.innerHTML;
	this.extTab.getElementsByTagName('a')[0].setAttribute("data-dot",elm.getAttribute("data-dot"));
	this.extTabCont.style.display = 'none';
	this.extendedVisibilityFlag = 0;

	this.extCnt.innerHTML = this.extForms[searchId].html;
	if(this.extForms[searchId].suggest) {
		suggestZboziInit();
	}

	var box = JAK.DOM.getElementsByClass('active', this.extCnt, 'DIV')[0];

	JAK.gel(box.id + '-field').value = val;

	var choser = this.extTab.getElementsByTagName('a')[0];
	if (elm.innerHTML.indexOf('t-select') == -1) {
		choser.innerHTML += '<span id="t-select"></span>';
		this.tSelect = JAK.gel('t-select');
		this.eventsCache['tSelect'] = JAK.Events.addListener(this.tSelect, 'click', this, '_showExtend', false, true);

		if (this.eventTabClick != null) {
			JAK.Events.removeListener(this.eventTabClick);
			this.eventTabClick = null;
		}
		this.eventsCache['choser'] = JAK.Events.addListener(choser, 'click', this, '_change', false, true);
	}

	JAK.gel(box.id + '-field').focus();

	this.tSelect = JAK.gel('t-select');
	choser.searchItem = {num:this.tabs.length, id:box.id, tab:this.extTab, box:box, a:choser};
	this.active = {num:this.tabs.length, id:box.id, tab:this.extTab, box:box, a:choser};
};

JAK.Tabs.prototype.addSeekForm = function (formObj) {
	this.extForms[formObj.seekId] = formObj;
};

JAK.Tabs.prototype._addQuery = function (e, elm) {
	var query = encodeURIComponent(JAK.gel(this.active.id + '-field').value);
	var groupId = elm.href.match(/groupId=(user|system)/)[0];
	elm.href = elm.href.replace(/&groupId=(user|system)/,'');

	var searchURLFinal = elm.href;

	if (!(groupId.indexOf('system') != -1)) {
		var url = searchURLFinal.substring(0, searchURLFinal.indexOf('&enco'))
		var encoding = searchURLFinal.substring(searchURLFinal.indexOf('&enco'), searchURLFinal.length);
		searchURLFinal = '/userSearch/?url=' + encodeURIComponent(url) + encoding + '&q=' + encodeURIComponent(query) +'&hashId=' + Homepage.CONF.HASHID;
	} else {
		searchURLFinal = searchURLFinal.replace('%s', query);
	}

	elm.href = searchURLFinal;
};
