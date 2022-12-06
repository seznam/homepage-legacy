/* ikona pro webmastery */
JAK.Promote = JAK.ClassMaker.makeClass({
	NAME:"Promote",
	VERSION:"1.0"
});

JAK.Promote.prototype.$constructor = function () {
	this.HTML 	= null;
	this.rssName 	= null;
	this.rssSource 	= null;
	this.iconCont	= null;
	this.radios		= null;
	this.step3		= null;

	this.eventsCache = new Object();

};

JAK.Promote.prototype.generate = function (e, elm) {
	JAK.Events.cancelDef(e);

	var both = false;
	var err = false;

	var imgSrc = '';
	for(i=0;i<this.radios.length;i++) {
		if(this.radios[i].checked == true) {
			imgSrc = this.radios[i].value;
		}
	}
	if(imgSrc == '') {
		alert("Není vybrána žádná ikonka!");
		err = true;
		return false;
	}

	if(this.rssSource.value.substring(7, this.rssSource.value.length) == '' && this.rssName.value == '') {
		alert("Není vyplněn \"Název\" a \"URL\" RSS zdroje!");
		both = true; err = true;
	}
	if(both == false) {
		if(this.rssName.value == '')  { alert("Není vyplněn \"Název\" RSS zdroje!"); err = true;};

		if(this.rssSource.value == '') { alert("Není vyplněno \"URL\" RSS zdroje!"); err = true;};
	}

	if(err == false) {
		var url = 'http://www.seznam.' + _tld + '/pridej-zpravy?url='+encodeURI(this.rssSource.value)+'&title='+encodeURI(this.rssName.value);
		var html = '<a href="'+url+'"><img src="'+imgSrc+'" border="0" alt="Přidej na Seznam" title="Přidej na Seznam"></a>';
		this.textHTML.value = html;
		this.step3.className = 'display';
	}
	return false;
};

JAK.Promote.prototype.init = function (textHTML,rssName,rssSource,iconCont,step3) {
	this.eventsCache.click = JAK.Events.addListener(JAK.gel('generateHTML'), "click", this, 'generate', false, true);
	this.radios = iconCont.getElementsByTagName('input');
	this.textHTML = textHTML;
	this.rssName = rssName;
	this.rssSource = rssSource;
	this.iconCont = iconCont;
	this.step3 = step3;
};
