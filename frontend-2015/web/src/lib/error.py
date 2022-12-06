#!/usr/bin/env python2.5
#
# FILE          $Id$
#
# DESCRIPTION   Exceptions

import web_publisher
import fastrpc
import sys
import traceback

from mod_python import apache
from dbglog     import dbg


def getExceptionString(exc = None) :
    """
    Sestav string s textem vyjimky (traceback)
    """
    # latest exception info
    if not exc:
        exc = sys.exc_info()
    #endif
    exc_tb = traceback.extract_tb(exc[2])

    # render traceback
    msg = ""
    for tb in exc_tb:
        msg = msg + "\n  File \"%s\", line %d, in %s\n   %s" % tb
        del tb

    msg = msg + "\n  %s: %s" % (exc[0], exc[1])

    del exc
    del exc_tb

    # return string
    return msg
#enddef


def _getException(exc = None):
    """
    Zpracuje informace o chybe
    """
    if not exc:
        exc = sys.exc_info()
    #endif

    output = (exc[0], exc[1])
    del exc
    return output
#enddef


class Error(Exception):
    """
    Zakladni trida pro vsechny chyby
    """

    def __str__(self):
        return repr(self)
    #enddef

#endclass


class MessageError(Exception):

    def __init__(self, string):
        super(MessageError, self).__init__(string)
        self.str = string
    #enddef

    def __str__(self):
        return self.str
    #enddef
#endclass


class ResponseIsTooBig(MessageError):

    def __init__(self, string):
        super(ResponseIsTooBig, self).__init__(string)
        self.str = string
    #enddef

    def __str__(self):
        return self.str
    #enddef
#endclass


class ConfigError(Error):
    """
    Indikuje chybu v konfiguraci aplikace
    """

    def __init__(self, identifier):
        Error.__init__(self)
        self.identifier = identifier
    #enddef

    def __repr__(self):
        return("<ConfigError for parameter '%s' (wrong or undefined)>" % (self.identifier))
    #enddef

#endclass


class UnexpectedResponse(Error):
    """
    Vyjimka indikuje neocekavanou odpoved serveru
    """

    def __init__(self, proxy, result):
        Error.__init__(self)
        dbg.log("Unexpected response: result: %s", result, ERR = 4)
        self.proxy = proxy
        self.errorMessage = result.get('statusMessage', '???')
        self.errorStatus = int(result.get('status', '0'))
    #enddef

    def handleRequest(self, req):
        """
        Zaloguje traceback a vygeneruje chybovou stranku
        """

        trace = getExceptionString()
        dbg.log("%s", trace, ERR = 3)
        dbg.log("Unexpected response: <%d, %s>", (self.errorStatus, self.errorMessage), WARN = 4)

        serverName = self.proxy.__dict__['host']
        methodName = self.proxy.__dict__['last_call']
        req.config.edbg.log("UnexpectedResponse: <%d, %s>. [method %s() @ %s]> ",
                        (self.errorStatus, self.errorMessage, methodName, serverName) , ERR = 4)


        # add all "more info" data to teng
        dataRoot = req.config.teng.createDataRoot({})

        dataRoot.addFragment('exception', {
                    'host'    : serverName,
                    'method'  : methodName,
                    'type'    : 'UnexpectedResponse',
                    'status'  : self.errorStatus,
                    'message' : self.errorMessage})

        # generate page
        lib_util = web_publisher.importModule(req, 'lib.util')
        lib_util.generatePage(req, 'index_sorry.html', dataRoot, req.config.template.defaultLanguage)

        # return ok, even if Internal error
        return apache.OK
    #enddef
#endclass


def frpcError(req, exc):
    """
    Osetri FRPC chyby
    """

    # utility budeme potrebovat
    lib_util = web_publisher.importModule(req, 'lib.util')

    method = exc[1].__dict__['method'].__dict__
    serverName = method['server_proxy'].__dict__['host']
    dot = serverName.find('.')
    if dot >= 0: serverName = serverName[:dot]

    methodName = method['method_name']
    excType = {fastrpc.ProtocolError: 'fastrpc.ProtocolError',
               fastrpc.Fault:         'fastrpc.Fault' }[exc[0]]


    # zaloguje traceback
    e = getExceptionString(exc)
    dbg.log("%s", e, ERR = 2)
    req.config.edbg.log("%s", str(exc[1]), ERR = 2)

    # vytvori root fragment
    dataRoot = req.config.teng.createDataRoot({})

    # prida informace o vyjimce
    dataRoot.addFragment('exception', {
            'host'   : serverName,
            'method' : methodName,
            'type'   : excType,
            'status' : 0,
            'message': ""})

    # pokud je Frpc chyba na screene, zobrazime sorry homepage
    pageId = req.uri.replace('/', '')
    if not pageId or pageId.endswith('Screen') or not pageId.endswith("Process"):
        dataRoot.addFragment('backendError', {})
        lib_util.generatePage(req, 'index_sorry.html', dataRoot, req.config.template.defaultLanguage)
        return apache.OK
    #endif

    pageId = pageId.replace('Process', 'Screen')
    return lib_util.redir(req, '/%s?backendError=1' % pageId)
#enddef


def unknownError(req, exc):
    """
    Zpracovatel nezname vyjimky
    """

    # ziska traceback
    e = getExceptionString(exc)
    req.config.edbg.log("%s", e, ERR = 3)

    # vytvori root fragment
    dataRoot = req.config.teng.createDataRoot({})

    # prida informace o vyjimce
    dataRoot.addFragment('exception', {
            'host'   : "UNKNOWN",
            'method' : "UNKNOWN",
            'type'   : str(exc[0]),
            'status' : "-1",
            'message': str(exc[1])})

    # vygeneruje stranku
    lib_util = web_publisher.importModule(req, 'lib.util')
    lib_util.generatePage(req, 'index_sorry.html', dataRoot, req.config.template.defaultLanguage)

    return apache.OK
#enddef

# pylint: disable-msg=W0613
def IOErrorExt(req, exception):
    """
    Zpracuje (v tichosti) IO error
    """

    dbg.log("IOError, pageId=%s", req.uri.lower()[1:], INFO = 2)
    return apache.OK
#endif
# pylint: enable-msg=W0613



