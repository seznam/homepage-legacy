#!/bin/bash
#
# $Id$
#
# Export stiaticke Homepage

# ===============================================================
# Konfigurace
# ---------------------------------------------------------------
# PAGE_URL    Url stranky, kterou exportujeme
# TMP_OUTPUT  Soubor, kam se docasne ulozi vyexportovana homepage
# OUTPUT      Soubor pro ulozeni uspesne exportovane Homepage
# MIN_SIZE    Minimalni velikost exportovane Homepage
# REPORT_TEXT Reportovany text s nazvem exportu
# HTTP_PROXY  Proxy server ve tvaru http://host:port
# REPORT      Email, kam zaslat chybovy report
# WGET        Cesta k programu `wget'
# ===============================================================
if [ "x$1" = "xcatalogue" ]
then
    PAGE_URL=http://localhost:__PORT__/generateCatalogue
    TMP_OUTPUT=__TARGET__/template/js_catalogueABC.tmp
    OUTPUT=__TARGET__/template/js_catalogueABC.js
    MIN_SIZE=10000
    REPORT_TEXT="ABC katalog"
    STAMPFILE=__TARGET__/log/catalogue.stamp
elif [ "x$1" = "xtopcatalogue" ]
then
    PAGE_URL=http://localhost:__PORT__/generateCatalogue?type=top
    TMP_OUTPUT=__TARGET__/template/catalogue.tmp
    OUTPUT=__TARGET__/template/catalogue.html
    MIN_SIZE=7000
    REPORT_TEXT="Top katalog"
    STAMPFILE=__TARGET__/log/topcatalogue.stamp
elif [ "x$1" == "xfirmyrandomcategory" ]
then
    PAGE_URL=http://localhost:__PORT__/generateFirmyRandomCategory
    TMP_OUTPUT=__TARGET__/template/firmy_random_category.tmp
    OUTPUT=__TARGET__/template/firmy_random_category.html
    MIN_SIZE=100
    REPORT_TEXT="Nahodna kategorie na Firmy.cz"
    STAMPFILE=__TARGET__/log/homepage-firmy_random_category.stamp
elif [ "x$1" == "xsorry" ]
then
    if [ $2 ]
    then
        PAGE_URL=http://localhost:__PORT__/?generateSorryPage=yes\&region=$2
        TMP_OUTPUT=__TARGET__/www/index_$2.tmp
        OUTPUT=__TARGET__/www/index_$2.html
        MIN_SIZE=10000
        REPORT_TEXT="Chybova Homepage"
        STAMPFILE=__TARGET__/log/homepage-index_$2.stamp
    else
        PAGE_URL=http://localhost:__PORT__/?generateSorryPage=yes
        TMP_OUTPUT=__TARGET__/template/index_sorry.tmp
        OUTPUT=__TARGET__/template/index_sorry.html
        MIN_SIZE=10000
        REPORT_TEXT="Chybova Homepage"
        STAMPFILE=__TARGET__/log/homepage-sorry.stamp
    fi
elif [ "x$1" == "xA" ]
then
    PAGE_URL='http://localhost:__PORT__/?generatePreprocessedPage=yes&variation=A'
    TMP_OUTPUT=__TARGET__/template/index_preprocessedA.tmp
    OUTPUT=__TARGET__/template/index_preprocessedA.html
    MIN_SIZE=10000
    REPORT_TEXT="Predpripravena Homepage A"
    STAMPFILE=__TARGET__/log/homepage-preprocessedA.stamp
elif [ "x$1" == "xB" ]
then
    PAGE_URL='http://localhost:__PORT__/?generatePreprocessedPage=yes&variation=B'
    TMP_OUTPUT=__TARGET__/template/index_preprocessedB.tmp
    OUTPUT=__TARGET__/template/index_preprocessedB.html
    MIN_SIZE=10000
    REPORT_TEXT="Predpripravena Homepage B"
    STAMPFILE=__TARGET__/log/homepage-preprocessedB.stamp
else
    EXPORT_SCRIPT=__TARGET__/bin/feed_export.dev.py
    STAMPFILE=__TARGET__/log/homepage-preprocessed.stamp

    if ! $EXPORT_SCRIPT
    then
        # export skoncil s chybou
        if [ ! -z $REPORT_ADDR ]
        then
            mail -s "Homepage: na ${ME=$(uname -n)} selhal export feedu." ${REPORT_ADDR} <<EOF
Na stroji ${ME} se nepodarilo exportovat feedy.
EOF
        fi
        exit 1
    fi

    date +%Y%m%d%H%M%S > $STAMPFILE
    exit 0
fi
HTTP_PROXY=
WGET='/usr/bin/wget --proxy=off'
# ===============================================================
# Konec konfigurace
# ===============================================================

# Identifikace sebe sama
ME=`uname -n`

# Stahneme soubor
http_proxy=${HTTP_PROXY} ${WGET} -q ${PAGE_URL} -O ${TMP_OUTPUT}
RET=$?
if [ ${RET} -eq 0 ]
then
    # Export probehl, overime velikost
    SIZE=`wc -c ${TMP_OUTPUT} | cut -d" " -f 1`
    if [ ${SIZE} -lt ${MIN_SIZE} ]
    then
        # Velikost souboru je prilis mala
#        mail -s "Homepage: kratky soubor na ${ME}" ${REPORT} <<EOF
#Exportovan dat ${REPORT_TEXT} na ${ME} ma pouze ${SIZE} bajtu,
#ocekava se minimalne ${MIN_SIZE} bajtu. Export neprobehl.
#EOF
        exit 1
    fi

    # nyni muzeme presunout soubor
    mv ${TMP_OUTPUT} ${OUTPUT} 2>/dev/null

    if [ ! $? -eq 0 ]
    then
        # Selhal move
#        mail -s "Homepage: selhal prikaz mv na ${ME}" ${REPORT} <<EOF
#Export dat ${REPORT_TEXT} na ${ME} probehl, ale neprobehl prikaz mv pro presun
#souboru na jeho spravne misto. Prosim, zkontroluj pristupova prava.
#EOF
        exit 1
    fi

else
    # wget skoncil s chybou
#    mail -s "Homepage: na ${ME} selhal export souboru ${REPORT_TEXT}" ${REPORT} <<EOF
#Nepodarilo se exportovat data ${REPORT_TEXT} na stroji ${ME}.
#EOF
    exit 1
fi

date +%Y%m%d%H%M%S > $STAMPFILE
