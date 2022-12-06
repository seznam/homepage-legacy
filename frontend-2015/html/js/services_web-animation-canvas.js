ServicesWeb.Animation.Canvas = JAK.ClassMaker.makeClass({
  NAME: "ServicesWeb.Animation.Canvas",
  VERSION: "0.1"
})

ServicesWeb.Animation.Canvas.prototype.$constructor = function(animation) {
    
    this._animation = animation;
    
    var file = document.createElement('script')
    file.setAttribute("type","text/javascript")
    file.setAttribute("src", Homepage.CONF.FLEVEO)
    if (typeof file != "undefined") { document.getElementsByTagName("head")[0].appendChild(file) }

    this.options = {
        otherElementsHeight:305,
        maxCanvasHeight: 500, // Pro šířku 1280
        minCanvasHeight: 230,
        minContainerWidth: 1024,
        maxContainerWidth: 1280,
        canvasPadding: 47
    }

    this.dom = this._animation.dom;

    this.dom.canvas.style.display = "block";
    this.dom.altImage.style.display = "none";

    this._canvasProportion = this.dom.canvas.offsetWidth / (this.dom.canvas.offsetHeight - this.options.canvasPadding - 1);

    //this.dom.preloader.style.display = "none";
}

ServicesWeb.Animation.Canvas.prototype.moveLeft = function(e, elm) {
    moveLeft();
}

ServicesWeb.Animation.Canvas.prototype.moveRight = function(e, elm) {
    moveRight();
}

ServicesWeb.Animation.Canvas.prototype._resize = function() {
    if (this._refreshed) {return;} else {this._refreshed = true};

    var dimensions = this._animation.windowDimensions();
    var height = dimensions.height,
        width = dimensions.width;
 
    var availableWidth = width - 24;
    if (width > this.options.maxContainerWidth) {
      availableWidth = this.options.maxContainerWidth - 24;
    } else if (width < this.options.minContainerWidth) {
      availableWidth = this.options.minContainerWidth - 24;
    }
  
    var availableHeight = height - this.options.otherElementsHeight;
    if(availableHeight > this.options.maxCanvasHeight) {
      availableHeight = this.options.maxCanvasHeight; 
    } else if(availableHeight < this.options.minCanvasHeight) {
      availableHeight = this.options.minCanvasHeight;
    }

    var newCanvasHeight = availableHeight, 
        newCanvasWidth = availableWidth;

    if (newCanvasHeight > newCanvasWidth / this._canvasProportion) {
      newCanvasHeight = newCanvasWidth / this._canvasProportion;
    } 
    if (newCanvasWidth > newCanvasHeight * this._canvasProportion) {
      newCanvasWidth = newCanvasHeight * this._canvasProportion;
    }

    this.dom.canvas.style.height = newCanvasHeight + 'px';
    this.dom.canvas.style.width = newCanvasWidth + 'px';
    this.dom.canvas.parentNode.style.width = availableWidth + 'px';

    this.dom.mirror.style.height = Math.ceil(71 * (availableHeight / (this.options.maxCanvasHeight ))) + 'px';
    this.dom.mirror.style.width = 900 + 'px';
    this.dom.mirror.style.left = (availableWidth / 2 - 450) + 'px';

    this.dom.canvasBg.style.height = Math.ceil(71 * (availableHeight / (this.options.maxCanvasHeight))) + 'px';
    this.dom.canvasBg.style.width = 900 + 'px';
    this.dom.canvasBg.style.left = (availableWidth / 2 - 450) + 'px';

    this._animation.resize(availableWidth, availableHeight);
}
