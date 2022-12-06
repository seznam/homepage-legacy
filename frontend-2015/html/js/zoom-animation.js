/* 
*	pred prechodem na jinou stranku zobrazi animaci
*	ze stredu stranky vyjede vrstva a postupne prekryje cele okno prohlizece
*/ 
JAK.ZoomAnimation = JAK.ClassMaker.makeClass({
	NAME: "ZoomAnimation",
	VERSION: "1.0",
	CLASS: "class"
});

JAK.ZoomAnimation.prototype.$constructor = function(overly,gadget) {
	var channels = JAK.DOM.getElementsByClass('animate',JAK.gel(gadget), 'a');

	/* zjsitime zda browser podporuje css3 transition */
	var animation = this._transitionSupport();

	if(animation) {
		this.overly = JAK.gel(overly);
		this.overly.style.display = 'block';
		
		/* umistime prekryvaci vrstvu na stred a nastavime aby se pozice prepocitala pri scroll nebo zmene okna */
		this._setPosition();
		this.lis1 = JAK.Events.addListener(window, 'resize', this, '_setPosition');	
		this.lis2 = JAK.Events.addListener(window, 'scroll', this, '_setPosition');

		for (var a = 0; a < channels.length; a++) {
			JAK.Events.addListener(channels[a], 'click', this, '_animateToUrl');
		}
	}	
};

/* zjisit zda browser podporuje css3 transition */
JAK.ZoomAnimation.prototype._transitionSupport = function() {
	if(document.body.style.webkitTransition !== undefined) {
		return true;
	}
	else if(document.body.style.MozTransition !== undefined) {
		return true;
	}
	else if(document.body.style.OTransition !== undefined) {
		return true;
	}
	else {
		return false;
	}	
}

/* umisti prekryvaci vrstvu na stred */
JAK.ZoomAnimation.prototype._setPosition = function() {
	var scrollPos = JAK.DOM.getScrollPos();
	var docSize = JAK.DOM.getDocSize();

	var top = (docSize.height / 2) - 25 + scrollPos.y;
	var left = (docSize.width / 2) - 25;	
	this.overly.style.top = top + 'px';
	this.overly.style.left = left + 'px';	
};

/* zobrazi animaci a prejde na stranku s url */
JAK.ZoomAnimation.prototype._animateToUrl = function(e, elm) {
	var docSize = JAK.DOM.getDocSize();
	var scrollPos = JAK.DOM.getScrollPos();
	
	//alert(document.body.clientHeight);
	this.overly.style.opacity = 1; 
	this.overly.style.width = docSize.width + 'px';
	this.overly.style.height = docSize.height  + 'px';
	this.overly.style.top = 0 + scrollPos.y +'px';
	this.overly.style.left = 0 +'px';
	this.overly.style.zIndex = 10000;
	
	JAK.Events.removeListener(this.lis1);
	JAK.Events.removeListener(this.lis2);
	
	setTimeout( function() { self.location.href= elm.href; },500);

	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e); 
};