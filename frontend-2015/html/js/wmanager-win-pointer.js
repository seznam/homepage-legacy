// class pro vytvoreni ukazetele vlozeni
JAK.Wmanager.Win.Pointer = JAK.ClassMaker.makeClass({
	NAME:"Pointer",
	VERSION:"1.0"
});

// vybuildi a pripoji ukazatel umisteni do stranky
JAK.Wmanager.Win.Pointer.prototype.$constructor = function (winObj) {
	this.winObj = winObj;

	var html = winObj.htmlObject.cloneNode(false);
	html.id = html.id+'-pointer';
	html.className = 's_win_pointer';
	html.innerHTML = '<div class="s_win_pointer_background" style="background:#ffffcc; border:0px dotted orange; height:100%; position:relative;"></div>';
	html.style.width = '100%';
	html.style.height = (winObj.height - this.winObj.paddingTop) + 'px';

	this.newWin = winObj.htmlObject.parentNode.replaceChild(html,winObj.htmlObject);

	this.winPosX = winObj.winPosX;
	this.winPosY = winObj.winPosY;

	this.centerX = Math.round(winObj.width / 2) + this.winPosX;
	this.centerY = Math.round(winObj.height / 2) + this.winPosY;

	this.htmlObject = html;
};

JAK.Wmanager.Win.Pointer.prototype.$destructor = function () {
	if(this.htmlObject.parentNode) {
		this.htmlObject.parentNode.removeChild(this.htmlObject);
	}
	this.winObj = null;
	this.htmlObject = null;
	this.changedPosId = null;
	this.winPosX = null;
	this.winPosY = null;
	this.centerX = null;
	this.centerY = null;
};

JAK.Wmanager.Win.Pointer.prototype.move = function (item) {
	// jsem nad prazdnym
	if (item == null) {
		arguments[1].appendChild(this.htmlObject);

	} else {
		if(arguments[1] == -1) {
			if(item.htmlObject.nextSibling != null) {
				item.htmlObject.parentNode.insertBefore(this.htmlObject,item.htmlObject.nextSibling)
			} else {
				item.grid.appendChild(this.htmlObject);
			}
		} else {
			item.htmlObject.parentNode.insertBefore(this.htmlObject,item.htmlObject);
		}

		this.winPosX = JAK.DOM.getBoxPosition(this.htmlObject).left;
		this.winPosY = JAK.DOM.getBoxPosition(this.htmlObject).top;

		this.centerX = Math.round(item.width / 2) + this.winPosX;
		this.centerY = Math.round(item.height / 2) + this.winPosY;

		// prpocitame oknum pozice
		this.winObj.parentWindow.recalcWins(this.winObj);
	}
};
