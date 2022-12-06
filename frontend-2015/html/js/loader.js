JAK.Loader = JAK.ClassMaker.makeClass({
	NAME:"Loader",
	VERSION:"1.0"
});

JAK.Loader.prototype.$constructor = function () {
	this.html = JAK.cel('div');
	this.html.className = 'loader';
	this.html.innerHTML = 'Čekejte prosím';
	this.html.style.display = 'none';
	this.active = false;
	this.currentlyRunning = 0;
	this.hideTimer = this._hideTMP.bind(this); // pouziva se i zvenci

	this.dFlag = false;
	JAK.Events.onDomReady(this, '_DOMFlag');
};

JAK.Loader.prototype._DOMFlag = function () {
	this.dFlag = true;
}

JAK.Loader.prototype.$destructor = function () {
	this.html.parentNode.removeChild(this.html);

	for(var i in this) {
		this[i] = null;
	}
};

JAK.Loader.prototype.init = function () {};

JAK.Loader.prototype.show = function (notAutoHide) {
	var controls = JAK.gel('controls');
	var center = JAK.DOM.getElementsByClass('center', controls,'DIV')[0];
	var body = document.getElementsByTagName('body')[0];

	if (!JAK.DOM.getElementsByClass('loader', body, 'DIV')[0]) { //!JAK.DOM.getElementsByClass('loader', controls, 'DIV')[0]
		if (this.dFlag) {
			body.appendChild(this.html);
		} else {
			body.insertBefore(this.html,body.firstChild);
		}
	}

	this.currentlyRunning++;
	if (!this.active) {
		var docSize = JAK.DOM.getDocSize();
		var scroll = JAK.DOM.getScrollPos();
		this.html.style.display = 'block';
		this.html.style.top = (Math.round(docSize.height/2) + scroll.y - 25) + 'px';
		this.html.style.left = (Math.round(docSize.width/2) + scroll.x - 75) + 'px';

		this.active = true;
        if (!notAutoHide) {
		    this.hide();
        }
	}
};

JAK.Loader.prototype.hide = function () {
	if(this.timer) {
		window.clearTimeout(this.timer);
		this.timer = null;
	}
	this.timer = window.setTimeout(this.hideTimer, 20000);
};

JAK.Loader.prototype.quickHide = function () {
	this._hideTMP();
};

JAK.Loader.prototype._hideTMP = function () {
	if(this.currentlyRunning > 0) {
		this.currentlyRunning--;
	}

	if (this.active && this.currentlyRunning <= 0) {
		this.html.style.display = 'none';
		this.active = false;
	}
};

JAK.loader = new JAK.Loader();
