$(document).ready(function() {
	var init = function() {
		
		///
		// SETUP
		// 1.  Define your own productId below.  It must be one that you have published as public within your Adobe fulfillment account (via Folio Producer)
		//     You can define it either as FREE or RETAIL depending upon what you want to test.
		///
		var productID = 'storefolio1';
		
		
		// Setup a hash indexed by 'productId' of all folios known to the library.
		var folioDataHash = {};
		
		
		///
		// This callback method is registered to be invoked when the library is updated.  SO, if you don't want it invoked, un-register it after the first update.
		// OR, better, do as below...it doesn't create any objects, but just updates labels as appropriate.
		//
		// as implemented in this example, it will be called every time the library is updated.
		///
		var onFolioData = function (data) {
			var len = data.length;
			
			// The library returns an array of folio descriptor objects.  Put them into a hash indexed by something more convenient (ie productId)
			for (var i = 0; i < len; i++) {
				
				folioDataHash[data[i].productId] = data[i];
				
				console("Folio: "+data[i].productId);
			}
			
			var folio = folioDataHash[productID];
			if (folio) {
				// Also fetch our preview image.
				adobe.dps.store.getPreviewImage(productID, true, 768, 1024, onPreviewImage);
			}
			else {
				console("The productId you have defined for purchase/download does not exist within your Fulfillment account");
			}
		};
		
		var onPreviewImage = function(data) {
			var s="";
			var folio = folioDataHash[productID];
			if (!folio) return;  // un-known folio...nothing to show.
			
			////
			// At this point, we have valid folio data representing our folios and a folio image for our target product ID.
			////
			
			// Create the image
			s += "<img src='"+data['path']+"' width='160' height='222' />";
			
			// Create the Title
			s += "<div id='title'>"+folio.title+"</div>";
			
			// Create the Folio Number
			s += "<div id='manifestXRef'>"+folio.description+"</div>";
			
			// Create the buy|view button and then create the 'buy' or 'view' label and assign a click handler, if valid
			s += "<div class='buyButton' id='buyButton1'>";
			if (folio.folioState=='100') { // buy folio
				s +="Buy";
			}
			else {
				s += "View";
			}
			s += "</div>";
			
			var node = document.getElementById("ourItem");
			if (node) {
				node.innerHTML = s;
				node.onclick = node.onclick=buy;
			}
		};
			
		var onLibraryUpdate = function () {
			adobe.dps.store.getFolioData(onFolioData);
			
			// Unregister for library updates
			unregisterUpdateLibraryHandler();
		}
	
		var registerUpdateLibraryHandler = function ()
		{
		  if (window.adobedpscontextloaded)
		  {
			// call into the updateLibrary API
			adobe.dps.store.registerLibraryUpdateCompleteHandler(onLibraryUpdate);
			adobe.dps.store.updateLibrary();
		  }
		  else {
			  console("Failed to find Javascript API");
		  }
		  
		};
		
		var unregisterUpdateLibraryHandler = function ()
		{
		  if (window.adobedpscontextloaded)
		  {
			// call into the updateLibrary API
			adobe.dps.store.unregisterLibraryUpdateCompleteHandler(onLibraryUpdate);
		  }
		}

		registerUpdateLibraryHandler();
		
		var buy = function  () {
			var folio = folioDataHash[productID];
			if (folio==null) return;
			if (folio.folioState=='100') {
				adobe.dps.store.buyFolio(productID);
			}else {
				adobe.dps.store.viewFolio(productID);
			}
		};
		
		var node = document.getElementById("ourItem");
		if (node) node.innerHTML = "Fetching Folio and preview...";
		 
		 ///
		 // Helper function for outputting informational messages to a <div/>
		 ///
		 var consoleElement = document.getElementById("console");
		 var console = function(s) {
			 if (consoleElement) consoleElement.innerHTML += s + "<br/>";
		 }
		
	}
	
	if (window.connected)
		init();
	else
		window.onnetworkconnection = init;
});
