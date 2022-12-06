/**
 * @class
 * JAK.Homepage.RSS pridani feedu z cizi stranky,
 */
JAK.Homepage.RSS.AddForeignFeed = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.RSS.AddForeignFeed",
	VERSION:"1.0"
})

JAK.Homepage.RSS.AddForeignFeed.prototype.$constructor = function (parent, option) {
	this.parent = parent;
	this.dom = {};
	this.option = option;
	this.ev = {};
	this.html = {};
	this.requestCount = 2;

	this.destructorBindCall = this.$destructor.bind(this)
}

JAK.Homepage.RSS.AddForeignFeed.prototype.$destructor = function () {
	for (var i in this.ev) {
		JAK.Events.removeListener(this.ev[i]);
	}

	this.dom.cont.parentNode.removeChild(this.dom.cont);

	for (var p in this) { this[p] = null; }
}

JAK.Homepage.RSS.AddForeignFeed.prototype.build = function (html) {
	this.html = html;

	this.html.innerHTML =
		'<div id="add-feed-foreign-cont">'+
			'<p>Chystáte se přidat na Seznam vlastní zprávy ze zdroje<br /> <strong>' + this.option.title +'</strong></p>'+
			'<p class="url">' + this.option.url + '</p>'+
			'<div class="buttons">'+
				'<form action="" method="get" id="add-feed-foreign-frm">'+
				'<input type="submit" name="" id="add-feed-foreign-sbm" class="submit" value="Ano, chci přidat zprávy" />'+
				'<input type="button" name="" id="add-feed-foreign-cnc" value="Nechci" />'+
				'</form>'+
			'</div>'+
		'</div>';

	this.dom.cont = JAK.gel('add-feed-foreign-cont');
	this.dom.frm = JAK.gel('add-feed-foreign-frm');
	this.dom.sbm = JAK.gel('add-feed-foreign-sbm');
	this.dom.cnc = JAK.gel('add-feed-foreign-cnc');

	this.ev.frm = JAK.Events.addListener(this.dom.frm, 'submit', this, this._submit);
	//thid.ev.sbm = JAK.Events.addListener(this.dom.sbm, '')
	this.ev.cnc = JAK.Events.addListener(this.dom.cnc, 'click', this, this._cancel);
};

JAK.Homepage.RSS.AddForeignFeed.prototype._submit = function (e, elm) {
	JAK.Events.cancelDef(e);
	this.parent.sendRss(this.option.url);

	this._fade();
}

JAK.Homepage.RSS.AddForeignFeed.prototype._cancel = function (e, elm) {
	JAK.Events.cancelDef(e);
	this._fade();
	//window.location.href="/";
}

JAK.Homepage.RSS.AddForeignFeed.prototype._fade = function (e, elm) {
	this.dom.cont.style.overflow = 'hidden';

	var ii = new JAK.CSSInterpolator(this.dom.cont, 1000, {endCallback: this.destructorBindCall});
	ii.addProperty('opacity', 1, '0');
	ii.addProperty('height', this.dom.cont.offsetHeight, '0', 'px');
	ii.start();
}
