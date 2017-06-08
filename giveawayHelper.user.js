// ==UserScript==
// @name Giveaway Helper
// @namespace https://github.com/Citrinate/giveawayHelper
// @description Enhances Steam key-related giveaways
// @author Citrinate
// @version 2.0.0
// @match https://gleam.io/*
// @match https://marvelousga.com/giveaway.php*
// @match https://dev.twitter.com/
// @match https://player.twitch.tv/
// @connect steamcommunity.com
// @connect twitter.com
// @connect twitch.tv
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addStyle
// @grant GM_xmlhttpRequest
// @updateURL https://raw.githubusercontent.com/Citrinate/giveawayHelper/master/giveawayHelper.user.js
// @downloadURL https://raw.githubusercontent.com/Citrinate/giveawayHelper/master/giveawayHelper.user.js
// @require https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @run-at document-end
// ==/UserScript==

/* jshint esversion: 6 */

(function() {

	/**
	 *
	 */
	var gleamHelper = (function() {
		var gleam = null,
			authentications = {};

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
						createTwitterButton(entry, entry_element);
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
		 * Places the button onto the page
		 */
		function addButton(entry_element) {
			return function(new_button) {
				new_button.addClass("btn-embossed btn-info");
				$(entry_element).find(">a").first().append(new_button);
			};
		}

		/**
		 * Returns true when an entry has been completed
		 */
		function isCompleted(entry) {
			return function() {
				return gleam.isEntered(entry.entry_method);
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
			/*if(isCompleted(entry)() &&
				(entry.entry_method.entry_type == "twitter_tweet" ||
					entry.entry_method.entry_type == "twitter_hashtags")) {

				return;
			}*/

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
				GM_addStyle(`
					.${giveawayHelperUI.gh_button} {
						bottom: 0px;
						height: 20px;
						margin: auto;
						padding: 6px;
						position: absolute;
						right: 64px;
						top: 0px;
						z-index: 9999999999;
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
	var marvelousHelper = (function() {
		var main_box = $("<div>");

		/**
		 * Search the page for Steam Groups and add Join/Leave buttons for them
		 */
		function findSteamGroups() {
			$("body").find("a[href*='steamcommunity.com/groups/']:not([href*='/detail/'])").each(function() {
				var group_name = $(this).attr("href").replace("http://steamcommunity.com/groups/", "").
						replace("https://steamcommunity.com/groups/", "").toLowerCase();

				if(group_name.indexOf("#") !== -1) group_name = group_name.substring(0, group_name.indexOf("#"));

				SteamHandler.getInstance().handleEntry({ group_name: group_name }, addButton, true);
			});
		}

		/**
		 * Places the button onto the page
		 */
		function addButton(new_button) {
			main_box.append(
				$("<div>", { class: "col-md-12" }).append(
					new_button
				)
			);
		}

		return {
			/**
			 *
			 */
			init: function() {
				GM_addStyle(`
					.${giveawayHelperUI.gh_main_container} {
						display: inline-block;
						font-size: 14px;
						line-height: 14px;
						position: relative;
						top: -4px;
					}

					.${giveawayHelperUI.gh_button} {
						border-bottom-width: 4px !important;
						margin: 8px !important;
					}

					.${giveawayHelperUI.gh_button_on} {
						background-color: #28b62c;
					}

					.${giveawayHelperUI.gh_button_off} {
						background-color: #ff4136;
					}
				`);

				main_box.addClass(giveawayHelperUI.gh_main_container);

				$(".navbar").after(
					$("<div>", { class: "container" }).append(
						$("<div>", { class: "col-md-8 col-md-offset-2" }).append(
							$("<div>", { class: "panel panel-danger" }).append(
								$("<div>", { class: "panel-heading" }).append(
									$("<h3>", { class: "text-center panel-title" }).append(
										"Giveaway Helper"
									)
								)
							).append(
								main_box
							)
						)
					)
				);

				findSteamGroups();
			},
		};
	})();

	/**
	 * Handles Steam group buttons
	 */
	var SteamHandler = (function() {
		function init() {
			var user_id = null,
				session_id = null,
				process_url = null,
				active_groups = [],
				button_count = 1,
				ready = false;

			// Get all the user data we'll need to make join/leave group requests
			GM_xmlhttpRequest({
				url: "https://steamcommunity.com/my/groups",
				method: "GET",
				onload: function(response) {
					user_id = response.responseText.match(/g_steamID = \"(.+?)\";/);
					session_id = response.responseText.match(/g_sessionID = \"(.+?)\";/);
					process_url = response.responseText.match(/processURL = '(.+?)';/);
					user_id = user_id === null ? null : user_id[1];
					session_id = session_id === null ? null : session_id[1];
					process_url = process_url === null ? null : process_url[1];

					$(response.responseText).find("a[href^='https://steamcommunity.com/groups/']").each(function() {
						var group_name = $(this).attr("href").replace("https://steamcommunity.com/groups/", "");

						if(group_name.indexOf("/") == -1) {
							active_groups.push(group_name.toLowerCase());
						}
					});

					$.unique(active_groups);
					ready = true;
				}
			});

			/**
			 *
			 */
			function prepCreateButton(group_data, button_callback, show_name, expected_user)
			{
				if(typeof group_data.group_id == "undefined") {
					getGroupID(group_data.group_name, function(group_id) {
						group_data.group_id = group_id;
						createButton(group_data, button_callback, show_name, expected_user);
					});
				} else {
					createButton(group_data, button_callback, show_name, expected_user);
				}
			}

			/**
			 * Create a join/leave toggle button
			 */
			function createButton(group_data, button_callback, show_name, expected_user) {
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
					The Steam Community is experiencing issues.
					Please handle any remaining Steam entries manually.
					<br>
					If you're having trouble getting groups to appear on
					<a href="https://steamcommunity.com/my/groups/">your groups list</a>,
					joining a <a href="https://steamcommunity.com/search/#filter=groups">new group</a>
					may force the list to update.
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
				GM_xmlhttpRequest({
					url: "https://steamcommunity.com/groups/" + group_name,
					method: "POST",
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					data: $.param({ action: "join", sessionID: session_id }),
					onload: function(response) {
						GM_xmlhttpRequest({
							url: "https://steamcommunity.com/my/groups",
							method: "GET",
							onload: function(response) {
								if(typeof callback == "function") {
									if($(response.responseText.toLowerCase()).find(
										`a[href='https://steamcommunity.com/groups/${group_name}']`).length === 0) {

										// Failed to join the group, Steam Community is probably down
										callback(false);
										console.debug(response);
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
				GM_xmlhttpRequest({
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
								console.debug(response);
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
				GM_xmlhttpRequest({
					url: "https://steamcommunity.com/groups/" + group_name,
					method: "GET",
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					onload: function(response) {
						var group_id = response.responseText.match(/joinchat\/([0-9]+)/);
						group_id = group_id === null ? null : group_id[1];

						callback(group_id);
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
			var command_hub_url = "https://dev.twitter.com/",
				command_hub_host = "dev.twitter.com",
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

			GM_xmlhttpRequest({
				url: "https://twitter.com",
				method: "GET",
				onload: function(response) {
					auth_token = $($(response.responseText)
						.find("input[id='authenticity_token']").get(0))
						.attr("value");
					user_handle = $(response.responseText)
						.find(".account-group.js-mini-current-user")
						.attr("data-screen-name");
					user_id = $(response.responseText)
						.find(".account-group.js-mini-current-user")
						.attr("data-user-id");

					auth_token = typeof auth_token == "undefined" ? null : auth_token;
					user_handle = typeof user_handle == "undefined" ? null : user_handle;
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
				GM_xmlhttpRequest({
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

				GM_xmlhttpRequest({
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
					GM_xmlhttpRequest({
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
				GM_xmlhttpRequest({
					url: "https://twitter.com/i/tweet/destroy",
					method: "POST",
					headers: {
						"Origin": "https://twitter.com",
						"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
					},
					data: $.param({ _method: "DELETE", authenticity_token: auth_token, id: tweet_id }),
					onload: function(response) {
						if(response.status != 200) {
							console.debug(response);
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
				GM_xmlhttpRequest({
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
							console.debug(response);
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
				ready_a = false;
				ready_b = false;

			// Get all the user data we'll need to undo twitch entries
			commandHub.load(
				command_hub_url,
				command_hub_host,
				function() {
					return {
						user_handle: getCookie("login")
					};
				},
				function(data) {
					user_handle = data.user_handle;
					ready_a = true;
				}
			);

			GM_xmlhttpRequest({
				url: "https://api.twitch.tv/api/viewer/token.json",
				method: "GET",
				headers: { "Client-ID": "jzkbprff40iqj646a697cyrvl0zt2m6" },
				onload: function(response) {
					api_token = response.responseText.match(/token\":\"(.+?)\"/);
					api_token = api_token === null ? null : api_token[1];

					ready_b = true;
				}
			});

			/**
			 * Get ready to create an item
			 */
			function prepCreateButton(twitch_handle, button_callback, ready_check, show_name, expected_user) {
				// Wait until the entry is completed before showing the button
				var temp_interval = setInterval(function() {
					if(ready_check()) {
						clearInterval(temp_interval);
						createButton(twitch_handle, button_callback, show_name, expected_user);
					}
				}, 100);
			}

			/**
			 * Create the button
			 */
			function createButton(twitch_handle, button_callback, show_name, expected_user) {
				if(!expected_user) {
					// The user doesn't have a Twitter account linked, do nothing
				} else if(user_handle === null || api_token === null) {
					// We're not logged in
					giveawayHelperUI.showError(`You must be logged into
						<a href="https://www.twitch.tv/login" target="_blank">twitch.tv</a>`);
				} else if(expected_user.user_handle != user_handle) {
					// We're logged in as the wrong user
					giveawayHelperUI.showError(`You must be logged into the Twitch account linked to Gleam.io:
						<a href="https://twitch.tv/${expected_user.user_handle}" target="_blank">
						https://twitch.tv/${expected_user.user_handle}</a>`);
				} else {
					// Create the button
					var button_id = "twitch_button_" + button_count++,
						label = `Unfollow${(show_name ? ` ${twitch_handle}` : "")}`;

					button_callback(
						giveawayHelperUI.buildButton(button_id, label, false, function() {
							giveawayHelperUI.removeButton(button_id);
							deleteTwitchFollow(twitch_handle);
						})
					);
				}
			}

			/**
			 *
			 */
			function deleteTwitchFollow(twitch_handle) {
				GM_xmlhttpRequest({
					url: "https://api.twitch.tv/kraken/users/" + user_handle + "/follows/channels/" + twitch_handle,
					method: "DELETE",
					headers: { "Authorization": "OAuth " + api_token },
					onload: function(response) {
						if(response.status != 204 && response.status != 200) {
							giveawayHelperUI.showError(`Failed to unfollow Twitch user:
								<a href="https://twitch.tv/${twitch_handle}" target="_blank">${twitch_handle}</a>`);
							console.debug(response);
						}
					}
				});
			}

			return {
				/**
				 *
				 */
				handleEntry: function(twitch_handle, button_callback, ready_check, show_name, expected_user) {
					if(ready_a && ready_b) {
						prepCreateButton(twitch_handle, button_callback, ready_check, show_name, expected_user);
					} else {
						// Wait for the command hub to load
						var temp_interval = setInterval(function() {
							if(ready_a && ready_b) {
								clearInterval(temp_interval);
								prepCreateButton(twitch_handle, button_callback, ready_check, show_name, expected_user);
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
     *
     */
	var giveawayHelperUI = (function() {
		var active_errors = [],
			active_notifications = {},
			active_buttons = {},
			notifications_box = $("<div>");

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
			$("html").css("margin-top", (notifications_box.is(":visible") ? notifications_box.outerHeight() : 0));
		}

		return {
			// Randomized CSS class names
			gh_main_container:         randomString(10),
			gh_button:                 randomString(10),
			gh_button_on:              randomString(10),
			gh_button_off:             randomString(10),
			gh_notification_container: randomString(10),
			gh_notification:           randomString(10),
			gh_error:                  randomString(10),
			gh_close:                  randomString(10),

			/**
			 * Print the UI
			 */
			loadUI: function() {
				GM_addStyle(`
					html {
						overflow-y: scroll !important;
					}

					.${this.gh_notification_container} {
						font-size: 16.5px;
						left: 0px;
						position: fixed;
						text-align: center;
						top: 0px;
						width: 100%;
						z-index: 9999999999;
					}

					.${this.gh_notification} {
						background: #000;
						border-top: 1px solid rgba(52, 152, 219, .5);
						box-shadow: 0px 2px 10px rgba(0, 0, 0, .5);
						box-sizing: border-box;
						color: #3498db;
						line-height: 22px;
						padding: 12px;
						width: 100%;
					}

					.${this.gh_error} {
						background: #e74c3c;
						border-top: 1px solid rgba(255, 255, 255, .5);
						box-shadow: 0px 2px 10px rgba(231, 76, 60, .5);
						box-sizing: border-box;
						color: #fff;
						line-height: 22px;
						padding: 12px;
						width: 100%;
					}

					.${this.gh_error} a {
						color: #fff;
					}

					.${this.gh_close} {
						float: right;
						background: rgba(255, 255, 255, .15);
						border: 1px solid #fff;
						box-shadow: 0px 0px 8px rgba(255, 255, 255, .5);
						cursor: pointer;
						margin-left: 4px;
						padding: 0px 4px;
					}

					.${this.gh_close}:hover {
						background: #fff;
						color: #e74c3c;
					}

					.${this.gh_close}::before {
						content: 'x';
						position: relative;
						top: -1px;
					}
				`);

				notifications_box.addClass(this.gh_notification_container);
				$("body").append(notifications_box);

			},

			/**
			 * Print an error
			 */
			showError: function(msg) {
				// Don't print the same error multiple times
				if(active_errors.indexOf(msg) != -1) return

				var self = this;

				active_errors.push(msg);

				notifications_box.append(
					$("<div>", { class: this.gh_error }).html(`<strong>Giveaway Helper Error</strong>: ${msg}`).prepend(
						$("<div>", { class: this.gh_close }).click(function() {
							$(this).unbind("click");
							$(this).parent().slideUp(400, function() {
								active_errors.splice(active_errors.indexOf(msg), 1);
								$(this).remove();
								updateTopMargin();
							});
						})
					));

				updateTopMargin();
			},

			/**
			 * Display or update a notification
			 */
			showNotification: function(notification_id, msg, hide_delay) {
				if(!active_notifications[notification_id]) {
					// New notification
					active_notifications[notification_id] = $("<div>", { class: this.gh_notification });
					notifications_box.append(active_notifications[notification_id]);
				}

				// Update notification
				active_notifications[notification_id].html(`<strong>Giveaway Helper Notification</strong>: ${msg}`);
				updateTopMargin();

				// Automatically hide notification after a delay
				if(typeof hide_delay == "number") {
					var self = this;
					setTimeout(function() {
						self.hideNotification(notification_id);
					}, hide_delay);
				}
			},

			/**
			 * Remove a notification
			 */
			hideNotification: function(notification_id) {
				if(active_notifications[notification_id]) {
					var old_notification = active_notifications[notification_id];

					delete active_notifications[notification_id];
					old_notification.slideUp(400, function() {
						old_notification.remove();
						updateTopMargin();
					});
				}
			},

			/**
			 *
			 */
			buildButton: function(button_id, label, button_on, click_function) {
				var new_button =
						$("<a>", {
							class: `${this.gh_button} ${button_on ? this.gh_button_on : this.gh_button_off} btn`
						}).append(
							$("<span>", { text: label })).append(
							$("<span>", { class: "fa ng-scope fa-refresh fa-spin", css: { display: "none" }})
						).click(function(e) {
							e.stopPropagation();
							if(!active_buttons[button_id].find(".fa").is(":visible")) {
								click_function();
							}
						});

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
				active_buttons[button_id].find(".fa").show();
			},

			/**
			 *
			 */
			hideButtonLoading: function(button_id) {
				active_buttons[button_id].find("span").first().show();
				active_buttons[button_id].find(".fa").hide();
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
							GM_setValue(funcvar, encodeURI(data_func.toString()));
							command_hub.contentWindow.postMessage({ status: "run" }, "*");
						} else if(event.data.status == "finished") {
							// wait until the values have been set
							var temp_interval = setInterval(function() {
								if(typeof GM_getValue(retvar) !== "undefined") {
									clearInterval(temp_interval);

									// the iframe has finished, send the data to the callback and close the frame
									document.body.removeChild(command_hub);
									callback(GM_getValue(retvar));
									GM_deleteValue(retvar);
								}
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
								if(typeof GM_getValue(funcvar) !== "undefined") {
									clearInterval(temp_interval);
									GM_setValue(retvar, eval(`(${decodeURI(GM_getValue(funcvar))})`)());
									GM_deleteValue(funcvar);
									parent.postMessage({ status: "finished" }, "*");
								}
							}, 100);
						}
					}
				});

				// let the parent know the iframe is ready
				parent.postMessage({status: "ready"}, "*");
			}
		};
	})();

	if(document.location.hostname == "gleam.io") {
		giveawayHelperUI.loadUI();
		gleamHelper.init();
	} else if(document.location.hostname == "marvelousga.com") {
		giveawayHelperUI.loadUI();
		marvelousHelper.init();
	} else {
		commandHub.init();
	}
})();
