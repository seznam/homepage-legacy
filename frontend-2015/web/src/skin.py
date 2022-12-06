#!/usr/bin/env python2.5
#
# $Id$
"""
DESCRIPTION   logika pro skiny
"""

from mod_python import apache
from dbglog import dbg
import fastrpc


###############################################################################
# JavaScript calls

def jsSkinSetId(req):
    """
    Nastavi uzivateli vybrany skin z nabidky
        id - post, id vybraneho skinu
    """

    skinId = req.form.post.getfirst("id", int, 0)

    dataRoot = req.userInfo.createDataRoot()

    if not skinId:
        dataRoot.addFragment("result", {"status": 400,
                                        "statusMessage": "Bad Request"})

    else:
        try:
            if skinId != req.userInfo.skinId:
                #TODO remove custom image??

                req.userInfo.skinId = skinId
                req.userInfo.setAttributes(req)  # propagace do profilu
            #endif

            dataRoot.addFragment("result", {"status": 200,
                                            "statusMessage": "OK"})

        except Exception, e:
            dbg.log('SKIN Ignoring error: %s', str(e), WARN=3)
            dataRoot.addFragment("result", {"status": 500,
                                 "statusMessage": "Internal Server Error"})

    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType='text/html',
                          responseContentType='application/x-javascript; charset=utf-8',
                          encoding="utf-8")

    return apache.OK


def jsSkinSetSynched(req):
    """
    Nastaveni synchronizovaneho skinu
    """

    dataRoot = req.userInfo.createDataRoot()

    if req.userInfo.loggedUser:
        anonymSkinCustom = req.userInfo.getAnonymOption(req, "skinCustom")
        anonymSkinCustomOpacity = bool(req.userInfo.getAnonymOption(req, "skinCustomOpacity"))

        if anonymSkinCustom:
            req.userInfo.skinCustom = anonymSkinCustom
            req.userInfo.skinId = 0
            req.userInfo.skinCustomOpacity = anonymSkinCustomOpacity
            req.userInfo.setAttributes(req)

            dataRoot.addFragment("result", {"status": 200,
                                            "statusMessage": "OK"})

        else:
            dataRoot.addFragment("result", {"status": 400,
                                            "statusMessage": "Bad Request"})

    else:
        dataRoot.addFragment("result", {"status": 405,
                                        "statusMessage": "Method Not Allowed"})

    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType='text/html',
                          responseContentType='application/x-javascript; charset=utf-8',
                          encoding="utf-8")

    return apache.OK


def jsSkinSetUploaded(req):
    """
    Nastavni uploadovaneho skinu
    """

    dataRoot = req.userInfo.createDataRoot()
    path = req.form.post.getfirst("path", str, default="")
    try:
        opacity = bool(req.form.post.getfirst("opacity", int, 0))
    except:
        opacity = False
    #endtry

    dbg.log("SKIN CUSTOM post: path=%s opacity=%d", (path, opacity), DBG=1)

    newSkinCustom = lib_util.secureUserImageLinkDecode(path)
    if not newSkinCustom:
        dbg.log("SKIN CUSTOM invalid path %s", path, DBG=3)
        dataRoot.addFragment("result", {
            "status"        : 400,
            "statusMessage" : "Bad Request"
        })
    else:
        userInfo = req.userInfo
        oldSkinCustom = userInfo.skinCustom
        userInfo.skinCustom = newSkinCustom
        userInfo.skinId = 0
        userInfo.skinCustomOpacity = opacity
        userInfo.setAttributes(req)

        dbg.log("SKIN CUSTOM set: skinCustom=%s opacity=%d",
                (newSkinCustom, opacity), DBG = 1)

        try:
            res = req.config.repository.proxy.storagecontrol.noticeObjectsChange({
                "templateName"   : "homepage-photo",
                "objectName"     : "picture",
                "injectObjectId" : newSkinCustom,
                "rejectObjectId" : oldSkinCustom,
            })
            if res["status"] != 200:
                dbg.log("SKIN CUSTOM: Problem while trying " \
                    "to notice change on repository: status=%(status)s, " \
                    "statusMessage=%(statusMessage)s", res, WARN = 2)
            #endif
        except fastrpc.Error, err:
            dbg.log("SKIN CUSTOM: ignoring FastRPC error: %s", err, WARN = 2)
        #endtry

        dataRoot.addFragment("result", {
            "status"        : 200,
            "statusMessage" : "OK"
        })

        # Client should hit a new image on persistent storage.
        addSkinCustom(req, dataRoot)
    #endif

    lib_util.generatePage(req,
        'js_confirm.js',
        dataRoot,
        req.config.template.defaultLanguage,
        responseContentType = 'application/x-javascript; charset=utf-8'
    )

    return apache.OK


def jsSkinSetCustom(req):
    """
    Nastavi vlastni obrazek
    """
    dataRoot = req.userInfo.createDataRoot()

    if not req.userInfo.skinCustom:
        # nothing to set
        dbg.log("SKINS CUSTOM no image spec", DBG = 3)
        dataRoot.addFragment("result", {"status": 400, "statusMessage": 
                                        "Bad Request"})
        #endif

    elif req.userInfo.skinId:
        # set skinId to 0, save
        req.userInfo.skinId = 0
        req.userInfo.setAttributes(req)
        dbg.log("SKIN CUSTOM setting skinCustom %s", req.userInfo.skinCustom, 
                DBG = 1)
        dataRoot.addFragment("result", {"status": 200, "statusMessage" : "OK"})

    else:
        # no skinId, skinCustom set -> everything seems to be all right
        dataRoot.addFragment("result", {"status": 200, "statusMessage" : "OK"})

    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
            req.config.template.defaultLanguage,
            contentType = 'text/html',
            responseContentType = 'application/x-javascript; charset=utf-8',
            encoding = "utf-8")
    return apache.OK


###############################################################################
# fragment functions

def addSkinsContent(req, dataRoot):
    """
    Pridani do dataRoot aktualni nabidku skinu
       skins[0], skins[1]...
    """

    try:
        skinList = req.config.mynosql.skinListActive()
        for skin in skinList:
            skin['selected'] = 0 #TODO remove: teng fix
            dataRoot.addFragment('skins', skin)
        #endfor
    except Exception, e:
        dbg.log("SKIN: No active skin list today... because: %s", str(e), 
                DBG = 1)
    #endtry
#enddef


def addSkinSelected(req, dataRoot):
    """
    Prida do dataRoot fragment skinSelected = uzivatelem vybrany skin
    Vyber probiha v poradi:
        if not skinId -> skinCustom
    """
    dbg.log("SKIN SkinCustom: %s synched: %d SkinId: %d synched: %d",
            (req.userInfo.skinCustom, req.userInfo.skinCustomSynched, 
             req.userInfo.skinId, req.userInfo.skinIdSynched), INFO = 1)

    # skinId is preferred - pokud je nastavene, nenastavuj skinCustom
    if len(req.userInfo.skinCustom) and not req.userInfo.skinId:
        req.userInfo.skinSelected = {
                "image" : lib_util.secureUserImageLink(req, 
                                                   req.userInfo.skinCustom),
                "imageThumb" : lib_util.secureUserImageLink(req, 
                                                   req.userInfo.skinCustom),
                "synched": req.userInfo.skinCustomSynched
            }
        dataRoot.addFragment("skinSelected", req.userInfo.skinSelected)
        return

    elif req.userInfo.skinId:
        dbg.log("SKIN: user skinId %d", req.userInfo.skinId, INFO = 1)
        try:
            skin = req.config.mynosql.skinGetAttributes(req.userInfo.skinId)
            if skin:
                req.userInfo.skinSelected = skin
                if skin["id"] == req.userInfo.skinId:
                    req.userInfo.skinSelected['synched'] = \
                            req.userInfo.skinIdSynched
                else:
                    dbg.log("SKIN Incorrect skinId %s", req.userInfo.skinId, 
                            DBG = 1)
                    req.userInfo.skinSelected['synched'] = True

                if req.userInfo.skinSelected['archived']:
                    dataRoot.addFragment("skinMissing", 
                                         req.userInfo.skinSelected)
                #endfor
            else:
                dbg.log("SKIN selected skin does not exist %d", 
                        req.userInfo.skinId, WARN = 3)
        except Exception, e:
            # no skins for today, bro
            dbg.log("SKIN: failed to select skin %s", str(e), DBG = 3)

        #endtry
    if req.userInfo.skinSelected:
        dataRoot.addFragment("skinSelected", req.userInfo.skinSelected)
        dbg.log("SKIN: skin selected %s", str(req.userInfo.skinSelected), 
                INFO = 1)
    else:
        dbg.log("SKIN: no skin selected", INFO = 1)
#enddef


def addSkinCustom(req, dataRoot):
    """
    Prida schazejici skin nastaveny uzivatelem
    Fragment SkinMissing - archivovany skin, ktery neni v nabidce aktivnich 
    skinu
    """
    # je vubec co pridavat?
    if not req.userInfo.skinCustom:
        return

    customData = {
            "image" : lib_util.secureUserImageLink(req, 
                                                   req.userInfo.skinCustom),
            "imageThumb" : lib_util.secureUserImageLink(req, 
                                                    req.userInfo.skinCustom),
            "synched": req.userInfo.skinCustomSynched
        }
    dataRoot.addFragment("skinCustom", customData)

    return
#enddef

