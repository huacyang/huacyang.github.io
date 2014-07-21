function setupCollapsedPanel(cssPattern, hideText, showText) {
  Spry.$$(cssPattern).forEach(function(intro) {
    intro.innerHTML = "<a href='#' class='blind_link'>" + hideText + "</a>";
    var link = intro.childNodes[0];
    var trace = intro.nextSibling;
    while (trace != null && trace.nodeType != 1) {
      trace = trace.nextSibling;
    }
    if (trace != null) {
      trace.style.display = '';
      link.onclick = function(e) {
      	var newDisplay = ''
      	var text = hideText;
      	if (trace.style.display == '') {
      	  newDisplay = 'none';
      	  text = showText;
      	}
      	trace.style.display = newDisplay;
      	link.innerHTML = text;
    	return false;
      };
    }
  });
}
function setupCollapsedSnippetPanel(cssPattern) {
  Spry.$$(cssPattern).forEach(function(intro) {
    var default_text = intro.innerHTML;
    intro.innerHTML = "<a href='#' class='blind_link'>" + default_text + "</a>";
    var link = intro.childNodes[0];
    var trace = intro.nextSibling;
    while (trace != null && trace.nodeType != 1) {
      trace = trace.nextSibling;
    }
    if (trace != null) {
      trace.style.display = 'none';
      link.onclick = function() {
      	var newDisplay = 'none';
      	var text = default_text;
      	if (trace.style.display == 'none') {
      	  newDisplay = '';
      	  text = "Hide "+default_text;
      	}
      	trace.style.display = newDisplay;
      	link.innerHTML = text;
    	return false;
      };
    }
  });
}
function transformWireTraces() {
  setupCollapsedPanel(".request_intro", "Hide example HTTP request", "Show example HTTP request");
  setupCollapsedPanel(".response_intro", "Hide example HTTP response", "Show example HTTP response");
}

function transformSnippets() {
  setupCollapsedSnippetPanel(".actionscript_snippet_intro");
  setupCollapsedSnippetPanel(".cpp_snippet_intro");
  setupCollapsedSnippetPanel(".java_snippet_intro");
  setupCollapsedSnippetPanel(".php_snippet_intro");
  setupCollapsedSnippetPanel(".ruby_snippet_intro");
}

function setCookie(name,value,expires,path,domain,secure) {
  document.cookie = name + "=" + escape (value) +
    ((expires) ? "; expires=" + expires.toGMTString() : "") +
    ((path) ? "; path=" + path : "") +
    ((domain) ? "; domain=" + domain : "") + ((secure) ? "; secure" : "");
}

/* This function is used to get cookies */
function getCookie(name) {
	var prefix = name + "=";
	var start = document.cookie.indexOf(prefix);

	if (start==-1) {
		return null;
	}

	var end = document.cookie.indexOf(";", start+prefix.length);
	if (end==-1) {
		end=document.cookie.length;
	}

	var value=document.cookie.substring(start+prefix.length, end);
	return unescape(value);
}

function addIonComments() {
  function getLangName() {
    var lang = "en-us";
    var metaElements = document.all ?
                       document.all.tags('meta') :
                       document.getElementsByTagName ?
                       document.getElementsByTagName('meta') : new Array();

    for (var m = 0; m < metaElements.length; m++) {
      if (metaElements[m].name == "lang") {
        lang = metaElements[m].content;
        break;
      }
    }
    var ptn = /(..)-(..)/;
    if (ptn.test(lang)) {
      var countryCode = lang.replace(ptn, "$1");
      var languageCode = lang.replace(ptn, "$2");
      lang = countryCode + "_" + languageCode.toUpperCase();
    }
    return lang;
  }

  var loc = getLangName();
  var commentsContainer = "ionComHere";

  ionComAddLoadEvent(function() {
    var thisURL = encodeURIComponent(window.location);
    var resource = thisURL.replace(new RegExp(/%23(.*)/), "");
    ionComments.setup(resource, loc, commentsContainer, { siteArea: 'help', productLabel: 'st_product_adobelr'});
  });
}