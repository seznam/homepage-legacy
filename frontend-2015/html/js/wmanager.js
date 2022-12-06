/* -------------------------------------------
 * Pohyb okynek po plose monitoru
 *
 * --------------------------------------------*/
JAK.Wmanager = JAK.ClassMaker.makeClass({
	NAME:"Wmanager",
	VERSION:"1.0"
});

JAK.Wmanager.EMPTY_STRING = "Na toto místo můžete<br /> přesunout další obsah.";

JAK.Wmanager.getComputedStyle = function (obj, property) {
	var prop = property.split('-');
	if(prop[1]) {
		var p = prop[1].substring(0,1).toUpperCase();
		prop = prop[0] + p + prop[1].substring(1,prop[1].length);
	}
	if (obj.currentStyle) {
		var val = obj.currentStyle[prop];
	} else {
		if(!JAK.Browser.client == 'safari' && !JAK.Browser.client == 'konqueror') {
			property = prop;
		}
		var val = document.defaultView.getComputedStyle(obj, null).getPropertyValue(property);
	}
	return val;
};

JAK.Wmanager.prototype.$constructor = function () {
	this.gadgets = new Array();

	this.clientWidth = null;
	this.clientHeight = null;
};

// pripravi pracovni plochu
JAK.Wmanager.prototype.init = function (desktop) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}

	// w manager je vlastne okno
	var desktop = JAK.gel(desktop);
	this.desktop = {};

	// mrizka
	this.desktop.grids = {};
	this.desktop.grids.htmlObjects = [];

	for (var i=0;i<desktop.childNodes.length;i++) {
		var child = desktop.childNodes[i];
		if (child.id && child.id.match(/^col_/)) {
			this.desktop.grids.htmlObjects.push(child);
		}
	}

	// pozice mrizky
	this.recalcGrid();
	this._syncEmpty();

	this.desktop.win = new JAK.Wmanager.Win(desktop);

	// projdu desktop a najdu v nem okna nejvyssi urovne
	var wins = JAK.DOM.getElementsByClass("s_win", desktop, null);
	var winsLen = wins.length;

	// vytvorim okna
	for(var i = 0 ; i < winsLen; ++i) {
		this.addWin(wins[i]);
	};

	// na resize prepocitame
	JAK.Events.addListener(window, "resize", this, this.recalcAll, false, true);

	// pozice okna
	this.pos = '';
};

JAK.Wmanager.prototype.addWin = function (win) {
	this.createWindow(win);
}

JAK.Wmanager.prototype.recalcAll = function () {
	var clientWidth = window.innerWidth || document.documentElement.clientWidth; 
	var clientHeight = window.innerHeight || document.documentElement.clientHeight;
	if (clientWidth != this.clientWidth || clientHeight != this.clientHeight ) {
		this.clientWidth = clientWidth;
		this.clientHeight = clientHeight;

		this._recalcAllTmp();
	} 
}

// prepocita okna a mrizku - pozice
JAK.Wmanager.prototype._recalcAllTmp = function () {
	this.recalcGrid();
	this.recalcWins(null);
};

// prepocita pozice mrizky
JAK.Wmanager.prototype.recalcGrid = function () {
	var arr = this.desktop.grids.htmlObjects;
	for (var i=0;i<arr.length;i++) {
		var node = arr[i];
		var pos = JAK.DOM.getBoxPosition(node);
		node.posX1 = pos.left;
		node.posX2 = pos.left + node.offsetWidth;
	}
};

// vytvari nova okna
JAK.Wmanager.prototype.createWindow = function (win) {
	// pridani okna do pole
	this.desktop.win.childWins.push(new JAK.Wmanager.Win(win,this));
};

JAK.Wmanager.prototype.removeWin = function (win) {
	var idx = this.desktop.win.childWins.indexOf(win);
	if (idx != -1) { this.desktop.win.childWins.splice(idx,1); }

	if(this.desktop.win.childWins.length == 0) {
		JAK.gel('outer-	page').className = 'emptypage';
	}
};

JAK.Wmanager.prototype.locatePointer = function (win) {
	var centerX = Math.round(win.width / 2) + win.winPosX;
	var centerY = Math.round(win.height / 2) + win.winPosY;

	if (win.relativeParentWindow.style.position == 'relative') {
		centerX  = centerX  + win.relativeParentWindow.offsetLeft;
		centerY = centerY + win.relativeParentWindow.offsetTop;
	}

	var nearestItem = false;
	var nearest = Number.POSITIVE_INFINITY;

	var column = false; /* nad kterym sloupcem se nachazime? */
	var columns = this.desktop.grids.htmlObjects;
	var index = -1;
	for (var i=0;i<columns.length;i++) {
		var col = columns[i];
		if (centerX > col.posX1 && centerX < col.posX2) {
			column = col;
			index = i;
		}
	}
	if (!column) { return; }

	/* projit vsechny okna a zjistit, ktere je nejbliz presouvanemu */
	for (var i=0;i<this.desktop.win.childWins.length;i++) {
		var item = this.desktop.win.childWins[i];
		if (win === item) { continue; } /* teda, ne uplne _vsechny_, napriklad to tazene ignorujeme */
		if (item.grid.id != column.id) { continue; } /* bereme jen okna ze sloupce, nad kterym se nachazime */
		if (JAK.DOM.hasClass(item.htmlObject, 'disableMove')) { continue; }
		/* vzdalenost stredu */
		var dist = Math.pow(item.centerX - centerX,2) + Math.pow(item.centerY - centerY,2);

		if (dist < nearest) {
			nearestItem = item;
			nearest = dist;
		}
	}
	var children = JAK.DOM.getElementsByClass('s_win', column,'DIV');
	var flagEmpty = 0;
	for (var d = 0; d < children.length; d++) {
		if(JAK.DOM.hasClass(children[d], 'disableMove')) {
			flagEmpty++;
		}
	}

	if (children.length == flagEmpty) { /* pokud je grid do ktereho chci pretahnout prazdny */
		win.pointer.move(null,column); /* presun pointeru */

		if (index+1 < this.desktop.grids.htmlObjects.length) {
			// win.htmlObject.style.width = column.offsetWidth + 'px'; /* zdedit sirku z noveho rodice */
		}
	} else if (nearestItem) {
		if (centerY < nearestItem.centerY) { /* porovnat vysku */
			win.pointer.move(nearestItem,1); /* nad */
		} else {
			win.pointer.move(nearestItem,-1); /* pod */
		}
		// win.htmlObject.style.width = nearestItem.width + 'px'; /* zdedit vysku z nejblizsiho */
	}
};

JAK.Wmanager.prototype.recalcWins = function (ignoreWin) {
	for (var i=0;i<this.desktop.win.childWins.length;i++) {
		var item = this.desktop.win.childWins[i];
		if (item == ignoreWin) { continue; }
		if (item) { item.recalcWin(); }
		if (item.htmlObject.gadget) {
			if (item.htmlObject.gadget.extGadg && item.htmlObject.gadget.extGadg.onMoveAction) {
				item.htmlObject.gadget.extGadg.onMoveAction();
			}
		}
	}
};

JAK.Wmanager.prototype.setColumns = function(count) { /* zmenit pocet sloupcu */
	var d = this.desktop.win.htmlObject;
	var l = this.desktop.grids.htmlObjects.length;

	if (l < count) { /* 2->3 */
		var n = JAK.cel("div", null, "col_3");
		n.innerHTML = "&nbsp;";
		var last = this.desktop.grids.htmlObjects[1];
		last.parentNode.insertBefore(n, last.nextSibling);
		this.desktop.grids.htmlObjects.push(n);
		this._syncEmpty();
	} else if (l > count) { /* 3->2 */
		var last = this.desktop.grids.htmlObjects.pop();
		last.parentNode.removeChild(last);
	}


	/* zrusit col_* classu rodici */
	var root = this.desktop.win.htmlObject;
	var cnames = root.className.split(" ");
	var arr = [];
	for (var i=0;i<cnames.length;i++) {
		var c = cnames[i];
		if (!(c.match(/^col/))) { arr.push(c); }
	}

	arr.push("col_"+count);
	root.className = arr.join(" ");

	var page = JAK.gel("outer-page");
	JAK.DOM.removeClass(page,"widepage");
	if (count > 2) { JAK.DOM.addClass(page,"widepage"); }

	this.recalcGrid();
}

JAK.Wmanager.prototype.reduceColumns = function() { /* prehazet widgety z 3. do 2. sloupce */
	var col2 = this.desktop.grids.htmlObjects[1];
	var col3 = this.desktop.grids.htmlObjects[2];
	var wins = JAK.DOM.getElementsByClass('s_win', col3, 'DIV');
	if (!wins.length) { return; }

	for (var i=0;i<wins.length;i++) {
		col2.appendChild(wins[i]);
	}
	this.recallcPos();
}

JAK.Wmanager.prototype.recallcPos = function () { /* skoncilo tahani, reagujeme na nove rozlozeni */
	/* prepocitat vsechno */
	this.recalcAll();

	var arr = [];
	var objs = this.desktop.grids.htmlObjects;
	for (var i=0;i<objs.length;i++) {
		var col = objs[i];
		var a = [];
		var wins = JAK.DOM.getElementsByClass('s_win', col, 'DIV');
		for (var j=0;j<wins.length;j++) {
			var win = wins[j];
			if (win.feedId != '') {
				a.push(win.feedId);
			}
		}
		arr.push(a.join(","));
	}
	var ids = arr.join(":");

	// nastaveni requestu
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsFeedMove', 'hashId=' + Homepage.CONF.HASHID + '&columns=' + ids);

	this._syncEmpty();
};

JAK.Wmanager.prototype._syncEmpty = function() {
	var divs = this.desktop.grids.htmlObjects;
	for (var i=0;i<divs.length;i++) {
		var div = divs[i];
		var wins = JAK.DOM.getElementsByClass('s_win', div, 'DIV');
		var empty = JAK.DOM.getElementsByClass('empty-col', div, 'DIV');
		if (!wins.length && !empty.length) {
			var e = JAK.cel("div","empty-col");
			e.innerHTML = this.constructor.EMPTY_STRING;
			div.appendChild(e);
		} else if (wins.length && empty.length) {
			empty[0].parentNode.removeChild(empty[0]);
		}
	}
}

JAK.Wmanager.prototype._process = function (response){
	var data = eval("("+response+")");
	if(data.status == 500) {

	} else if(data.status == 200) {
		this.data = data;
		if(data.method == 'getFeedList') {
			this._build();
		} else if(data.method == 'confirm') {
			this._finalize();
		}
	} else if(data.status == 401) {
		alert('Něco je špatně!');
	}
};

JAK.Wmanager.prototype._finalize = function () {
	// zatim nedela nic asi ani nebude
};
