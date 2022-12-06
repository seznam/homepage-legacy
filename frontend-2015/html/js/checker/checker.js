(function () {
  /**
   * Key identifying the local storage / session storage items used to track
   * browsers and sessions.
   */
  var WEB_STORAGE_KEY = "adblockCheckerTracker";

  var scripts = ["advert", "hit"];

  var tld = "cz";
  var scriptElm = document.getElementById("checkerScript");
  if (scriptElm) {
      var r = scriptElm.src.match(/\/\/(.*)$/i);
      var srcParts = r[1].split("/")[0].split(".");
      tld = srcParts[srcParts.length - 1];
  }

  var query = "i=" + encodeURIComponent(generateHitId()) + "&" + generateTrackingFlags().join("&");
  for (var i = scripts.length; i--;) {
    var scriptUri = "//www.seznam." + tld + "/static-js/checker/" + scripts[i] + ".js?" + query;
    var script = makeScript(scriptUri);
    injectScript(script);
  }

  /**
   * Generates the currently applying tracking flags.
   *
   * @param {string[]} The currently applying tracking flags.
   */
  function generateTrackingFlags() {
    if (!window.sessionStorage || !window.localStorage) {
      return ["u"];
    }

    var flags = [];

    if (!localStorage.getItem(WEB_STORAGE_KEY)) {
      localStorage.setItem(WEB_STORAGE_KEY, "1");
      flags.push("b");
    }

    if (!sessionStorage.getItem(WEB_STORAGE_KEY)) {
      sessionStorage.setItem(WEB_STORAGE_KEY, "1");
      flags.push("s");
    }

    return flags;
  }

  /**
   * Generates an identifier of this page it that is as unique as possible, but
   * reasonably long.
   *
   * @return {
   */
  function generateHitId() {
    var simpleId = ((new Date()).getTime() + Math.random()) + "_";

    var crypto = window.crypto || window.msCrypto;
    if (!crypto || !window.Uint32Array) {
      return simpleId;
    }

    var safeRandomValue = new Uint32Array(1);
    crypto.getRandomValues(safeRandomValue);
    return simpleId + safeRandomValue[0];
  }

  /**
   * Creates a new asynchronously loaded script element loading the JavaScript
   * available at the specified URI.
   *
   * @param {string} uri The location from where the JavaScript should be
   *        loaded once the script element is injected into the page.
   * @return {Element} The generated script element.
   */
  function makeScript(uri) {
    var script = document.createElement("script");
    script.setAttribute("async", "");
    script.setAttribute("defer", "");
    script.setAttribute("src", uri);
    return script;
  }

  /**
   * Injects the provided script into the page.
   *
   * @param {Element} script A script element to inject into the page.
   */
  function injectScript(script) {
    document.getElementsByTagName("head")[0].appendChild(script);
  }
}());
