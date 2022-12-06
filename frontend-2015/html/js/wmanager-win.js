// konstruktor okna - staticka vlastnost tridy Wmanager
JAK.Wmanager.Win = JAK.ClassMaker.makeClass({
	NAME:"Win",
	VERSION:"1.0"
});

JAK.Wmanager.Win.prototype.$constructor = function (win,parentWindow) {
	this.scrolling = 0; /* 1 dolu, -1 nahoru */
	this.scrollAmount = 10;
	this.scrollThreshold = 150;
	this.scrollFrequency = 20;
	this.scrollTimer = false;

	this.disableMove = (JAK.DOM.hasClass(win, 'disableMove'));

	this._scroll = this._scroll.bind(this);

	//nadrazene okno
	this.parentWindow = parentWindow ? parentWindow : null;
	this.childWins = [];  // zasobnik oken - detatek

	this.htmlObject = win;

	if (this.parentWindow != null) {
		this.feedId = this.htmlObject.feedId;
		// zasobnik akci - udalosti
		this.actions = new Object();

		// ziska title a nastavi kurzor
		this.title = this._getTitle();
		this.titleName = this.title.getElementsByTagName('a')[0] ? this.title.getElementsByTagName('a')[0].innerHTML : '';

		if (!this.disableMove) {
			this.title.style.cursor = 'move';
		}

		this.winPosX = JAK.DOM.getBoxPosition(this.htmlObject).left;
		this.winPosY = JAK.DOM.getBoxPosition(this.htmlObject).top;

		this.width = win.offsetWidth;
		this.height = win.offsetHeight;

		this.relativeParentWindow = this.parentWindow.desktop.win.htmlObject;

		this.originalWidth = win.offsetWidth;
		this.originalHeight = win.offsetHeight;

		this.winPosX = JAK.DOM.getBoxPosition(this.htmlObject).left;
		this.winPosY = JAK.DOM.getBoxPosition(this.htmlObject).top;

		this.winOrigPosX = JAK.DOM.getBoxPosition(this.htmlObject).left;
		this.winOrigPosY = JAK.DOM.getBoxPosition(this.htmlObject).top;

		// center okna
		this.setCenter();

		this.grid = win.parentNode;

		this.isMoved = false;

		//navesi udalosti
		this._addListeners();
	}
};

JAK.Wmanager.Win.prototype.$destructor = function () {
	for (i in this.actions) {
		JAK.Events.removeListener(this.actions[i]);
	}
	this.parentWindow.removeWin(this);
};

// ziska html titulek
JAK.Wmanager.Win.prototype._getTitle = function () {
	var title = JAK.DOM.getElementsByClass("title",this.htmlObject,null)[0];
	return title;
};

// navesi udalosti ktere jsou potreba pro start
JAK.Wmanager.Win.prototype._addListeners = function () {
	if (this.parentWindow != null) {
		if (!this.disableMove) {
			//drag za title
			this.actions.startDrag = JAK.Events.addListener(this.title, "mousedown", this, this._startDrag, false, true);
			//drag za pripadnou ikonku v title
			var icoElms = JAK.DOM.getElementsByClass("ico", this.title, "span");
			if (icoElms.length) {
				this.actions.startDrag = JAK.Events.addListener(icoElms[0], "mousedown", this, this._startDrag, false, true);
			}
			this.actions.mouseOverAction = JAK.Events.addListener(this.title, "mouseover", this, this._mouseOverDelay, false, true);
			this.actions.mouseOutAction = JAK.Events.addListener(this.title, "mouseout", this, this._mouseOutDelay, false, true);
		}

		for (var i = 0; i < this.title.childNodes.length; i++) {
			if(this.title.childNodes[i].nodeType == 1 && JAK.DOM.hasClass(this.title.childNodes[i], 'text') != true) {
				this.actions['stopElms' + i] = JAK.Events.addListener(this.title.childNodes[i], "mousedown", JAK.Events, 'stopEvent', false, true);
			}
		}
	}

	this.closeLink = JAK.DOM.getElementsByClass('close-win-img', this.htmlObject, 'a')[0];
	if (this.closeLink != null) {
		this.actions.closeLinkClick = JAK.Events.addListener(this.closeLink, "click", this, this._closeWin, false, true);
	}
};

JAK.Wmanager.Win.prototype._closeWin = function (e, elm) {
	JAK.Events.cancelDef(e);
	this.closed = true;
	this.htmlObject.style.display = 'none';

	this.htmlClose = JAK.cel('div');
	this.htmlClose.className = 'close-confirm-win';
	this.htmlClose.innerHTML = 'Chcete okno <strong>' + this.titleName + '</strong> opravdu zavřít? <a class="yesC" href="">ANO</a> / <a class="noC" href="">NE</a>';

	this.htmlObject.parentNode.insertBefore(this.htmlClose,this.htmlObject);

	this.yesC = JAK.DOM.getElementsByClass('yesC',this.htmlClose, 'A')[0];
	this.noC = JAK.DOM.getElementsByClass('noC',this.htmlClose, 'A')[0];
	this.actions.yesC = JAK.Events.addListener(this.yesC, "click", this, this._close, false, true);
	this.actions.noC = JAK.Events.addListener(this.noC, "click", this, this._open, false, true);

	this.parentWindow._syncEmpty();
};

JAK.Wmanager.Win.prototype._close = function (e, elm) {
	JAK.Events.cancelDef(e);
	this.killPRompt();

	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this.parentWindow, '_process');
	rq.send('/jsFeedRemove','hashId=' + Homepage.CONF.HASHID + '&feedId=' + this.feedId);

	this.htmlClose.parentNode.removeChild(this.htmlClose);
	this.$destructor();
	this.htmlObject.parentNode.removeChild(this.htmlObject);
};

JAK.Wmanager.Win.prototype._open = function (e, elm) {
	JAK.Events.cancelDef(e);
	this.killPRompt();

	this.htmlClose.parentNode.removeChild(this.htmlClose);
	this.htmlObject.style.display = 'block';
};

JAK.Wmanager.Win.prototype.killPRompt = function () {
	JAK.Events.removeListener(this.actions.yesC);
	JAK.Events.removeListener(this.actions.noC);
	this.actions.yesC = null; delete(this.actions.yesC);
	this.actions.noC = null; delete(this.actions.noC);
};

/* zpozdene volani onMouseOver na hlavicku presouvanzch bloku */
JAK.Wmanager.Win.prototype._mouseOverDelay = function (e, elm) {
	if (this.htmlObject._timoutOver) clearTimeout(this.htmlObject._timoutOver);
	if (this.htmlObject._timoutOut) clearTimeout(this.htmlObject._timoutOut);

	if (JAK.DOM.hasClass(this.htmlObject, 'moved')) {
		JAK.DOM.removeClass(this.htmlObject, 'moved');
		this._mouseOver(e, elm);
	} else {
		this.htmlObject._timoutOver = setTimeout(this._mouseOver.bind(this, [e, elm]), 250);
	}
};

JAK.Wmanager.Win.prototype._mouseOver = function (e, elm) {
	if(this.htmlObject.className.indexOf(' moved') == -1) {
		this.htmlObject.className += ' moved';
	}
};

JAK.Wmanager.Win.prototype._mouseOutDelay = function (e, elm) {
	this.htmlObject._timoutOut = setTimeout(this._mouseOut.bind(this, [e, elm]), 5);
}

JAK.Wmanager.Win.prototype._mouseOut = function (e, elm) {
	if (this.htmlObject._timoutOver) clearTimeout(this.htmlObject._timoutOver);
	if (this.htmlObject._timoutOut) clearTimeout(this.htmlObject._timoutOut);

	this.htmlObject.className = this.htmlObject.className.replace(' moved', '');
}

// pri mouse down inicializuje tahnuti
JAK.Wmanager.Win.prototype._startDrag = function (e, elm) {
	var target = JAK.Events.getTarget(e);
	if (target.tagName.toLowerCase() == "a") {
		return;
	}

	if(JAK.Browser.client == 'ie' || JAK.Browser.client == 'opera') {

		if(e.srcElement && e.srcElement.nodeName.toLowerCase() == 'a' && e.srcElement.parentNode.className == 'text') {
			document.location = e.srcElement.href;
		}
		if( JAK.Browser.client == 'opera' && JAK.Browser.mouse.middle == e.button) {
			JAK.Events.cancelDef(e);
			return 0;
		}
	}
	//JAK.Events.cancelBuble(e);

	JAK.Events.cancelDef(e);

	if (!JAK.DOM.hasClass(this.htmlObject, 'moved')) {
		this._mouseOver(e, this.htmlObject);
	}

	this.paddingTop = parseInt(JAK.Wmanager.getComputedStyle(this.htmlObject,'padding-top'));

	if(JAK.flags.getFlagValue('gagdetSettings') == 'opened') {
		return 0;
	}
	if (this.isMoved != true) {
		this.isMoved = false;

		this.ieFix = JAK.Browser.client == 'ie' ? 8 : 0;

		//nastavi pozicovani
		this.winPosX = JAK.DOM.getBoxPosition(this.htmlObject).left;
		this.winPosY = JAK.DOM.getBoxPosition(this.htmlObject).top + this.ieFix;
		if (this.relativeParentWindow.style.position == 'relative') {
			this.winPosX = this.winPosX - this.relativeParentWindow.offsetLeft;
			this.winPosY = this.winPosY - this.relativeParentWindow.offsetTop;
		}


		this.width = this.htmlObject.offsetWidth;
		this.height = this.htmlObject.offsetHeight;

		this.originalWidth = this.htmlObject.offsetWidth;
		this.originalHeight = this.htmlObject.offsetHeight;

		// nahodime ukazetel polohy
		this.pointer = new JAK.Wmanager.Win.Pointer(this);
		this.htmlObject = this.pointer.newWin;

		this.htmlObject.style.position = 'absolute';

		this.htmlObject.style.top = (this.winPosY) + 'px';
		this.htmlObject.style.left = (this.winPosX) + 'px';

		this.pointer.htmlObject.parentNode.parentNode.appendChild(this.htmlObject);

		this.htmlObject.style.width = (this.pointer.htmlObject.offsetWidth) + 'px';

		this.winOrigPosX = JAK.DOM.getBoxPosition(this.htmlObject).left;
		this.winOrigPosY = JAK.DOM.getBoxPosition(this.htmlObject).top + this.ieFix;

		// startovaci pozice mysi
		var mouseXStartPos = e.clientX;
		var mouseYStartPos = e.clientY;

		this.driftX = Math.abs(mouseXStartPos - this.winPosX + JAK.DOM.getScrollPos().x);
		this.driftY = Math.abs(mouseYStartPos - this.winPosY + JAK.DOM.getScrollPos().y);

		this.actions.move = JAK.Events.addListener(document, "mousemove", this, this._move, false, true);
		this.actions.endDrag = JAK.Events.addListener(document, "mouseup", this, this._endDrag, false, true);

		this._currentGadget = this.htmlObject.gadget.extGadg;
	}

};

// tahnuti mysi
JAK.Wmanager.Win.prototype._move = function (e, elm) {
	JAK.DOM.addClass(this.htmlObject, 'dragged');
	this.isMoved = true;

	/* OZ: kod na spusteni scrollovani, je-li treba */
	var s = this._checkScroll(e);

	var mouseX = e.clientX + JAK.DOM.getScrollPos().x;
	var mouseY = e.clientY + JAK.DOM.getScrollPos().y;

	this.winPosX = mouseX - this.driftX;
	this.winPosY = mouseY - this.driftY;

	this.htmlObject.style.top = this.winPosY + 'px';
	this.htmlObject.style.left = this.winPosX + 'px';

	// vyvareni mista - vlastnost wmanagera
	this.parentWindow.locatePointer(this);

	JAK.Events.cancelDef(e);

};

// konec tazeni - pusteni tlacitka mysi
JAK.Wmanager.Win.prototype._endDrag = function (e, elm) {

	JAK.DOM.removeClass(this.htmlObject, 'dragged');
	this._stopScroll();

	this._mouseOut(e, elm);

	// zrusim udalosti
	this.isMoved = false;

	JAK.Events.removeListener(this.actions.move);
	JAK.Events.removeListener(this.actions.endDrag);

	this.htmlObject.style.position = '';
	this.htmlObject.style.top = '';
	this.htmlObject.style.left = '';
	this.htmlObject.style.width = 'auto';

	this.pointer.htmlObject = this.pointer.htmlObject.parentNode.replaceChild(this.htmlObject,this.pointer.htmlObject);

	this.width = this.htmlObject.offsetWidth;
	this.height = this.htmlObject.offsetHeight;

	this.originalWidth = this.htmlObject.offsetWidth;
	this.originalHeight = this.htmlObject.offsetHeight;

	this.grid = this.htmlObject.parentNode;

	this.ieFixSend = JAK.Browser.client == 'ie' ? this.paddingTop : 0;

	//zavolame prepocet pozic a odesleme na server
	if ((this.winOrigPosY != (JAK.DOM.getBoxPosition(this.htmlObject).top + this.ieFixSend))
		|| (this.winOrigPosX != (JAK.DOM.getBoxPosition(this.htmlObject).left))) {
		this.parentWindow.recallcPos();
	}

	if(this._currentGadget && this._currentGadget.onMoveAction){
		this._currentGadget.onMoveAction();
		this._currentGadget = null;
	}

	this.pointer.$destructor();
};

// spocita stred okna
JAK.Wmanager.Win.prototype.setCenter = function () {
	this.centerX = Math.round(this.width / 2) + this.winPosX;
	this.centerY = Math.round(this.height / 2) + this.winPosY;
};

// prepocita rozmery a umisteni okna
JAK.Wmanager.Win.prototype.recalcWin = function () {
	this.winPosX = JAK.DOM.getBoxPosition(this.htmlObject).left;
	this.winPosY = JAK.DOM.getBoxPosition(this.htmlObject).top;

	this.winOrigPosX = JAK.DOM.getBoxPosition(this.htmlObject).left;
	this.winOrigPosY = JAK.DOM.getBoxPosition(this.htmlObject).top;

	this.width = this.htmlObject.offsetWidth;
	this.height = this.htmlObject.offsetHeight;

	this.setCenter();
};

JAK.Wmanager.Win.prototype._startScroll = function(direction) {
	if (this.scrolling) { return; }
	this.scrolling = direction;
	this._scroll();
	this.scrollTimer = setInterval(this._scroll, this.scrollFrequency);
}

JAK.Wmanager.Win.prototype._stopScroll = function(direction) {
	this.scrolling = 0;
	if (this.scrollTimer) {
		clearInterval(this.scrollTimer);
		this.scrollTimer = false;
	}
}

JAK.Wmanager.Win.prototype._checkScroll = function(e) {
	var win = JAK.DOM.getDocSize();
	var s = JAK.DOM.getScrollPos();


	if (e.clientY < this.scrollThreshold && s.y > 0) {
		this._startScroll(-1);
	} else if (e.clientY + this.scrollThreshold > win.height &&
			s.y < (this.relativeParentWindow.offsetTop+this.relativeParentWindow.clientHeight)) {
		this._startScroll(1);
	} else { 
		this._stopScroll(); 
	}
}

JAK.Wmanager.Win.prototype._scroll = function() {
	var win = JAK.DOM.getDocSize();
	var amount = this.scrollAmount * this.scrolling;

	var s = JAK.DOM.getScrollPos();
	if (s.y + amount < 0) { amount = -s.y; }

	if (this.scrolling == 1 && (s.y > (this.relativeParentWindow.offsetTop+this.relativeParentWindow.clientHeight-win.height))) {
		return;
	}

	this.winPosY += amount;
	this.htmlObject.style.top = this.winPosY + 'px';

	if (JAK.Browser.client == "safari" || JAK.Browser.client == "chrome") {
		document.body.scrollTop += amount;
	} else {
		document.documentElement.scrollTop += amount;
	}

	// vytvareni mista - vlastnost wmanagera
	this.parentWindow.locatePointer(this);

}
