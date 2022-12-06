/* katalog */

JAK.Catalogue = JAK.ClassMaker.makeClass({
	NAME:"Catalogue",
	VERSION:"1.0"
});

JAK.Catalogue.prototype.$constructor = function (parent,feedId) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}

	this.feedId = feedId;
	this.parent = parent;
	this.htmlObject = JAK.gel(parent);
	this.eventsCache = new Object();

	//this.abc = JAK.DOM.getElementsByClass('alphabet', this.htmlObject, 'UL')[0];
	this.list = JAK.DOM.getElementsByClass('cat-list', this.htmlObject, 'UL')[0];
	this.htmlTop = this.list.innerHTML;
	//this.activeABCLi = JAK.DOM.getElementsByClass('selected', this.abc, 'LI')[0];

	//this.abcLi = this.abc.getElementsByTagName('LI');

	this._sortCollsTimeout = this._sortCollsTmp.bind(this);
	this.listClone = this.list.cloneNode(true);

	this.cols = 0;
	this._sortCollsTimeout();
	this.eventsCache.resizator = JAK.Events.addListener(window, 'resize', this, '_sortCollsTimeout', false, true);
};

JAK.Catalogue.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Catalogue.prototype.init = function () {};

/* vola class Win pri pohzbu */
JAK.Catalogue.prototype.onMoveAction = function () {
	this._sortCollsTmp();
};

JAK.Catalogue.prototype._change = function (e, elm) {
	JAK.Events.cancelDef(e);
	/* aktivni zalozka */
	this.activeABCLi.className = '';
	this.activeABCLi = elm.parentNode;
	elm.parentNode.className = 'selected';

	this.letter = (elm.href.indexOf('.cz/katalog/') != -1 ? 'top' : elm.href.substring(elm.href.length-2,elm.href.length-1));
	if (this.letter != 'top') {
		var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
		rq.setCallback(this, '_process');
		rq.send('/jsCatalogueABC', 'hashId=' + Homepage.CONF.HASHID + '&letter='+ this.letter);
	} else {
		this._changeLetter();
	}
};

JAK.Catalogue.prototype._sortCollsTmp = function () {
	var itemsOrig = this.list.getElementsByTagName('LI');
	if (itemsOrig) {

		var itemsDOM = this.listClone.cloneNode(true).getElementsByTagName('LI');
		var items = new Array();

		for(var i = 0; i < itemsDOM.length; i++) {
			items[i] = itemsDOM[i];
		}

		var itemsLength = items.length;

		var cols = Math.floor((this.list.offsetWidth+22)/itemsOrig[0].offsetWidth);

		var lines = Math.floor(itemsLength/cols);
		if (lines*cols < itemsLength) {
			lines += 1;
		}


		if (lines - (cols*lines - itemsLength) < lines*0.5) {
			cols -= 1;
			lines = Math.ceil(itemsLength/cols);
		}


		if(cols == this.cols) {
			return 0;
		}

		this.cols = cols;
		var itemsOut = new Array;
		for (var i=0 ; i<lines ; i++) {
			for (var j=0 ; j<cols ; j++) {
				if ((j*lines+i)<(itemsLength)) {
					itemsOut.push(items[j*lines+i]);
				} else {
					/*var li = JAK.cel('li');
					li.innerHTML = '&nbsp';
					itemsOut.push(li);*/
				}
			}
		}

		while(this.list.childNodes.length) {
			this.list.removeChild(this.list.childNodes[0])
		}

		for (var i = 0; i < itemsOut.length; i++) {
			this.list.appendChild(itemsOut[i]);
		}

		this.list.style.display = 'block';
	} else {
		window.setTimeout(this._sortCollsTimeout, 500);
	}
};

JAK.Catalogue.prototype._process = function (response) {
	var data = eval("("+response+")");
	if (data.status == 500) {

	} else if (data.status == 200) {
		this.data = data;
		if (data.method == 'catalogueABC') {
			this._changeLetter();
		}
	} else if (data.status == 401) {
		Alert('Něco je špatně!');
	}
};

JAK.Catalogue.prototype._changeLetter = function () {
	if(this.letter != 'top') {
		var items = this.data.letters;
		this.list.innerHTML = '';
		this.list.className = 'cat-list-abc';
		for(var i = 0; i <  items.length; i++) {
			if(items[i].smallLetter == this.letter) {
				var list = items[i].items;
				for (var i = 0; i < list.length; i++) {
					var li = JAK.cel('li');
					li.innerHTML = '<a href="' + list[i].lnk + '">' + list[i].title + '</a>';
					this.list.appendChild(li);
				}
				break;
			}
		}
	} else {
		this.list.className = 'cat-list';
		this.list.innerHTML = this.htmlTop;
	}
};
