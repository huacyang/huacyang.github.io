/*
 * Function for setting the corresponding tab on the navigation bar active
 */
function active() {
    var url = document.URL,
        found = false,
		token = url.replace(/\./g, "/");
	// prase the url
    token = token.split("/");
	// loops through the parsed url
    for (var i = 0; i < token.length; i++) {
        var found = false;

        switch (token[i]) {
			default:
				break;
		}

		if (found)
			break;
	}
	// activate the home page by default
	if (!found)
		$('#profile').addClass('active');
}

function font_upper() {
    var plus = parseInt($('#content-area p').css('font-size')) + 2;
    console.log(plus);
    $('#content-area p').css('font-size', plus);
}

function font_lower() {
    var minus = parseInt($('#content-area p').css('font-size')) - 2;
    console.log(minus);
    $('#content-area p').css('font-size', minus);
}

/*
 * Function for detecting the window's scroll position
 */
jQuery(window).scroll(function() {
    // Only triggers when not in mobile view
    if ($(window).width() >= 1024) {
    	var sposition = $(window).scrollTop();
        if (sposition >= 50) {
            $('#logo').hide();
            $(".important-class").addClass("padding-on-my-header");
        }
        if (sposition < 50) {
            $(".important-class").removeClass("padding-on-my-header");
            $('#logo').show();
        }
    }
});