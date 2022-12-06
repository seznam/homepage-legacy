/**
 * @class
 * prepinani zalozek ve streamboxu
 * @property {obect} cont hlavni konteiner
 * @property {object} linkURL odkazy na A v menu
 * @property {object} moreLink odkaz na A Vice
 * @property {object} rq instance z XHR tridy umoznujici komunikaci
 * @param {string} cont IDcko contu
 * @param {int} feedId id feedu
 */
JAK.StreamBox = JAK.ClassMaker.makeClass({
	NAME:"JAK.StreamBox",
	VERSION:"1.0"
});

JAK.StreamBox.prototype.$constructor = function (cont, feedId) {
	// nastaveni requestu
	this.feedId = feedId;

	this.LIMIT_1 = 490; // vejde se vse
	this.LIMIT_2 = 418; // maximum pro 3 obrazky
	this.LIMIT_3 = 370; 

	this.TEXT_1 = 'Další <br/>videa'; // vejde se vse
	this.TEXT_2 = 'Další videa &raquo;'; // maximum pro 3 obrazky

	this.titleHeight = 30;

	this._cont = JAK.gel(cont);
	this._dom = {};
	this._dom.movies = JAK.DOM.getElementsByClass('movie', this._cont, 'div');
	this._dom.more = JAK.gel('more-news');
	this._dom.more.a = this._dom.more.getElementsByTagName('a')[0];
	this._dom.push = JAK.DOM.getElementsByClass('push', this._cont, 'div')[0];

	this._dom.titles = JAK.DOM.getElementsByClass('titShow', this._cont, 'span');
	this._dom.ep = JAK.DOM.getElementsByClass('episode', this._cont, 'span');

	this.clientWidth = null;
	this.clientHeight = null;

	this._reCalc();
	JAK.Events.addListener(window, 'resize', this, this._resize);
	JAK.Events.onDomReady(this, '_reCalc');
};

JAK.StreamBox.prototype._resize = function () {
	var clientWidth = window.innerWidth || document.documentElement.clientWidth; 
	var clientHeight = window.innerHeight || document.documentElement.clientHeight;
	if (clientWidth != this.clientWidth || clientHeight != this.clientHeight ) {
		this.clientWidth = clientWidth;
		this.clientHeight = clientHeight;

		this._reCalc();
	} 
};

JAK.StreamBox.prototype._reCalc = function () {
	var width = this._dom.push.offsetWidth;
	// tri vedle sebe
	if (width > this.LIMIT_1) {
		this._dom.more.a.innerHTML = this.TEXT_2;
		JAK.DOM.addClass(this._dom.more, 'under');
		JAK.DOM.removeClass(this._dom.more, 'beside');
		this._dom.movies[2].style.display = 'block';
		this.titleHeight = 30;
		// tri vedle sebe + odkaz dalsi pod
	} else if (width < this.LIMIT_1 && width >= this.LIMIT_2){
		this._dom.more.a.innerHTML = this.TEXT_2;
		JAK.DOM.addClass(this._dom.more, 'under');
		JAK.DOM.removeClass(this._dom.more, 'beside');
		this._dom.movies[2].style.display = 'block';
		this.titleHeight = 30;
	} else if (width < this.LIMIT_2 && width >= this.LIMIT_3 ) {
		this._dom.more.a.innerHTML = this.TEXT_1;
		JAK.DOM.addClass(this._dom.more, 'beside');
		JAK.DOM.removeClass(this._dom.more, 'under');
		this._dom.movies[2].style.display = 'none';
		this.titleHeight = 45;
	} else if (width < this.LIMIT_3 ) {
		this._dom.more.a.innerHTML = this.TEXT_2;
		JAK.DOM.addClass(this._dom.more, 'under');
		JAK.DOM.removeClass(this._dom.more, 'beside');
		this._dom.movies[2].style.display = 'none';
		this.titleHeight = 45;
	}
	//orezavani titulku
	//this._titleCuter();
}

JAK.StreamBox.prototype._titleCuter = function () {

	
	if (this._dom.ep.length > 0) {
		for (var i = 0; i < this._dom.titles.length; i++) {
			this._dom.titles[i].style.height = 'auto';
			if (this._dom.titles[i].offsetHeight > 45){
				this._dom.titles[i].style.overflow = 'hidden';
				if (this.titleHeight > 30){
					this._dom.titles[i].style.height = 3.9 + 'em';
				}else{
					if (this.titleHeight < 30){
						this._dom.titles[i].style.height = 'auto';
					}else {
						this._dom.titles[i].style.height = 2.6 + 'em';
					}
				}
				this._dom.ep[i].style.overflow = 'hidden';
				this._dom.ep[i].style.height = 1.2 + 'em';
			};
		};
	};
};

/* vola class Win pri pohzbu */
JAK.StreamBox.prototype.onMoveAction = function () {
	this._reCalc();
};
