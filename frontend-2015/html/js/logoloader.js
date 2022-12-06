JAK.LogoLoader = JAK.ClassMaker.makeClass({
	NAME:"LogoLoader",
	VERSION:"1.0"
});

JAK.LogoLoader.prototype.$constructor = function (logoSrc, title) {
	this.eventsCache = new Object();
	this.animatedLogo = JAK.cel('img');
	this.animatedLogo.style.position = 'absolute';
	this.animatedLogo.style.top = '-4000px';
	this.animatedLogo.style.left = '-4000px';
	this.logoSrc = logoSrc
	this.staticLogo = null;
	this.title = title;
	this.init();
};

JAK.LogoLoader.prototype.$destructor = function () {
	for(var i in this) {
		this[i] = null;
	};
};

JAK.LogoLoader.prototype.init = function () {
	document.body.insertBefore(this.animatedLogo,document.body.firstChild);
	this.eventsCache['load'] = JAK.Events.addListener(this.animatedLogo, 'load', this, '_checkReadyState', false, true);

	this.staticLogo = JAK.gel('seznam-logo').getElementsByTagName('img')[0];
	this.animatedLogo.src = this.logoSrc;
};

JAK.LogoLoader.prototype._checkReadyState = function (e, elm) {
	this.staticLogo.src = this.animatedLogo.src;
	if (this.title) {
		this.staticLogo.title = this.title;
		this.staticLogo.alt = this.title;
	}
	this.animatedLogo.parentNode.removeChild(this.animatedLogo);
};
