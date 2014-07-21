$(document).ready(function() {
	var init = function() {
		// Define a function in case the main JS file has not loaded yet.
		if (!window.onnetworkconnection) {
			window.onnetworkconnection = function() {
				window.connected = true;
			}
		}
		
		$.ajax({
			type: "HEAD",
			url: "http://www.google.com/",
			success: function() {
				window.onnetworkconnection();
			},
			error: function() {
				$("#offline").text("You must be connected to the internet to access the store.");
			}
		})
	}
	
	// alternative suggestion - be aware for testing on Android
	// var testondesktop = (navigator.userAgent.toLowerCase().indexOf("ipad") == -1);
	var testondesktop = true;
	
	if(testondesktop) {
		init();
    } else {
		//on a tablet, this is the callback that will be called when the Javascript Bridge is ready
        window.onadobedpscontextloaded = init; 
    }
});