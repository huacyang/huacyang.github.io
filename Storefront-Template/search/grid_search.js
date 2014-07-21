$(document).ready(function() {
	var init = function() {
		// Since the account is a demo account and will contain different magazines (The Look, Fork & Spoon, Current)
		// use a different URL for the XML than the fulfillment server so only one of the magazines is displayed for a particular store.
		var FULFILLMENT_URL = "http://lighthouse.adobe.com/users/derek/store/data/grid_943864f0a0d2431aa2992987caf78cb0.xml";
		//var FULFILLMENT_URL = "http://edge.adobe-dcfs.com/ddp/issueServer/issues?accountId=943864f0a0d2431aa2992987caf78cb0";
	
		/** Method used by FeaturedFolioCollection and FolioCollection.
		 * 	Sample XML response:
		 * <?xml version="1.0" encoding="UTF-8"?>
		 * <results status="SUCCESS" message="Success"> 
		 *   <issues>
		 *    <issue id="1602ea42-52f7-4f2f-9242-5c16b674e6be" productId="15" formatVersion="1.7.0" version="1" subpath=""> 
		 *      <magazineTitle>Title 15</magazineTitle> 
		 *      <issueNumber>15</issueNumber>
		 *      <publicationDate>2011-06-22T07:00:00Z</publicationDate>
		 *      <description>description for folio 15</description> 
		 *      <manifestXRef>Folio 15</manifestXRef> 
		 *      <state>production</state> 
		 *      <libraryPreviewUrl landscapeVersion="1" portraitVersion="1">http://edge.adobe-dcfs.com/ddp/issueServer/issues/1602ea42-52f7-4f2f-9242-5c16b674e6be/libraryPreview</libraryPreviewUrl> 
		 *      <brokers> 
		 *        <broker>noChargeStore</broker> 
		 *      </brokers> 
		 *    </issue> 
		 *   </issues> 
		 * </results> 
		 */
		var parseIssues = function(xml) {
			var issueNodes = xml.getElementsByTagName("issue");
			var len = issueNodes.length;
			if (len > 0) {
				var issues = [];
				for (var i = 0; i < len; i++) {
					var issueNode = issueNodes[i];
					// Get the attributes
					var issue = {};
					var attributes = issueNode.attributes;
					issue.id = attributes.getNamedItem("id").value;
					issue.productId = attributes.getNamedItem("productId").value;
					issue.formatVersion = attributes.getNamedItem("formatVersion").value;
					issue.version = attributes.getNamedItem("version").value;
					issue.subpath = attributes.getNamedItem("subpath").value;
					
					// Loop through the nodes.
					var childNodes = issueNode.childNodes;
					var numNodes = childNodes.length;
					for (var j = 0; j < numNodes; j++) {
						var childNode = childNodes[j];
						if (childNode.nodeType == 1) { // ELEMENT_NODE
							var nodeName = childNode.nodeName;
							if (childNode.nodeName == "libraryPreviewUrl") {
								issue[nodeName] = $.trim(childNode.firstChild.nodeValue);
								//issue.hasLandscapeImage = childNode.attributes.getNamedItem("landscapeVersion").value == "1";
								//issue.hasPortraitImage = childNode.attributes.getNamedItem("portraitVersion").value == "1";
							} else if (childNode.nodeName == "publicationDate") {
								// 2011-06-22T07:00:00Z.
								var pubDate = childNode.firstChild.nodeValue.split("-");
								var date = new Date(pubDate[0], Number(pubDate[1]) - 1, pubDate[2].substr(0, 2));
								issue[nodeName] = date;
							} else {
								issue[nodeName] = childNode.firstChild.nodeValue;
							}
						}
					}
					
					issues.push(issue);
				}
				
				issues.sort(sortDatesDescending);
				
				return issues;
			}
			else
			{
				return null;
			}
		}
		
		var sortDatesAscending = function (a, b) {
			if (a.publicationDate < b.publicationDate)
				return -1;
			else if (a.publicationDate > b.publicationDate)
				return 1;
			else
				return 0;
		}
		
		var sortDatesDescending = function (a, b) {
			if (a.publicationDate < b.publicationDate)
				return 1;
			else if (a.publicationDate > b.publicationDate)
				return -1;
			else
				return 0;
		}
		
		var Folio = Backbone.Model.extend({
			initialize: function() {
				var folio = folioDataHash[this.attributes.id];
				if (folio) {
					if (folio.state == 100 || folio.state == 200) {
						var price = folioDataHash[this.attributes.id].price.toLowerCase();
						this.attributes.buyLabel = price == "$0.00" || price == "free" ? "Free" : price;
					} else {
						this.attributes.buyLabel = "View";
					}
				}
				else { // This will be the case when testing on the desktop
					this.attributes.buyLabel = "Buy";
				}
			}
		});
		
		var FolioCollection = Backbone.Collection.extend({
			model: Folio,
			
			url: FULFILLMENT_URL,
			
			parse: parseIssues
		});
		
		/**
		 * Displays each individual folio thumbnail.
		 */
		var FolioItemView = Backbone.View.extend({
			tagName:  "div",
			
			className: "folio",
			
			template: _.template("<img src='<%= libraryPreviewUrl %>/portrait' width='160' height='222' /><div id='title'><%= magazineTitle %></div><div id='manifestXRef'><%= manifestXRef %></div><div class='buyButton' id='<%= id %>'><%= buyLabel %></div>"),
			
			render: function() {
				$(this.el).html(this.template(this.model.toJSON()));
				return this;
			},
		});
		
		/**
		 * Displays the rows of FolioItemViews.
		 */
		var FolioView = Backbone.View.extend({
			el: $("body"),
			
			// Stores the data for the sortByDropDown.
			sortByDropDownData: {},
			
			initialize: function() {
				var html  = "<div id='topBar'>";
					html += 	"<div id='sortBy'></div>";
					html += 	"<div id='searchContainer'>";
					html +=			"<input id='searchInput' type='text' />";
					html +=			"<div id='clearInput'></div>";
					html +=		"</div>";
					html +=	"</div>";
					html += "<div id='marketing'><img id='bg' src='http://lighthouse.adobe.com/users/derek/store/images/search_marketing_pod.jpg' width='730' height='314'></div>";
					html += "<div id='loading'>Loading...</div>";
				
				$("body").append(html);
				
				this.createRotatingBanner("marketing", ["http://lighthouse.adobe.com/users/derek/store/images/search_marketing_1.jpg",
														"http://lighthouse.adobe.com/users/derek/store/images/search_marketing_2.jpg",
														"http://lighthouse.adobe.com/users/derek/store/images/search_marketing_3.jpg",
														"http://lighthouse.adobe.com/users/derek/store/images/search_marketing_4.jpg"]);
														
				_.bindAll(this, "dropDown_bodyClickHandler");

				_.bindAll(this, "removeMissingFolios");
				folioCollection.bind("all", this.removeMissingFolios);
				
				var scope = this;
				
				$("#sortBy").click(function() { scope.sortBy_clickHandler() });
				
				this.sortByDropDownData.selectedIndex = 0;
				
				// Preload the images for the dropdown.
				var image = new Image();
				image.src = "http://lighthouse.adobe.com/users/derek/store/images/drop_down_bg_top.png";
				image.src = "http://lighthouse.adobe.com/users/derek/store/images/drop_down_bg_bottom.png";
				image.src = "http://lighthouse.adobe.com/users/derek/store/images/drop_down_item_bg.png";
				image.src = "http://lighthouse.adobe.com/users/derek/store/images/drop_down_item_selected_bg.png";
				
				$("#searchInput").focus(function(){ scope.startChangeInterval()})
				$("#searchInput").focusout(
					function(){
						clearInterval(scope.changeInterval);
						clearTimeout(scope.applySearchQueryTimeout);
					});

				$("#clearInput").css("display", "none");
				$("#clearInput").click(function(){ scope.clearInput_clickHandler() });
				
				if (adobeExists()) {
					// Get the folio data before fetching the collections so
					// state and price can be cross-referenced.
					adobe.dps.store.getFolioData(this.getFolioDataHandler);
				} else { // API doesn't exist so testing on desktop.
					folioCollection.fetch({dataType: 'xml'});
				}
				
				$(window).resize( function(){ scope.layoutFolios(false)});
			},
			
			// The index of the image fading in.
			selectedRotatingBannerIndex: 1,
			bannerImages: null,
			fadingInBanner: null,
			fadingOutBanner: null,
			
			createRotatingBanner: function(elementId, images) {
				this.bannerImages = images;
				
				// preload the images.
				var image;
				for (var i = 0; i < images.length; i++) {
					image = new Image();
					image.src = images[i];
				}
				
				this.fadingInBanner = $("<img class='rotatingImage' id='rotatingImage1' src='" + images[1] + "'>").appendTo("#" + elementId);
				this.fadingOutBanner = $("<img class='rotatingImage' id='rotatingImage0' src='" + images[0] + "'>").appendTo("#" + elementId);
				
				this.rotateBanners();
			},
			
			stopRotatingBanner: function() {
				this.bannerStopped = true;
			},
			
			startRotatingBanner: function() {
				if (this.bannerStopped) {
					this.fadingInBanner.css("opacity", 0);
					this.fadingOutBanner.css("opacity", 1);
					this.bannerStopped = false;
					this.rotateBanners();
				}
				
				this.bannerStopped = false;
			},
			
			rotateBanners: function() {
				if (!this.bannerStopped) {
					var scope = this;
					this.fadingOutBanner.delay(2500).animate({opacity: 0}, 1500, "quadEaseIn", function(){ scope.rotateBanners()});
					this.fadingInBanner.delay(2500).animate({opacity: 1}, 1500, "quadEaseIn");
					
					if (this.selectedRotatingBannerIndex == this.bannerImages.length)
						this.selectedRotatingBannerIndex = 0;
					
					this.fadingInBanner.attr("src", this.bannerImages[this.selectedRotatingBannerIndex]);
					
					this.selectedRotatingBannerIndex += 1;
	
					var temp = this.fadingInBanner;
					this.fadingInBanner = this.fadingOutBanner;
					this.fadingOutBanner = temp;
				}
			},
			
			sortBy_clickHandler: function() {
				this.createDropDown(["Newest First", "Oldest First"]);
			},
			
			createDropDown: function(labels) {
				if (!this.sortByDropDownData.dropDown) {
					var items = "";
					for (var i = 0; i < labels.length; i++) {
						var divClass = i != this.sortByDropDownData.selectedIndex  ? "dropDownItem" : "dropDownItemSelected";
						// Set the id of the item for lookup later when toggling the selected state.
						items += "<div id='dropDownItem" + i + "' class='" + divClass +"'>" + labels[i] + "</div>";
					}
	
					var html  = "<div id='sortByDropDown'>";
						html += 	"<img src='http://lighthouse.adobe.com/users/derek/store/images/drop_down_bg_top.png'>"; // The triangle pointer.
						html += 	items;
						html += 	"<img src='http://lighthouse.adobe.com/users/derek/store/images/drop_down_bg_bottom.png'>"; // The bottom bar.
						html +=	"</div>";
						
					$("body").bind("click", this.dropDown_bodyClickHandler);
					this.sortByDropDownData.dropDown = $(html).appendTo("body");
					
					var scope = this;
					$("#sortByDropDown").bind("click", function(e){ scope.dropDown_clickHandler(e) });
					
					// A click event is registered immediately so make sure the menu doesn't close on the first one.
					this.sortByDropDownData.numClicks = 0;
				}
				
				this.sortByDropDownData.labels = labels;
			},
			
			
			dropDown_clickHandler: function(e) {
				if (e.layerY > 14) {// 14 = height of the triangle at the top of the menu.
					var height = this.convertPixelsToNumber(this.sortByDropDownData.dropDown.css("height"));
					var selectedIndex = Math.floor(((e.layerY - 14) / (height - 14)) * this.sortByDropDownData.labels.length);
					if (selectedIndex == this.sortByDropDownData.selectedIndex) {
						this.closeDropDown();
					} else {
						$("#dropDownItem" + selectedIndex).attr("class", "dropDownItemSelected");
						$("#dropDownItem" + this.sortByDropDownData.selectedIndex).attr("class", "dropDownItem");
						
						this.sortByDropDownData.selectedIndex = selectedIndex;
						// set a delay before closing so the user sees the item selection.
						var scope = this;
						setTimeout(function() {
							scope.closeDropDown();
							scope.filteredFolios.reverse();
							scope.folios.reverse();
							folioCollection.models.reverse();
							scope.layoutFolios(false);
						}, 150);
					}
				} else {
					this.closeDropDown();
				}
			},
			
			// Takes a string such as 98px and returns a number.
			convertPixelsToNumber: function(value) {
				return Number(value.slice(0, value.length - 2));
			},
			
			// Handler for when a user clicks the body when the dropdown is open.
			dropDown_bodyClickHandler: function(e) {
				if (this.sortByDropDownData.numClicks > 0) {
					var top = this.convertPixelsToNumber(this.sortByDropDownData.dropDown.css("top"));
					var left = this.convertPixelsToNumber(this.sortByDropDownData.dropDown.css("left"));
					var width = this.convertPixelsToNumber(this.sortByDropDownData.dropDown.css("width"));
					var height = this.convertPixelsToNumber(this.sortByDropDownData.dropDown.css("height"));

					// Make sure a user didn't click inside the drop down.
					if (e.pageX < left || e.pageX > left + width || e.pageY < top || e.pageY > top + height)
						this.closeDropDown();
				}
				
				this.sortByDropDownData.numClicks +=1 ;
			},
			
			closeDropDown: function() {
				this.sortByDropDownData.dropDown.remove();
				$("body").unbind("click", this.dropDown_bodyClickHandler);
				this.sortByDropDownData.dropDown = null;
			},
			
			// Handler for when a users clicks the "x" icon to clear searchInput.
			clearInput_clickHandler: function() {
				$("#clearInput").css("display", "none");
				$("#searchInput").val("");
				$("#searchInput").focus();
			},
			
			// The interval used to watch for changes to searchInput.
			changeInterval: null,
			
			// The timeout delay used to filter the folios.
			applySearchQueryTimeout: null,
			
			// The previous value of searchInput.
			previousSearchTxt: "",
			
			// Starts the interval to watch changes to searchInput when it has focus.
			startChangeInterval: function() {
				var scope = this;
				this.changeInterval = setInterval(function(){ scope.watchChange() }, 100);
			},
			
			// Watches the changes to searchInput.
			watchChange: function() {
				var q = $("#searchInput").val();
				if (this.previousSearchTxt != q) {
					clearTimeout(this.applySearchQueryTimeout);
					// Wait 700ms to apply the filter so filtering isn't done for every key change.
					var scope = this;
					this.applySearchQueryTimeout = setTimeout(function(){ scope.applySearchQuery(q) }, 700);
				}
				
				$("#clearInput").css("display", q == "" ? "none" : "block");
				
				this.previousSearchTxt = q;
			},
			
			// After a timeout the search query is applied to the folios.
			applySearchQuery: function(q) {
				if (q != "") {
					q = q.toLowerCase();
					this.filteredFolios = [];
					var numFolios = folioCollection.length;
					for (var i = 0; i < numFolios; i++) {
						var attributes = folioCollection.at(i).attributes;
						if (attributes.manifestXRef.toLowerCase().indexOf(q) != -1 || 
							attributes.magazineTitle.toLowerCase().indexOf(q) != -1 ||
							attributes.description.toLowerCase().indexOf(q) != -1) {
							this.filteredFolios.push(attributes.productId);
						}
					}
				}
				else
				{
					this.filteredFolios = this.folios.slice();
				}
				
				// The loading message is reused to display "Sorry, your search had no results."
				$("#loading").css("display", this.filteredFolios.length == 0 ? "block" : "none");
				
				this.layoutFolios(true, true);
			},
			
			/**
			 * Sample return data from adobe.dps.store.getFolioData()
			 * [{"id":"eac00de0-463f-41f7-b88a-bbf4ab7d6592","state":200,"price":"FREE","productId":"10"},
			 *  {"id":"4f19b54a-622f-445b-bc18-d9ffa77918de","state":100,"price":"$0.99","productId":"productid5"},
			 *  {"id":"09b34326-8eb3-44d1-85c7-2df13d79c3ec","state":100,"price":"$0.99","productId":"productid6"},
			 *  {"id":"fc4e2ab4-ae3f-4d42-bbea-bce76ffd0238","state":200,"price":"FREE","productId":"6"}]
			 */
			getFolioDataHandler: function(data) {
				var len = data.length;
				for (var i = 0; i < len; i++) {
					folioDataHash[data[i].id] = data[i];
				}
				
				folioCollection.fetch({dataType: 'xml'});
			},
			
			numFoliosPerRow: 4,
			horizontalGap: 30,
			verticalGap: 30,
			folioWidth: 160,
			folioHeight: 298,
			easing: "cubicEaseInOut",
			
			folios: [], // Array of all folio product ids. Used to look up the element.
			filteredFolios: [], // Array of folio product ids which match the search string. Used to look up the element.
			filteredFolioHash: null, // Keeps track of the folio product ids which match the search string.
		
			// Adds the folios
			addFolios: function() {
				var numFolios = folioCollection.length;
				var scope = this;
				for (var i = 0; i < numFolios; i++) {
					var folio = folioCollection.at(i);
					// Set the id on the div based on productId.
					var view = new FolioItemView({model: folio, id: "folio" + folio.attributes.productId});
					var el = $(view.render().el).appendTo("body");
					this.folios.push(folio.attributes.productId);
					this.filteredFolios.push(folio.attributes.productId);
					$("#" + folio.attributes.id).click(function(e){ scope.buy(e) });
				}
				
				$("#loading").css("display", "none");
				$("#loading").html("Sorry, your search had no results.");
				
				this.layoutFolios(false);
			},
			
			buy: function(e) {
				var folio = folioDataHash[e.currentTarget.id];
				if (folio.state == 100)
					adobe.dps.store.buyFolio(folio.productId);
				else
					adobe.dps.store.viewFolio(folio.productId);
			},
			
			// Lays out the folios in a grid.
			layoutFolios: function(bAnimate, ignoreKeyboardHeight) {
				var startX = Math.round(($(window).width() - (((this.numFoliosPerRow - 1) * this.horizontalGap) + this.numFoliosPerRow * this.folioWidth)) / 2);	
				var startY;
				var marketingEl = $("#marketing");
				if ($("#searchInput").val() == "") { // search field is empty so make marketing pod visible.
					if (bAnimate && marketingEl.css("opacity") == 0)
						marketingEl.animate({opacity: 1}, 600, this.easing);
									
					startY = 412; // Start layout 30px below marketing pod.
					
					this.startRotatingBanner();
				}
				else
				{
					if (marketingEl.css("opacity") == 1) 
						marketingEl.animate({opacity: 0}, 600, this.easing);
					
					startY = 63;
					
					this.stopRotatingBanner();
				}
				
				var len = this.filteredFolios.length;
				this.filteredFolioHash = {};
				// In order to optimize the animations so items which are not onscreen are not animated,
				// take into account the height of the keyboard. Keyboard is taller in landscape. It can also be taller in other languages.
				// When sorting the keyboard is not visible.
				var availableHeight = ignoreKeyboardHeight ? window.innerHeight : window.innerHeight - (window.innerWidth == 768 ? 264 : 352);

				// Loop through the filtered folios and animate or put them in the correct position.
				for (var i = 0; i < len; i++) {
					var productId = this.filteredFolios[i];
					var el = $("#folio" + productId);
					var colIndex = i % this.numFoliosPerRow;
					var rowIndex = Math.floor(i / this.numFoliosPerRow);
					var left = startX + colIndex * (this.horizontalGap + this.folioWidth);
					var top = startY + rowIndex * (this.verticalGap + this.folioHeight);

					if (el.css("display") != "block")
						el.css("display", "block");

					var currentTop = this.convertPixelsToNumber(el.css("top"));
					if (bAnimate && (top < availableHeight || currentTop < availableHeight)) { // Only animate if the element is going to be visible or is currently visible.
						if (i == len - 1) {
							var scope = this;
							// Add a handler to the first animation only.
							// The handler hides the folios not in filteredFolios.
							el.animate({left: left, top: top, opacity: 1}, 600, this.easing, function(){ scope.animateHandler()});
						} else {
							el.animate({left: left, top: top, opacity: 1}, 600, this.easing);
						}
					} else {
						el.css("opacity", 1);
						el.css("left", left);
						el.css("top", top);
					}
					
					this.filteredFolioHash[productId] = true;
				}
				
				// Fade out the visible folios which are not included in filteredFolios.
				// Wait until the first animation from above completes and then set display: none.
				// Setting it now will make the animation choppy so wait until it's done. 
				len = this.folios.length;
				for (i = 0; i < len; i++) {
					if (!this.filteredFolioHash[this.folios[i]]) {
						el = $("#folio" + this.folios[i]);
						currentTop = this.convertPixelsToNumber(el.css("top"));
						// Hide the folios which are visible
						if (bAnimate &&	currentTop < availableHeight) {
							el.animate({opacity: 0}, 600, this.easing);
						}
					}
				}
			},
			
			// Hides the folios, after the animation, which don't match the search query.
			animateHandler: function() {
				var len = this.folios.length;
				for (var i = 0; i < len; i++) {
					if (!this.filteredFolioHash[this.folios[i]]) {
						$("#folio" + this.folios[i]).css("display", "none");
					}
				}
			},
			
			removeMissingFolios: function() {
				if (adobeExists()) {
					var len = folioCollection.length;
					for (var i = len - 1; i >= 0; i--) {
						var folio = folioCollection.at(i);
						// Make sure a matching item was returned from getFolioData().
						// For retail items there will not be a match if a price could not be determined from iTunesConnect.
						if (!folioDataHash[folio.attributes.id]){
							folioCollection.remove(folio, {silent: true});
						}
					}
				}
				
				this.addFolios();
			}
		});
		
		// Checks to make sure the store api is present.
		var adobeExists = function() {
			var itExists = typeof adobe != 'undefined' &&
		               typeof adobe.dps != 'undefined' &&
		               typeof adobe.dps.store != 'undefined';
	
			//if (!itExists) alert('No store API found...');
		
			return itExists;
		}
		
		// The folio data returned by the store API. The data is returned as an
		// array but stored in hash for easier look up.
		// Data includes id, state, price and productId.
		// Valid states are in adobe.dps.Store.FolioState
		// INVALID : 0,
		// UNAVALIABLE : 50			 The folio is not yet available for purchase
		// PURCHASABLE : 100		 Can be purchased and downloaded
		// PURCHASING : 101			 There is an active or paused Purchase Transaction for
		// DOWNLOADABLE : 200		 The folio is free, or its Purchase Transaction completed
		// DOWNLOADING : 201		 There is an active or paused Download Transaction for
		// EXTRACTABLE : 400		 The folio content is stored locally.
		// EXTRACTING : 401			 There is an active or pause Extraction Transaction for
		// VIEWABLE : 1000			 The folio is can be loaded in the viewer
		// UPDATEDOWNLOADABLE : 1500 The folio is viewable but can be updated
		// UPDATEDOWNLOADING : 1501  There is an active update download for this folio
		// UPDATEEXTRACTABLE : 1502  The folio is viewable but has an update that can be installed
		// UPDATEEXTRACTING : 1503   There is an active update extraction for this folio
		var folioDataHash = {};
		
		var folioCollection = new FolioCollection();
		var folioView = new FolioView();
	}
	
	if (window.connected)
		init();
	else
		window.onnetworkconnection = init;
});