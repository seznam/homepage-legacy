/**
 * @class
 * Kulate rohy pro hranate divy, automaticky prida kulate rohy danemu uzlu
 * @augments JAK.Window
 * @param {object} options opsny pro window, zadna zmena proti Window
 * @param {int} elm odkaz na uzel (konteiner) ktery ma mit kulate rozky (string = id || node)
 *
 */
JAK.HPWindow = JAK.ClassMaker.makeClass({
		NAME: 'JAK.HPWindow',
		VERSION: '1.0',
		EXTEND: JAK.Window
})

JAK.HPWindow.prototype.$constructor = function (optObj, elm) {

	/*if(optObj['tableWidth']) {
		this._options['tableWidth'] = optObj['tableWidth'];
	}*/

	this.$super(optObj);

	this.replacedNode = JAK.gel(elm);
	this._init();
}

/**
 * @private
 * provede automaticke zakulaceni
 */
JAK.HPWindow.prototype._init = function () {
	/* prvek nemusi byt pripojen do stranky */
	if (this.replacedNode && this.replacedNode.parentNode) {
		this.replacedNode.parentNode.insertBefore(this.container,this.replacedNode);
		this.content.appendChild(this.replacedNode);
	}
}

/**
 * Tvorba DOM stromu
 */
JAK.HPWindow.prototype._build = function() {
	var imageNames = [
		["lt","t","rt"],
		["l","","r"],
		["lb","b","rb"]
	]

	this.container = JAK.mel("div",{className:"window-container"}, {position:"relative",zIndex:10});
	var cssProperties = {borderCollapse:"collapse",position:"relative"};
	if(this._options['tableWidth']) { cssProperties['width'] = this._options['tableWidth'] };
	var table = JAK.mel("table", null, cssProperties);
	var tbody = JAK.cel("tbody");
	JAK.DOM.append([table,tbody],[this.container,table]);

	for (var i=0;i<3;i++) {
		var tr = JAK.cel("tr");
		tbody.appendChild(tr);
		for (var j=0;j<3;j++) {
			var td = JAK.cel("td");
			td.style.padding = "0px";
			td.style.margin = "0px";
			var div = (i == 1 && j == 1 ? this.content : JAK.mel("div",null,{overflow:"hidden"}));
			td.appendChild(div);

			var im = imageNames[i][j];
			if (im) { /* image */
				var path = this._options.imagePath + im + "." + this._options.imageFormat;
				if (JAK.Browser.client == "ie" && this._options.imageFormat.match(/png/i)) {
					td.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+path+"',sizingMethod='scale')";
				} else {
					td.style.backgroundImage = "url("+path+")";
				} /* not ie */
			}

			/* dimensions */
			if (i == 0) {
				div.style.height = this._options.sizes[0]+"px";
			}
			if (i == 2) { div.style.height = this._options.sizes[2]+"px"; }
			if (j == 0) {
				div.style.width = this._options.sizes[3]+"px";
				td.style.width = this._options.sizes[3]+"px";
			}
			if (j == 2) {
				div.style.width = this._options.sizes[1]+"px";
				td.style.width = this._options.sizes[1]+"px";
			}
			if (j == 1 && i != 1) { td.style.width = "auto"; }

			tr.appendChild(td);
		} /* for all columns */
	} /* for all rows */
}
