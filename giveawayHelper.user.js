// ==UserScript==
// @name Giveaway Helper
// @namespace https://github.com/Citrinate/giveawayHelper
// @description Enhances Steam key-related giveaways
// @author Citrinate
// @version 2.12.2
// @match *://*.chubbykeys.com/giveaway.php*
// @match *://*.bananagiveaway.com/giveaway/*
// @match *://*.dogebundle.com/index.php?page=redeem&id=*
// @match *://*.dupedornot.com/giveaway.php*
// @match *://*.embloo.net/task/*
// @match *://*.gamecode.win/giveaway/*
// @match *://*.gamehag.com/giveaway/*
// @match *://*.gamezito.com/giveaway/*
// @match *://*.getkeys.net/giveaway.php*
// @match *://*.ghame.ru/*
// @match *://*.giftybundle.com/giveaway.php*
// @match *://*.giveaway.su/giveaway/view/*
// @match *://*.giveawayhopper.com/giveaway.php*
// @match *://*.gleam.io/*
// @match *://*.grabfreegame.com/giveaway/*
// @match *://*.hrkgame.com/en/giveaway/get-free-game/
// @match *://*.keychampions.net/view.php?gid=*
// @match *://*.marvelousga.com/giveaway/*
// @match *://*.prys.ga/giveaway/?id=*
// @match *://*.simplo.gg/index.php?giveaway=*
// @match *://*.steamfriends.info/free-steam-key/
// @match *://*.treasuregiveaways.com/*.php*
// @match *://*.whosgamingnow.net/giveaway/*
// @connect steamcommunity.com
// @connect steampowered.com
// @connect twitter.com
// @connect twitch.tv
// @match https://syndication.twitter.com/
// @match https://player.twitch.tv/
// @grant GM_getValue
// @grant GM.getValue
// @grant GM_setValue
// @grant GM.setValue
// @grant GM_deleteValue
// @grant GM.deleteValue
// @grant GM_addStyle
// @grant GM_xmlhttpRequest
// @grant GM.xmlHttpRequest
// @updateURL https://raw.githubusercontent.com/Citrinate/giveawayHelper/master/giveawayHelper.user.js
// @downloadURL https://raw.githubusercontent.com/Citrinate/giveawayHelper/master/giveawayHelper.user.js
// @require https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.2/rollups/md5.js
// @run-at document-end
// ==/UserScript==

(function() {

	/**
	 *
	 */
	var setup = (function() {
		return {
			/**
			 * Determine what to do for this page based on what's defined in the "config" variable
			 *
			 * 		hostname: A string
			 *			The hostname of the site we're setting the config for. Must be the same as what's defined
			 *			as @match in the metadata block above.
			 *
			 *		helper: An object
			 * 			The class which will determine how the do/undo buttons are added to the page. Usually this will
			 *			be set to basicHelper, which simply searches for links to Steam Groups and adds buttons for
			 *			them at the top of the page.
			 *
			 *		domMatch: An array of strings
			 *			In some cases, we don't know what page a giveaway will be on.  For example, Indiegala embeds
			 *			giveaways on various parts of their site which they want to attract attention to.  Instead we
			 *			need to search the page for a DOM element that only appears when there is a giveaway on that
			 *			page. If any of the elements in this array match, then the script will be run on this page.
			 *
			 *		urlMatch: An array of regular expressions
			 *			Used in conjunction with domMatch.  Used for pages on the domain that we do know are relevant
			 *			to giveaways, and we always want to run the script on.  For example, the giveaway confirmation
			 *			page on Indiegala.  The regular expressions will be tested against the url of the pages, and if
			 *			any of them match, the script will be run on this page.
			 *
			 *		cache: Boolean
			 *			For use with basicHelper.  Some sites will remove links to Steam groups after the entry has
			 *			been completed.  Set this to true so that any groups we find will be saved and presented later.
			 *
			 *		offset: Array of integers
			 *			For use with basicHelper.  Used to correct instances where the script's UI blocks parts of a
			 *			site.  Offsets the UI by X number of pixels in the order of [top, left, right].
			 *			Directions that shouldn't be offset should be set to 0.
			 *
			 *      zIndex: Integer
			 *          For use with basicHelper.  Used to correct instances where the site's UI might overlay the
			 *          the script's UI and will be blocked by it.
			 *
			 *		requires: An object: {twitch: Boolean}
			 *			For use with basicHelper.  Some sites may have links asking you to follow a twitch channel, but
			 *			don't verify that you've done so.  In these cases there's no need to display a "follow/unfollow"
			 *			button.  For sites that do verify, set the value to true.
			 *
			 *		redirect_urls: A function which returns a jQuery object
			 *			For use with basicHelper.  Used on sites which may hide URLs behind a redirection link.
			 *			The jQuery object should contain the anchors that contain these links, and should be specific
			 *			enough so that it only contains links we know must be resolved.
			 *
			 *		redirect_url_extract: A function which returns a string
			 *			For use with basicHelper and redirect_urls.  Used in instances where redirections are used, but
			 *			the links can't be found within anchors.  This function is used to extract the url from whatever
			 *			elements the redirect_urls function returns.
			 *
			 *		onLoad: A function
			 *			For use with basicHelper.  A function that executes after the page loads.
			 *
			 */
			run: function() {
				var found = false,
					config = [
						{
							hostname: "chubbykeys.com",
							helper: basicHelper,
							cache: false
						},
						{
							hostname: "bananagiveaway.com",
							helper: basicHelper,
							cache: true,
							redirect_urls: function() {
								return $("li:contains('Join')")
									.find("button:nth-child(1)");
							},
							redirect_url_extract: function(element) {
								return element.attr("onclick").replace("window.open('", "").replace("')", "");
							}
						},
						{
							hostname: "dogebundle.com",
							helper: basicHelper,
							cache: true,
							offset: [50, 0, 0]
						},
						{
							hostname: "dupedornot.com",
							helper: basicHelper,
							cache: false,
							requires: {twitch: true}
						},
						{
							hostname: "embloo.net",
							helper: basicHelper,
							cache: true
						},
						{
							hostname: "gamecode.win",
							helper: basicHelper,
							cache: true,
							requires: {twitch: true}
						},
						{
							hostname: "gamehag.com",
							helper: basicHelper,
							cache: true,
							offset: [80, 0, 300],
							zIndex: 80,
							redirect_urls: function() {
								return $(".element-list .task-content:contains('Steam Community group')")
									.find("a[href*='/giveaway/click/']");
							}
						},
						{
							hostname: "gamezito.com",
							helper: basicHelper,
							cache: true,
							onLoad: function() {
								var temp_interval = setInterval(function() {
									if($("body").css("overflow") != "visible") {
										clearInterval(temp_interval);
										$("body").css("overflow", "visible");
									}
								}, 100);
							}
						},
						{
							hostname: "getkeys.net",
							helper: basicHelper,
							cache: false,
							requires: {twitch: true},
							offset: [60, 0, 0],
							zIndex: 998
						},
						{
							hostname: "ghame.ru",
							helper: basicHelper,
							cache: false
						},
						{
							hostname: "giftybundle.com",
							helper: basicHelper,
							cache: false
						},
						{
							hostname: "giveaway.su",
							helper: basicHelper,
							cache: true,
							requires: {steam_curators: true},
							zIndex: 1,
							redirect_urls: function() {
								return $(".fa-steam").closest("tr").find("a[href*='/action/redirect/']");
							}
						},
						{
							hostname: "giveawayhopper.com",
							helper: basicHelper,
							cache: false
						},
						{
							hostname: "gleam.io",
							helper: gleamHelper,
							cache: false
						},
						{
							hostname: "grabfreegame.com",
							helper: basicHelper,
							cache: true,
							offset: [56, 0, 0],
							redirect_urls: function() {
								return $("li p:contains('Steam Group')").parent()
									.find("button:contains('To do')");
							},
							redirect_url_extract: function(element) {
								return element.attr("onclick").replace("window.open('", "").replace("')", "");
							}
						},
						{
							hostname: "hrkgame.com",
							helper: basicHelper,
							cache: false
						},
						{
							hostname: "keychampions.net",
							helper: basicHelper,
							cache: true,
							offset: [0, 120, 0]
						},
						{
							hostname: "marvelousga.com",
							helper: basicHelper,
							cache: false,
							zIndex: 1,
							requires: {twitch: true}
						},
						{
							hostname: "prys.ga",
							helper: basicHelper,
							cache: false,
							offset: [50, 0, 0],
							zIndex: 1029
						},
						{
							hostname: "simplo.gg",
							helper: basicHelper,
							cache: true
						},
						{
							hostname: "steamfriends.info",
							helper: basicHelper,
							cache: false
						},
						{
							hostname: "treasuregiveaways.com",
							helper: basicHelper,
							cache: true,
							offset: [50, 0, 0],
							zIndex: 1029
						},
						{
							hostname: "whosgamingnow.net",
							helper: basicHelper,
							cache: true
						}
					];

				for(var i = 0; i < config.length; i++) {
					var site = config[i];

					if(document.location.hostname.split(".").splice(-2).join(".") == site.hostname) {
						found = true;

						// determine whether to run the script based on the content of the page
						if(typeof site.domMatch !== "undefined" ||
							typeof site.urlMatch !== "undefined"
						) {
							var match_found = false;

							// check the DOM for matches as defined by domMatch
							if(typeof site.domMatch !== "undefined") {
								for(var k = 0; k < site.domMatch.length; k++) {
									if($(site.domMatch[k]).length !== 0) {
										match_found = true;
										break;
									}
								}
							}

							// check the URL for matches as defined by urlMatch
							if(typeof site.urlMatch !== "undefined") {
								for(var l = 0; l < site.urlMatch.length; l++) {
									var reg = new RegExp(site.urlMatch[l]);

									if(reg.test(location.href)) {
										match_found = true;
										break;
									}
								}
							}

							if(!match_found) break;
						}

						giveawayHelperUI.loadUI(site.zIndex, site.onLoad);
						site.helper.init(site.cache, site.cache_id, site.offset, site.requires, site.redirect_urls,
							site.redirect_url_extract);
					}
				}

				if(!found) {
					commandHub.init();
				}
			}
		};
	})();

	/**
	 *
	 */
	var gleamHelper = (function() {
		var gleam = null,
			authentications = { steam: false, twitter: false, twitch: false };

		/**
		 * Check to see what accounts the user has linked to gleam
		 */
		function checkAuthentications() {
			if(gleam.contestantState.contestant.authentications) {
				var authentication_data = gleam.contestantState.contestant.authentications;

				for(var i = 0; i < authentication_data.length; i++) {
					var current_authentication = authentication_data[i];
					authentications[current_authentication.provider] = current_authentication;
				}
			}
		}

		/**
		 * Decide what to do for each of the entries
		 */
		function handleEntries() {
			var entries = $(".entry-method");

			for(var i = 0; i < entries.length; i++) {
				var entry_element = entries[i],
					entry = unsafeWindow.angular.element(entry_element).scope();

				switch(entry.entry_method.entry_type) {
					case "steam_join_group":
						createSteamButton(entry, entry_element);
						break;

					case "twitter_follow":
					case "twitter_retweet":
					case "twitter_tweet":
					case "twitter_hashtags":
						//createTwitterButton(entry, entry_element);
						break;

					case "twitchtv_follow":
						createTwitchButton(entry, entry_element);
						break;

					default:
						break;
				}
			}
		}

		/**
		 *
		 */
		function handleReward() {
			var temp_interval = setInterval(function() {
				if(gleam.bestCouponCode() !== null) {
					clearInterval(temp_interval);
					SteamHandler.getInstance().findKeys(addRedeemButton, gleam.bestCouponCode(), false);
				}
			}, 100);
		}

		/**
		 * Places the button onto the page
		 */
		function addButton(entry_element) {
			return function(new_button) {
				new_button.addClass("btn btn-embossed btn-info");
				$(entry_element).find(">a").first().append(new_button);
			};
		}

		/**
		 *
		 */
		function addRedeemButton(new_button) {
			new_button.find("button").first().addClass("btn btn-embossed btn-success");
			$(".redeem-container").first().after(new_button);
		}

		/**
		 * Returns true when an entry has been completed
		 */
		function isCompleted(entry) {
			return function() {
				return gleam.isEntered(entry.entry_method) && !gleam.canEnter(entry.entry_method);
			};
		}

		/**
		 *
		 */
		function createSteamButton(entry, entry_element) {
			SteamHandler.getInstance().handleEntry({
					group_name: entry.entry_method.config3.toLowerCase(),
					group_id: entry.entry_method.config4
				},
				addButton(entry_element),
				false,
				authentications.steam === false ? false : {
					user_id: authentications.steam.uid
				}
			);
		}

		/**
		 *
		 */
		function createTwitterButton(entry, entry_element) {
			// Don't do anything for a tweet entry that's already been completed
			if(isCompleted(entry)() &&
				(entry.entry_method.entry_type == "twitter_tweet" ||
					entry.entry_method.entry_type == "twitter_hashtags")) {

				return;
			}

			TwitterHandler.getInstance().handleEntry({
					action: entry.entry_method.entry_type,
					id: entry.entry_method.config1
				},
				addButton(entry_element),
				isCompleted(entry),
				false,
				authentications.twitter === false ? false : {
					user_id: authentications.twitter.uid,
					user_handle: authentications.twitter.reference
				}
			);
		}

		/**
		 *
		 */
		function createTwitchButton(entry, entry_element) {
			TwitchHandler.getInstance().handleEntry(
				entry.entry_method.config1,
				addButton(entry_element),
				isCompleted(entry),
				false,
				authentications.twitchtv === false ? false : {
					user_handle: authentications.twitchtv.reference
				}
			);
		}

		return {
			/**
			 *
			 */
			init: function() {
				MKY.addStyle(`
					.${giveawayHelperUI.gh_button} {
						bottom: 0px;
						height: 32px;
						margin: auto;
						padding: 6px;
						position: absolute;
						right: 64px;
						top: 0px;
						z-index: 9999999999;
					}

					.${giveawayHelperUI.gh_redeem_button} {
						margin-bottom: 32px;
						position: static;
					}
				`);

				// Show exact end date when hovering over any times
				$("[data-ends]").each(function() {
					$(this).attr("title", new Date(parseInt($(this).attr("data-ends")) * 1000));
				});

				// wait for gleam to finish loading
				var temp_interval = setInterval(function() {
					if($(".popup-blocks-container") !== null) {
						clearInterval(temp_interval);
						gleam = unsafeWindow.angular.element($(".popup-blocks-container").get(0)).scope();

						// wait for gleam to fully finish loading
						var another_temp_interval = setInterval(function() {
							if(typeof gleam.campaign.entry_count !== "undefined") {
								clearInterval(another_temp_interval);
								checkAuthentications();
								handleReward();

								if(!gleam.showPromotionEnded()) {
									handleEntries();
								}
							}
						}, 100);
					}
				}, 100);
			}
		};
	})();

	/**
	 *
	 */
	var basicHelper = (function() {
		return {
			/**
			 *
			 */
			init: function(do_cache, cache_id, offset, requires, redirect_urls, redirect_url_extract) {
				if(typeof do_cache !== "undefined" && do_cache) {
					if(typeof cache_id === "undefined") {
						cache_id = document.location.hostname + document.location.pathname + document.location.search;
					}

					cache_id = `cache_${CryptoJS.MD5(cache_id)}`;
				} else {
					do_cache = false;
				}

				giveawayHelperUI.defaultButtonSetup(offset);

				// Some sites load the giveaway data dynamically.  Check every second for changes
				setInterval(function() {
					// Add Steam buttons
					SteamHandler.getInstance().findGroups(
						giveawayHelperUI.addButton,
						$("body").html(),
						true,
						do_cache,
						cache_id
					);

					// Add Steam Key redeem buttons
					SteamHandler.getInstance().findKeys(giveawayHelperUI.addButton, $("body").html(), true);

					if(typeof requires !== "undefined") {
						if(typeof requires.twitch !== "undefined" && requires.twitch === true) {
							// Add Twitch buttons
							TwitchHandler.getInstance().findChannels(
								giveawayHelperUI.addButton,
								$("body").html(),
								true,
								do_cache,
								`twitch_${cache_id}`
							);
						}

						if(typeof requires.steam_curators !== "undefined" && requires.steam_curators === true) {
							// Add Steam Curator buttons
							SteamCuratorHandler.getInstance().findCurators(
								giveawayHelperUI.addButton,
								$("body").html(),
								true,
								do_cache,
								`steam_curators_${cache_id}`
							);
						}
					}

					// Check for redirects
					if(typeof redirect_urls !== "undefined") {
						redirect_urls().each(function() {
							var redirect_url;

							if(typeof redirect_url_extract !== "undefined") {
								redirect_url = redirect_url_extract($(this));
							} else {
								redirect_url = $(this).attr("href");
							}

							giveawayHelperUI.resolveUrl(redirect_url, function(url) {
								// Add Steam button
								SteamHandler.getInstance().findGroups(
									giveawayHelperUI.addButton,
									url,
									true,
									do_cache,
									cache_id
								);

								if(typeof requires !== "undefined") {
									if(typeof requires.twitch !== "undefined" && requires.twitch === true) {
										// Add Twitch button
										TwitchHandler.getInstance().findChannels(
											giveawayHelperUI.addButton,
											url,
											true,
											do_cache,
											`twitch_${cache_id}`
										);
									}

									if(typeof requires.steam_curators !== "undefined" && requires.steam_curators === true) {
										// Steam Curator buttons
										SteamCuratorHandler.getInstance().findCurators(
											giveawayHelperUI.addButton,
											url,
											true,
											do_cache,
											`steam_curators_${cache_id}`
										);
									}
								}
							});
						});
					}
				}, 1000);
			},
		};
	})();

	/**
	 * Handles Steam group buttons
	 */
	var SteamHandler = (function() {
		function init() {
			var re_group_name = /steamcommunity\.com\/groups\/([a-zA-Z0-9\-\_]{2,32})/g,
				re_group_id = /steamcommunity.com\/gid\/(([0-9]+)|\[g:[0-9]:([0-9]+)\])/g,
				re_steam_key = /([A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}|[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5})/g,
				redeem_key_url = "https://store.steampowered.com/account/registerkey?key=",
				user_id = null,
				session_id = null,
				process_url = null,
				active_groups = [],
				button_count = 1,
				handled_group_names = [],
				handled_group_ids = [],
				handled_keys = [],
				ready = false;

			// Get all the user data we'll need to make join/leave group requests
			MKY.xmlHttpRequest({
				url: "https://steamcommunity.com/my/groups",
				method: "GET",
				onload: function(response) {
					user_id = response.responseText.match(/g_steamID = \"(.+?)\";/);
					session_id = response.responseText.match(/g_sessionID = \"(.+?)\";/);
					process_url = response.responseText.match(/steamcommunity.com\/(id\/.+?|profiles\/[0-9]+)\/friends\//);
					user_id = user_id === null ? null : user_id[1];
					session_id = session_id === null ? null : session_id[1];
					process_url = process_url === null ? null : "https://steamcommunity.com/" + process_url[1] + "/home_process";

					$(response.responseText).find("a[href^='https://steamcommunity.com/groups/']").each(function() {
						var group_name = $(this).attr("href").replace("https://steamcommunity.com/groups/", "");

						if(group_name.indexOf("/") == -1) {
							active_groups.push(group_name.toLowerCase());
						}
					});

					active_groups = giveawayHelperUI.removeDuplicates(active_groups);
					ready = true;
				}
			});

			function verifyLogin(expected_user) {
				if(typeof expected_user !== "undefined" && !expected_user) {
					// The user doesn't have a Steam account linked, do nothing
				} else if(user_id === null || session_id === null || process_url === null) {
					// We're not logged in
					giveawayHelperUI.showError(`You must be logged into
						<a href="https://steamcommunity.com/login" target="_blank">steamcommunity.com</a>`);
				} else if(typeof expected_user !== "undefined" && expected_user.user_id != user_id) {
					// We're logged in as the wrong user
					giveawayHelperUI.showError(`You must be logged into the linked Steam account:
						<a href="https://steamcommunity.com/profiles/${expected_user.user_id}" target="_blank">
						https://steamcommunity.com/profiles/${expected_user.user_id}</a>`);
				} else if(active_groups === null) {
					// Couldn't get user's group data
					giveawayHelperUI.showError("Unable to determine what Steam groups you're a member of");
				} else {
					return true;
				}

				return false;
			}

			/**
			 *
			 */
			function prepCreateButton(group_data, button_callback, show_name, expected_user) {
				if(typeof group_data.group_id == "undefined") {
					// Group ID is missing
					getGroupID(group_data.group_name, function(group_id) {
						group_data.group_id = group_id;
						createButton(group_data, button_callback, show_name, expected_user);
					});
				} else if(typeof group_data.group_name == "undefined") {
					// Group name is missing
					getGroupName(group_data.group_id, function(group_name) {
						group_data.group_name = group_name;

						// Fetch a separate numeric group id that we'll need
						getGroupID(group_data.group_name, function(group_id) {
							group_data.group_id = group_id;
							createButton(group_data, button_callback, show_name, expected_user);
						});
					});
				} else {
					createButton(group_data, button_callback, show_name, expected_user);
				}
			}

			/**
			 * Create a join/leave toggle button
			 */
			function createButton(group_data, button_callback, show_name, expected_user) {
				if(verifyLogin(expected_user)) {
					// Create the button
					var group_name = group_data.group_name,
						group_id = group_data.group_id,
						in_group = active_groups.indexOf(group_name) != -1,
						button_id = "steam_button_" + button_count++,
						label = in_group ?
							`Leave ${show_name ? group_name : "Group"}`
							: `Join ${show_name ? group_name : "Group"}`;

					button_callback(
						giveawayHelperUI.buildButton(button_id, label, in_group, function() {
							toggleGroupStatus(button_id, group_name, group_id, show_name);
							giveawayHelperUI.showButtonLoading(button_id);
						})
					);
				}
			}


			/**
			 * Toggle group status between "joined" and "left"
			 */
			function toggleGroupStatus(button_id, group_name, group_id, show_name) {
				var steam_community_down_error = `
					The Steam Community is experiencing issues.  Please handle any remaining Steam entries manually, or reload the page and try again.
				`;

				if(active_groups.indexOf(group_name) == -1) {
					joinSteamGroup(group_name, group_id, function(success) {
						if(success) {
							active_groups.push(group_name);
							giveawayHelperUI.toggleButtonClass(button_id);
							giveawayHelperUI.setButtonLabel(button_id, `Leave ${show_name ? group_name : "Group"}`);
						} else {
							giveawayHelperUI.showError(steam_community_down_error);
						}

						giveawayHelperUI.hideButtonLoading(button_id);
					});
				} else {
					leaveSteamGroup(group_name, group_id, function(success) {
						if(success) {
							active_groups.splice(active_groups.indexOf(group_name), 1);
							giveawayHelperUI.toggleButtonClass(button_id);
							giveawayHelperUI.setButtonLabel(button_id, `Join ${show_name ? group_name : "Group"}`);
						} else {
							giveawayHelperUI.showError(steam_community_down_error);
						}

						giveawayHelperUI.hideButtonLoading(button_id);
					});
				}
			}

			/**
			 * Join a steam group
			 */
			function joinSteamGroup(group_name, group_id, callback) {
				MKY.xmlHttpRequest({
					url: "https://steamcommunity.com/groups/" + group_name,
					method: "POST",
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					data: $.param({ action: "join", sessionID: session_id }),
					onload: function(response) {
						MKY.xmlHttpRequest({
							url: "https://steamcommunity.com/my/groups",
							method: "GET",
							onload: function(response) {
								if(typeof callback == "function") {
									if($(response.responseText.toLowerCase()).find(
										`a[href='https://steamcommunity.com/groups/${group_name}']`).length === 0) {

										// Failed to join the group, Steam Community is probably down
										callback(false);
									} else {
										callback(true);
									}
								}
							}
						});
					}
				});
			}

			/**
			 * Leave a steam group
			 */
			function leaveSteamGroup(group_name, group_id, callback) {
				MKY.xmlHttpRequest({
					url: process_url,
					method: "POST",
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					data: $.param({ sessionID: session_id, action: "leaveGroup", groupId: group_id }),
					onload: function(response) {
						if(typeof callback == "function") {
							if($(response.responseText.toLowerCase()).find(
								`a[href='https://steamcommunity.com/groups/${group_name}']`).length !== 0) {

								// Failed to leave the group, Steam Community is probably down
								callback(false);
							} else {
								callback(true);
							}
						}
					}
				});
			}

			/**
			 * Get the numeric ID for a Steam group
			 */
			function getGroupID(group_name, callback) {
				MKY.xmlHttpRequest({
					url: "https://steamcommunity.com/groups/" + group_name,
					method: "GET",
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					onload: function(response) {
						var group_id = response.responseText.match(/OpenGroupChat\( \'([0-9]+)\'/);
						group_id = group_id === null ? null : group_id[1];

						callback(group_id);
					}
				});
			}

			/**
			 * Get the name for a Steam group given the numeric ID
			 */
			function getGroupName(group_id, callback) {
				MKY.xmlHttpRequest({
					url: "https://steamcommunity.com/gid/" + group_id,
					method: "GET",
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					onload: function(response) {
						var group_name = response.finalUrl.match(/steamcommunity\.com\/groups\/([a-zA-Z0-9\-\_]{2,32})/);
						group_name = group_name === null ? null : group_name[1];

						callback(group_name.toLowerCase());
					}
				});
			}

			return {
				/**
				 *
				 */
				handleEntry: function(group_data, button_callback, show_name, expected_user) {
					if(ready) {
						prepCreateButton(group_data, button_callback, show_name, expected_user);
					} else {
						// Wait for the command hub to load
						var temp_interval = setInterval(function() {
							if(ready) {
								clearInterval(temp_interval);
								prepCreateButton(group_data, button_callback, show_name, expected_user);
							}
						}, 100);
					}
				},

				/**
				 *
				 */
				findGroups: function(button_callback, target, show_name, do_cache, cache_id) {
					var self = this;

					giveawayHelperUI.restoreCachedLinks(cache_id).then(function(group_names) {
						giveawayHelperUI.restoreCachedLinks(cache_id + "_ids").then(function(group_ids) {
							var match;

							if(!do_cache) {
								group_names = [];
								group_ids = [];
							}

							// Look for any links containing steam group names
							while((match = re_group_name.exec(target)) !== null) {
								group_names.push(match[1].toLowerCase());
							}

							// Look for any links containing steam group ids
							while((match = re_group_id.exec(target)) !== null) {
								if(typeof match[2] !== "undefined") {
									group_ids.push(match[2].toLowerCase());
								} else {
									group_ids.push(match[3].toLowerCase());
								}
							}

							group_names = giveawayHelperUI.removeDuplicates(group_names);
							group_ids = giveawayHelperUI.removeDuplicates(group_ids);

							// Cache the results
							if(do_cache) {
								giveawayHelperUI.cacheLinks(group_names, cache_id);
								giveawayHelperUI.cacheLinks(group_ids, cache_id + "_ids");
							}

							// Create the buttons
							for(var i = 0; i < group_names.length; i++) {
								if($.inArray(group_names[i], handled_group_names) == -1) {
									handled_group_names.push(group_names[i]);
									self.handleEntry({ group_name: group_names[i] }, button_callback, show_name);
								}
							}

							for(var j = 0; j < group_ids.length; j++) {
								if($.inArray(group_ids[i], handled_group_ids) == -1) {
									handled_group_ids.push(group_ids[i]);
									self.handleEntry({ group_id: group_ids[j] }, button_callback, show_name);
								}
							}
						});
					});
				},

				/**
				 *
				 */
				findKeys: function(button_callback, target, show_key) {
					var keys = [],
						match;

					while((match = re_steam_key.exec(target)) !== null) {
						keys.push(match[1]);
					}

					for(var i = 0; i < keys.length; i++) {
						if($.inArray(keys[i], handled_keys) == -1) {
							var steam_key = keys[i],
								button_id = 'redeem_' + handled_keys.length,
								label = show_key ? `Redeem ${steam_key}` : "Redeem Key",
								redeem_url = `${redeem_key_url}${steam_key}`;

							handled_keys.push(steam_key);
							button_callback(
								giveawayHelperUI.buildRedeemButton(button_id, label, redeem_url)
							);
						}
					}
				}
			};
		}

		var instance;
		return {
			getInstance: function() {
				if(!instance) instance = init();
				return instance;
			}
		};
	})();



	/**
	 * Handles Steam curator buttons
	 */
	var SteamCuratorHandler = (function() {
		function init() {
			var re_curator_id = /steampowered.com\/curator\/([0-9]+)/g,
				session_id = null,
				active_curators = [],
				button_count = 1,
				handled_curator_ids = [],
				ready = false;
				curator_ready_status = 0;

			// Get all the user data we'll need to make follow/unfollow curator requests
			MKY.xmlHttpRequest({
				url: "https://store.steampowered.com",
				method: "GET",
				onload: function(response) {
					session_id = response.responseText.match(/g_sessionID = \"(.+?)\";/);
					session_id = session_id === null ? null : session_id[1];

					MKY.xmlHttpRequest({
						url: "https://store.steampowered.com/curators/ajaxgetcurators//?query=&start=0&count=1000&filter=mycurators",
						method: "GET",
						headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
						onload: function(response) {
							var curator_urls_completed = 1;

							try {
								var data = JSON.parse(response.responseText);

								if(typeof data.success != "undefined" && typeof data.pagesize != "undefined" && typeof data.total_count != "undefined" && data.success == true) {
									parseActiveCurators(data);

									for(var i = 1; i < Math.ceil(data.total_count/data.pagesize); i++) {
										setTimeout(function() {
											if(ready) return;

											MKY.xmlHttpRequest({
												url: "https://store.steampowered.com/curators/ajaxgetcurators//?query=&start=" + (i * data.pagesize) + "&count=1000&filter=mycurators",
												method: "GET",
												headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
												onload: function(response) {
													try {
														var data = JSON.parse(response.responseText);

														if(typeof data.success != "undefined" && data.success == true) {
															parseActiveCurators(data);
														} else {
															ready = true;
															active_curators = null;
														}

														curator_urls_completed++;
													} catch(e) {
														ready = true;
														active_curators = null;
													}
												}
											});
										}, i * 500);
									}

									var temp_interval = setInterval(function() {
										if(curator_urls_completed >= Math.ceil(data.total_count/data.pagesize)) {
											clearInterval(temp_interval);
											ready = true;
										}
									}, 100)
								}
							} catch(e) {
								ready = true;
								active_curators = null;
							}
						}
					});
				}
			});

			function verifyLogin(expected_user) {
				if(typeof expected_user !== "undefined" && !expected_user) {
					// The user doesn't have a Steam account linked, do nothing
				} else if(session_id === null) {
					// We're not logged in
					giveawayHelperUI.showError(`You must be logged into
						<a href="https://steamcommunity.com/login" target="_blank">steamcommunity.com</a>`);
				}  else if(active_curators === null) {
					// Couldn't get user's group data
					giveawayHelperUI.showError("Unable to determine what Steam curators you're following");
				} else {
					return true;
				}

				return false;
			}

			/**
			 * 
			 */
			function parseActiveCurators(data) {
				if(typeof data.results_html == "undefined") {
					curator_ready_status = 2;
					active_curators = null;
					return;
				}

				var re_curator_results_id = /\"clanID\":\"([0-9]+)\"/g;

				while((match = re_curator_results_id.exec(data.results_html)) !== null) {
					active_curators.push(match[1]);
				}

				return;
			}

			/**
			 * Create a join/leave Curator toggle button
			 */
			function createButton(curator_id, button_callback, show_name, expected_user) {
				if(verifyLogin(expected_user)) {
					// Create the button
					var is_following = active_curators.indexOf(curator_id) != -1,
						button_id = "steam_curator_button_" + button_count++,
						label = is_following ?
							`Unfollow ${show_name ? curator_id : "Curator"}`
							: `Follow ${show_name ? curator_id : "Curator"}`;

					button_callback(
						giveawayHelperUI.buildButton(button_id, label, is_following, function() {
							toggleCuratorStatus(button_id, curator_id, show_name);
							giveawayHelperUI.showButtonLoading(button_id);
						})
					);
				}
			}


			/**
			 * Toggle steam curator status between "following" and "not following"
			 */
			function toggleCuratorStatus(button_id, curator_id, show_name) {
				var steam_community_down_error = `
					The Steam Community is experiencing issues.  Please handle any remaining Steam entries manually, or reload the page and try again.
				`;

				if(active_curators.indexOf(curator_id) == -1) {
					followCurator(curator_id, function(success) {
						if(success) {
							active_curators.push(curator_id);
							giveawayHelperUI.toggleButtonClass(button_id);
							giveawayHelperUI.setButtonLabel(button_id, `Unfollow ${show_name ? curator_id : "Curator"}`);
						} else {
							giveawayHelperUI.showError(steam_community_down_error);
						}

						giveawayHelperUI.hideButtonLoading(button_id);
					});
				} else {
					unfollowCurator(curator_id, function(success) {
						if(success) {
							active_curators.splice(active_curators.indexOf(curator_id), 1);
							giveawayHelperUI.toggleButtonClass(button_id);
							giveawayHelperUI.setButtonLabel(button_id, `Follow ${show_name ? curator_id : "Curator"}`);
						} else {
							giveawayHelperUI.showError(steam_community_down_error);
						}

						giveawayHelperUI.hideButtonLoading(button_id);
					});
				}
			}

			/**
			 * Follow a steam curator
			 */
			function followCurator(curator_id, callback) {
				MKY.xmlHttpRequest({
					url: "https://store.steampowered.com/curators/ajaxfollow",
					method: "POST",
					data: $.param({ clanid: curator_id, sessionid: session_id, follow: "1" }),
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					onload: function(response) {
						try {
							var data = JSON.parse(response.responseText);

							if(typeof data.success != "undefined" && data.success == 1) {
								callback(true);
							} else {
								callback(false);
							}
						} catch(e) {
							callback(false)
						}
					}
				});
			}

			/**
			 * Unfollow a steam curator
			 */
			function unfollowCurator(curator_id, callback) {
				MKY.xmlHttpRequest({
					url: "https://store.steampowered.com/curators/ajaxfollow",
					method: "POST",
					data: $.param({ clanid: curator_id, sessionid: session_id, follow: "0" }),
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					onload: function(response) {
						try {
							var data = JSON.parse(response.responseText);

							if(typeof data.success != "undefined" && data.success == 1) {
								callback(true);
							} else {
								callback(false);
							}
						} catch(e) {
							callback(false)
						}
					}
				});
			}

			return {
				/**
				 *
				 */
				handleEntry: function(curator_id, button_callback, show_name, expected_user) {
					if(ready) {
						createButton(curator_id, button_callback, show_name, expected_user);
					} else {
						// Wait for the command hub to load
						var temp_interval = setInterval(function() {
							if(ready) {
								clearInterval(temp_interval);
								createButton(curator_id, button_callback, show_name, expected_user);
							}
						}, 100);
					}
				},

				/**
				 *
				 */
				findCurators: function(button_callback, target, show_name, do_cache, cache_id) {
					var self = this;

					giveawayHelperUI.restoreCachedLinks(cache_id).then(function(curator_ids) {
						var match;

						if(!do_cache) {
							curator_ids = [];
						}

						// Look for any links containing steam curator ids
						while((match = re_curator_id.exec(target)) !== null) {
							curator_ids.push(match[1].toLowerCase());
						}

						curator_ids = giveawayHelperUI.removeDuplicates(curator_ids);

						// Cache the results
						if(do_cache) {
							giveawayHelperUI.cacheLinks(curator_ids, cache_id);
						}

						// Create the buttons
						for(var i = 0; i < curator_ids.length; i++) {
							if($.inArray(curator_ids[i], handled_curator_ids) == -1) {
								handled_curator_ids.push(curator_ids[i]);
								self.handleEntry(curator_ids[i], button_callback, show_name);
							}
						}
					});
				}
			};
		}

		var instance;
		return {
			getInstance: function() {
				if(!instance) instance = init();
				return instance;
			}
		};
	})();

	/**
	 * Handles Twitter undo buttons
	 */
	var TwitterHandler = (function() {
		function init() {
			var command_hub_url = "https://syndication.twitter.com/",
				command_hub_host = "syndication.twitter.com",
				auth_token = null,
				csrf_token = null,
				user_handle = null,
				user_id = null,
				start_time = +new Date(),
				deleted_tweets = [], // used to make sure we dont try to delete the same (re)tweet more than once
				button_count = 1,
				ready_a = false;
				ready_b = false;

			// Get all the user data we'll need to undo twitter entries
			commandHub.load(
				command_hub_url,
				command_hub_host,
				function() {
					return {
						csrf_token: getCookie("ct0")
					};
				},
				function(data) {
					csrf_token = data.csrf_token;
					ready_a = true;
				}
			);

			MKY.xmlHttpRequest({
				url: "https://twitter.com",
				method: "GET",
				onload: function(response) {
					auth_token = $($(response.responseText)
						.find("input[id='authenticity_token']").get(0))
						.attr("value");
					user_handle = $(response.responseText)
						.find(".current-user a")
						.attr("href");
					user_id = $(response.responseText)
						.find("#current-user-id")
						.attr("value");

					auth_token = typeof auth_token == "undefined" ? null : auth_token;
					user_handle = typeof user_handle == "undefined" ? null : user_handle.replace("/", "");
					user_id = typeof user_id == "undefined" ? null : user_id;

					ready_b = true;
				}
			});

			/**
			 * Get ready to create an item
			 */
			function prepCreateButton(action_data, button_callback, ready_check, show_name, expected_user) {
				// Wait until the entry is completed before showing the button
				var temp_interval = setInterval(function() {
					if(ready_check()) {
						clearInterval(temp_interval);
						createButton(action_data, button_callback, show_name, expected_user, +new Date());
					}
				}, 100);
			}

			/**
			 * Create the button
			 */
			function createButton(action_data, button_callback, show_name, expected_user, end_time) {
				if(!expected_user) {
					// The user doesn't have a Twitter account linked, do nothing
				} else if(auth_token === null || user_handle === null || csrf_token === null) {
					// We're not logged in
					giveawayHelperUI.showError(`You must be logged into
						<a href="https://twitter.com/login" target="_blank">twitter.com</a>`);
				} else if(expected_user.user_id != user_id) {
					// We're logged in as the wrong user
					giveawayHelperUI.showError(`You must be logged into the Twitter account linked to Gleam.io:
						<a href="https://twitter.com/${expected_user.user_handle}" target="_blank">
						https://twitter.com/${expected_user.user_handle}</a>`);
				} else {
					// Create the button
					var button_id = "twitter_button_" + button_count++;

					if(action_data.action == "twitter_follow") {
						// Unfollow button
						var twitter_handle = action_data.id;

						button_callback(
							giveawayHelperUI.buildButton(button_id, `Unfollow${show_name ? ` ${twitter_handle}` : ""}`,
								false,
								function() {
									giveawayHelperUI.removeButton(button_id);

									// Get user's Twitter ID
									getTwitterUserData(twitter_handle, function(twitter_id, is_following) {
										deleteTwitterFollow(twitter_handle, twitter_id);
									});
							})
						);
					} else if(action_data.action == "twitter_retweet") {
						// Delete Retweet button
						button_callback(
							giveawayHelperUI.buildButton(button_id, "Delete Retweet", false, function() {
								giveawayHelperUI.removeButton(button_id);
								deleteTwitterRetweet(action_data.id.match(/\/([0-9]+)/)[1]);
							})
						);
					} else if(action_data.action == "twitter_tweet" || action_data.action == "twitter_hashtags") {
						// Delete Tweet button
						button_callback(
							giveawayHelperUI.buildButton(button_id, "Delete Tweet", false, function() {
								giveawayHelperUI.removeButton(button_id);

								/* We don't have an id for the tweet, so instead delete the first tweet we can find
								that was posted after we handled the entry, but before it was marked completed. */
								getTwitterTweet(end_time, function(tweet_id) {
									if(tweet_id === false) {
										giveawayHelperUI.showError(`Failed to find
											<a href="https://twitter.com/${user_handle}" target="_blank">Tweet</a>`);
									} else {
										deleteTwitterTweet(tweet_id);
									}
								});
							})
						);
					}
				}
			}

			/**
			 * @return {String} twitter_id - Twitter id for this handle
			 * @return {Boolean} is_following - True for "following", false for "not following"
			 */
			function getTwitterUserData(twitter_handle, callback) {
				MKY.xmlHttpRequest({
					url: "https://twitter.com/" + twitter_handle,
					method: "GET",
					onload: function(response) {
						var twitter_id = $($(response.responseText.toLowerCase()).find(
								`[data-screen-name='${twitter_handle.toLowerCase()}'][data-user-id]`).get(0)).attr(
								"data-user-id"),
							is_following = $($(response.responseText.toLowerCase()).find(
								`[data-screen-name='${twitter_handle.toLowerCase()}'][data-you-follow]`).get(0)).attr(
								"data-you-follow");

						if(typeof twitter_id !== "undefined" && typeof is_following !== "undefined") {
							callback(twitter_id, is_following !== "false");
						} else {
							callback(null, null);
						}
					}
				});
			}

			/**
			 * We don't have an id for the tweet, so instead delete the first tweet we can find
			 * that was posted after we handled the entry, but before it was marked completed.
			 *
			 * @param {Number} end_time - Unix timestamp in ms
			 * @return {Array|Boolean} tweet_id - The oldest (re)tweet id between start and end time, false if not found
			 */
			function getTwitterTweet(end_time, callback) {
				/* Tweets are instantly posted to our profile, but there's a delay before they're made
				public (a few seconds).  Increase the range by a few seconds to compensate. */
				end_time += (60 * 1000);

				MKY.xmlHttpRequest({
					url: "https://twitter.com/" + user_handle,
					method: "GET",
					onload: function(response) {
						var found_tweet = false,
							now = +new Date();

						// reverse the order so that we're looking at oldest to newest
						$($(response.responseText.toLowerCase()).find(
							`a[href*='${user_handle.toLowerCase()}/status/']`).get().reverse()).each(function() {

							var tweet_time = $(this).find("span").attr("data-time-ms"),
								tweet_id = $(this).attr("href").match(/\/([0-9]+)/);

							if(typeof tweet_time != "undefined" && tweet_id !== null) {
								if(deleted_tweets.indexOf(tweet_id[1]) == -1 &&
									tweet_time > start_time &&
									(tweet_time < end_time || tweet_time > now)) {

									// return the first match
									found_tweet = true;
									deleted_tweets.push(tweet_id[1]);
									callback(tweet_id[1]);
									return false;
								}
							}
						});

						// couldn't find any tweets between the two times
						if(!found_tweet) {
							callback(false);
						}
					}
				});
			}

			/**
			 * Unfollow a twitter user
			 */
			function deleteTwitterFollow(twitter_handle, twitter_id) {
				if(twitter_id === null) {
					giveawayHelperUI.showError(`Failed to unfollow Twitter user:
						<a href="https://twitter.com/${twitter_handle}" target="_blank">${twitter_handle}</a>`);
				} else {
					MKY.xmlHttpRequest({
						url: "https://api.twitter.com/1.1/friendships/destroy.json",
						method: "POST",
						headers: {
							"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
							"authorization": "Bearer AAAAAAAAAAAAAAAAAAAAAPYXBAAAAAAACLXUNDekMxqa8h%2F40K4moUkGsoc%3DTYfbDKbT3jJPCEVnMYqilB28NHfOPqkca3qaAxGfsyKCs0wRbw",
							"x-csrf-token": csrf_token,
						},
						data: $.param({ user_id: twitter_id }),
						onload: function(response) {
							if(response.status != 200) {
								giveawayHelperUI.showError(`Failed to unfollow Twitter user:
									<a href="https://twitter.com/${twitter_handle}" target="_blank">
										${twitter_handle}
									</a>`);
							}
						}
					});
				}
			}

			/**
			 * Delete a tweet
			 * @param {Array} tweet_id - A single tweet ID
			 */
			function deleteTwitterTweet(tweet_id) {
				MKY.xmlHttpRequest({
					url: "https://twitter.com/i/tweet/destroy",
					method: "POST",
					headers: {
						"Origin": "https://twitter.com",
						"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
					},
					data: $.param({ _method: "DELETE", authenticity_token: auth_token, id: tweet_id }),
					onload: function(response) {
						if(response.status != 200) {
							giveawayHelperUI.showError(`Failed to delete
								<a href="https://twitter.com/${user_handle}" target="_blank">Tweet}</a>`);
						}
					}
				});
			}

			/**
			 * Delete a retweet
			 * @param {Array} tweet_id - A single retweet ID
			 */
			function deleteTwitterRetweet(tweet_id) {
				MKY.xmlHttpRequest({
					url: "https://api.twitter.com/1.1/statuses/unretweet.json",
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
						"authorization": "Bearer AAAAAAAAAAAAAAAAAAAAAPYXBAAAAAAACLXUNDekMxqa8h%2F40K4moUkGsoc%3DTYfbDKbT3jJPCEVnMYqilB28NHfOPqkca3qaAxGfsyKCs0wRbw",
						"x-csrf-token": csrf_token,
					},
					data: $.param({ _method: "DELETE", id: tweet_id }),
					onload: function(response) {
						if(response.status != 200) {
							giveawayHelperUI.showError(`Failed to delete
								<a href="https://twitter.com/${user_handle}" target="_blank">Retweet</a>`);
						}
					}
				});
			}

			return {
				/**
				 *
				 */
				handleEntry: function(action_data, button_callback, ready_check, show_name, expected_user) {
					if(ready_a && ready_b) {
						prepCreateButton(action_data, button_callback, ready_check, show_name, expected_user);
					} else {
						// Wait for the command hub to load
						var temp_interval = setInterval(function() {
							if(ready_a && ready_b) {
								clearInterval(temp_interval);
								prepCreateButton(action_data, button_callback, ready_check, show_name, expected_user);
							}
						}, 100);
					}
				}
			};
		}

		var instance;
		return {
			getInstance: function() {
				if(!instance) instance = init();
				return instance;
			}
		};
	})();

	/**
	 * Handles all Twitch entries that may need to interact with Twitch
	 */
	var TwitchHandler = (function() {
		function init() {
			var command_hub_url = "https://player.twitch.tv/",
				command_hub_host = "player.twitch.tv",
				user_handle = null,
				api_token = null,
				button_count = 1,
				following_status = {},
				handled_channels = [],
				ready = false;

			// Get all the user data we'll need to undo twitch entries
			commandHub.load(
				command_hub_url,
				command_hub_host,
				function() {
					return {
						user_handle: getCookie("login"),
						api_token: getCookie("auth-token")
					};
				},
				function(data) {
					user_handle = data.user_handle;
					api_token = data.api_token;
					ready = true;
				}
			);

			/**
			 * Get ready to create an item
			 */
			function prepCreateButton(twitch_handle, button_callback, ready_check, show_name, expected_user) {
				// Wait until the entry is completed before showing the button
				var temp_interval = setInterval(function() {
					if(ready_check === null || ready_check()) {
						clearInterval(temp_interval);
						createButton(twitch_handle, button_callback, show_name, expected_user, ready_check === null);
					}
				}, 100);
			}

			/**
			 * Create the button
			 */
			function createButton(twitch_handle, button_callback, show_name, expected_user, toggle_button) {
				if(typeof expected_user !== "undefined" && !expected_user) {
					// The user doesn't have a Twitter account linked, do nothing
				} else if(user_handle === null || api_token === null) {
					// We're not logged in
					giveawayHelperUI.showError(`You must be logged into
						<a href="https://www.twitch.tv/login" target="_blank">twitch.tv</a>`);
				} else if(typeof expected_user !== "undefined" && expected_user.user_handle != user_handle) {
					// We're logged in as the wrong user
					giveawayHelperUI.showError(`You must be logged into the Twitch account linked to Gleam.io:
						<a href="https://twitch.tv/${expected_user.user_handle}" target="_blank">
						https://twitch.tv/${expected_user.user_handle}</a>`);
				} else {
					// Create the button
					var button_id = "twitch_button_" + button_count++;

					if(toggle_button) {
						getTwitchUserData(twitch_handle, function(is_following) {
							var label = is_following ? `Unfollow ${twitch_handle}` : `Follow ${twitch_handle}`;

							following_status[twitch_handle] = is_following;

							button_callback(
								giveawayHelperUI.buildButton(button_id, label, is_following, function() {
									toggleFollowStatus(button_id, twitch_handle);
									giveawayHelperUI.showButtonLoading(button_id);
								})
							);
						});
					} else {
						var label = `Unfollow${(show_name ? ` ${twitch_handle}` : "")}`;

						button_callback(
							giveawayHelperUI.buildButton(button_id, label, false, function() {
								giveawayHelperUI.removeButton(button_id);
								deleteTwitchFollow(twitch_handle);
							})
						);
					}
				}
			}

			/**
			 *
			 */
			function deleteTwitchFollow(twitch_handle, callback) {
				MKY.xmlHttpRequest({
					url: "https://api.twitch.tv/kraken/users/" + user_handle + "/follows/channels/" + twitch_handle,
					method: "DELETE",
					headers: { "Authorization": "OAuth " + api_token },
					onload: function(response) {
						if(response.status != 204 && response.status != 200) {
							giveawayHelperUI.showError(`Failed to unfollow Twitch user:
								<a href="https://twitch.tv/${twitch_handle}" target="_blank">${twitch_handle}</a>`);

							if(typeof callback == "function") callback(false);
						} else {
							if(typeof callback == "function") callback(true);
						}
					}
				});
			}

			/**
			 *
			 */
			function twitchFollow(twitch_handle, callback) {
				MKY.xmlHttpRequest({
					url: "https://api.twitch.tv/kraken/users/" + user_handle + "/follows/channels/" + twitch_handle,
					method: "PUT",
					headers: { "Authorization": "OAuth " + api_token },
					onload: function(response) {
						if(response.status != 204 && response.status != 200) {
							giveawayHelperUI.showError(`Failed to follow Twitch user:
								<a href="https://twitch.tv/${twitch_handle}" target="_blank">${twitch_handle}</a>`);

							callback(false);
						} else {
							callback(true);
						}
					}
				});
			}

			/**
			 * @return {Boolean} is_follow - True for "following", false for "not following"
			 */
			function getTwitchUserData(twitch_handle, callback) {
				MKY.xmlHttpRequest({
					url: "https://api.twitch.tv/kraken/users/" + user_handle + "/follows/channels/" + twitch_handle,
					method: "GET",
					headers: { "Authorization": "OAuth " + api_token },
					onload: function(response) {
						if(response.status === 404) {
							callback(false);
						} else if(response.status != 204 && response.status != 200) {
							giveawayHelperUI.showError(`Failed to determine follow status of Twtich user`);
						} else {
							callback(true);
						}
					}
				});
			}

			/**
			 *
			 */
			function toggleFollowStatus(button_id, twitch_handle) {
				if(following_status[twitch_handle]) {
					deleteTwitchFollow(twitch_handle, function(success) {
						if(success) {
							following_status[twitch_handle] = false;
							giveawayHelperUI.toggleButtonClass(button_id);
							giveawayHelperUI.setButtonLabel(button_id, `Follow ${twitch_handle}`);
						}

						giveawayHelperUI.hideButtonLoading(button_id);
					});
				} else {
					twitchFollow(twitch_handle, function(success) {
						if(success) {
							following_status[twitch_handle] = true;
							giveawayHelperUI.toggleButtonClass(button_id);
							giveawayHelperUI.setButtonLabel(button_id, `Unfollow ${twitch_handle}`);
						}

						giveawayHelperUI.hideButtonLoading(button_id);
					});
				}
			}

			return {
				/**
				 *
				 */
				handleEntry: function(twitch_handle, button_callback, ready_check, show_name, expected_user) {
					if(ready) {
						prepCreateButton(twitch_handle, button_callback, ready_check, show_name, expected_user);
					} else {
						// Wait for the command hub to load
						var temp_interval = setInterval(function() {
							if(ready) {
								clearInterval(temp_interval);
								prepCreateButton(twitch_handle, button_callback, ready_check, show_name, expected_user);
							}
						}, 100);
					}
				},

				/**
				 *
				 */
				findChannels: function(button_callback, target, show_name, do_cache, cache_id) {
					var self = this;

					giveawayHelperUI.restoreCachedLinks(cache_id).then(function(channels) {
						var re = /twitch\.tv\/([a-zA-Z0-9_]{2,25})/g,
							match;

						if(!do_cache) {
							channels = [];
						}

						while((match = re.exec(target)) !== null) {
							channels.push(match[1].toLowerCase());
						}

						channels = giveawayHelperUI.removeDuplicates(channels);
						if(do_cache) giveawayHelperUI.cacheLinks(channels, cache_id);

						for(var i = 0; i < channels.length; i++) {
							if(channels[i] == "login") continue;

							if($.inArray(channels[i], handled_channels) == -1) {
								handled_channels.push(channels[i]);
								self.handleEntry(channels[i], button_callback, null, show_name);
							}
						}
					});
				}
			};
		}

		var instance;
		return {
			getInstance: function() {
				if(!instance) instance = init();
				return instance;
			}
		};
	})();

    /**
     *
     */
	var giveawayHelperUI = (function() {
		var active_errors = [],
			active_buttons = {},
			gh_main_container = randomString(10),
			gh_button_container = randomString(10),
			gh_button_title = randomString(10),
			gh_button_loading = randomString(10),
			gh_spin = randomString(10),
			gh_notification_container = randomString(10),
			gh_notification = randomString(10),
			gh_error = randomString(10),
			gh_close = randomString(10),
			main_container = $("<div>", { class: gh_main_container }),
			button_container = $("<span>"),
			resolved_urls = [],
			offset_top = 0;

		/**
		 * Generate a random alphanumeric string
		 * http://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
		 */
		function randomString(length) {
			var result = '';
			var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

			for(var i = length; i > 0; --i) {
				result += chars[Math.floor(Math.random() * chars.length)];
			}

			return result;
		}

		/**
		 * Push the page down to make room for notifications
		 */
		function updateTopMargin() {
			var new_margin_top = main_container.outerHeight() + main_container.position().top - offset_top;

			$("html").css("margin-top", main_container.is(":visible") ? new_margin_top : 0);
		}

		return {
			gh_button: randomString(10),
			gh_button_on: randomString(10),
			gh_button_off: randomString(10),
			gh_redeem_button: randomString(10),

			/**
			 * Print the UI
			 */
			loadUI: function(zIndex, onLoad) {
				zIndex = typeof zIndex == "undefined" ? 9999999999 : zIndex;

				if(typeof onLoad == "function") onLoad();

				MKY.addStyle(`
					html {
						overflow-y: scroll !important;
					}

					.${gh_main_container} {
						font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
						font-size: 16.5px;
						left: 0px;
						line-height: 21px;
						position: fixed;
						text-align: left;
						top: 0px;
						right: 0px;
						z-index: ${zIndex};
					}

					.${gh_button_container} {
						background-color: #000;
						border-top: 1px solid rgba(52, 152, 219, .5);
						box-shadow: 0px 2px 10px rgba(0, 0, 0, .5);
						box-sizing: border-box;
						color: #3498db;
						padding: 8px;
					}

					.${gh_button_title} {
						font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
						padding: 10px 15px;
						margin-right:8px;
					}

					.${gh_button_loading} {
						-webkit-animation: ${gh_spin} 2s infinite linear;
						animation: ${gh_spin} 2s infinite linear;
						display: inline-block;
						font: normal normal normal 14px/1;
						transform-origin: 45% 55%;
					}

					.${gh_button_loading}:before {
						content: "\\21B7";
					}

					@-webkit-keyframes ${gh_spin} {
						0% {
							-webkit-transform:rotate(0deg);
							transform:rotate(0deg);
						}
						100%{
							-webkit-transform:rotate(359deg);
							transform:rotate(359deg);
						}
					}

					@keyframes ${gh_spin} {
						0% {
							-webkit-transform:rotate(0deg);
							transform:rotate(0deg);
						}
						100% {
							-webkit-transform:rotate(359deg);
							transform:rotate(359deg);
						}
					}

					.${gh_notification} {
						box-sizing: border-box;
						padding: 8px;
					}

					.${gh_error} {
						background: #f2dede;
						box-shadow: 0px 2px 10px rgba(231, 76, 60, .5);
						color: #a94442;
					}

					.${gh_error} a {
						color: #a94442;
						font-weight: 700;
					}

					.${gh_close} {
						color: #000;
						background: 0 0;
						border: 0;
						cursor: pointer;
						display: block;
						float: right;
						font-size: 21px;
						font-weight: 700;
						height: auto;
						line-height: 1;
						margin: 0px;
						opacity: .2;
						padding: 0px;
						text-shadow: 0 1px 0 #fff;
						width: auto;
					}

					.${gh_close}:hover {
						opacity: .5;
					}
				`);

				$("body").append(main_container);
			},

			/**
			 *
			 */
			defaultButtonSetup: function(offset) {
				MKY.addStyle(`
					.${this.gh_button} {
						background-image:none;
						border: 1px solid transparent;
						border-radius: 3px !important;
						cursor: pointer;
						display: inline-block;
						font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
						font-size: 12px;
						font-weight: 400;
						height: 30px;
						line-height: 1.5 !important;
						margin: 4px 8px 4px 0px;
						padding: 5px 10px;
						text-align: center;
						vertical-align: middle;
						white-space: nowrap;
					}

					.${this.gh_button}:active {
						box-shadow: inset 0 3px 5px rgba(0,0,0,.125);
						outline: 0;
					}

					.${this.gh_button_on} {
						background-color: #337ab7;
						border-color: #2e6da4;
						color: #fff;
					}

					.${this.gh_button_on}:hover {
						background-color: #286090;
						border-color: #204d74;
						color: #fff;
					}

					.${this.gh_button_off} {
						background-color: #d9534f;
						border-color: #d43f3a;
						color: #fff;
					}

					.${this.gh_button_off}:hover {
						background-color: #c9302c;
						border-color: #ac2925;
						color: #fff;
					}

					.${this.gh_redeem_button} {
						background-color: #5cb85c;
						border-color: #4cae4c;
						color: #fff;
					}
				`);

				if(typeof offset !== "undefined") {
					main_container.css({top: offset[0], left: offset[1], right: offset[2]});
					offset_top = offset[0];
				}

				main_container.append(
					$("<div>", { class: gh_button_container }).append(
						$("<span>", { class: gh_button_title }).html("Giveaway Helper v" + MKY.info.script.version)
					).append(button_container)
				);

				updateTopMargin();
			},

			/**
			 *
			 */
			addButton: function(new_button) {
				button_container.append(new_button);
				new_button.width(new_button.outerWidth());
				updateTopMargin();
			},

			/**
			 *
			 */
			buildButton: function(button_id, label, button_on, click_function) {
				var new_button =
						$("<button>", { type: "button",
							class: `${this.gh_button} ${button_on ? this.gh_button_on : this.gh_button_off}`
						}).append(
							$("<span>").append(label)).append(
							$("<span>", { class: gh_button_loading, css: { display: "none" }})
						).click(function(e) {
							e.stopPropagation();
							if(!active_buttons[button_id].find(`.${gh_button_loading}`).is(":visible")) {
								click_function();
							}
						});

				active_buttons[button_id] = new_button;
				return new_button;
			},

			/**
			 *
			 */
			buildRedeemButton: function(button_id, label, redeem_url) {
				var new_button =
						$("<a>", { href: redeem_url, target: "_blank" }).append(
							$("<button>", { type: "button",
								class: `${this.gh_button} ${this.gh_redeem_button}`
							}).append(
								$("<span>").append(label)
							)
						);

				active_buttons[button_id] = new_button;
				return new_button;
			},



			/**
			 *
			 */
			removeButton: function(button_id) {
				active_buttons[button_id].remove();
				delete active_buttons[button_id];
			},

			/**
			 *
			 */
			setButtonLabel: function(button_id, label, color) {
				active_buttons[button_id].find("span").first().text(label);

				if(color !== undefined) {
					active_buttons[button_id].css("background-color", color);
					active_buttons[button_id].css("border-color", color);
				}
			},

			/**
			 *
			 */
			toggleButtonClass: function(button_id) {
				active_buttons[button_id].toggleClass(this.gh_button_on);
				active_buttons[button_id].toggleClass(this.gh_button_off);
			},

			/**
			 *
			 */
			showButtonLoading: function(button_id) {
				active_buttons[button_id].find("span").first().hide();
				active_buttons[button_id].find(`.${gh_button_loading}`).show();
			},

			/**
			 *
			 */
			hideButtonLoading: function(button_id) {
				active_buttons[button_id].find("span").first().show();
				active_buttons[button_id].find(`.${gh_button_loading}`).hide();
			},

			/**
			 * Print an error
			 */
			showError: function(msg) {
				// Don't print the same error multiple times
				if(active_errors.indexOf(msg) != -1) return;

				var self = this;

				active_errors.push(msg);
				main_container.append(
					$("<div>", { class: `${gh_notification} ${gh_error}` }).append(
						$("<button>", { class: gh_close}).append(
							$("<span>").html("&times;")
						).click(function() {
							$(this).unbind("click");
							$(this).parent().slideUp(400, function() {
								active_errors.splice(active_errors.indexOf(msg), 1);
								$(this).remove();
								updateTopMargin();
							});
						})
					).append(
						$("<strong>").html("Giveaway Helper Error: ")
					).append(msg)
				);

				updateTopMargin();
			},

			/**
			 * Remove duplicate items from an array
			 */
			removeDuplicates: function(arr) {
				var out = [];

				for(var i = 0; i < arr.length; i++) {
					if (out.indexOf(arr[i]) == -1) {
						out.push(arr[i]);
					}
				}

				return out;
			},

			/**
			 * Some sites remove links to a group after you get your reward, remember which links we've seen where
			 */
			cacheLinks: function(data, id) {
				MKY.setValue(id, JSON.stringify(data));
			},

			/**
			 *
			 */
			restoreCachedLinks: function(id) {
				return MKY.getValue(id, JSON.stringify([])).then(function(value) {
					return JSON.parse(value);
				});
			},

			/**
			 *
			 */
			resolveUrl: function(url, callback) {
				var self = this,
					cached_url_id = `cache_${MKY.info.script.version.replace(/\./g,"_")}_${CryptoJS.MD5(url)}`;

				self.restoreCachedLinks(cached_url_id).then(function(value){
					if(value.length !== 0) {
						callback(value[0]);
					} else {
						self.cacheLinks([false], cached_url_id);

						MKY.xmlHttpRequest({
							url: url,
							method: "GET",
							onload: function(response) {
								if(response.status == 200 && response.finalUrl !== null) {
									self.cacheLinks([response.finalUrl], cached_url_id);
								}

								self.restoreCachedLinks(cached_url_id).then(function(final_url){
									callback(final_url);
								});
							}
						});
					}
				});
			}
		};
	})();

    /**
     * Used to communicate with and run code on a different domain
     * Usualy with the intent to grab necessary cookies
     */
	var commandHub = (function() {
		/**
		 * http://stackoverflow.com/a/15724300
		 */
		function getCookie(name) {
			var value = "; " + document.cookie,
				parts = value.split("; " + name + "=");

			if(parts.length == 2) {
				return parts.pop().split(";").shift();
			} else {
				return null;
			}
		}

		return {
			/**
			 * Load an iframe so that we can run code on a different domain
			 * @param {String} url - The url to be loaded into the iframe
			 * @param {Function} data_func - The code that we're going to run inside the iframe
			 * @param {Function} callback - Runs after data_func returns
			 */
			load: function(url, hostname, data_func, callback) {
				var command_hub = document.createElement('iframe');

				command_hub.style.display = "none";
				command_hub.src = url;
				document.body.appendChild(command_hub);

				hostname = hostname.replace(/\./g, "_");

				var funcvar = `command_hub_func_${hostname}`,
					retvar = `command_hub_return_${hostname}`;

				window.addEventListener("message", function(event) {
					if(event.source == command_hub.contentWindow) {
						if(event.data.status == "ready") {
							// the iframe has finished loading, tell it what to do
							MKY.setValue(funcvar, encodeURI(data_func.toString()));
							command_hub.contentWindow.postMessage({ status: "run" }, "*");
						} else if(event.data.status == "finished") {
							// wait until the values have been set
							var temp_interval = setInterval(function() {
								MKY.getValue(retvar).then(function(value) {
									if(typeof value !== "undefined") {
										clearInterval(temp_interval);

										// the iframe has finished, send the data to the callback and close the frame
										document.body.removeChild(command_hub);
										callback(value);
										MKY.deleteValue(retvar);
									}
								});
							}, 100);
						}
					}
				});
			},

			/**
			 *
			 */
			init: function() {
				var hostname = document.location.hostname.replace(/\./g, "_"),
					funcvar = `command_hub_func_${hostname}`,
					retvar = `command_hub_return_${hostname}`;

				// wait for our parent to tell us what to do
				window.addEventListener("message", function(event) {
					if(event.source == parent) {
						if(event.data.status == "run") {
							// wait until the values have been set
							var temp_interval = setInterval(function() {
								MKY.getValue(funcvar).then(function(value) {
									if(typeof value !== "undefined") {
										clearInterval(temp_interval);
										MKY.setValue(retvar, eval(`(${decodeURI(value)})`)());
										MKY.deleteValue(funcvar);
										parent.postMessage({ status: "finished" }, "*");
									}
								});
							}, 100);
						}
					}
				});

				// let the parent know the iframe is ready
				parent.postMessage({status: "ready"}, "*");
			}
		};
	})();

	// Greasemonkey 4 polyfill
	// https://arantius.com/misc/greasemonkey/imports/greasemonkey4-polyfill.js

	var MKY = typeof GM !== "undefined" ? GM : {
			'info': GM_info,
			'addStyle': GM_addStyle,
			'xmlHttpRequest': GM_xmlhttpRequest,
			'deleteValue': GM_deleteValue,
			'setValue': GM_setValue,
			'getValue': function () {
				return new Promise((resolve, reject) => {
						try {
							resolve(GM_getValue.apply(this, arguments));
						} catch (e) {
							reject(e);
						}
					});
				}
	};

	if(typeof GM_addStyle == 'undefined' || typeof MKY.addStyle == 'undefined') {
		MKY.addStyle = function(aCss) {
			'use strict';
			let head = document.getElementsByTagName('head')[0];
			if(head) {
				let style = document.createElement('style');
				style.setAttribute('type', 'text/css');
				style.textContent = aCss;
				head.appendChild(style);
				return style;
			}
			return null;
		};
	}

	setup.run();
})();
