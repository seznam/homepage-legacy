#!/usr/bin/env python2.5
#
# FILE          $Id$
#
# DESCRIPTION   Nadler na 404

from dbglog     import dbg
import re
import urllib


# =================================================
# Tato tabulka obsahuje prepuis starych url na nova
# =================================================
redirectTable = {
    '/s180':  'http://katalog.seznam.cz/Auto_moto/Auto_moto_vyrobci/',
    '/s130':  'http://katalog.seznam.cz/Auto_moto/Auto_moto_sluzby/Autoservisy/',
    '/s587':  'http://katalog.seznam.cz/Banky_a_financni_sluzby/Uverove_sluzby/',
    '/s495':  'http://katalog.seznam.cz/Banky_a_financni_sluzby/',
    '/s500':  'http://katalog.seznam.cz/Banky_a_financni_sluzby/Bankovni_a_sporitelni_sluzby/',
    '/s87':   'http://katalog.seznam.cz/Banky_a_financni_sluzby/Uverove_sluzby/',
    '/s194':  'http://katalog.seznam.cz/Cestovni_sluzby_a_pohostinstvi/',
    '/s197':  'http://katalog.seznam.cz/Cestovni_sluzby_a_pohostinstvi/Cestovni_kancelare/',
    '/s331':  'http://katalog.seznam.cz/Cestovni_sluzby_a_pohostinstvi/Ubytovaci_sluzby/',
    '/s1650': 'http://katalog.seznam.cz/Dum__byt_a_zahrada/',
    '/s1653': 'http://katalog.seznam.cz/Remesla_a_sluzby/Reality/',
    '/s1661': 'http://katalog.seznam.cz/Dum__byt_a_zahrada/Prodejci_bytoveho_nabytku/',
    '/s1671': 'http://katalog.seznam.cz/Dum__byt_a_zahrada/Prodejci_stavebnin/',
    '/s371':  'http://katalog.seznam.cz/Elektro__mobily_a_pocitace/',
    '/s404':  'http://katalog.seznam.cz/Elektro__mobily_a_pocitace/Prodejci_komunikacni_techniky/Prodejci_mobilnich_telefonu/',
    '/s429':  'http://katalog.seznam.cz/Elektro__mobily_a_pocitace/Prodejci_vypocetni_techniky/',
    '/s372':  'http://katalog.seznam.cz/Elektro__mobily_a_pocitace/Bazary_elektro/',
    '/s592':  'http://katalog.seznam.cz/Instituce_a_urady/',
    '/s675':  'http://katalog.seznam.cz/Instituce_a_urady/Statni_organizace_a_urady/',
    '/s669':  'http://katalog.seznam.cz/Instituce_a_urady/Sdruzeni_a_spolky/',
    '/s741':  'http://katalog.seznam.cz/Instituce_a_urady/Vzdelavaci_instituce/',
    '/s1128': 'http://katalog.seznam.cz/Nakupovani_na_internetu/',
    '/s1179': 'http://katalog.seznam.cz/Nakupovani_na_internetu/Prodejci_knih/',
    '/s1250': 'http://katalog.seznam.cz/Nakupovani_na_internetu/Prodejci_spotrebni_elektroniky_a_elektrotechniky/',
    '/s1305': 'http://katalog.seznam.cz/Nakupovani_na_internetu/Prodejci_zajezdu_a_letenek/',
    '/s845':  'http://katalog.seznam.cz/Obchody_a_obchudky/',
    '/s846':  'http://katalog.seznam.cz/Obchody_a_obchudky/Bazary_a_zastavarny/',
    '/s987':  'http://katalog.seznam.cz/Obchody_a_obchudky/Prodejci_potravin_/',
    '/s1061': 'http://katalog.seznam.cz/Obchody_a_obchudky/Prodejci_textilu__odevu_a_obuvi_/',
    '/s2230': 'http://katalog.seznam.cz/Prvni_pomoc_a_zdravotnictvi/',
    '/s2278': 'http://katalog.seznam.cz/Prvni_pomoc_a_zdravotnictvi/Prodejci_zdravotnickeho_zbozi_a_leciv/Prodejci_leku_a_farmak/Lekarny/',
    '/s2263': 'http://katalog.seznam.cz/Prvni_pomoc_a_zdravotnictvi/Zdravotnicke_sluzby/Zdravotnicka_zarizeni/Nemocnice/',
    '/s2245': 'http://katalog.seznam.cz/Prvni_pomoc_a_zdravotnictvi/Zdravotnicke_sluzby/Lekarske_ordinace/',
    '/s1314': 'http://katalog.seznam.cz/Remesla_a_sluzby/',
    '/s1384': 'http://katalog.seznam.cz/Remesla_a_sluzby/Remesla/',
    '/s1431': 'http://katalog.seznam.cz/Remesla_a_sluzby/Pujcovny/',
    '/s1535': 'http://katalog.seznam.cz/Remesla_a_sluzby/Vyukove_sluzby/',
    '/s1540': 'http://katalog.seznam.cz/Vse_pro_firmy/',
    '/s1626': 'http://katalog.seznam.cz/Vse_pro_firmy/Prodejci_vybaveni_a_techniky_pro_firmy/',
    '/s1595': 'http://katalog.seznam.cz/Vse_pro_firmy/Vyrobci_vybaveni_a_techniky_pro_firmy/',
    '/s1744': 'http://katalog.seznam.cz/Velkoobchod_a_vyroba/',
    '/s2114': 'http://katalog.seznam.cz/Velkoobchod_a_vyroba/Vyrobci_stavebnin/',
    '/s1745': 'http://katalog.seznam.cz/Velkoobchod_a_vyroba/Velkoobchodni_prodejci/',
    '/s6577': 'http://katalog.seznam.cz/Cestovani/',
    '/s6662': 'http://katalog.seznam.cz/Cestovani/Jizdni_rady__zeleznice_a_autobusy/Jizdni_rady/',
    '/s6691': 'http://katalog.seznam.cz/Cestovani/Turisticke_cile/',
    '/s7122': 'http://katalog.seznam.cz/Konicky_a_volny_cas/',
    '/s7143': 'http://katalog.seznam.cz/Konicky_a_volny_cas/Kulturni_vyziti/',
    '/s7131': 'http://katalog.seznam.cz/Konicky_a_volny_cas/Hobby/Fotografie/',
    '/s6001': 'http://katalog.seznam.cz/Hudba__Film_a_MP3/',
    '/s6002': 'http://katalog.seznam.cz/Hudba__Film_a_MP3/Hudba/',
    '/s6144': 'http://katalog.seznam.cz/Hudba__Film_a_MP3/MP3/',
    '/s6124': 'http://katalog.seznam.cz/Hudba__Film_a_MP3/Film/',
    '/s7013': 'http://katalog.seznam.cz/Lide__seznamky__chat/',
    '/s7014': 'http://katalog.seznam.cz/Lide__seznamky__chat/Chatovani/',
    '/s7023': 'http://katalog.seznam.cz/Lide__seznamky__chat/Seznamky/',
    '/s7185': 'http://katalog.seznam.cz/Prakticke_informace_a_inzerce/',
    '/s7192': 'http://katalog.seznam.cz/Prakticke_informace_a_inzerce/Inzerce/',
    '/s7270': 'http://katalog.seznam.cz/Prakticke_informace_a_inzerce/Svatky__vyroci__jmeniny/',
    '/s5147': 'http://katalog.seznam.cz/Prakticke_informace_a_inzerce/Televizni_programy/',
    '/s6151': 'http://katalog.seznam.cz/Sport/',
    '/s6265': 'http://katalog.seznam.cz/Sport/Fotbal/',
    '/s6519': 'http://katalog.seznam.cz/Sport/Hokej/',
    '/s6173': 'http://katalog.seznam.cz/Sport/Basketbal/',
    '/s6704': 'http://katalog.seznam.cz/Veda_a_technika/',
    '/s6741': 'http://katalog.seznam.cz/Veda_a_technika/Fyzika/',
    '/s6748': 'http://katalog.seznam.cz/Veda_a_technika/Historie/',
    '/s6778': 'http://katalog.seznam.cz/Veda_a_technika/Technika/',
    '/s7461': 'http://katalog.seznam.cz/Zabava_a_hry/',
    '/s7462': 'http://katalog.seznam.cz/Erotika/',
    '/s7504': 'http://katalog.seznam.cz/Zabava_a_hry/Hry/',
    '/s7617': 'http://katalog.seznam.cz/Zabava_a_hry/Humor/',
    '/s5003': 'http://katalog.seznam.cz/Zabava_a_hry/Radio/',
    '/s7358': 'http://katalog.seznam.cz/Zpravodajstvi/',
    '/s7363': 'http://katalog.seznam.cz/Zpravodajstvi/Casopisy__e_ziny/',
    '/s7449': 'http://katalog.seznam.cz/Zpravodajstvi/Deniky/',
    '/s7453': 'http://katalog.seznam.cz/Zpravodajstvi/Pocasi/',
    '/s6806': 'http://katalog.seznam.cz/Veda_a_technika/Pocitace/',

    # RUZNE
    '/blg'  : 'http://blog.lide.cz/',
    '/odk'  : 'http://napoveda.seznam.cz/page.php?page_id=157',
    '/fir'  : 'http://napoveda.seznam.cz/page.php?page_id=166',
    '/vol'  : 'http://sprace.seznam.cz/index.fcgi?a=list&firm_ID=17651',
    '/pln'  : 'http://www.mapy.cz/route.py',
    '/dov'  : 'http://www.sdovolena.cz/',
    '/let'  : 'http://www.sletenky.cz/',
    '/nas'  : 'http://www.seznam.cz/nastaveni-zprav',
    '/lpo'  : 'http://s.lide.cz/profile.fcgi?auth=',
    '/harrypotter' : 'http://www.mkmarcom.cz',

    # HOROSKOPY
    '/zn1'  : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=1',
    '/zn2'  : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=2',
    '/zn3'  : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=3',
    '/zn4'  : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=4',
    '/zn5'  : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=5',
    '/zn6'  : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=6',
    '/zn7'  : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=7',
    '/zn8'  : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=8',
    '/zn9'  : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=9',
    '/zn10' : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=10',
    '/zn11' : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=11',
    '/zn12' : 'http://www.horoskopy.cz/index.fcgi?a=sign&sign_ID=12',

    # STARE REDIREKTY NA SEKCE
    '/eml'  : 'http://email.seznam.cz/',
    '/erg'  : 'http://registrace.seznam.cz/register.py/stageZeroScreen?service=email',
    '/slv'  : 'http://slovnik.seznam.cz',
    '/spr'  : 'http://www.sport.cz/',
    '/onas' : 'http://firma.seznam.cz',
    '/ban'  : 'http://banka.seznam.cz/',
    '/net4' : 'http://www.net4net.cz',
    '/shp'  : 'http://napoveda.seznam.cz/page.php?page_id=174',
    '/sez'  : 'http://www.lide.cz/date.fcgi',

    # NAPOVEDA
    '/faq' : 'http://napoveda.seznam.cz/',
    '/faq_hledani.html': 'http://napoveda.seznam.cz/page.php?page_id=170',
    '/D'   : 'http://katalog.seznam.cz/d/',
    '/rek' : 'http://reklama.seznam.cz/',
    '/pok' : 'http://katalog.seznam.cz/pokrocile.html',
    '/szn-email' : 'http://email.seznam.cz/',
    '/szn-sms'   : 'http://www.smobil.cz/',
    '/szn-mapy'  : 'http://www.mapy.cz/',
    '/szn-slovnik' : 'http://slovnik.seznam.cz/',
    '/szn-seznam'  : '/',
    '/pod' : 'http://pocasi.seznam.cz/',
    '/hk'  : 'http://www.horoskopy.cz/',
    '/map' : 'http://www.mapy.cz/',
    '/sbi' : 'http://www.bezpecnyinternet.cz/',
    '/sia' : 'http://akcelerator.seznam.cz/',

    # TO UZ FAKT NETUSIM
    '/.partner' : 'http://partner.seznam.cz/partner/',
    '/.img/srdce.gif' : 'http://img.seznam.cz/.img/srdce.gif',
    '/.img/kolo.gif' : 'http://img.seznam.cz/.img/kolo.gif',
    '/.img/msie.gif' : 'http://img.seznam.cz/ie.gif',

    '/gds' : 'http://zbozi.seznam.cz/',
    '/hokej' : 'http://muj.seznam.cz/?akce=hokej',
    '/Spolecnost/Kultura' : 'http://www.seznam.cz/Umeni/Kultura',
    '/pohrebni_sluzby' : 'http://www.seznam.cz/Sluzby/Domaci_spolecenske_sluzby/Krematoria_a_pohrebni_suzby/',
    '/syry' : 'http://www.seznam.cz/Prumysl/Potravinarsky_a_tabakovy_prumysl/Mlecne_vyrobky',
    '/informace.html' : 'http://firma.seznam.cz',
    '/Auto_moto/' : 'http://www.seznam.cz/Auto-moto/',
    '/Auto_moto/Auto_moto_prodejci/' : 'http://www.seznam.cz/Auto-moto/Auto-moto-prodejci/',
    '/Auto_moto/Auto_moto_prodejci/Autobazary/' : 'http://www.seznam.cz/Auto-moto/Auto-moto-prodejci/Autobazary/',
    '/Auto_moto/Auto_moto_prodejci/Autobazary/Osobni_automobily/' : 'http://www.seznam.cz/Auto-moto/Auto-moto-prodejci/Autobazary/Osobni-automobily/',
    '/Banky_a_financni_sluzby/' : 'http://www.seznam.cz/Banky-a-financni-sluzby/',
    '/Cestovani/Jizdni_rady_zeleznice_a_autobusy/Jizdni_rady/' : 'http://www.seznam.cz/Cestovani/Jizdni-rady-zeleznice-a-autobusy/Jizdni-rady/',
    '/Cestovni_sluzby_a_pohostinstvi/' : 'http://www.seznam.cz/Cestovni-sluzby-a-pohostinstvi/',
    '/Cestovni_sluzby_a_pohostinstvi/Cestovni_kancelare/' : 'http://www.seznam.cz/Cestovni-sluzby-a-pohostinstvi/Cestovni-kancelare/',
    '/Cestovni_sluzby_a_pohostinstvi/Restauracni_a_pohostinske_sluzby/' :
                'http://www.seznam.cz/Cestovni-sluzby-a-pohostinstvi/Restauracni-a-pohostinske-sluzby/',
    '/Cestovni_sluzby_a_pohostinstvi/Ubytovaci_sluzby/' : 'http://www.seznam.cz/Cestovni-sluzby-a-pohostinstvi/Ubytovaci-sluzby/',
    '/Dum_byt_a_zahrada/' : 'http://www.seznam.cz/Dum-byt-a-zahrada/',
    '/Dum_byt_a_zahrada/Prodejci_bytoveho_nabytku/' : 'http://www.seznam.cz/Dum-byt-a-zahrada/Prodejci-bytoveho-nabytku/',
    '/Elektro_mobily_a_pocitace/' : 'http://www.seznam.cz/Elektro-mobily-a-pocitace/',
    '/Elektro_mobily_a_pocitace/Prodejci_komunikacni_techniky/Prodejci_mobilnich_telefonu/' :
                'http://www.seznam.cz/Elektro-mobily-a-pocitace/Prodejci-komunikacni-techniky/Prodejci-mobilnich-telefonu/',
    '/Elektro_mobily_a_pocitace/Prodejci_vypocetni_techniky/' : 'http://www.seznam.cz/Elektro-mobily-a-pocitace/Prodejci-vypocetni-techniky/',
    '/Erotika/Eroticke_casopisy_a_e_ziny/' : 'http://www.seznam.cz/Erotika/Eroticke-casopisy-a-e-ziny/',
    '/Erotika/Eroticke_povidky_a_texty/' : 'http://www.seznam.cz/Erotika/Eroticke-povidky-a-texty/',
    '/Erotika/Hardcore_obrazky_a_video/' : 'http://www.seznam.cz/Erotika/Hardcore-obrazky-a-video/',
    '/Erotika/Obrazky_a_video/' : 'http://www.seznam.cz/Erotika/Obrazky-a-video/',
    '/Erotika/Obrazky_a_video/Celebrity/' : 'http://www.seznam.cz/Erotika/Obrazky-a-video/Celebrity/',
    '/Hudba_Film_a_MP3/' : 'http://www.seznam.cz/Hudba-Film-a-MP3/',
    '/Hudba_Film_a_MP3/Hudba/' : 'http://www.seznam.cz/Hudba-Film-a-MP3/Hudba/',
    '/Instituce_a_urady/' : 'http://www.seznam.cz/Instituce-a-urady/',
    '/Instituce_a_urady/Samosprava/Mestske_urady_a_magistraty/' : 'http://www.seznam.cz/Instituce-a-urady/Samosprava/Mestske-urady-a-magistraty/',
    '/Instituce_a_urady/Socialni_a_pracovni_organizace/Urady_prace/' : 'http://www.seznam.cz/Instituce-a-urady/Socialni-a-pracovni-organizace/Urady-prace/',
    '/Instituce_a_urady/Statni_organizace_a_urady/' : 'http://www.seznam.cz/Instituce-a-urady/Statni-organizace-a-urady/',
    '/Instituce_a_urady/Vzdelavaci_instituce/' : 'http://www.seznam.cz/Instituce-a-urady/Vzdelavaci-instituce/',
    '/Konicky_a_volny_cas/' : 'http://www.seznam.cz/Konicky-a-volny-cas/',
    '/Lide_seznamky_chat/' : 'http://www.seznam.cz/Lide-seznamky-chat/',
    '/Nakupovani_na_internetu/' : 'http://www.seznam.cz/Nakupovani-na-internetu/',
    '/Obchody_a_obchudky/' : 'http://www.seznam.cz/Obchody-a-obchudky/',
    '/Prakticke_informace_a_inzerce/' : 'http://www.seznam.cz/Prakticke-informace-a-inzerce/',
    '/Prakticke_informace_a_inzerce/Inzertni_servery_a_online_bazary/Online_vyhledavace_prace/' :
                'http://www.seznam.cz/Prakticke-informace-a-inzerce/Inzertni-servery-a-online-bazary/Online-vyhledavace-prace/',
    '/Prakticke_informace_a_inzerce/Zdravi/' : 'http://www.seznam.cz/Prakticke-informace-a-inzerce/Zdravi/',
    '/Prvni_pomoc_a_zdravotnictvi/' : 'http://www.seznam.cz/Prvni-pomoc-a-zdravotnictvi/',
    '/Remesla_a_sluzby/' : 'http://www.seznam.cz/Remesla-a-sluzby/',
    '/Remesla_a_sluzby/Pujcovny/' : 'http://www.seznam.cz/Remesla-a-sluzby/Pujcovny/',
    '/Remesla_a_sluzby/Reality/Realitni_kancelare/' : 'http://www.seznam.cz/Remesla-a-sluzby/Reality/Realitni-kancelare/',
    '/Remesla_a_sluzby/Sluzby_pracovniho_trh/' : 'http://www.seznam.cz/Remesla-a-sluzby/Sluzby-pracovniho-trh/',
    '/Veda_a_technika/' : 'http://www.seznam.cz/Veda-a-technika/',
    '/Velkoobchod_a_vyroba/' : 'http://www.seznam.cz/Velkoobchod-a-vyroba/',
    '/Vse_pro_firmy/' : 'http://www.seznam.cz/Vse-pro-firmy/',
    '/Zabava_a_hry/' : 'http://www.seznam.cz/Zabava-a-hry/',
    '/Zabava_a_hry/Hry/' : 'http://www.seznam.cz/Zabava-a-hry/Hry/',
    '/Zabava_a_hry/Hry/Hry_pocitacove/' : 'http://www.seznam.cz/Zabava-a-hry/Hry/Hry-pocitacove/',
    '/Zabava_a_hry/Hry/Hry_pocitacove/On_line_hry/' : 'http://www.seznam.cz/Zabava-a-hry/Hry/Hry-pocitacove/On-line-hry/',
    '/Zpravodajstvi/Casopisy_e_ziny/' : 'http://www.seznam.cz/Zpravodajstvi/Casopisy-e-ziny/',
}


def unknownUrl(req):
    """
    Handler pro neznama url. Zde se snazime odhadnout, jake url klient chtel ze stare/starych
    webovek Homepage
    """

    dbg.log('Uknown url %s, checking what to use', req.unparsed_uri, DBG=4)

    # nachystame si url noveho umisteni
    reqUri = re.sub('^/+', '/', req.unparsed_uri)
    error404 = False


    # --------------------------------------------------------------
    # REDIRECT SEKCI DLE SLOVNIKU
    # --------------------------------------------------------------
    if reqUri in redirectTable:
        newUrl = redirectTable[reqUri]

    # --------------------------------------------------------------
    # KLASICKA REWRITE PRAVIDLA
    # --------------------------------------------------------------
    # RewriteRule ^\/zpr[/]?$ http://www.novinky.cz/
    # RewriteRule ^\/nov[/]?$ http://www.novinky.cz/
    elif re.match('^/+(zpr|nov)[/]*$', reqUri):
        newUrl = 'http://www.novinky.%s' % req.config.control.UrlTld

    # RewriteRule ^\/zpr\/(.*)$ http://www.novinky.cz/$1.html
    # RewriteRule ^\/nov\/(.*)$ http://www.novinky.cz/$1.html
    elif re.match('^/(zpr|nov)\/', reqUri):
        newUrl = re.sub('^/(zpr|nov)/(.*)$','http://www.novinky.%s/\\2.html' % req.config.control.UrlTld, reqUri)

    # RewriteRule ^\/spo[/]?$ http://www.sport.cz/
    elif re.match('^/spo[/]*$', reqUri):
        newUrl = 'http://www.sport.%s/' % req.config.control.UrlTld

    # RewriteRule ^\/spo\/(.*)$ http://www.sport.cz/$1.html
    elif re.match('^/spo\/', reqUri):
        newUrl = re.sub('^/spo/(.*)$', 'http://www.sport.%s/\\1.html' % req.config.control.UrlTld, reqUri)

    # Redirect /pridej.html http://www.seznam.cz/pridej_odkaz.html
    elif re.match('^/pridej.html', reqUri):
        newUrl = 'http://katalog.seznam.%s/pridej_odkaz.html' % req.config.control.UrlTld

    # Redirect /zmena.html http://www.seznam.cz/ctlg_ui.fcgi?action=change1
    elif re.match('^/zmena.html', reqUri):
        newUrl = 'http://katalog.seznam.%s/ctlg_ui.fcgi?action=change1' % req.config.control.UrlTld

    # Redirect /zmena.cgi http://www.seznam.cz/catalog.cgi?action=change1
    # Redirect /cgi/zmena.cgi http://www.seznam.cz/catalog.cgi?action=change1
    elif re.match('^/(cgi/)*zmena.cgi', reqUri):
        newUrl = 'http://katalog.seznam.%s/catalog.cgi?action=change1' % req.config.control.UrlTld

    # Redirect /pridej.cgi http://www.seznam.cz/catalog.cgi
    # Redirect /cgi/pridej.cgi http://www.seznam.cz/catalog.cgi
    elif re.match('/+(cgi/)*pridej.cgi', reqUri):
        newUrl = 'http://katalog.seznam.%s/catalog.cgi' % req.config.control.UrlTld

    # Redirect /nastaveni http://seznam.cz/nastaveni/
    elif re.match('^/(nastaveni|cookie.py)', reqUri):
        newUrl = '/nastaveni-zprav'

    # Logout
    elif re.match('^/(nastaveni/?)*logout', reqUri):
        newUrl = '/logoutProcess'

    # Redirect /napoveda/?show=faq_odkazy&page=2 http://napoveda.seznam.cz/page.php?page_id=159
    elif re.match('^/napoveda/?show=faq_odkazy&page=2', reqUri):
        newUrl = 'http://napoveda.seznam.%s/page.php?page_id=159' % req.config.control.UrlTld

    # Redirect /napoveda/?show=faq_firmy&page=2 http://napoveda.seznam.cz/page.php?page_id=167
    elif re.match('^/napoveda/?show=faq_firmy&page=2', reqUri):
        newUrl = 'http://napoveda.seznam.%s/page.php?page_id=167' % req.config.control.UrlTld

    # Redirect /napoveda http://napoveda.seznam.cz
    elif re.match('^/napoveda', reqUri):
        newUrl = 'http://napoveda.seznam.%s' % req.config.control.UrlTld

    # Redirect /obchodni-podminky http://firma.seznam.cz/?pg=reklama&sub=obchodni-podminky
    elif re.match('^/obchodni-podminky', reqUri):
        newUrl = 'http://firma.seznam.%s/?pg=reklama&sub=obchodni-podminky' % req.config.control.UrlTld

    # BIG BROTHER
    elif re.match('[bB][iI][gG][bB][rR][oO][tT][hH][eE][rR]', reqUri):
        newUrl = 'http://bigbrother.seznam.cz'

    # --------------------------------------------------------------
    # VSECHNY PROXY PASS PREHODIME NA KATALOG
    # --------------------------------------------------------------
    elif re.match('^/(search|cgi/[a-z]*|hledej|ctlg_stat|firm_ui|zadosti-[a-z]*|firm|images|link|feedback)\\.([f]*cgi|php|py)', reqUri):
        newUrl = 'http://katalog.seznam.%s%s' % (req.config.control.UrlTld, reqUri)

    elif re.match('^/export-xml-megasex-add-change-link', reqUri):
        newUrl = 'http://katalog.seznam.%s%s' % (req.config.control.UrlTld, reqUri)


    # --------------------------------------------------------------
    # PROXY PASS PRAVIDLA PRO IM.CZ
    # --------------------------------------------------------------
    # ProxyPass /hodiny/ http://hobit.seznam.cz/hodiny/
    # ProxyPass /adaptace/ http://hobit.seznam.cz/adaptace/
    # ProxyPass /letuska/ http://hobit.seznam.cz/letuska/
    # ProxyPass /richard.muller/ http://hobit.seznam.cz/richard.muller/
    # ProxyPass /spykids3d/ http://hobit.seznam.cz/spykids3d/
    # ProxyPass /basnici.cz/ http://hobit.seznam.cz/basnici.cz/
    # ProxyPass /basnici/ http://hobit.seznam.cz/basnici.cz/
    # Redirect /chinaski/ http://seznam.cz/chinaski/
    elif re.match('^/(hodiny|adaptace|letuska|richard.muller|spykids3d|basnici|basnici.cz|chinaski)[/]*', reqUri):
        newUrl = re.sub('^/(hodiny|adaptace|letuska|richard.muller|spykids3d|basnici|basnici.cz|chinaski)[/]*',
                        'http://katalog.seznam.%s/\\1/' % req.config.control.UrlTld,
                        reqUri)

    # Redirect /osk http://ad.seznam.cz/clickthru?spotId=75525&zoneId=seznam.hp.ikona.top&campaignId=42666&advertismentId=68989&capping=0&destination=http%3A//cz.hit.gemius.pl/hitredir/id%3D0nhLcmO2NG0b2jj.xPNebMd.DmZ87oOGBaLP2eLJD_f.y7/stparam%3Dolmseuhnoa/url%3Dhttp%3A//www.oskarmobil.cz/
    elif re.match('^/osk', reqUri):
        newUrl = 'http://ad.seznam.%s%s' % (req.config.control.UrlTld, '/clickthru?spotId=75525&zoneId=seznam.hp.ikona.top&campaignId=42666&advertismentId=68989&capping=0&destination=http%3A//cz.hit.gemius.pl/hitredir/id%3D0nhLcmO2NG0b2jj.xPNebMd.DmZ87oOGBaLP2eLJD_f.y7/stparam%3Dolmseuhnoa/url%3Dhttp%3A//www.oskarmobil.cz/')


    # --------------------------------------------------------------
    # PREPIS HOSTNAMES
    # --------------------------------------------------------------
    #RewriteCond %{HTTP_HOST}        ^pr.seznam.cz$
    #RewriteRule ^/$ http://blog.lide.cz/Seznam.PR
    elif re.match('^pr.seznam.cz$', req.hostname):
        newUrl = 'http://blog.lide.%s/Seznam.PR' % req.config.control.UrlTld

    #RewriteCond %{HTTP_HOST}        ^dir.seznam.cz$
    #RewriteRule ^/(.*) http://www.seznam.cz/$1      [R=301]
    #RewriteRule ^\/+([0-9][0-9])\/([0-9][0-9])\/([0-9][0-9])-.*$ /$1/$2/$3.html
    elif re.match('^dir.seznam.cz$', req.hostname):
        pom = re.sub('^/([0-9][0-9])/([0-9][0-9])/([0-9][0-9])-.*$', '/\\1/\\2/\\3.html', reqUri)
        newUrl = 'http://katalog.seznam.%s%s' % (req.config.control.UrlTld, pom)


    # --------------------------------------------------------------
    # PREPIS NUTS KODU
    # --------------------------------------------------------------
    elif re.match('^.*/CZ0[128]1.html$', reqUri):
        newUrl = 'http://katalog.seznam.%s%s' % (req.config.control.UrlTld,
            re.sub('CZ0([128])1.html$', 'CZ0\\g<1>0.html', reqUri))

    else:
        error404 = True
    #endif


    if error404:
        # generuj error404 stranku
        dbg.log("Using error404 page", INFO = 2)
        from mod_python import apache
        req.status = apache.HTTP_NOT_FOUND
        lib_util.generatePage(req, "error404.html", req.config.teng.createDataRoot({}), req.config.template.defaultLanguage)
        return apache.OK
    else:
        # presmeruj na pozadovanou stranku
        try:
            referer = req.headers_in['Referer']
            dbg.log("Using url `%s' as redirect for `%s', REFERER: `%s'", (newUrl, reqUri, referer), INFO = 2)
        except:
            dbg.log("Using url `%s' as redirect for `%s'", (newUrl, reqUri), INFO = 2)
        #endtry
        return lib_util.redir(req, newUrl)
    #endif
    
#enddef


def firmy(req):
    """
    Redirect pro hledani ve firmach
    """

    w = req.form.get.getfirst('w', default=u'')
    r = req.form.get.getfirst('r', default='')
    mod = req.form.get.getfirst('mod', default='')

    try:
        w = w.encode('iso-8859-2', 'replace')
    except UnicodeError:
        pass
    #endif

    return lib_util.redir(req, 'http://firmy.seznam.%s/?w=%s&r=%s&mod=%s' %
            (req.config.control.UrlTld, urllib.quote(w), urllib.quote(r), urllib.quote(mod)))
#enddef

