#!/usr/bin/env python2.5
# -*- coding: utf-8 -*-
#
# FILE          $Id$
#
# DESCRIPTION   Setup
#
# import
from mod_python import apache
from dbglog     import dbg

import fastrpc


def jsSetSelectedNote(req):
    """
    Nastavuje cislo vybrane poznamky
    """

    note = req.form.post.getfirst("note", int)

    dataRoot = req.userInfo.createDataRoot()

    try:
        if note in xrange(1, req.config.control.noteCount+1):
            req.userInfo.selectedNote = note
            req.userInfo.setAttributes(req)
            dataRoot.addFragment("result", {"status" : 200,
                                            "statusMessage" : "ok"})
        else:
            dataRoot.addFragment("result", {"status" : 401,
                                            "statusMessage" : "bad_note"})
        #endif
    except (fastrpc.Fault, fastrpc.Error), e:
        dbg.log('Ignoring FastRPC error: %s', str(e), WARN=3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    except Exception, e:
        dbg.log('Ignoring error: %s', str(e), WARN=3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    #endif


    # generuj stranku
    lib_util.generatePage(req, 'js_setSelectedNote.js', dataRoot, 
                    req.config.template.defaultLanguage,
                    contentType='text/html',
                    responseContentType='application/x-javascript; charset=utf-8',
                    encoding = "utf-8") # as we don't support ie5.0 anymore,
                                        # we're using utf-8 everywhere

    return apache.OK
#enddef


def jsGetSelectedNote(req):
    """
    Vraci cislo vybrane poznamky
    """

    dataRoot = req.userInfo.createDataRoot()

    dataRoot.addFragment("result", {
        "status"        : 200,
        "statusMessage" : "ok" })
    dataRoot.addFragment("noteAttributes", {
        "note"          : req.userInfo.selectedNote})

    # generuj stranku
    lib_util.generatePage(req, 'js_getSelectedNote.js', dataRoot, 
                    req.config.template.defaultLanguage,
                    contentType='text/html',
                    responseContentType='application/x-javascript; charset=utf-8',
                    encoding = "utf-8") # as we don't support ie5.0 anymore,
                                        # we're using utf-8 everywhere

    return apache.OK
#enddef


def jsGetNote(req):
    """
    Vraci obsah poznamky
    """

    note = req.form.post.getfirst("note", int)

    dataRoot = req.userInfo.createDataRoot()

    try:
        content, hidden = req.userInfo.getNote(note)
        dataRoot.addFragment("result", {
            "status"        : 200,
            "statusMessage" : "ok"})
        dataRoot.addFragment("noteAttributes", {
            "content"       : content,
            "parsedContent" : lib_util.parseNote(req, content),
            "hidden"        : int(hidden.value)})
    except (fastrpc.Fault, fastrpc.Error), e:
        dbg.log('Ignoring FastRPC error: %s', str(e), WARN=3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    except Exception, e:
        dbg.log('Ignoring error: %s', str(e), WARN=3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})

    # generuj stranku
    lib_util.generatePage(req, 'js_getNote.js', dataRoot, 
                    req.config.template.defaultLanguage,
                    contentType='text/html',
                    responseContentType='application/x-javascript; charset=utf-8',
                    encoding = "utf-8") # as we don't support ie5.0 anymore,
                                        # we're using utf-8 everywhere

    return apache.OK
#enddef


def jsSetNote(req):
    """
    Vraci cislo vybrane poznamky
    """

    note = req.form.post.getfirst("note", int)
    content = req.form.post.getfirst("content", str)
    hidden = req.form.post.getfirst("hidden", int)
    if hidden not in (0, 1):
        hidden = 1
    #endif

    dataRoot = req.userInfo.createDataRoot()
    try:
        try:
            content = content.decode("utf-8")
            content = content.replace(u"\u2028", "\n") \
                             .replace(u"\u2029", "\n")
            content = content.encode("utf-8")
        except UnicodeError:
            pass
        #endtry

        req.userInfo.setNote(note, content, hidden)
        dataRoot.addFragment("result", {
            "status"        : 200,
            "statusMessage" : "ok"})
        dataRoot.addFragment("noteAttributes", {
            "content"       : content,
            "parsedContent" : lib_util.parseNote(req, content),
            "hidden"        : hidden})
    except (fastrpc.Fault, fastrpc.Error), e:
        dbg.log('Ignoring FastRPC error: %s', str(e), WARN=3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    except Exception, e:
        dbg.log('Ignoring error: %s', str(e), WARN=3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_setNote.js', dataRoot, 
                    req.config.template.defaultLanguage,
                    contentType='text/html',
                    responseContentType='application/x-javascript; charset=utf-8',
                    encoding = "utf-8") # as we don't support ie5.0 anymore,
                                        # we're using utf-8 everywhere

    return apache.OK
#enddef


def jsRemoveNote(req):
    """
    Vraci cislo vybrane poznamky
    """

    note = req.form.post.getfirst("note", int)

    dataRoot = req.userInfo.createDataRoot()

    try:
        req.userInfo.removeNote(note)
        dataRoot.addFragment("result", {
            "status"        : 200,
            "statusMessage" : "ok"})
    except (fastrpc.Fault, fastrpc.Error), e:
        dbg.log('Ignoring FastRPC error: %s', str(e), WARN=3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    except Exception, e:
        dbg.log('Ignoring error: %s', str(e), WARN=3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})

    # generuj stranku
    lib_util.generatePage(req, 'js_removeNote.js', dataRoot, 
                    req.config.template.defaultLanguage,
                    contentType='text/html',
                    responseContentType='application/x-javascript; charset=utf-8',
                    encoding = "utf-8") # as we don't support ie5.0 anymore,
                                        # we're using utf-8 everywhere

    return apache.OK
#enddef


def jsSetNoteVisibility(req):
    """
    Nastavuje poznamce viditelnost
    """

    note = req.form.post.getfirst("note", int)
    hidden = req.form.post.getfirst("hidden", int)
    if hidden not in [0, 1]:
        hidden = 1
    #endif

    dataRoot = req.userInfo.createDataRoot()

    try:
        req.userInfo.setNoteVisibility(note, hidden)
        dataRoot.addFragment("result", {
            "status"        : 200,
            "statusMessage" : "ok"})
    except (fastrpc.Fault, fastrpc.Error), e:
        dbg.log('Ignoring FastRPC error: %s', str(e), WARN=3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    except Exception, e:
        dbg.log('Ignoring error: %s', str(e), WARN=3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})

    # generuj stranku
    lib_util.generatePage(req, 'js_setNoteVisibility.js', dataRoot, 
                    req.config.template.defaultLanguage,
                    contentType='text/html',
                    responseContentType='application/x-javascript; charset=utf-8',
                    encoding = "utf-8") # as we don't support ie5.0 anymore,
                                        # we're using utf-8 everywhere

    return apache.OK
#enddef
