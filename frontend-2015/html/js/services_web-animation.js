ServicesWeb.Animation = JAK.ClassMaker.makeClass({
    NAME: "ServicesWeb.Animation",
    VERSION: "0.1"
})

ServicesWeb.Animation.prototype.$constructor = function() {
  
    this.dom = {
        altImage: JAK.gel("alternative_image"),
        canvas: JAK.gel("c"),
        preloader: JAK.gel("preloader"),
        arrLeft: JAK.gel("arrLeft"),
        arrRight: JAK.gel("arrRight"),
        caption: JAK.gel("caption"),
        visitPage: JAK.gel("visitPage"),
        mirror: JAK.gel("arrow"),
        columnsContainer: JAK.gel("columns_container"),
        footer: JAK.gel("foot"),
        canvasBg:JAK.gel("canvas_bg")
    }

    this._ev = [];
    this._canvasSupported = !!document.createElement("canvas").getContext;

    if(this._canvasSupported) {
      this._renderer = new ServicesWeb.Animation.Canvas(this);
    } else {
      this._renderer = new ServicesWeb.Animation.Simple(this);
    }

    this._ev.push(JAK.Events.addListener(this.dom.arrLeft, 'click', this._renderer, 'moveLeft'));
    this._ev.push(JAK.Events.addListener(this.dom.arrRight, 'click', this._renderer, 'moveRight'));
    this._ev.push(JAK.Events.addListener(document, 'keydown', this, '_keyDown'));

    this._renderer._refreshed = false;
    var clearRefreshed = function() {this._refreshed = false}; 
    setInterval(clearRefreshed.bind(this._renderer),50);

    JAK.Events.addListener(window, "resize", this._renderer, "_resize");
  
    this._renderer._resize();

}

ServicesWeb.Animation.prototype.totalElHeight = function(el) {
    return  el.offsetHeight + 
            parseInt(JAK.DOM.getStyle(el, 'paddingTop')) + parseInt(JAK.DOM.getStyle(el, 'paddingBottom')) +
            parseInt(JAK.DOM.getStyle(el, 'marginTop')) + parseInt(JAK.DOM.getStyle(el, 'marginBottom'))
}

ServicesWeb.Animation.prototype.windowDimensions = function() {
    var width = 0, height = 0;
    if( typeof( window.innerWidth ) == 'number' ) {
        //Non-IE
        height = window.innerHeight;
        width = window.innerWidth;
    } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
        //IE 6+ in 'standards compliant mode
        height = document.documentElement.clientHeight;
        width = document.documentElement.clientWidth;
    } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
        //IE 4 compatible
        height = document.body.clientHeight;
        width = document.body.clientWidth;
    }
    var result = {"width":width, "height":height}                   	
	return result;
}

ServicesWeb.Animation.prototype._keyDown = function(e, elm) {
  	if(e.keyCode == 37 || e.keyCode == 38)
			  this._renderer.moveLeft();
		else if(e.keyCode == 39 || e.keyCode == 40)
			  this._renderer.moveRight();
}

ServicesWeb.Animation.prototype.resize = function(width, height) {
    this.dom.visitPage.style.height = (height * 0.7) + 'px';
    this.dom.visitPage.style.top = (height / 2) - (height * 0.7 / 2) + 'px';
    this.dom.visitPage.style.width = (width * 0.5) + 'px';
    this.dom.visitPage.style.left = (width / 2) - (width * 0.5 / 2) + 'px';
}


