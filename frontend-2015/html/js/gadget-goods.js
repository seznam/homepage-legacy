JAK.GadgetGoods = JAK.ClassMaker.makeClass({
	NAME: 'JAK.GadgetGoods',
	VERSION: '1.0'
});

JAK.GadgetGoods.prototype.$constructor = function(feedId, parent, cnt) {
	this._itemsCnt = parseInt(cnt) || 0;	
	this._container = document.querySelector('#'+feedId);
	this._ec = [];	
	this._active = [];

	
	//init:
	
	for (var i = 0; i < this._itemsCnt; i++) {
		var elms = this._container.querySelectorAll('.js-item-'+i);
		var tab = elms.item(0);
		var content = elms.item(1);
		if (tab && content) {
			this._ec.push(
				JAK.Events.addListener(tab, 'click', this._tabClicked.bind(this, content))
			);
			if (JAK.DOM.hasClass(tab, 'active')) {
				this._active = [tab, content];
			}
		}
	}
};

JAK.GadgetGoods.prototype.$destructor = function () {
	JAK.Events.removeListeners(this._ec);
};

JAK.GadgetGoods.prototype._tabClicked = function (content, e, tab) {
	JAK.Events.cancelDef(e);
	
	if (this._active[0] === tab) {
		return;
	}
	
	JAK.DOM.removeClass(this._active[0], 'active');
	JAK.DOM.removeClass(this._active[1], 'active');
	
	this._active[0] = tab;
	this._active[1] = content;
	
	JAK.DOM.addClass(tab, 'active');
	JAK.DOM.addClass(content, 'active');
};