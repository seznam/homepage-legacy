# coding: utf-8
#
# FILE             $Id$
#
# DESCRIPTION      Mapovani kraju a okresu
#

county = {
    # Kraj_id : Nazev_kraje
    1  : 'Česká republika',
    2  : 'Praha',
    27 : 'Středočeský',
    35 : 'Jihočeský',
    43 : 'Plzeňský',
    51 : 'Karlovarský',
    60 : 'Ústecký',
    78 : 'Liberecký',
    86 : 'Královéhradecký',
    94 : 'Pardubický',
    108 : 'Kraj Vysočina',
    116 : 'Jihomoravský',
    124 : 'Olomoucký',
    132 : 'Moravskoslezský',
    141 : 'Zlínský',
}

# old weather dictionary (replaced on 11.2008)
#district = {
#    # NUT    : [Nazev_okresu, Kraj_id]
#    'CZ0000' : ['Česká republika', 1],
#    'CZ011X' : ['Praha', 2],
#    'CZ0211' : ['Benešov', 27],
#    'CZ0212' : ['Beroun', 27],
#    'CZ0213' : ['Kladno', 27],
#    'CZ0214' : ['Kolín', 27],
#    'CZ0215' : ['Kutná Hora', 27],
#    'CZ0216' : ['Mělník', 27],
#    'CZ0217' : ['Mladá Boleslav', 27],
#    'CZ0218' : ['Nymburk', 27],
#    #'CZ0219' : ['Praha-východ', 27],
#    #'CZ021A' : ['Praha-západ', 27],
#    'CZ021B' : ['Příbram', 27],
#    'CZ021C' : ['Rakovník', 27],
#    'CZ0311' : ['České Budějovice', 35],
#    'CZ0312' : ['Český Krumlov', 35],
#    'CZ0313' : ['Jindřichův Hradec', 35],
#    'CZ0613' : ['Pelhřimov', 108],
#    'CZ0314' : ['Písek', 35],
#    'CZ0315' : ['Prachatice', 35],
#    'CZ0316' : ['Strakonice', 35],
#    'CZ0317' : ['Tábor', 35],
#    'CZ0321' : ['Domažlice', 43],
#    'CZ0411' : ['Cheb', 51],
#    'CZ0412' : ['Karlovy Vary', 51],
#    'CZ0322' : ['Klatovy', 43],
#    'CZ0323' : ['Plzeň', 43],
#    #'CZ0324' : ['Plzeň-jih', 43],
#    #'CZ0325' : ['Plzeň-sever', 43],
#    'CZ0326' : ['Rokycany', 43],
#    'CZ0413' : ['Sokolov', 51],
#    'CZ0327' : ['Tachov', 43],
#    'CZ0511' : ['Česká Lípa', 78],
#    'CZ0421' : ['Děčín', 60],
#    'CZ0422' : ['Chomutov', 60],
#    'CZ0512' : ['Jablonec nad Nisou', 78],
#    'CZ0513' : ['Liberec', 78],
#    'CZ0423' : ['Litoměřice', 60],
#    'CZ0424' : ['Louny', 60],
#    'CZ0425' : ['Most', 60],
#    'CZ0426' : ['Teplice', 60],
#    'CZ0427' : ['Ústí nad Labem', 60],
#    'CZ0611' : ['Havlíčkův Brod', 108],
#    'CZ0521' : ['Hradec Králové', 86],
#    'CZ0531' : ['Chrudim', 94],
#    'CZ0522' : ['Jičín', 86],
#    'CZ0523' : ['Náchod', 86],
#    'CZ0532' : ['Pardubice', 94],
#    'CZ0524' : ['Rychnov nad Kněžnou', 86],
#    'CZ0514' : ['Semily', 78],
#    'CZ0533' : ['Svitavy', 94],
#    'CZ0525' : ['Trutnov', 86],
#    'CZ0534' : ['Ústí nad Orlicí', 94],
#    'CZ0621' : ['Blansko', 116],
#    'CZ0622' : ['Brno', 116],
#    #'CZ0623' : ['Brno-venkov', 116],
#    'CZ0624' : ['Břeclav', 116],
#    'CZ0724' : ['Zlín', 141],
#    'CZ0625' : ['Hodonín', 116],
#    'CZ0612' : ['Jihlava', 108],
#    'CZ0721' : ['Kroměříž', 141],
#    'CZ0713' : ['Prostějov', 124],
#    'CZ0614' : ['Třebíč', 108],
#    'CZ0722' : ['Uherské Hradiště', 141],
#    'CZ0626' : ['Vyškov', 116],
#    'CZ0627' : ['Znojmo', 116],
#    'CZ0615' : ['Žďár nad Sázavou', 108],
#    'CZ0811' : ['Bruntál', 132],
#    'CZ0812' : ['Frýdek-Místek', 132],
#    'CZ0813' : ['Karviná', 132],
#    'CZ0814' : ['Nový Jičín', 132],
#    'CZ0712' : ['Olomouc', 124],
#    'CZ0815' : ['Opava', 132],
#    'CZ0816' : ['Ostrava-město', 132],
#    'CZ0714' : ['Přerov', 124],
#    'CZ0715' : ['Šumperk', 124],
#    'CZ0723' : ['Vsetín', 141],
#    'CZ0711' : ['Jeseník', 124],
#}

district = {
#   POCASI_ENTITY_ID : [Nazev_okresu, Kraj_id]
    'CESKA_REPUBLIKA' : ['Česká republika', 1],
    'PRAHA' : ['Praha', 2],
    'BENESOV' : ['Benešov', 27],
    'BEROUN' : ['Beroun', 27],
    'KLADNO' : ['Kladno', 27],
    'KOLIN' : ['Kolín', 27],
    'KUTNA_HORA' : ['Kutná Hora', 27],
    'MELNIK' : ['Mělník', 27],
    'MLADA_BOLESLAV' : ['Mladá Boleslav', 27],
    'NYMBURK' : ['Nymburk', 27],
    'PRIBRAM' : ['Příbram', 27],
    'RAKOVNIK' : ['Rakovník', 27],
    'CESKE_BUDEJOVICE' : ['České Budějovice', 35],
    'CESKY_KRUMLOV' : ['Český Krumlov', 35],
    'JINDRICHUV_HRADEC' : ['Jindřichův Hradec', 35],
    'PELHRIMOV' : ['Pelhřimov', 108],
    'PISEK' : ['Písek', 35],
    'PRACHATICE' : ['Prachatice', 35],
    'STRAKONICE' : ['Strakonice', 35],
    'TABOR' : ['Tábor', 35],
    'DOMAZLICE' : ['Domažlice', 43],
    'CHEB' : ['Cheb', 51],
    'KARLOVY_VARY' : ['Karlovy Vary', 51],
    'KLATOVY' : ['Klatovy', 43],
    'PLZEN' : ['Plzeň', 43],
    'ROKYCANY' : ['Rokycany', 43],
    'SOKOLOV' : ['Sokolov', 51],
    'TACHOV' : ['Tachov', 43],
    'CESKA_LIPA' : ['Česká Lípa', 78],
    'DECIN' : ['Děčín', 60],
    'CHOMUTOV' : ['Chomutov', 60],
    'JABLONEC' : ['Jablonec nad Nisou', 78],
    'LIBEREC' : ['Liberec', 78],
    'LITOMERICE' : ['Litoměřice', 60],
    'LOUNY' : ['Louny', 60],
    'MOST' : ['Most', 60],
    'TEPLICE' : ['Teplice', 60],
    'USTI_NAD_LABEM' : ['Ústí nad Labem', 60],
    'HAVLICKUV_BROD' : ['Havlíčkův Brod', 108],
    'HRADEC_KRALOVE' : ['Hradec Králové', 86],
    'CHRUDIM' : ['Chrudim', 94],
    'JICIN' : ['Jičín', 86],
    'NACHOD' : ['Náchod', 86],
    'PARDUBICE' : ['Pardubice', 94],
    'RYCHNOV_NAD_KNEZNOU' : ['Rychnov nad Kněžnou', 86],
    'SEMILY' : ['Semily', 78],
    'SVITAVY' : ['Svitavy', 94],
    'TRUTNOV' : ['Trutnov', 86],
    'USTI_NAD_ORLICI' : ['Ústí nad Orlicí', 94],
    'BLANSKO' : ['Blansko', 116],
    'BRNO' : ['Brno', 116],
    'BRECLAV' : ['Břeclav', 116],
    'ZLIN' : ['Zlín', 141],
    'HODONIN' : ['Hodonín', 116],
    'JIHLAVA' : ['Jihlava', 108],
    'KROMERIZ' : ['Kroměříž', 141],
    'PROSTEJOV' : ['Prostějov', 124],
    'TREBIC' : ['Třebíč', 108],
    'UHERSKE_HRADISTE' : ['Uherské Hradiště', 141],
    'VYSKOV' : ['Vyškov', 116],
    'ZNOJMO' : ['Znojmo', 116],
    'ZDAR_NAD_SAZAVOU' : ['Žďár nad Sázavou', 108],
    'BRUNTAL' : ['Bruntál', 132],
    'FRYDEK_MISTEK' : ['Frýdek-Místek', 132],
    'KARVINA' : ['Karviná', 132],
    'NOVY_JICIN' : ['Nový Jičín', 132],
    'OLOMOUC' : ['Olomouc', 124],
    'OPAVA' : ['Opava', 132],
    'OSTRAVA' : ['Ostrava-město', 132],
    'PREROV' : ['Přerov', 124],
    'SUMPERK' : ['Šumperk', 124],
    'VSETIN' : ['Vsetín', 141],
    'JESENIK' : ['Jeseník', 124],
}

countyCodes = {}
for ck, cv in county.iteritems():
    for dk, dv in district.iteritems():
        if ck == dv[1]:
            if countyCodes.has_key(ck):
                countyCodes[ck]["districts"].append(dk)
            else:
                countyCodes[ck] = {"name"      : cv,
                                   "districts" : [dk]}
            #endif
        #endif
    #endfor
#endfor
