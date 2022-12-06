JAK.Search = JAK.ClassMaker.makeClass({
	NAME: "JAK.Search",
	VERSION: "1.0",
	IMPLEMENT: JAK.ISignals
});

JAK.Search.prototype.$constructor = function(form, input, options) {

	this.form	 				= JAK.gel(form);
	this.input	 				= JAK.gel(input);
	this.opt 					= this._makeOptions(options);
	this.ec 					= [];

	JAK.Events.addListener(this.form, 'submit', this, '_send');
	this.addListener('suggest-submit', '_onSuggestSubmit');
	//this.addListener('suggestSubmit', '_onSuggestSubmit');

};

JAK.Search.prototype._makeOptions = function(options) {
	
	opt = { /* defaultní nastaveni */
		'utmSource': 'seznam.cz',
		'utmMedium': 'search',
		'utmCampaign': 'hp'
	};

	for (var i in options) {
		opt[i] = options[i];
	}
	
	return opt;
};

JAK.Search.prototype._onSuggestSubmit = function(e) {
	
	var target = e.target;
    var dom = target ? target._dom : null;
    var input = dom ? dom.input : null;
    var id = input ? input.id : "";

    if(id == this.input.id){
        this._send();
    }

};

JAK.Search.prototype._send = function(e) {
	if(e){
		
		JAK.Events.cancelDef(e);
		JAK.Events.stopEvent(e);
	}

	var url = this.form.action + "?" + this.input.name + "=" + encodeURIComponent(this.input.value);
	window.location = url;
};