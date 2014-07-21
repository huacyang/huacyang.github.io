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
		 *      <description>description for folio 15</description> 
		 *      <manifestXRef>Folio 15</manifestXRef> 
		 *      <state>production</state> 
		 *      <libraryPreviewUrl landscapeVersion="1" portraitVersion="1">http://edge.adobe-dcfs.com/ddp/issueServer/issues/1602ea42-52f7-4f2f-9242-5c16b674e6be/libraryPreview</libraryPreviewUrl> 
		 *      <brokers> 
		 *        <broker>noChargeStore</broker> 
		 *      </brokers> 
		 *    </issue> 
		 *    <issue id="09b34326-8eb3-44d1-85c7-2df13d79c3ec" productId="productid6" formatVersion="1.7.0" version="7" subpath=""> 
		 *      <magazineTitle>Title 6</magazineTitle> 
		 *      <issueNumber>6</issueNumber> 
		 *      <description>description for folio 6</description> 
		 *      <manifestXRef>Folio 6</manifestXRef> 
		 *      <state>production</state> 
		 *      <libraryPreviewUrl landscapeVersion="2" portraitVersion="2">http://edge.adobe-dcfs.com/ddp/issueServer/issues/09b34326-8eb3-44d1-85c7-2df13d79c3ec/libraryPreview</libraryPreviewUrl> 
		 *      <brokers> 
		 *        <broker>appleStore</broker> 
		 *       </brokers> 
		 *     </issue> 
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
						if (childNodes[j].nodeType == 1) {
							var nodeName = childNodes[j].nodeName;
							if (nodeName != "libraryPreviewUrl")
								issue[nodeName] = childNodes[j].firstChild.nodeValue;
							else
								issue[nodeName] = $.trim(childNodes[j].firstChild.nodeValue);
								
							if (childNodes[j].nodeName == "libraryPreviewUrl") {
								issue.hasLandscapeImage = childNodes[j].attributes.getNamedItem("landscapeVersion").value == "1";
								issue.hasPortraitImage = childNodes[j].attributes.getNamedItem("portraitVersion").value == "1";
							}
						}
					}
					
					issues.push(issue);
				}
	
				return issues;
			}
			else
			{
				return null;
			}
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
		 * Displays the folios as a slideshow.
		 */
		var FeaturedFolioView = Backbone.View.extend({
			el: $("#slideshow"),
			
			viewportWidth: 730,
			
			viewportHeight: 297,
			
			loop: true,
			
			selectedIndex: -1,
			
			// jQuery objects which reference the respective canvas.
			leftCanvas: null,
			selectedCanvas: null,
			rightCanvas: null,
			
			ignoreNextTouchableend: true,
			isAnimating: false,
			bTouchMoved: false,
			animationDuration: 300,
			
			easing: "cubicEaseOut",
			
			initialize: function() {
				$("body").append("<div id='slideshow'><div id='slideshowViewport'></div></div><canvas id='navStatus' width='730' height='30'></canvas>");
				
				// Add the images and prevent dragging.
				this.leftBufferImage = $("<img class='slideshowImage' onmousedown='return false' width='" + this.viewportWidth + "' height='" + this.viewportHeight + "' />").appendTo("#slideshowViewport");
				this.selectedImage = $("<img class='slideshowImage' onmousedown='return false' width='" + this.viewportWidth + "' height='" + this.viewportHeight + "'/>").appendTo("#slideshowViewport");
				this.rightBufferImage = $("<img class='slideshowImage' onmousedown='return false' width='" + this.viewportWidth + "' height='" + this.viewportHeight + "'/>").appendTo("#slideshowViewport");
	
				var scope = this;
				$("#slideshowViewport").Touchable();
				$("#slideshowViewport").bind("mousedown touchstart MozTouchDown", function(e, touch){ scope.slideshowViewport_mouseDownHandler(e, touch)});
				
				// This would most likely be loaded from an xml or json file but for demo purposes hardcode.
				this.setData([{url: "http://lighthouse.adobe.com/users/derek/store/images/marketing1.jpg"},
							  {url: "http://lighthouse.adobe.com/users/derek/store/images/marketing2.jpg"},
							  {url: "http://lighthouse.adobe.com/users/derek/store/images/marketing3.jpg"}]);
			},
		
			setData: function(value) {
				this.data = value;
				// Preload the images.
				for (var i = 0; i < this.data.length; i++) {
					var image = new Image();
					image.src = this.data[i].url;
				}
				
				this.selectedIndex = 0;
				this.resetImageCoords();
				this.updateBufferImagesSrc();
				this.drawNavStatus();
				this.selectedImage.attr("src", value[0].url);
			},
			
			previous: function(bUpdateBufferImagesSrc) {
				this.stopAnimations();
				
				if (bUpdateBufferImagesSrc)
					this.updateBufferImagesSrc();
				
				// If the slideshow is not supposed to loop then don't
				// do anything when previous is clicked.
				if (!this.loop && this.selectedIndex == 0)
					return;
					
				if (this.selectedIndex == 0)
					this.selectedIndex = this.data.length - 1;
				else
					this.selectedIndex -= 1;
	
				var scope = this;
				this.leftBufferImage.animate({left: 0}, this.animationDuration, this.easing);
				this.selectedImage.animate({left: this.viewportWidth}, this.animationDuration, this.easing, function(){ scope.animateHandler() });
				this.isAnimating = true;
				
				var temp = this.selectedImage;
				this.selectedImage = this.leftBufferImage;
				this.leftBufferImage = temp;
			},
			
			next: function(bUpdateBufferImagesSrc) {
				this.stopAnimations();
				
				if (bUpdateBufferImagesSrc)
					this.updateBufferImagesSrc();
					
				// If the slideshow is not supposed to loop then don't
				// do anything when previous is clicked.
				if (!this.loop && this.selectedIndex + 1 == this.data.length)
					return;
				
				if (this.selectedIndex + 1 == this.data.length)
					this.selectedIndex = 0;
				else
					this.selectedIndex += 1;
					
				var scope = this;
				this.rightBufferImage.animate({left: 0}, this.animationDuration, this.easing);
				this.selectedImage.animate({left: -this.viewportWidth}, this.animationDuration, this.easing, function(){ scope.animateHandler() });
				this.isAnimating = true;
				
				var temp = this.selectedImage;
				this.selectedImage = this.rightBufferImage;
				this.rightBufferImage = temp;
			},
			
			drawNavStatus: function() {
				var canvas = document.getElementById("navStatus");
				var context = canvas.getContext("2d");
				context.clearRect(0, 0, canvas.width, canvas.height)
				var len = this.data.length;
				
				var horizontalGap = 10;
				var radius = 5;
				
				var totalWidth = len * radius * 2 + (len -1) * horizontalGap;
				var centerX = Math.round((canvas.width - totalWidth) / 2);
				var centerY = radius * 2;
				
				// draw the background first. semi circles on each end with a rectangle in the middle.
				context.fillStyle = "#808080";
				
				context.beginPath();
				context.arc(centerX - 3, centerY, radius * 2, Math.PI * -1.5, Math.PI + Math.PI * -1.5)
				context.closePath();
				context.fill();
				
				context.beginPath();
				context.fillRect(centerX - 3, 0, totalWidth - 2, radius * 4);
				context.closePath();
				context.fill();
				
				context.beginPath();
				context.arc(totalWidth + centerX - 5, centerY, radius * 2, Math.PI * 1.5, Math.PI + Math.PI * 1.5)
				context.closePath();
				context.fill();
				
				for (var i = 0; i < len; i++) {
					context.fillStyle = i == this.selectedIndex ? "#ffffff" : "#999999";
					context.beginPath();
					context.arc(centerX + ((radius * 2 + horizontalGap) * i), centerY, radius, 0, Math.PI * 2, true); 
					context.closePath();
					context.fill();
				}
			},
			
			stopAnimations: function() {
				if (this.isAnimating) {
					this.leftBufferImage.stop(true, true);
					this.selectedImage.stop(true, true);
					this.rightBufferImage.stop(true, true);
					
					this.resetImageCoords();
				}
			},
			
			/**
			 * Positions each image at their correct positions.
			 */
			resetImageCoords: function() {
				// Offscreen to the left.
				this.leftBufferImage.css("left", -this.viewportWidth);
				// Visible.
				this.selectedImage.css("left", 0);
				// Offscreen to the right.
				this.rightBufferImage.css("left", this.viewportWidth);
			},
			
			animateHandler: function() {
				this.isAnimating = false;
				
				this.resetImageCoords();
				this.updateBufferImagesSrc();
				this.drawNavStatus();
			},
			
			/**
			 * Updates the source for the images.
			 */
			updateBufferImagesSrc: function() {
				var index = this.selectedIndex - 1;
				if (index < 0)
					index = this.data.length - 1;
			
				if (this.leftBufferImage.attr("src") != this.data[index].url)
					this.leftBufferImage.attr("src", this.data[index].url);
				
				index = this.selectedIndex + 1
				if (index == this.data.length)
					index = 0;
				
				if (this.rightBufferImage.attr("src") != this.data[index].url)
					this.rightBufferImage.attr("src", this.data[index].url);
			},
			
			/**
			 * Need to listen for the mouseDown on slideshowViewport and then add the listeners
			 * for the touchable events. Otherwise on iOS the touchablemove event is triggered
			 * on anything that is touched rather than only on slideshowViewport.
			 */
			slideshowViewport_mouseDownHandler: function(e) {
				if (this.isAnimating)
					this.updateBufferImagesSrc();
				
				this.stopAnimations();
				
				// On iOS touchableend is triggered twice so use a flag to ignore the second one. 
				this.ignoreNextTouchableend = false;
				
				this.bTouchMoved = false;
				
				var scope = this;
				$("#slideshowViewport").bind("touchablemove", function(e, touch){ scope.touchablemoveHandler(e, touch)});
				$("#slideshowViewport").bind("touchableend", function(e, touch){ scope.touchableendHandler(e, touch)});
			},
			
			touchablemoveHandler: function(e, touch) {
				this.selectedImage.css("left", touch.currentStartDelta.x);
				
				// Only mark the touch as a move if touch.currentStartDelta.x > 20
				// otherwise treat it as a tap rather than drag.
				if (Math.abs(touch.currentStartDelta.x) > 20)
					this.bTouchMoved = true;
					
				if (touch.currentStartDelta.x > this.viewportWidth) { // Dragged past the right edge.
					// If !loop then only set leftCanvas if we aren't at the first image.
					if (this.loop || (!this.loop && this.selectedIndex > 0))
						this.leftBufferImage.css("left", 0);
				} else if (touch.currentStartDelta.x < -this.viewportWidth) { // Dragged past the left edge.
					// If !loop then only set rightCanvas if we aren't at the last image.
					if (this.loop || (!this.loop && this.selectedIndex + 1 < this.data.length))
						this.rightBufferImage.css("left", 0);
				} else if (touch.currentStartDelta.x > 0) { // Dragging right
					// If !loop then only set leftCanvas if we aren't at the first image.
					if (this.loop || (!this.loop && this.selectedIndex > 0))
						this.leftBufferImage.css("left", touch.currentStartDelta.x - this.viewportWidth);
						
					this.rightBufferImage.css("left", this.viewportWidth);
				} else {// Dragging left.
					// If !loop then only set rightCanvas if we aren't at the last image.
					if (this.loop || (!this.loop && this.selectedIndex + 1 < this.data.length))
						this.rightBufferImage.css("left", touch.currentStartDelta.x + this.viewportWidth);
						
					this.leftBufferImage.css("left", -this.viewportWidth);
				}
			},
			
			touchableendHandler: function(e, touch) {
				if (!this.ignoreNextTouchableend) {
					if (this.bTouchMoved) {
						if (this.loop) {
							if (touch.currentDelta.x > 0) 
								this.previous(false);
							else 
								this.next(false);
						} else {// No looping
							if (touch.currentDelta.x < 0 && this.selectedIndex + 1 < this.data.length) {
								// Go to the next one as long as we aren't at the last image.
								this.next(false);
							} else if (touch.currentDelta.x > 0 && this.selectedIndex > 0) {
								// Go to the previous one as long as we aren't at the first image.
								this.previous(false);
							} else {
								// At the first or last image so animate it back to zero.
								var scope = this;
								this.selectedImage.animate({left: 0}, this.animationDuration, this.easing, function(){ scope.animateHandler() });
								this.isAnimating = true;
							}
						}
					} else {
						// Check if the user tapped the left or right of the image.
						// touch.startTouch.x is the x coord for the entire window.
						// $("#slideshowViewport").position().left is the center x coord of the image.
						if (touch.startTouch.x > $("#slideshowViewport").position().left)
							this.next();
						else
							this.previous();
					}
					
					$("#slideshowViewport").unbind("touchablemove");
					$("#slideshowViewport").unbind("touchableend");
				}
				
				this.ignoreNextTouchableend = true;
			},
		});
		
		/**
		 * Displays the rows of FolioItemViews.
		 */
		var FolioView = Backbone.View.extend({
			el: $("#foliosContainer"),
			
			NUM_FOLIOS_PER_PAGE: 12, // Display items in increments of this amount.
			
			pageIndex: 0,
					
			initialize: function() {
				$("body").append("<div id='foliosContainer'><div id='folios'></div><div id='more'>More</div><div id='loading'>Loading...</div></div>")
				$("#more").css("display", "none");
				$("#loading").css("display", "block");
				_.bindAll(this, "removeMissingFolios");
				folioCollection.bind("all", this.removeMissingFolios);
				
				var scope = this;
				$("#more").click(function(){ scope.addFolios()});
				
				if (adobeExists()) {
					// Get the folio data before fetching the collections so
					// state and price can be cross-referenced.
					adobe.dps.store.getFolioData(this.getFolioDataHandler);
				} else { // API doesn't exist so testing on desktop.
					folioCollection.fetch({dataType: 'xml'});
				}
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
				
				// When the viewer is launched for the first time the library needs to update before
				// adobe.dps.store.getFolioData can return valid data. Unfortunately it will return zero
				// folios until the library is updated so need to add a condition to check for zero folios
				// and if there aren't any then create an interval and wait until there are more.
				if (len == 0) {
					if (!this.interval) {
						var scope = this;
						this.interval = setInterval(function() {
							adobe.dps.store.getFolioData(function(data) {
								scope.getFolioDataHandler(data);
							});
						}, 1000);
					}
					
					return;
				}
				
				clearInterval(this.interval);
				
				for (var i = 0; i < len; i++) {
					folioDataHash[data[i].id] = data[i];
				}
				
				folioCollection.fetch({dataType: 'xml'});
			},
			
			events: {
				"click #more": "addFolios"
			},
			
			// Adds the folios
			addFolios: function() {
				var numFolios = Math.min(this.pageIndex * this.NUM_FOLIOS_PER_PAGE + this.NUM_FOLIOS_PER_PAGE, folioCollection.length);
				var scope = this;
				for (var i = this.pageIndex * this.NUM_FOLIOS_PER_PAGE; i < numFolios; i++) {
					var folio = folioCollection.at(i);
					var view = new FolioItemView({model: folio});
					$("#folios").append(view.render().el);
					$("#" + folio.attributes.id).click(function(e){ scope.buy(e) });
				}
				
				$("#loading").css("display", "none");
				$("#more").css("display", numFolios < folioCollection.length ? "block" : "none");
				
				this.pageIndex += 1;
			},
			
			buy: function(e) {
				var folio = folioDataHash[e.currentTarget.id];
				if (folio.state == 100)
					adobe.dps.store.buyFolio(folio.productId);
				else
					adobe.dps.store.viewFolio(folio.productId);
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
		
		var featuredFolioView = new FeaturedFolioView();
		var folioCollection = new FolioCollection();
		var folioView = new FolioView();
	}
	
	if (window.connected)
		init();
	else
		window.onnetworkconnection = init;
});