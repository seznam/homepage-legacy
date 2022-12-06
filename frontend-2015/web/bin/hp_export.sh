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
    PAGE_URL=http://localhost:9210/generateCatalogue
    TMP_OUTPUT=/www/homepage/userweb/template/js_catalogueABC.tmp
    OUTPUT=/www/homepage/userweb/template/js_catalogueABC.js
    MIN_SIZE=10000
    REPORT_TEXT="ABC katalog"
    STAMPFILE=/www/homepage/userweb/log/catalogue.stamp
elif [ "x$1" = "xtopcatalogue" ]
then
    PAGE_URL=http://localhost:9210/generateCatalogue?type=top
    TMP_OUTPUT=/www/homepage/userweb/template/catalogue.tmp
    OUTPUT=/www/homepage/userweb/template/catalogue.html
    MIN_SIZE=7000
    REPORT_TEXT="Top katalog"
    STAMPFILE=/www/homepage/userweb/log/topcatalogue.stamp
elif [ "x$1" == "xfirmyrandomcategory" ]
then
    PAGE_URL=http://localhost:9210/generateFirmyRandomCategory
    TMP_OUTPUT=/www/homepage/userweb/template/firmy_random_category.tmp
    OUTPUT=/www/homepage/userweb/template/firmy_random_category.html
    MIN_SIZE=100
    REPORT_TEXT="Nahodna kategorie na Firmy.cz"
    STAMPFILE=/www/homepage/userweb/log/homepage-firmy_random_category.stamp
elif [ "x$1" == "xsorry" ]
then
    PAGE_URL=http://localhost:9210/?generateSorryPage=yes
    TMP_OUTPUT=/www/homepage/userweb/template/index_sorry.tmp
    OUTPUT=/www/homepage/userweb/template/index_sorry.html
    MIN_SIZE=10000
    REPORT_TEXT="Chybova Homepage"
    STAMPFILE=/www/homepage/userweb/log/homepage-sorry.stamp
elif [ "x$1" == "xA" ]
then
    PAGE_URL='http://localhost:9210/?generatePreprocessedPage=yes&variation=A'
    TMP_OUTPUT=/www/homepage/userweb/template/index_preprocessedA.tmp
    OUTPUT=/www/homepage/userweb/template/index_preprocessedA.html
    MIN_SIZE=10000
    REPORT_TEXT="Predpripravena Homepage A"
    STAMPFILE=/www/homepage/userweb/log/homepage-preprocessedA.stamp
elif [ "x$1" == "xB" ]
then
    PAGE_URL='http://localhost:9210/?generatePreprocessedPage=yes&variation=B'
    TMP_OUTPUT=/www/homepage/userweb/template/index_preprocessedB.tmp
    OUTPUT=/www/homepage/userweb/template/index_preprocessedB.html
    MIN_SIZE=10000
    REPORT_TEXT="Predpripravena Homepage B"
    STAMPFILE=/www/homepage/userweb/log/homepage-preprocessedB.stamp
else
    EXPORT_SCRIPT=/www/homepage/userweb/bin/feed_export.py
    STAMPFILE=/www/homepage/userweb/log/homepage-preprocessed.stamp

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
