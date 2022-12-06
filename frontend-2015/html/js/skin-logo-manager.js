/**
 * @class
 * trida repr. manazera skinu - vyrobi a ovlada pas se skiny
 * @augments JAK.ISignals
 * @property {int} synched urcuje zda ma probehnout synchronizace
 * @signal firstShow
 */
Homepage.SkinLogoManager = JAK.ClassMaker.makeClass({
	NAME: "Homepage.SkinLogoManager",
	VERSION: "1.0",
	IMPLEMENT: JAK.ISignals
})

Homepage.SkinLogoManager.prototype.$constructor = function (opt) {
	this._opt = {
		logo_elm_id			: '',
		logo_1_src			: '',
		logo_2_src			: '',
		logo_3_src			: '',
		logo_3_length		: 0,
		banned_skins_css_id	: [],
		skin_css_id         : 0,
		device				: 'desktop'
	};
	this._ec = [];

	this._logoImg = null;

	for (var i in opt) {
		this._opt[i] = opt[i];
	};

	JAK.Events.onDomReady(this, this._init);
};

Homepage.SkinLogoManager.prototype._init = function () {
	this._logoElm = JAK.gel(this._opt.logo_elm_id);

	if (this._logoElm) {
		this._logoImg = this._logoElm.getElementsByTagName('img')[0];
	};

	if (this._logoImg) {
		this.addListener('actualSkin', this._changeLogo.bind(this));

		// - nacachuji si loga;
		this._cacheLogo1 = new Image();
		this._cacheLogo1.src = this._opt.logo_1_src;

		this._cacheLogo2 = new Image();
		this._cacheLogo2.src = this._opt.logo_2_src;

		if (this._opt.logo_3_src) {
			// mame OnHover animovane logo

			if (this._opt.device == "desktop") {
				// na desktopu jej pouzijeme

				this._cacheLogo3 = new Image();
				this._cacheLogo3.src = this._opt.logo_3_src;
				if (this._opt.banned_skins_css_id.indexOf(this._opt.skin_css_id) == -1) {
					// nepruhledny skin
					this._logoImg.onmouseover = this.animateLogo.bind(this);
				} else {
					// pruhledny skin, pouzijeme zastupne sekundarni logo
					this._logoImg.src = this._cacheLogo2.src;
				}
			} else {
				// na telefonu a tablete pouzijeme zastupne sekundarni logo
				this._logoImg.src = this._cacheLogo2.src;
			};
		};
	};
};

Homepage.SkinLogoManager.prototype._changeLogo = function (signal) {
	var skinCssId = signal.data.staticCssId;

	if (typeof(skinCssId) == "undefined" || this._opt.banned_skins_css_id.indexOf(skinCssId) >= 0 || (this._opt.device != "desktop" && this._opt.logo_3_src)) {
		this._logoImg.src = this._cacheLogo2.src;
		this._logoImg.onmouseover = null;
	} else {
		if (this._logoImg.src == this._cacheLogo2.src) {
			// prepneme na 1 jen pokud ted mame 2, pripadnou 3 nechame dojet do konce

			this._logoImg.src = this._cacheLogo1.src;

			if (this._opt.logo_3_src && this._logoImg.onmouseover == null) {
				this._logoImg.onmouseover = this.animateLogo.bind(this);
			};
		};
	};
};

Homepage.SkinLogoManager.prototype.animateLogo = function () {
	var img = this._logoImg;
	var src1 = this._cacheLogo1.src;
	var src2 = this._cacheLogo2.src;
	var src3 = this._cacheLogo3.src;
    var duration = this._opt.logo_3_length; 

	if (img.src == src1) {
		// switchnout loga na dobu delky animace
		img.src = src3;
		setTimeout(function() {if (img.src == src3) {img.src = src1;};}, duration);
	};
};

