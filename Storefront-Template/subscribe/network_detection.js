$(document).ready(function() {
	var init = function() {
		// Define a function in case the main JS file has not loaded yet.
		if (!window.onnetworkconnection) {
			window.onnetworkconnection = function() {
				window.connected = true;
			}
		}
		
		$.ajax({
			type: "GET",
			url: "http://www.adobe.com",
			success: function() {
				window.onnetworkconnection();
			},
			error: function() {
				$("body").append("<div id='offline'>You must be connected to the internet to access the store.</div>");
			}
		})
	}
	
	if (navigator.userAgent.toLowerCase().indexOf("ipad") == -1) // On desktop so call init() immediately. This will be the case for dev.
		init();
	else
		window.onadobedpscontextloaded = init; // On tablet so wait until onadobedpscontextloaded.
});