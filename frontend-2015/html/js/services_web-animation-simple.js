ServicesWeb.Animation.Simple = JAK.ClassMaker.makeClass({
    NAME: "ServicesWeb.Animation.Simple",
    VERSION: "0.1"
})

ServicesWeb.Animation.Simple.prototype.$constructor = function(animation) {

    this._animation = animation;

    this.options = {
        otherElementsHeight: 305,
        imageSrc: '/fimg-resp/?spec=ss700x406&url=',
        minContainerWidth: 1024,
        maxContainerWidth: 1280,
        minImageHeight: 270,
        maxImageHeight:506,
        imagePadding: 100
    }

    this.dom = this._animation.dom;
    
    this.dom.canvas.style.display = "none";
    this.dom.altImage.style.display = "block";
    this.dom.canvasBg.style.height = '20px';
    this.dom.mirror.style.height = '20px';

    this._ev = [];
    this._imageProportion = 700 / 406; 
    this._images = [];

    this.dom.activeElements = JAK.query('#columns_container span.itm');
    this.dom.noScreenElements = JAK.query('#columns_container span.itmNoScreen');

    for( var i in this.dom.activeElements) {

        var element = this.dom.activeElements[i];

        if(typeof(element) == "object") {

            var link = element.getElementsByTagName("a")[0];
            var relLink = link.getAttribute("rel");

            // ma element tridu itm a itmNoScreen zaroven
            var isItmNoScreen = false;
            for (var ii in this.dom.noScreenElements){
                if (this.dom.noScreenElements[ii] === element) {
                    isItmNoScreen = true;
                }
            }

            if (isItmNoScreen){
                // pridani obrazku napevno
                var imgLink = relLink;

            } else {
                // pridani obrazku pres screenshotator
                if (relLink) {
                  var imgLink = this.options.imageSrc + relLink;
                } else {
                  var imgLink = this.options.imageSrc + link.href;
                }
            }

            var image = JAK.mel("img", {src:imgLink});
            this._images.push(image);

            this._ev.push(JAK.Events.addListener(element,'mouseover', this, '_itemMouseover'));
        }
    }
    
    this.dom.preloader.style.display = "none";

    this._makeActive(0);
}

ServicesWeb.Animation.Simple.prototype._itemMouseover = function(e, elm) {
    var index = this.dom.activeElements.indexOf(elm);
    this._makeActive(index);
}

ServicesWeb.Animation.Simple.prototype._makeActive = function(index) {

    this._activeIndex = index;

    var curElement = this.dom.activeElements[index];
    var curParent = curElement.parentElement;
    var curLink = curElement.getElementsByTagName("a")[0];
    var curText = curParent.childNodes[1];
    var curImage = this._images[index];
    this.dom.altImage.src = curImage.src;

    for(var i = 0; i < this.dom.activeElements.length; i++ ) {
        var element = this.dom.activeElements[i];
        if(element != curElement) {
            var parent = element.parentElement;
            JAK.DOM.removeClass(parent, 'active');
        }
    }

    JAK.DOM.addClass(curParent, 'active');
    this.dom.caption.innerHTML = curElement.innerHTML.trim() + ' ' + curText.innerHTML.trim()
    this.dom.visitPage.href = curLink.href;
}

ServicesWeb.Animation.Simple.prototype._resize = function() {
 
    if (this._refreshed) { return } else {this._refreshed = true};
    var dimensions = this._animation.windowDimensions();
    var width = dimensions.width,
        height = dimensions.height;
  
    var availableWidth = width - 24;
    if (width > this.options.maxContainerWidth) {
      availableWidth = this.options.maxContainerWidth - 24;
    } else if (width < this.options.minContainerWidth) {
      availableWidth = this.options.minContainerWidth - 24;
    }
    var availableHeight = height - this.options.otherElementsHeight;
    if(availableHeight > (this.options.maxImageHeight)) {
      availableHeight = this.options.maxImageHeight; 
    } else if(availableHeight < (this.options.minImageHeight)) {
      availableHeight = this.options.minImageHeight;
    }

    var newImageHeight = availableHeight//,
        newImageWidth = availableWidth;

    if (newImageHeight > newImageWidth / this._imageProportion) {
      newImageHeight = newImageWidth / this._imageProportion;
    } 
    if (newImageWidth > newImageHeight * this._imageProportion) {
      newImageWidth = newImageHeight * this._imageProportion;
    }

    this.dom.altImage.style.height = (newImageHeight - this.options.imagePadding) + 'px';
	  this.dom.altImage.parentNode.style.width = availableWidth + 'px';

    this.dom.mirror.style.width = 900 + 'px';
    this.dom.mirror.style.left = (availableWidth / 2 - 450) + 'px';

    this.dom.canvasBg.style.width = 900 + 'px';
    this.dom.canvasBg.style.left = (availableWidth / 2 - 450) + 'px';

    this._animation.resize(availableWidth,availableHeight);

}

ServicesWeb.Animation.Simple.prototype.moveLeft = function() {
    var newIndex = this._activeIndex - 1;
    if (newIndex < 0) {
        newIndex = this.dom.activeElements.length - 1;
    }
    this._makeActive(newIndex);
}

ServicesWeb.Animation.Simple.prototype.moveRight = function() {
    var newIndex = this._activeIndex + 1;
    if (newIndex >= this.dom.activeElements.length) {
        newIndex = 0;
    }
    this._makeActive(newIndex);
}

