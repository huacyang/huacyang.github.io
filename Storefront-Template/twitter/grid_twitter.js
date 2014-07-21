$(document).ready(function() {
	var init = function() {
		// Since the account is a demo account and will contain different magazines (The Look, Fork & Spoon, Current)
		// use a different URL for the XML than the fulfillment server so only one of the magazines is displayed for a particular store.
		var FULFILLMENT_URL = "http://lighthouse.adobe.com/users/derek/store/data/grid_943864f0a0d2431aa2992987caf78cb0.xml";
		//var FULFILLMENT_URL = "http://edge.adobe-dcfs.com/ddp/issueServer/issues?accountId=943864f0a0d2431aa2992987caf78cb0";
		
		var TWITTER_URL = "http://search.twitter.com/search.json?q=from:nytimes";
	
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
		
		var formatCreatedAt = function (a) {
		    var b = new Date();
		    var c = new Date(a);
		    var d = b - c;
		    var e = 1000,
		        minute = e * 60,
		        hour = minute * 60,
		        day = hour * 24,
		        week = day * 7;
		    if (isNaN(d) || d < 0) return "";

		    if (d < e * 7) return "right now";

		    if (d < minute) return Math.floor(d / e) + " seconds ago";

		    if (d < minute * 2) return "about 1 minute ago";
		    
		    if (d < hour) return Math.floor(d / minute) + " minutes ago";
		    
		    if (d < hour * 2) return "about 1 hour ago";
		    
		    if (d < day) return Math.floor(d / hour) + " hours ago";
		    
		    if (d > day && d < day * 2) return "yesterday";
		    
		    if (d < day * 365) return Math.floor(d / day) + " days ago"
		    else return "over a year ago"
		};
		
		var Twitter = Backbone.Model.extend({});
		
		var TwitterCollection = Backbone.Collection.extend({
			model: Twitter,
			
			url: TWITTER_URL
		});
		
		/**
		 * Displays each individual tweet.
		 */
		var TwitterItemView = Backbone.View.extend({
			tagName:  "div",
			
			className: "tweet",
			
			formatCreatedAt: formatCreatedAt,
			
			parseHashTag: function(str) {
								return str.replace(/[#]+[A-Za-z0-9-_.]+/g, function(t) {
									var tag = t.replace("#","%23")
									return t.link("http://search.twitter.com/search?q="+tag);
								});
							},
			
			parseURL: function(str) {
							return str.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
								return url.link(url);
							});
						},
			
			parseUsername: function(str) {
								return str.replace(/[@]+[A-Za-z0-9-_]+/g, function(u) {
									var username = u.replace("@","")
									return u.link("http://twitter.com/"+username);
								});
							},
		
			template: _.template("<%= this.parseUsername(this.parseHashTag(this.parseURL(text))) %><div class='date'><%= this.formatCreatedAt(created_at) %></div><hr>"),
			
			render: function() {
				$(this.el).html(this.template(this.model));
				return this;
			},
		});
		
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
			
			NUM_FOLIOS_PER_PAGE: 9, // Display items in increments of this amount.
			
			pageIndex: 0,
					
			initialize: function() {
				var html = "<div id='outerContainer'>";
					html += 	"<div id='container'>";
					html += 		"<div id='leftCol'>";
					html += 			"<div id='folios'></div>";
					html += 			"<div id='more'>More</div>";
					html += 			"<div id='loading'>Loading...</div>";
					html +=			"</div>";
					html += 		"<div id='twitter'><img src='http://lighthouse.adobe.com/users/derek/store/images/twitter_header.gif' width='162' height='44'><strong>@nytimes</strong><hr></div>";
					html += 	"</div>";
					html += "</div>";
					
				$("body").append(html);
				$("#more").css("display", "none");
				$("#loading").css("display", "block");
				_.bindAll(this, "removeMissingFolios");
				folioCollection.bind("all", this.removeMissingFolios);
				
				_.bindAll(this, "addTweets");
				twitterCollection.bind("all", this.addTweets);
				twitterCollection.fetch();
				
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
			
			addTweets: function() {
				var tweets = twitterCollection.at(0).attributes.results;
				var len = Math.min(tweets.length, 10);
				for (var i = 0; i < len; i++) {
					var tweet = tweets[i];
					var view = new TwitterItemView({model: tweet});
					$("#twitter").append(view.render().el);
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
		
		var twitterCollection = new TwitterCollection();
		var folioCollection = new FolioCollection();
		var folioView = new FolioView();
	}
	
	if (window.connected)
		init();
	else
		window.onnetworkconnection = init;
});