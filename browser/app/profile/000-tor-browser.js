# Default Preferences
# Tor Browser Bundle
# Do not edit this file.

// Please maintain unit tests at ./tbb-tests/browser_tor_TB4.js

// Disable browser automatic updates and associated homepage notifications
pref("app.update.auto", false);
pref("browser.search.update", false);
pref("browser.rights.3.shown", true);
pref("browser.startup.homepage_override.mstone", "ignore");
pref("startup.homepage_welcome_url", "");
pref("startup.homepage_override_url", "");

// Disable "Slow startup" warnings and associated disk history
// (bug #13346)
pref("browser.slowStartup.notificationDisabled", true);
pref("browser.slowStartup.maxSamples", 0);
pref("browser.slowStartup.samples", 0);

// Disk activity: Disable Browsing History Storage
pref("browser.privatebrowsing.autostart", true);
pref("browser.cache.disk.enable", false);
pref("browser.cache.offline.enable", false);
pref("dom.indexedDB.enabled", false);
pref("permissions.memory_only", true);
pref("network.cookie.lifetimePolicy", 2);
pref("browser.download.manager.retention", 1);
pref("security.nocertdb", true);

// Disk activity: TBB Directory Isolation
pref("browser.download.useDownloadDir", false);
pref("browser.shell.checkDefaultBrowser", false);
pref("browser.download.manager.addToRecentDocs", false);

// Misc privacy: Disk
pref("signon.rememberSignons", false);
pref("browser.formfill.enable", false);
pref("signon.autofillForms", false);
pref("browser.sessionstore.privacy_level", 2);
pref("media.cache_size", 0);

// Misc privacy: Remote
pref("browser.send_pings", false);
pref("geo.enabled", false);
pref("geo.wifi.uri", "");
pref("browser.search.suggest.enabled", false);
pref("browser.safebrowsing.enabled", false);
pref("browser.safebrowsing.malware.enabled", false);
pref("browser.download.manager.scanWhenDone", false); // prevents AV remote reporting of downloads
pref("extensions.ui.lastCategory", "addons://list/extension");
pref("datareporting.healthreport.service.enabled", false); // Yes, all three of these must be set
pref("datareporting.healthreport.uploadEnabled", false);
pref("datareporting.policy.dataSubmissionEnabled", false);
pref("security.mixed_content.block_active_content", false); // Disable until https://bugzilla.mozilla.org/show_bug.cgi?id=878890 is patched
pref("browser.syncPromoViewsLeftMap", "{\"addons\":0, \"passwords\":0, \"bookmarks\":0}"); // Don't promote sync
pref("services.sync.engine.prefs", false); // Never sync prefs, addons, or tabs with other browsers
pref("services.sync.engine.addons", false);
pref("services.sync.engine.tabs", false);
pref("extensions.getAddons.cache.enabled", false); // https://blog.mozilla.org/addons/how-to-opt-out-of-add-on-metadata-updates/

// Fingerprinting
pref("webgl.min_capability_mode", true);
pref("webgl.disable-extensions", true);
pref("dom.battery.enabled", false); // fingerprinting due to differing OS implementations
pref("dom.network.enabled",false); // fingerprinting due to differing OS implementations
pref("browser.display.max_font_attempts",10);
pref("browser.display.max_font_count",10);
pref("gfx.downloadable_fonts.fallback_delay", -1);
pref("general.appname.override", "Netscape");
pref("general.appversion.override", "5.0 (Windows)");
pref("general.oscpu.override", "Windows NT 6.1");
pref("general.platform.override", "Win32");
pref("general.useragent.override", "Mozilla/5.0 (Windows NT 6.1; rv:31.0) Gecko/20100101 Firefox/31.0");
pref("general.productSub.override", "20100101");
pref("general.buildID.override", "20100101");
pref("browser.startup.homepage_override.buildID", "20100101");
pref("general.useragent.vendor", "");
pref("general.useragent.vendorSub", "");
pref("dom.enable_performance", false);
pref("plugin.expose_full_path", false);
pref("browser.zoom.siteSpecific", false);
pref("intl.charset.default", "windows-1252");
pref("browser.link.open_newwindow.restriction", 0); // Bug 9881: Open popups in new tabs (to avoid fullscreen popups)
pref("dom.gamepad.enabled", false); // bugs.torproject.org/13023
// pref("intl.accept_languages", "en-us, en"); // Set by Torbutton
// pref("intl.accept_charsets", "iso-8859-1,*,utf-8"); // Set by Torbutton
// pref("intl.charsetmenu.browser.cache", "UTF-8"); // Set by Torbutton

// Third party stuff
pref("network.cookie.cookieBehavior", 1);
pref("security.enable_tls_session_tickets", false);
pref("network.http.spdy.enabled", false); // Stores state and may have keepalive issues (both fixable)
pref("network.http.spdy.enabled.v2", false); // Seems redundant, but just in case
pref("network.http.spdy.enabled.v3", false); // Seems redundant, but just in case

// Proxy and proxy security
pref("network.proxy.socks", "127.0.0.1");
pref("network.proxy.socks_port", 9150);
pref("network.proxy.socks_remote_dns", true);
pref("network.proxy.no_proxies_on", ""); // For fingerprinting and local service vulns (#10419)
pref("network.proxy.type", 1);
pref("network.security.ports.banned", "9050,9051,9150,9151");
pref("network.dns.disablePrefetch", true);
pref("network.protocol-handler.external-default", false);
pref("network.protocol-handler.external.mailto", false);
pref("network.protocol-handler.external.news", false);
pref("network.protocol-handler.external.nntp", false);
pref("network.protocol-handler.external.snews", false);
pref("network.protocol-handler.warn-external.mailto", true);
pref("network.protocol-handler.warn-external.news", true);
pref("network.protocol-handler.warn-external.nntp", true);
pref("network.protocol-handler.warn-external.snews", true);
pref("plugins.click_to_play", true);
pref("plugin.state.flash", 1);
pref("plugins.hide_infobar_for_missing_plugin", true);
pref("media.peerconnection.enabled", false); // Disable WebRTC interfaces

// Network and performance
pref("network.http.pipelining", true);
pref("network.http.pipelining.aggressive", true);
pref("network.http.pipelining.maxrequests", 12);
pref("network.http.pipelining.ssl", true);
pref("network.http.proxy.pipelining", true);
pref("security.ssl.enable_false_start", true);
pref("network.http.keep-alive.timeout", 20);
pref("network.http.connection-retry-timeout", 0);
pref("network.http.max-persistent-connections-per-proxy", 256);
pref("network.http.pipelining.reschedule-timeout", 15000);
pref("network.http.pipelining.read-timeout", 60000);
// Hacked pref: Now means "Attempt to pipeline at least this many requests together"
pref("network.http.pipelining.max-optimistic-requests", 3);
pref("security.ssl.disable_session_identifiers", true);

// Extension support
pref("extensions.autoDisableScopes", 0);
pref("extensions.bootstrappedAddons", "{}");
pref("extensions.checkCompatibility.4.*", false);
pref("extensions.databaseSchema", 3);
pref("extensions.enabledAddons", "https-everywhere%40eff.org:3.1.4,%7B73a6fe31-595d-460b-a920-fcc0f8843232%7D:2.6.6.1,torbutton%40torproject.org:1.5.2,ubufox%40ubuntu.com:2.6,tor-launcher%40torproject.org:0.1.1pre-alpha,%7B972ce4c6-7e08-4474-a285-3208198ce6fd%7D:17.0.5");
pref("extensions.enabledItems", "langpack-en-US@firefox.mozilla.org:,{73a6fe31-595d-460b-a920-fcc0f8843232}:1.9.9.57,{e0204bd5-9d31-402b-a99d-a6aa8ffebdca}:1.2.4,{972ce4c6-7e08-4474-a285-3208198ce6fd}:3.5.8");
pref("extensions.enabledScopes", 1);
pref("extensions.pendingOperations", false);
pref("xpinstall.whitelist.add", "");
pref("xpinstall.whitelist.add.36", "");

// Toolbar layout
pref("browser.uiCustomization.state", "{\"placements\":{\"PanelUI-contents\":[\"edit-controls\",\"zoom-controls\",\"new-window-button\",\"save-page-button\",\"print-button\",\"bookmarks-menu-button\",\"history-panelmenu\",\"find-button\",\"preferences-button\",\"add-ons-button\",\"developer-button\",\"https-everywhere-button\",\"downloads-button\"],\"addon-bar\":[\"addonbar-closebutton\",\"status-bar\"],\"PersonalToolbar\":[\"personal-bookmarks\"],\"nav-bar\":[\"noscript-tbb\",\"torbutton-button\",\"urlbar-container\",\"search-container\",\"webrtc-status-button\",\"social-share-button\"],\"TabsToolbar\":[\"tabbrowser-tabs\",\"new-tab-button\",\"alltabs-button\"],\"toolbar-menubar\":[\"menubar-items\"]},\"seen\":[],\"dirtyAreaCache\":[\"PersonalToolbar\",\"nav-bar\",\"TabsToolbar\",\"toolbar-menubar\",\"PanelUI-contents\",\"addon-bar\"],\"newElementCount\":0}");

// Omnibox settings
pref("keyword.URL", "https://startpage.com/do/search?q=");

// Hacks/workarounds: Direct2D seems to crash w/ lots of video cards w/ MinGW?
// Nvida cards also experience crashes without the second pref set to disabled
pref("gfx.direct2d.disabled", true);
pref("layers.acceleration.disabled", true);

// Security enhancements
// https://trac.torproject.org/projects/tor/ticket/9387#comment:17
pref("javascript.options.ion.content", false);
pref("javascript.options.baselinejit.content", false);
pref("javascript.options.asmjs", false);
pref("javascript.options.typeinference", false);

// Audio_data is deprecated in future releases, but still present
// in FF24. This is a dangerous combination (spotted by iSec)
pref("media.audio_data.enabled", false);

// Enable TLS 1.1 and 1.2:
// https://trac.torproject.org/projects/tor/ticket/11253
pref("security.tls.version.max", 3);
// POODLE hotfix: Disable SSLv3
pref("security.tls.version.min", 1);

#ifdef TOR_BROWSER_VERSION
#expand pref("torbrowser.version", __TOR_BROWSER_VERSION__);
#endif
