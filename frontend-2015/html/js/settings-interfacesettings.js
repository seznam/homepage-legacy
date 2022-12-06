/**
 * @class
 * definuje rozhrani pro tridy reprezentuji jednotliva nastaveni
 */
JAK.Homepage.InterfaceSettings = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.InterfaceSettings",
	VERSION:"1.0"
})

/**
 * metoda ktera slouzi k odeslani dat na server, musi ji definovat kazda trida
 * definujici funkcionalitu pro nejake nastaveni
 */
JAK.Homepage.InterfaceSettings.prototype.submit = function () {}
