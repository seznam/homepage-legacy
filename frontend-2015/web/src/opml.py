#/bin/env python2.2
#
# $Id$
"""
DESCRIPTION   Setup
"""

from mod_python import apache
from dbglog     import dbg
from xml        import sax

def exportScreen(req):
    """
    Obrazovka exportu opml
    """
    return _opmlScreen(req)
#enddef

def exportProcess(req):
    """
    Metoda exportujici data z DB do OPML XML
    """
    # Ziskame data z froga - nejdrive feedy
    res = req.config.frog.proxy.user.feed.list(req.userInfo.userId)
    if res['status'] / 100 != 2:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
    #endif
    feeds = res["feeds"]
    dbg.log("Got `%d' user feeds.", len(feeds), INFO = 1)

    # Pak si nechame dat groupy
    groups = {}
    for feed in feeds:
        # Schovane skupiny ignorujeme
        if feed["groupId"] in ["system", "seznam"]:
            continue
        #endif

        # Pokud nemame skupinu - pridame ji
        if not groups.has_key(feed["groupId"]):
            groups[feed["groupId"]] = {"name": feed["groupId"], "feeds":[]}
        #endif

        groups[feed["groupId"]]["feeds"].append(feed)
    #endfor

    # Vygenereujeme xml
    dataRoot = req.config.teng.createDataRoot({})

    # Pridame fragmenty
    added = 0
    for key in groups.keys():
        group = groups[key]

        # Pridame groupu
        dbg.log("Append group `%s' to teng", (group["name"]), DBG = 4)
        groupFrag = dataRoot.addFragment("group", {"name": group["name"]})

        # A jeji feedy
        for feed in group["feeds"]:
            dbg.log("Append frag `%s' to teng", (feed["title"]), DBG = 4)
            groupFrag.addFragment("feed", feed)
            added += 1
        #endif
    #endfor

    # Pokud jsme nedali zadny fragmenty, tak chyba
    if not added:
        return lib_util.redir(req, "/export-zprav-opml?error=empty")
    #endif

    # Generujeme stranku
    res = req.config.teng.generatePage(
            templateFilename = "opml.xml",
            dictionaryFilename = req.config.template.dict,
            configFilename = req.config.template.config,
            language = req.userInfo.language,
            data = dataRoot,
            contentType = "text/xml")

    # log if error
    for error in res['errorLog']:
        dbg.log("%s:%s:%s: %s", (error['filename'], error['line'],
                                 error['column'], error['message']), ERR = 2)
    #endfor
    xml = res["output"]

    # Vygenerujeme odpoved
    name = "feeds.opml"
    length = len(xml)
    req.content_type = "application/octet-stream"
    req.headers_out.add(
                "Content-Type", "application/octet-stream; name=\"%s\"" % name)
    req.headers_out.add(
                "Content-Disposition", "attachment; filename=%s" % (name))
    req.headers_out.add("Content-Length", "%s" % length)
    req.write(xml)

    return apache.OK
#enddef

def importScreen(req):
    """
    Screen na import
    """
    return _opmlScreen(req)
#enddef

def importProcess(req):
    """
    Metoda importujici data z OPML XML souboru do databaze
    """
    # Natahneme data
    files = req.form.post.get("file", default = [])

    # zistime a obmedzime mode len na "normal", alebo "popup"        
    mode = req.form.post.getfirst("mode", str, "normal")
    if mode != 'popup':
        mode = 'normal'

    if len(files) == 0:
        lib_util.redir(req, "/export-zprav-opml?error=nofile&mode=%s" % mode)
    #endif

    # Vstupni data
    source = files[0].file

    count = 0
    try:
        dbg.log("Import started, userId `%d'.", (req.userInfo.userId),
                INFO = 1)

        # Vytvorime parser a naparsujeme data
        parser = sax.make_parser()
        handler = OpmlHandler()
        parser.setContentHandler(handler)
        parser.parse(source)

        # Mame naparsovany data - nyni je zkusime naimportovat do db
        opml = handler.opml

        # Pokud nic jsme nenasli, tak to asi neni uplne spravny xml soubor :)
        count = len(opml)
        if not count:
            return lib_util.redir(req, 
                              "/export-zprav-opml?error=import&mode=%s" % mode)
        #endif

        # Proiterujeme feedy a vkladame do db
        for feed in opml:
            # zkusime pridat, pokud tam jiz je, dostaneme 201 ale stejne 
            # dostaneme feedId
            res = req.config.frog.proxy.feed.create(feed["title"], feed["url"],
                    req.config.control.userGroupId, {"typeId": "rss"})

            # Otestujeme vysledek
            if res["status"] == 201:
                dbg.log("Feed `%s' already exist.", (feed["url"]), INFO = 2)
            #endif
            if res["status"] / 100 != 2:
                raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
            #endif

            # Ulozime feedId
            feedId = res["feedId"]

            # jeste ho musime pridat uzivateli
            res = req.config.frog.proxy.user.feed.add(req.userInfo.userId, 
                                                      {"feedId" : feedId,
                                                       "column" : 0})
            # Otestujeme vysledek
            if res["status"] == 201:
                dbg.log("User has feed `%s' allready.", (feed["url"]), 
                        INFO = 2)
            #endif
            if res["status"] / 100 != 2:
                raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
            #endif

            dbg.log("Feed `%s' add for userId `%d'.", (feed["url"], 
                                                       req.userInfo.userId), 
                    INFO = 2)
        #endfor

        dbg.log("Import finished, userId `%d'.", (req.userInfo.userId), 
                INFO = 1)

    # Saxovy chyby vratime jako spatny soubor
    except (sax.SAXException, AttributeError), exp:
        dbg.log("XML parse error(%s)", (exp), ERR = 3)
        return lib_util.redir(req, 
                              "/export-zprav-opml?error=import&mode=%s" % mode)
    #endtry

    return lib_util.redir(req, 
                          "/export-zprav-opml?saved=1&count=%d&mode=%s" % 
                          (count, mode))
#enddef

def _opmlScreen(req):
    """
    Metoda zobrazujici stranku s moznosti exportu/import OPML
    """
    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # standardni flagy na strance
    lib_util.addScreenFlags(req.form.get, dataRoot)

    # Vytahmene si informace o chybach a pridame do tengu
    error = req.form.get.getfirst("error", str, "")
    if error:
        dataRoot.addFragment("error", {"error": error})
    #endif

    # Jeste pripadny pocet importovanych zprav
    dataRoot.addVariable("count", req.form.get.getfirst("count", str, "0"))

    dataRoot.addVariable("mode", req.form.get.getfirst("mode", str, "normal"))

    # vypiseme stranku
    lib_util.generatePage(req, 'setup_opml.html', dataRoot, 
                          req.userInfo.language)

    return apache.OK
#enddef

###############################################################################
#                     Trida pro parsovani OPML
###############################################################################
#
# V OPML XML souboru muze mit uzivatel definovane feedy, je to velmi jednoduche
# XML, jehoz priklad nasleduje:
#
#<?xml version="1.0" encoding="UTF-8"?>
#<opml version="1.0" >
# <head>
#  <text></text>
# </head>
# <body>
#  <outline isOpen="true" id="462713792" text="Imported Feeds" >
# <outline htmlUrl="http://www.abclinuxu.cz/clanky" title="Abclinuxu" 
# type="rss" xmlUrl="http://www.abclinuxu.cz/auto/abc.rss" text="Abclinuxu" 
# description="Seznam clanku na www.abclinuxu.cz" />
# .
# .
# .
#  </outline>
#  <outline text="Next feeds">
# .
# .
# .
#  </outline>
# </body>
#</opml>
#
# Pro nas jsou pouze dulezite tagy `outline', vsechny ostatni jsou zbytecne. 
# Prvak head obsahuje informace jako takove o celem souboru, to nas nezajima. 
# Druhak jeste tag outline muze predstavovat skupinu feedu, ale my toto 
# nepodporujeme, takze vezmene kazdy outline a pokud bude mit typ `rss' a 
# atribut `xmlUrl' je to kandidat na import. Dle specifikace by jsme jeste 
# meli najit atribut text, ale bereme i title, ktery uprednostime.

class OpmlHandler(sax.ContentHandler):
    """
    Trida parsujici potrebna data z OPML
    """

    def __init__(self):
        sax.ContentHandler.__init__(self)
        self.opml = []
    #enddef

    def startDocument(self):
        # Nas nezajima
        pass
    #enddef

    def startElement(self, name, attributes):
        # Je to tag s informacema o feedu
        if name == "outline":
            if not attributes.has_key("type"):
                # Chyba - ingnorujeme tag
                return
            #endif

            if attributes["type"].lower() == "rss" and \
                    attributes.has_key("xmlUrl"):
                # vyhledame nazev
                if attributes.has_key("title"):
                    title = attributes["title"]
                elif attributes.has_key("text"):
                    title = attributes["text"]
                else:
                    # Chyba - ingnorujeme tag
                    return
                #endif

                # Nasli jsme kandidata na import, ulozime si ho
                self.opml.append({"url": attributes["xmlUrl"], "title": title})
            #endif
    #enddef

    def endElement(self, name):
        """
        Handler konce elementu
        """
        # Koncove tagy taky nepotrebujeme
        pass
    #enddef

    def characters(self, text):
        """
        Handler pro text
        """
        # Text nas nezajima
        pass
    #enddef
#endclass
