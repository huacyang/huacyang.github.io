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
		 * Displays the rows of FolioItemViews.
		 */
		var FolioView = Backbone.View.extend({
			el: $("#foliosContainer"),
			
			NUM_FOLIOS_PER_PAGE: 12, // Display items in increments of this amount.
			
			pageIndex: 0,
					
			initialize: function() {
				var html  = "<div id='marketing'><img id='bg' src='http://lighthouse.adobe.com/users/derek/store/images/search_marketing_pod.jpg' width='730' height='314'></div>";
					html += "<div id='foliosContainer'><div id='folios'></div><div id='more'>More</div><div id='loading'>Loading...</div></div>";
								 
				$("body").append(html);
											 
				this.createRotatingBanner("marketing", ["http://lighthouse.adobe.com/users/derek/store/images/rotating_banner_1.jpg",
														"http://lighthouse.adobe.com/users/derek/store/images/rotating_banner_2.jpg",
														"http://lighthouse.adobe.com/users/derek/store/images/rotating_banner_3.jpg",
														"http://lighthouse.adobe.com/users/derek/store/images/rotating_banner_4.jpg"]);
				
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
											 
			rotateBanners: function() {
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
		
		var folioCollection = new FolioCollection();
		var folioView = new FolioView();
	}
	
	if (window.connected)
		init();
	else
		window.onnetworkconnection = init;
});