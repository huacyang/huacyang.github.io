$(document).ready(function() {
	
	var init = function() {
		//remove comment 
		adobe.dps.store.getFolioData(showFolios);
	}

    var showFolios = function(foliodata) {
	
		for(folio_index in foliodata) {
			folio = foliodata[folio_index]
	
			
			addFolio(folio, $('#folios'));
			
		}	
		
		for(folio_index in foliodata) {
			
			folio = foliodata[folio_index]	
		}	
		
		loadCoverImages(foliodata);

    }
	
	var addFolio = function(folio, element) {
		
			folioID = "folio-"+folio.id;
			
			folioHTML = $('<a>');
			//folioHTML.attr('id', folioID);
			folioHTML.attr('href', "#");
			
			$('#folios').append(folioHTML);
			
			folioHTML.append(folio.title);
			folioHTML.append(" / ");
			folioHTML.append(folio.productId);
			
			folioHTML.click(function(e) {
				adobe.dps.store.viewFolio(folio.productId);
			});
			
			folioDiv = $('<div>');
			folioDiv.attr('id',folioID);
			folioDiv.append(folioHTML);
			element.append(folioDiv);
		
	}
	
	var loadCoverImages = function(foliodata) {
		for(folio_index in foliodata) {
			folio = foliodata[folio_index]
		
			addCoverImage(folio);
		}	
	}
	
	var addCoverImage = function (folio) {
		folioID = "folio-"+folio.id;
		folioElement = $('#'+folioID);
		
		imgElement = $('<img>');
		imgElement.attr('class','withStyle');
		imgElement.attr('width',120);
		
		console.log("ProductId:"+folio.productId);
		adobe.dps.store.getPreviewImage(folio.productId, false, 0, 0, function(data) {
			var result = data && data.result;
			if(result == "succeeded") {
				imgElement.attr('src',data.path);
			} else {
				console.log("An error occurred");
			}
		});
		
		
		folioElement.append(imgElement);
	}
		
	// alternative suggestion - be aware for testing on Android
	// var testondesktop = (navigator.userAgent.toLowerCase().indexOf("ipad") == -1);
	var testondesktop = true;
	
	if(testondesktop) {
		init();
    } else {
        window.onadobedpscontextloaded = init; 
    }
	
});