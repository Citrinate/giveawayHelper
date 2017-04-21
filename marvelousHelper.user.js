// ==UserScript==
// @name Marvelous Helper
// @namespace https://github.com/Citrinate/marvelousHelper
// @description Enhances Marvelousga giveaways
// @author Citrinate
// @version 1.0
// @match https://marvelousga.com/giveaway.php*
// @connect steamcommunity.com
// @grant GM_addStyle
// @grant GM_xmlhttpRequest
// @grant unsafeWindow
// @updateURL https://raw.githubusercontent.com/Citrinate/marvelousHelper/master/marvelousHelper.user.js
// @downloadURL https://raw.githubusercontent.com/Citrinate/marvelousHelper/master/marvelousHelper.user.js
// @require https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @run-at document-end
// ==/UserScript==

(function() {
	/**
	 *
	 */
	var gleamHelper = (function() {

		/**
		 * Search the page for Steam Groups and add Join/Leave buttons for them
		 */
		function findSteamGroups() {
			$("body").find("a[href^='http://steamcommunity.com/groups/']").each(function() {
				var group_name = $(this).attr("href").replace("http://steamcommunity.com/groups/", "").toLowerCase().replace(/[^a-z0-9\-]/g, "");

				loadSteamHandler.getInstance().handleEntry(group_name);
			});
		}

		/**
		 * Handles Steam group buttons
		 */
		var loadSteamHandler = (function() {
			function init() {
				var steam_id = null,
					session_id = null,
					process_url = null,
					active_groups = [],
					button_base_id = "steam_button_",
					button_count = 1;
					ready = false;

				// Get all the user data we'll need to make join/leave group requests
				GM_xmlhttpRequest({
					url: "https://steamcommunity.com/my/groups",
					method: "GET",
					onload: function(response) {
						steam_id = response.responseText.match(/g_steamID = \"(.+?)\";/);
						session_id = response.responseText.match(/g_sessionID = \"(.+?)\";/);
						process_url = response.responseText.match(/processURL = '(.+?)';/);
						steam_id = steam_id === null ? null : steam_id[1];
						session_id = session_id === null ? null : session_id[1];
						process_url = process_url === null ? null : process_url[1];

						$(response.responseText).find("a[href^='https://steamcommunity.com/groups/']").each(function() {
							var group_name = $(this).attr("href").replace("https://steamcommunity.com/groups/", "").toLowerCase();

							if(group_name.indexOf("/") == -1) {
								active_groups.push(group_name);
							}
						});

						$.unique(active_groups);
						ready = true;
					}
				});


				/**
				 * Add a join/leave toggle button to the group
				 */
				function createButton(group_name) {
					if(steam_id === null || session_id === null || process_url === null) {
						// We're not logged in
						gleamHelperUI.showError('You must be logged into <a href="https://steamcommunity.com/login" target="_blank">steamcommunity.com</a>');
					} else if(active_groups === null) {
						// Couldn't get user's group data
						gleamHelperUI.showError("Unable to determine what Steam groups you're a member of");
					} else {
						// Create the button
						var starting_label = active_groups.indexOf(group_name) == -1 ? "Join " + group_name : "Leave " + group_name,
							button_id = button_base_id + button_count++,
							group_id = null;

						gleamHelperUI.addButton(button_id, starting_label, function() {
							gleamHelperUI.showButtonLoading(button_id);

							if(group_id === null) {
								group_id = getGroupID(group_name, function(new_group_id) {
									group_id = new_group_id;
									toggleGroupStatus(button_id, group_name, group_id);
								});
							} else {
								toggleGroupStatus(button_id, group_name, group_id);
							}
						});
					}
				}


				/**
				 * Toggle group status between "joined" and "left"
				 */
				function toggleGroupStatus(button_id, group_name, group_id) {
					var steam_community_down_error = "The Steam Community is experiencing issues. " +
						"Please handle any remaining Steam entries manually.<br>" +
						"If you're having trouble getting groups to appear on " +
						'<a href="https://steamcommunity.com/my/groups/">your groups list</a>, ' +
						'joining a <a href="https://steamcommunity.com/search/#filter=groups">new group</a> may force the list to update.';

					if(active_groups.indexOf(group_name) == -1) {
						joinSteamGroup(group_name, group_id, function(success) {
							if(success) {
								active_groups.push(group_name);
								gleamHelperUI.setButtonLabel(button_id, "Leave " + group_name);
							} else {
								gleamHelperUI.showError(steam_community_down_error);
							}

							gleamHelperUI.hideButtonLoading(button_id);
						});
					} else {
						leaveSteamGroup(group_name, group_id, function(success) {
							if(success) {
								active_groups.splice(active_groups.indexOf(group_name), 1);
								gleamHelperUI.setButtonLabel(button_id, "Join " + group_name);
							} else {
								gleamHelperUI.showError(steam_community_down_error);
							}

							gleamHelperUI.hideButtonLoading(button_id);
						});
					}
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
										if($(response.responseText.toLowerCase()).find("a[href='https://steamcommunity.com/groups/" + group_name + "']").length === 0) {
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
					GM_xmlhttpRequest({
						url: process_url,
						method: "POST",
						headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
						data: $.param({ sessionID: session_id, action: "leaveGroup", groupId: group_id }),
						onload: function(response) {
							if(typeof callback == "function") {
								if($(response.responseText.toLowerCase()).find("a[href='https://steamcommunity.com/groups/" + group_name + "']").length !== 0) {
									// Failed to leave the group, Steam Community is probably down
									callback(false);
								} else {
									callback(true);
								}
							}
						}
					});
				}

				return {
					/**
					 *
					 */
					handleEntry: function(group_name) {
						if(ready) {
							createButton(group_name);
						} else {
							// Wait for the command hub to load
							var temp_interval = setInterval(function() {
								if(ready) {
									clearInterval(temp_interval);
									createButton(group_name);
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

		return {
			/**
			 *
			 */
			initGleam: function() {
				gleamHelperUI.loadUI();
				findSteamGroups();
			},
		};
	})();

	var gleamHelperUI = (function() {
		var active_errors = [],
			active_notifications = {},
			active_buttons = {},
			group_box_container = $("<div>", { class: "gh__group_box panel-body" }),
			gleam_helper_container = $("<div>", { class: "gh__main_container" });

			GM_addStyle(
				"html { overflow-y: scroll !important; }" +
				".gh__main_container { font-size: 16.5px; left: 0px; position: fixed; text-align: center; top: 0px; width: 100%; z-index: 9999999999; }" +
				".gh__button { border-bottom-width: 4px !important; margin: 8px !important; }" +
				".gh__notification { background: #000; border-top: 1px solid rgba(52, 152, 219, .5); box-shadow: 0px 2px 10px rgba(0, 0, 0, .5); box-sizing: border-box; color: #3498db; line-height: 22px; padding: 12px; width: 100%; }" +
				".gh__error { background: #e74c3c; border-top: 1px solid rgba(255, 255, 255, .5); box-shadow: 0px 2px 10px rgba(231, 76, 60, .5); box-sizing: border-box; color: #fff; line-height: 22px; padding: 12px; width: 100%; }" +
				".gh__error a { color: #fff; }" +
				".gh__quantity { font-style: italic; margin: 12px 0px 0px 0px; }" +
				".gh__group_box { display: inline-block; font-size: 14px; line-height: 14px; position: relative; top: -4px; }" +
				".gh__close { float: right; background: rgba(255, 255, 255, .15); border: 1px solid #fff; box-shadow: 0px 0px 8px rgba(255, 255, 255, .5); cursor: pointer; margin-left: 4px; padding: 0px 4px; }" +
				".gh__close:hover { background: #fff; color: #e74c3c; }" +
				".gh__close::before { content: 'x'; position: relative; top: -1px; }"
			);

		/**
		 * Push the page down to make room for notifications
		 */
		function updateTopMargin() {
			$("html").css("margin-top", (gleam_helper_container.is(":visible") ? gleam_helper_container.outerHeight() : 0));
		}

		return {
			/**
			 * Print the UI
			 */
			loadUI: function() {
				$("body").append(gleam_helper_container);
				$("body>div:first").after(
					$("<div>", { class: "container" }).append(
						$("<div>", { class: "col-md-8 col-md-offset-2" }).append(
							$("<div>", { class: "panel panel-danger" }).append(
								$("<div>", { class: "panel-heading" }).append(
									$("<h3>", { class: "text-center panel-title" }).append(
										"Marvelous Helper"
									)
								)
							).append(
								group_box_container
							)
						)
					)
				);
			},

			/**
			 * Print an error
			 */
			showError: function(msg) {
				// Don't print the same error multiple times
				if(active_errors.indexOf(msg) == -1) {
					var self = this;

					active_errors.push(msg);
					gleam_helper_container.append(
						$("<div>", { class: "gh__error" }).html("<strong>Marvelous Helper Error</strong>: " + msg).prepend(
							$("<div>", { class: "gh__close" }).click(function() {
								$(this).unbind("click");
								$(this).parent().slideUp(400, function() {
									active_errors.splice(active_errors.indexOf(msg), 1);
									$(this).remove();
									updateTopMargin();
								});
							})
						));
					updateTopMargin();
				}
			},

			/**
			 * Display or update a notification
			 */
			showNotification: function(notification_id, msg, hide_delay) {
				if(!active_notifications[notification_id]) {
					// New notification
					active_notifications[notification_id] = $("<div>", { class: "gh__notification" });
					gleam_helper_container.append(active_notifications[notification_id]);
				}

				// Update notification
				active_notifications[notification_id].html("<strong>Marvelous Helper Notification</strong>: " + msg);
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
			addButton: function(button_id, label, click_function) {
				var new_button =
						$("<a>", { class: "gh__button btn btn-embossed btn-info" }).append(
							$("<span>", { text: label })).append(
							$("<span>", { class: "fa ng-scope fa-refresh fa-spin", css: { display: "none" }})
						).click(function(e) {
							e.stopPropagation();
							if(!active_buttons[button_id].find(".fa").is(":visible")) {
								click_function();
							}
						});

				active_buttons[button_id] = new_button;

				group_box_container.append(
					$("<div>", { class: "col-md-12" }).append(
						new_button
					)
				);
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
			setButtonLabel: function(button_id, label) {
				active_buttons[button_id].find("span").first().text(label);
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

	gleamHelper.initGleam();
})();
