#!/usr/bin/env python2.5
#
# $Id$
"""
DESCRIPTION   Web dispatcher table for Homepage
"""
import web_publisher
import fastrpc
from lib.util import process_only_on_test

# Definuj, kde lezi konfiguracni trida
# pylint: disable=C0103
config_reader = ("lib.config.Config", ("lib.error", "lib.uiradr",))

# Definuj, kde lezi overovaci trida
check_request = ("lib.userinfo.UserInfo", ("lib.error", "lib.util",
                                            "lib.defaultinfo",
                                            "lib.anonyminfo",
                                            "lib.loggedinfo",
                                            "lib.geoip"))
# pylint: enable=C0103

# Tabulka dispecera
paths = {

    # Homepage
    "/" : ("hp.indexScreen",
                web_publisher.GET,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.calendar", "lib.error", "lib.geoip",
                    "lib.userinfo", "lib.uiradr", "lib.defaultinfo",
                    "lib.anonyminfo", "lib.loggedinfo", "skin", "hint")),

    # Homepage
    "/nove-nastaveni" : ("hp.setup",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.calendar", "lib.error", "lib.geoip",
                    "lib.userinfo", "lib.defaultinfo", "lib.anonyminfo",
                    "lib.loggedinfo", "lib.uiradr"),
                {'loginRequired' : True, "checkHashId" : False}),

    "/readerScreen" : ("hp.readerScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"), {'loginRedirect' : 'reader' }),

    "/readerMenuScreen" : ("hp.readerMenuScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/readerFeedScreen" : ("hp.readerFeedScreen",
                web_publisher.GET,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error"),),

    #
    # Top clanky
    #
    "/nejctenejsi-clanky": ("toparticles.top_articles",
                            web_publisher.GET,
                            web_publisher.PARSE_FORM,
                            ("lib.util", "lib.calendar", "lib.error",
                             "lib.userinfo", "lib.uiradr", "lib.defaultinfo",
                             "lib.anonyminfo", "lib.loggedinfo")),
    "/nejctenejsi-clanky/registrace": ("toparticles.top_articles_registration",
                                       web_publisher.POST,
                                       web_publisher.PARSE_FORM,
                                       ("lib.util", "lib.calendar", "lib.error",
                                        "lib.userinfo", "lib.uiradr", "lib.defaultinfo",
                                        "lib.anonyminfo", "lib.loggedinfo")),
    "/nejctenejsi-clanky/potvrzeni": ("toparticles.top_articles_check",
                                      web_publisher.GET,
                                      web_publisher.PARSE_FORM,
                                      ("lib.util", "lib.calendar", "lib.error",
                                       "lib.userinfo", "lib.uiradr", "lib.defaultinfo",
                                       "lib.anonyminfo", "lib.loggedinfo")),
    "/nejctenejsi-clanky/odhlasit": ("toparticles.top_articles_delete",
                                     web_publisher.GET,
                                     web_publisher.PARSE_FORM,
                                     ("lib.util", "lib.calendar", "lib.error",
                                      "lib.userinfo", "lib.uiradr", "lib.defaultinfo",
                                      "lib.anonyminfo", "lib.loggedinfo")),
    "/nejctenejsi-clanky/get-captcha": ("toparticles.top_articles_captcha",
                                        web_publisher.GET,
                                        web_publisher.PARSE_FORM,
                                        ("lib.util", "lib.calendar", "lib.error",
                                         "lib.userinfo", "lib.uiradr", "lib.defaultinfo",
                                         "lib.anonyminfo", "lib.loggedinfo")),

    #
    # Prihlaseni a odhlaseni uzivatele
    #
    "/loginScreen" : ("login.loginScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util",),
                {"checkHashId" : False}),

    "/loginProcess" : ("login.loginProcess",
                web_publisher.POST,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error")),

    "/logoutProcess" : ("login.logoutProcess",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/ticket" : ("login.ticket",
                web_publisher.GET,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error")),

    "/distribuce.html" : ("hp.distribuce",
                web_publisher.GET,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error",
                    "lib.userinfo", "lib.uiradr", "lib.defaultinfo",
                    "lib.anonyminfo", "lib.loggedinfo")),


    #
    # Nastaveni - vyber horoskopu
    #
    "/setupZodiacScreen" : ("setup.setupZodiacScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {'loginRedirect' : '', "checkHashId" : False}),

    "/setupZodiacProcess" : ("setup.setupZodiacProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"), {'loginRedirect' : 'zodiac' }),

    #
    # Nastaveni - seznam RSS zdroju
    #
    "/setupFeedScreen" : ("setup.setupFeedScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {'loginRedirect' : 'feed', "checkHashId" : False}),

    "/setupFeedProcess" : ("setup.setupFeedProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.rss"),
                {'loginRedirect' : 'feed' }),

    "/setupFeedDiscoveryScreen" : ("setup.setupFeedDiscoveryScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {"checkHashId" : False}),

    "/setupFeedDiscoveryProcess" : ("setup.setupFeedDiscoveryProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),
    #
    # Nastaveni - vyber regionu pro pocasi
    #
    "/setupWeatherScreen" : ("setup.setupWeatherScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.uiradr"),
                {'loginRedirect' : '', "checkHashId" : False}),

    "/setupWeatherProcess" : ("setup.setupWeatherProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.defaultinfo"),
                {'loginRedirect' : 'weather'}),

    #
    # Nastaveni - vyber oblibenych TV stanic
    #
    "/setupTvScreen" : ("setup.setupTvScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {'loginRedirect' : '', "checkHashId" : False}),

    "/setupTvProcess" : ("setup.setupTvProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"), {'loginRedirect' : 'tv' }),

    #
    # Export feedu do OPML
    #
    "/opmlExportScreen" : ("opml.exportScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {'loginRedirect' : 'export', "checkHashId" : False}),

    "/opmlExportProcess" : ("opml.exportProcess",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"), {'loginRedirect' : 'export' }),

    #
    # Import OPML
    #
    "/opmlImportScreen" : ("opml.importScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"), {'loginRedirect' : 'export' }),

    "/opmlImportProcess" : ("opml.importProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"), {'loginRedirect' : 'export' }),

    #
    # Ostatni nastaveni
    #
    "/setupOtherScreen" : ("setup.setupOtherScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {'loginRedirect' : 'other', "checkHashId" : False}),

    "/setupOtherProcess" : ("setup.setupOtherProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"), {'loginRedirect' : 'other' }),

    #
    # Nastaveni skinu
    #
    "/setupSkinScreen" : ("setup.setupSkinScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {'loginRedirect' : 'skin', "checkHashId" : False}),

    "/setupSkinProcess" : ("setup.setupSkinProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"), {'loginRedirect' : 'skin' }),


    #
    # Pridani vlastnich RSS zdroju
    #
    "/addFeed" : ("setup.addFeed",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"), {"checkHashId" : False}),

    "/addFeedProcess" : ("setup.addFeedProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"), {'loginRedirect' : 'addfeed'}),

    "/promoteScreen" : ("setup.promoteScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {"checkHashId" : False}),

    "/aboutRssScreen" : ("setup.aboutRssScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {"checkHashId" : False}),

    #
    # Vlastni hledani redir
    #
    "/userSearch" : ("hp.userSearch",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    #
    # JS volani
    #

    "/jsGetContent" : ("hp.jsGetContent",
                       web_publisher.POST,
                       web_publisher.PARSE_FORM,
                       ("lib.util", "lib.calendar", "lib.error", "lib.geoip",
                           "lib.userinfo", "lib.defaultinfo", "lib.anonyminfo",
                           "lib.loggedinfo", "lib.uiradr", "hint")),

    "/jsCloseWave" : ("hint.jsCloseWave",
                web_publisher.POST,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.anonyminfo", "lib.loggedinfo")
                ),

    "/closeWave" : ("hint.closeWave",
                web_publisher.GET,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.anonyminfo", "lib.loggedinfo")
                ),

    "/jsRSS" : ("hp.jsRSS",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSetupFeedProcess" : ("setup.jsSetupFeedProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.anonyminfo", "lib.loggedinfo")),

    "/jsSetupFacebookProcess" : ("setup.jsSetupFacebookProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.anonyminfo", "lib.loggedinfo")),

    "/jsSetupZodiacProcess" : ("setup.jsSetupZodiacProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSetupTvProcess" : ("setup.jsSetupTvProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSetupOtherProcess" : ("setup.jsSetupOtherProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSetupSuggest" : ("setup.jsSetupSuggest",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSetupWeatherScreen" : ("hp.jsSetupWeatherScreen",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.anonyminfo", "lib.loggedinfo")),
#                {"checkHashId" : False}),

    "/jsSetupWeatherProcess" : ("setup.jsSetupWeatherProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.anonyminfo", "lib.loggedinfo")),
#                {"checkHashId" : False}),

    "/jsSetupForeignEmailProcess" : ("setup.jsSetupFeedProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.anonyminfo", "lib.loggedinfo")),

    "/jsFeedGetContent" : ("setup.jsFeedGetContent",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.anonyminfo", "lib.loggedinfo")),

    "/jsForeignEmailGetContent" : ("setup.jsFeedGetContent",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.anonyminfo", "lib.loggedinfo")),

    "/jsForeignEmailLogout" : ("setup.jsForeignEmailLogout",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.anonyminfo", "lib.loggedinfo")),

    "/jsWeatherGetCities" : ("hp.jsWeatherGetCities",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.uiradr")),
#                {"checkHashId" : False}),

    "/jsSetupEmailProcess" : ("setup.jsSetupEmailProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.userinfo",
                    "lib.defaultinfo", "lib.anonyminfo", "lib.loggedinfo")),
#                {"checkHashId" : False}),

    "/jsSetupTvScreen" : ("setup.jsSetupTvScreen",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsTvDescription" : ("hp.jsTvDescription",
                web_publisher.POST,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error")),

    "/jsFeedRemove" : ("setup.jsFeedRemove",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsFeedAdd" : ("setup.jsFeedAdd",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsFeedMove" : ("setup.jsFeedMove",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsGetFeedList" : ("setup.jsGetFeedList",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsFeedSearch" : ("setup.jsFeedSearch",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.rss")),

    "/jsFeedProcess" : ("setup.jsFeedProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSetupSkinProcess" : ("setup.jsSetupSkinProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    #"/jsSearchAdd" : ("setup.jsSearchAdd",
    #            web_publisher.POST,
    #            web_publisher.PARSE_AND_CHECK_FORM,
    #            ("lib.util", "lib.error", "lib.httpproxy")),

    "/jsSearchList" : ("setup.jsSearchList",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSetupSearchProcess" : ("setup.jsSetupSearchProcess",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/setByOther" : ("setup.setByOther",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/nastavit-vychozi" : ("setup.setDefaults",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {"checkHashId" : False}),

    "/jsLogin" : ("login.jsLogin",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsTestSSL" : ("hp.jsTestSSL",
                web_publisher.GET,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error")),

    "/jsHintExecute" : ("hint.jsHintExecute",
                web_publisher.GET_POST,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.calendar", "lib.error", "lib.geoip",
                 "lib.userinfo", "lib.uiradr", "lib.defaultinfo",
                 "lib.anonyminfo", "lib.loggedinfo")),

    #
    # Poznamky
    #
    "/jsGetSelectedNote" : ("note.jsGetSelectedNote",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSetSelectedNote" : ("note.jsSetSelectedNote",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsGetNote" : ("note.jsGetNote",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSetNote" : ("note.jsSetNote",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsRemoveNote" : ("note.jsRemoveNote",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSetNoteVisibility" : ("note.jsSetNoteVisibility",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    #
    # Titulky
    #
    "/jsTitleExecute" : ("hp.jsTitleExecute",
                web_publisher.GET_POST,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error")),

    #
    # Skiny 
    #
    "/jsSkinSetId" : ("skin.jsSkinSetId",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSkinSetCustom" : ("skin.jsSkinSetCustom",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSkinSetSynched" : ("skin.jsSkinSetSynched",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSkinSetUploaded" : ("skin.jsSkinSetUploaded",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    "/jsSkinSaveImage" : ("skin.jsSkinSaveImage",
                web_publisher.POST,
                web_publisher.NO_ACTION,
                ("lib.util", "lib.error", "lib.userinfo", "lib.defaultinfo",
                    "lib.anonyminfo", "lib.loggedinfo")),

    "/skinSaveImage" : ("skin.skinSaveImage",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error", "lib.userinfo", "lib.defaultinfo",
                    "lib.anonyminfo", "lib.loggedinfo")),
    #
    # Televize
    #
    "/jsTvGetChannels" : ("hp.jsTvGetChannels",
                web_publisher.POST,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {"checkHashId" : False }),
    #
    # Vsechny ostatni pripady (404 Not found)
    # Zde zejmena osetrime vsechny redirecty
    #
    web_publisher.ANY : ("redirect.unknownUrl",
                web_publisher.GET_POST,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error")),

    # Sluzby na seznamu
    "/servicesScreen" : ("hp.servicesScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {"checkHashId" : False}),

    # Homepage firefoxu
    "/firefox" : ("hp.firefox",
               web_publisher.GET,
               web_publisher.PARSE_AND_CHECK_FORM,
               ("lib.util",),
               {"checkHashId" : False}),

    # Redirect pro firmy.seznam.cz (utf -> iso)
    "/firmy" : ("redirect.firmy",
               web_publisher.GET,
               web_publisher.PARSE_FORM,
               ("lib.util",),
               {"checkHashId" : False}),

    "/jsRSS2" : ("hp.jsRSS2",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {"checkHashId" : False}),

    "/jsCatalogueABC" : ("hp.jsCatalogueABC",
                web_publisher.POST,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error")),

    # Generovani sablony pro ABC katalog
    "/generateCatalogue" : ("hp.generateCatalogue",
                web_publisher.GET,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error"),
                {"checkHashId" : False}),

    # Generovani nahodne kategorie pro Firmy.cz
    "/generateFirmyRandomCategory" : ("hp.generateFirmyRandomCategory",
                web_publisher.GET,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error"),
                {"checkHashId" : False}),

    # Export ctennosti
    "/readers.xml" : ("readers.xmlScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {"checkHashId" : False}),

    "/readers.dtd" : ("readers.dtdScreen",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error"),
                {"checkHashId" : False}),

    "/presmeruj" : ("hp.redirectProcess",
                web_publisher.GET,
                web_publisher.PARSE_AND_CHECK_FORM,
                ("lib.util", "lib.error")),

    # novinky

    "/staticInfoScreen" : ("hp.staticInfoScreen",
                 web_publisher.GET,
                 web_publisher.PARSE_FORM,
                 ("lib.util", "lib.error")),

    # noredir pro mobilni sluzby

    "/mobileNoredir" : ("hp.mobileNoredir",
                web_publisher.GET,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error")),

#    "*" :       ("hp.contentDispatcher",
#                web_publisher.GET_POST,
#                web_publisher.PARSE_AND_CHECK_FORM,
#                ("lib.util", "lib.error", "redirect"),
#                {"checkHashId" : False}),

    # nastavi beta cookie podle nastaveni v adminu
    "/zkusit-betu": ("hp.setBetaCookie",
                     web_publisher.GET,
                     web_publisher.PARSE_AND_CHECK_FORM,
                     ("lib.util", "lib.error"),
                     {"checkHashId": False}),

    # Filmy na homepage
    "/film-na-hp" : ("movie.movieScreen",
                web_publisher.GET,
                web_publisher.PARSE_FORM,
                ("lib.util", "lib.error")),

} # end of paths dict

# alias index.html to /
paths["/index.html"] = paths["/"]

# Aliasy pro SEO optimalizaci
paths["/nastaveni-zprav"] = paths["/setupFeedScreen"]
paths["/vyber-zprav"] = paths["/setupFeedDiscoveryScreen"]
paths["/nastaveni-pocasi"] = paths["/setupWeatherScreen"]
paths["/nastaveni-horoskopu"] = paths["/setupZodiacScreen"]
paths["/nastaveni-tv-programu"] = paths["/setupTvScreen"]
paths["/nastaveni-ostatni"] = paths["/setupOtherScreen"]
paths["/zmena-vzhledu"] = paths["/setupSkinScreen"]
paths["/export-zprav-opml"] = paths["/opmlExportScreen"]
paths["/import-zprav-opml"] = paths["/opmlImportScreen"]
paths["/pridej-zpravy"] = paths["/addFeed"]
paths["/prihlaseni"] = paths["/loginScreen"]
paths["/prihlaseni-nastaveni-obsahu"] = paths["/loginScreen"]
paths["/prihlaseni-nastaveni-vzhledu"] = paths["/loginScreen"]
paths["/prihlaseni-nastaveni-hledani"] = paths["/loginScreen"]
paths["/prihlaseni-nove-nastaveni"] = paths["/loginScreen"]
paths["/co-je-rss"] = paths["/aboutRssScreen"]
paths["/ikona-pro-webmastery"] = paths["/promoteScreen"]
paths["/sluzby-na-seznamu"] = paths["/servicesScreen"]
paths["/rss-ctecka"] = paths["/readerScreen"]
paths["/rss-ctecka-menu"] = paths["/readerMenuScreen"]
paths["/rss-ctecka-feed"] = paths["/readerFeedScreen"]
paths["/dle-vaseho-gusta"] = paths["/staticInfoScreen"]
# Filmy na HP
#paths["/super-startup-2011"] = paths["/film-na-hp"]
#paths["/super-startup-2011-live"] = paths["/film-na-hp"]
#paths["/fimfarum-2"] = paths["/film-na-hp"]
#paths["/obusku-z-pytle-ven"] = paths["/film-na-hp"]
#paths["/princezna-se-zlatou-hvezdou"] = paths["/film-na-hp"]
paths["/film-je-nedostupny"] = paths["/film-na-hp"]
paths["/neni-zadny-obsah"] = paths["/film-na-hp"]

# handlery pro vanocni pohadku
#@process_only_on_test
#def __add_christmas_movies(paths):
#    paths["/kuky-se-vraci"] = paths["/film-na-hp"]
#    paths["/kuky"] = paths["/film-na-hp"]
#    paths["/limit"] = paths["/film-na-hp"]
#    paths["/film-nedostupny"] = paths["/film-na-hp"]
#enddef
#__add_christmas_movies(paths)

# Vydej vypadkove stranky - kdyz je v adminu zapnut vypadek nektereho boxu
paths["/vypadek"] = paths["/film-na-hp"]
paths["/abtest-prepare"] = paths["/film-na-hp"]

# Staticke stranky na hp, pouzijeme film-na-hp
#paths["/kristalova-lupa"] = paths["/film-na-hp"]
#paths["/vanocni-program"] = paths["/film-na-hp"]
paths["/domovska-stranka"] = paths["/film-na-hp"]

# Tabulka osetreni vyjimek
exceptions = {
    fastrpc.Fault                   : ("lib.error.frpcError", ("lib.util",)),
    fastrpc.ProtocolError           : ("lib.error.frpcError", ("lib.util",)),
    IOError                         : ("lib.error.IOErrorExt", ()),
    web_publisher.UNKNOWN_EXCEPTION : ("lib.error.unknownError", ("lib.util",)),
}
