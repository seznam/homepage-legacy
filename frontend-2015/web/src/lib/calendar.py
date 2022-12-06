#!/usr/bin/env python2.5
# coding: utf-8
#
# $Id$
"""
DESCRIPTION   Calendar
"""


class Calendar:
    """
    Trida pro praci s kalendarem
    """

    def __init__(self):
        """
        Inicializuje kalendar
        """

        self.calendar = globalCalendar
    #enddef

    def getDay(self, day, month):
        """
        Vraci jmeniny a vyroci pro dany den v roce
        """

        return self.calendar[month][day]
    #enddef

    def getNameday(self, day, month):
        """
        Vraci jmeniny pro zadany den v roce
        """

        return self.calendar[month][day]['name']
    #enddef

    def getHoliday(self, day, month):
        """
        Vraci svatek v zadany den v roce
        """

        return self.calendar[month][day]['holiday']
    #enddef
#endclass

# --------------------------------------------------------------------------------
# Kalendar staticky definujeme zde, aby se nesestavoval pri kazde instanci objektu
# --------------------------------------------------------------------------------
globalCalendar = {}
for x in range(1, 13):
    globalCalendar[x] = {}
#endfor

# LEDEN
globalCalendar[1][1] = {"name": "", "holiday": "Den obnovy samostatného českého státu"}
globalCalendar[1][2] = {"name": "Karina", "holiday": ""}
globalCalendar[1][3] = {"name": "Radmila", "holiday": ""}
globalCalendar[1][4] = {"name": "Diana", "holiday": ""}
globalCalendar[1][5] = {"name": "Dalimil", "holiday": ""}
globalCalendar[1][6] = {"name": "", "holiday": "Tři králové"}
globalCalendar[1][7] = {"name": "Vilma", "holiday": ""}
globalCalendar[1][8] = {"name": "Čestmír", "holiday": ""}
globalCalendar[1][9] = {"name": "Vladan", "holiday": ""}
globalCalendar[1][10] = {"name": "Břetislav", "holiday": ""}
globalCalendar[1][11] = {"name": "Bohdana", "holiday": ""}
globalCalendar[1][12] = {"name": "Pravoslav", "holiday": ""}
globalCalendar[1][13] = {"name": "Edita", "holiday": ""}
globalCalendar[1][14] = {"name": "Radovan", "holiday": ""}
globalCalendar[1][15] = {"name": "Alice", "holiday": ""}
globalCalendar[1][16] = {"name": "Ctirad", "holiday": ""}
globalCalendar[1][17] = {"name": "Drahoslav", "holiday": ""}
globalCalendar[1][18] = {"name": "Vladislav, Vladislava", "holiday": ""}
globalCalendar[1][19] = {"name": "Doubravka", "holiday": ""}
globalCalendar[1][20] = {"name": "Ilona a Sebastian", "holiday": ""}
globalCalendar[1][21] = {"name": "Běla", "holiday": ""}
globalCalendar[1][22] = {"name": "Slavomír", "holiday": ""}
globalCalendar[1][23] = {"name": "Zdeněk", "holiday": ""}
globalCalendar[1][24] = {"name": "Milena", "holiday": ""}
globalCalendar[1][25] = {"name": "Miloš", "holiday": ""}
globalCalendar[1][26] = {"name": "Zora", "holiday": ""}
globalCalendar[1][27] = {"name": "Ingrid", "holiday": "Den památky obětí holocaustu"}
globalCalendar[1][28] = {"name": "Otýlie", "holiday": ""}
globalCalendar[1][29] = {"name": "Zdislava", "holiday": ""}
globalCalendar[1][30] = {"name": "Robin", "holiday": ""}
globalCalendar[1][31] = {"name": "Marika", "holiday": ""}

# UNOR
globalCalendar[2][1] = {"name": "Hynek", "holiday": ""}
globalCalendar[2][2] = {"name": "Nela", "holiday": "Hromnice"}
globalCalendar[2][3] = {"name": "Blažej", "holiday": ""}
globalCalendar[2][4] = {"name": "Jarmila", "holiday": ""}
globalCalendar[2][5] = {"name": "Dobromila", "holiday": ""}
globalCalendar[2][6] = {"name": "Vanda", "holiday": ""}
globalCalendar[2][7] = {"name": "Veronika", "holiday": ""}
globalCalendar[2][8] = {"name": "Milada", "holiday": ""}
globalCalendar[2][9] = {"name": "Apolena", "holiday": ""}
globalCalendar[2][10] = {"name": "Mojmír", "holiday": ""}
globalCalendar[2][11] = {"name": "Božena", "holiday": ""}
globalCalendar[2][12] = {"name": "Slavěna", "holiday": ""}
globalCalendar[2][13] = {"name": "Věnceslav", "holiday": ""}
globalCalendar[2][14] = {"name": "Valentýn, Valentýna", "holiday": "svátek zamilovaných"}
globalCalendar[2][15] = {"name": "Jiřina", "holiday": ""}
globalCalendar[2][16] = {"name": "Ljuba", "holiday": ""}
globalCalendar[2][17] = {"name": "Miloslava", "holiday": ""}
globalCalendar[2][18] = {"name": "Gizela", "holiday": ""}
globalCalendar[2][19] = {"name": "Patrik", "holiday": ""}
globalCalendar[2][20] = {"name": "Oldřich", "holiday": ""}
globalCalendar[2][21] = {"name": "Lenka a Eleonora", "holiday": ""}
globalCalendar[2][22] = {"name": "Petr", "holiday": ""}
globalCalendar[2][23] = {"name": "Svatopluk", "holiday": ""}
globalCalendar[2][24] = {"name": "Matěj a Matyáš", "holiday": ""}
globalCalendar[2][25] = {"name": "Liliana", "holiday": ""}
globalCalendar[2][26] = {"name": "Dorota", "holiday": ""}
globalCalendar[2][27] = {"name": "Alexandr", "holiday": ""}
globalCalendar[2][28] = {"name": "Lumír", "holiday": ""}
globalCalendar[2][29] = {"name": "Horymír", "holiday": ""}

# BREZEN
globalCalendar[3][1] = {"name": "Bedřich", "holiday": ""}
globalCalendar[3][2] = {"name": "Anežka", "holiday": ""}
globalCalendar[3][3] = {"name": "Kamil", "holiday": ""}
globalCalendar[3][4] = {"name": "Stela", "holiday": ""}
globalCalendar[3][5] = {"name": "Kazimír", "holiday": ""}
globalCalendar[3][6] = {"name": "Miroslav", "holiday": ""}
globalCalendar[3][7] = {"name": "Tomáš", "holiday": ""}
globalCalendar[3][8] = {"name": "Gabriela", "holiday": "Mezinárodní den žen"}
globalCalendar[3][9] = {"name": "Františka", "holiday": ""}
globalCalendar[3][10] = {"name": "Viktorie", "holiday": ""}
globalCalendar[3][11] = {"name": "Anděla, Angelika", "holiday": ""}
globalCalendar[3][12] = {"name": "Řehoř", "holiday": "Den vstupu ČR do NATO"}
globalCalendar[3][13] = {"name": "Růžena", "holiday": ""}
globalCalendar[3][14] = {"name": "Rút a Matylda", "holiday": ""}
globalCalendar[3][15] = {"name": "Ida", "holiday": ""}
globalCalendar[3][16] = {"name": "Elena, Herbert", "holiday": ""}
globalCalendar[3][17] = {"name": "Vlastimil", "holiday": ""}
globalCalendar[3][18] = {"name": "Eduard", "holiday": ""}
globalCalendar[3][19] = {"name": "Josef", "holiday": ""}
globalCalendar[3][20] = {"name": "Světlana", "holiday": ""}
globalCalendar[3][21] = {"name": "Radek", "holiday": ""}
globalCalendar[3][22] = {"name": "Leona", "holiday": ""}
globalCalendar[3][23] = {"name": "Ivona", "holiday": ""}
globalCalendar[3][24] = {"name": "Gabriel", "holiday": ""}
globalCalendar[3][25] = {"name": "Marián, Mario", "holiday": ""}
globalCalendar[3][26] = {"name": "Emanuel", "holiday": ""}
globalCalendar[3][27] = {"name": "Dita", "holiday": ""}
globalCalendar[3][28] = {"name": "Soňa", "holiday": ""}
globalCalendar[3][29] = {"name": "Taťána", "holiday": ""}
globalCalendar[3][30] = {"name": "Arnošt", "holiday": ""}
globalCalendar[3][31] = {"name": "Kvido", "holiday": ""}

# DUBEN
globalCalendar[4][1] = {"name": "Hugo", "holiday": ""}
globalCalendar[4][2] = {"name": "Erika", "holiday": ""}
globalCalendar[4][3] = {"name": "Richard", "holiday": ""}
globalCalendar[4][4] = {"name": "Ivana", "holiday": ""}
globalCalendar[4][5] = {"name": "Miroslava", "holiday": ""}
globalCalendar[4][6] = {"name": "Vendula", "holiday": ""}
globalCalendar[4][7] = {"name": "Heřman, Hermína", "holiday": ""}
globalCalendar[4][8] = {"name": "Ema", "holiday": ""}
globalCalendar[4][9] = {"name": "Dušan", "holiday": ""}
globalCalendar[4][10] = {"name": "Darja", "holiday": ""}
globalCalendar[4][11] = {"name": "Izabela", "holiday": ""}
globalCalendar[4][12] = {"name": "Julius", "holiday": ""}
globalCalendar[4][13] = {"name": "Aleš", "holiday": ""}
globalCalendar[4][14] = {"name": "Vincenc", "holiday": ""}
globalCalendar[4][15] = {"name": "Anastázie", "holiday": ""}
globalCalendar[4][16] = {"name": "Irena", "holiday": ""}
globalCalendar[4][17] = {"name": "Rudolf", "holiday": ""}
globalCalendar[4][18] = {"name": "Valérie", "holiday": ""}
globalCalendar[4][19] = {"name": "Rostislav", "holiday": ""}
globalCalendar[4][20] = {"name": "Marcela", "holiday": ""}
globalCalendar[4][21] = {"name": "Alexandra", "holiday": ""}
globalCalendar[4][22] = {"name": "Evženie", "holiday": ""}
globalCalendar[4][23] = {"name": "Vojtěch", "holiday": ""}
globalCalendar[4][24] = {"name": "Jiří", "holiday": ""}
globalCalendar[4][25] = {"name": "Marek", "holiday": ""}
globalCalendar[4][26] = {"name": "Oto", "holiday": ""}
globalCalendar[4][27] = {"name": "Jaroslav", "holiday": ""}
globalCalendar[4][28] = {"name": "Vlastislav", "holiday": ""}
globalCalendar[4][29] = {"name": "Robert", "holiday": ""}
globalCalendar[4][30] = {"name": "Blahoslav", "holiday": ""}

# KVETEN
globalCalendar[5][1] = {"name": "", "holiday": "Svátek práce"}
globalCalendar[5][2] = {"name": "Zikmund", "holiday": ""}
globalCalendar[5][3] = {"name": "Alexej", "holiday": ""}
globalCalendar[5][4] = {"name": "Květoslav", "holiday": ""}
globalCalendar[5][5] = {"name": "Klaudie", "holiday": "Květnové povstání českého lidu"}
globalCalendar[5][6] = {"name": "Radoslav", "holiday": ""}
globalCalendar[5][7] = {"name": "Stanislav", "holiday": ""}
globalCalendar[5][8] = {"name": "", "holiday": "Den vítězství (státní svátek)"}
globalCalendar[5][9] = {"name": "Ctibor", "holiday": ""}
globalCalendar[5][10] = {"name": "Blažena", "holiday": "Den matek"}
globalCalendar[5][11] = {"name": "Svatava", "holiday": ""}
globalCalendar[5][12] = {"name": "Pankrác", "holiday": ""}
globalCalendar[5][13] = {"name": "Servác", "holiday": ""}
globalCalendar[5][14] = {"name": "Bonifác", "holiday": ""}
globalCalendar[5][15] = {"name": "Žofie, Sofie", "holiday": ""}
globalCalendar[5][16] = {"name": "Přemysl", "holiday": ""}
globalCalendar[5][17] = {"name": "Aneta", "holiday": ""}
globalCalendar[5][18] = {"name": "Nataša", "holiday": ""}
globalCalendar[5][19] = {"name": "Ivo", "holiday": ""}
globalCalendar[5][20] = {"name": "Zbyšek", "holiday": ""}
globalCalendar[5][21] = {"name": "Monika", "holiday": ""}
globalCalendar[5][22] = {"name": "Emil", "holiday": ""}
globalCalendar[5][23] = {"name": "Vladimír", "holiday": ""}
globalCalendar[5][24] = {"name": "Jana, Vanesa", "holiday": ""}
globalCalendar[5][25] = {"name": "Viola", "holiday": ""}
globalCalendar[5][26] = {"name": "Filip", "holiday": ""}
globalCalendar[5][27] = {"name": "Valdemar", "holiday": ""}
globalCalendar[5][28] = {"name": "Vilém", "holiday": ""}
globalCalendar[5][29] = {"name": "Maxmilián, Maxim", "holiday": ""}
globalCalendar[5][30] = {"name": "Ferdinand", "holiday": ""}
globalCalendar[5][31] = {"name": "Kamila", "holiday": ""}

# CERVEN
globalCalendar[6][1] = {"name": "Laura", "holiday": "Mezinárodní den dětí"}
globalCalendar[6][2] = {"name": "Jarmil", "holiday": ""}
globalCalendar[6][3] = {"name": "Tamara, Kevin", "holiday": ""}
globalCalendar[6][4] = {"name": "Dalibor", "holiday": ""}
globalCalendar[6][5] = {"name": "Dobroslav, Dobroslava", "holiday": ""}
globalCalendar[6][6] = {"name": "Norbert", "holiday": ""}
globalCalendar[6][7] = {"name": "Iveta, Slavoj", "holiday": ""}
globalCalendar[6][8] = {"name": "Medard", "holiday": ""}
globalCalendar[6][9] = {"name": "Stanislava", "holiday": ""}
globalCalendar[6][10] = {"name": "Gita", "holiday": ""}
globalCalendar[6][11] = {"name": "Bruno", "holiday": ""}
globalCalendar[6][12] = {"name": "Antonie", "holiday": ""}
globalCalendar[6][13] = {"name": "Antonín", "holiday": ""}
globalCalendar[6][14] = {"name": "Roland", "holiday": ""}
globalCalendar[6][15] = {"name": "Vít", "holiday": ""}
globalCalendar[6][16] = {"name": "Zbyněk", "holiday": ""}
globalCalendar[6][17] = {"name": "Adolf", "holiday": ""}
globalCalendar[6][18] = {"name": "Milan", "holiday": ""}
globalCalendar[6][19] = {"name": "Leoš, Leo", "holiday": ""}
globalCalendar[6][20] = {"name": "Květa", "holiday": ""}
globalCalendar[6][21] = {"name": "Alois", "holiday": ""}
globalCalendar[6][22] = {"name": "Pavla", "holiday": ""}
globalCalendar[6][23] = {"name": "Zdeňka", "holiday": ""}
globalCalendar[6][24] = {"name": "Jan", "holiday": ""}
globalCalendar[6][25] = {"name": "Ivan", "holiday": ""}
globalCalendar[6][26] = {"name": "Adriana", "holiday": ""}
globalCalendar[6][27] = {"name": "Ladislav", "holiday": "Den památky obětí komunismu"}
globalCalendar[6][28] = {"name": "Lubomír", "holiday": ""}
globalCalendar[6][29] = {"name": "Petr, Pavel", "holiday": ""}
globalCalendar[6][30] = {"name": "Šárka", "holiday": ""}

# CERVENEC
globalCalendar[7][1] = {"name": "Jaroslava", "holiday": ""}
globalCalendar[7][2] = {"name": "Patricie", "holiday": ""}
globalCalendar[7][3] = {"name": "Radomír", "holiday": ""}
globalCalendar[7][4] = {"name": "Prokop", "holiday": ""}
globalCalendar[7][5] = {"name": "", "holiday": "Den slovan. věrozvěstů Cyrila a Metoděje"}
globalCalendar[7][6] = {"name": "", "holiday": "Den upálení mistra Jana Husa"}
globalCalendar[7][7] = {"name": "Bohuslava", "holiday": ""}
globalCalendar[7][8] = {"name": "Nora", "holiday": ""}
globalCalendar[7][9] = {"name": "Drahoslava", "holiday": ""}
globalCalendar[7][10] = {"name": "Libuše, Amálie", "holiday": ""}
globalCalendar[7][11] = {"name": "Olga", "holiday": ""}
globalCalendar[7][12] = {"name": "Bořek", "holiday": ""}
globalCalendar[7][13] = {"name": "Markéta", "holiday": ""}
globalCalendar[7][14] = {"name": "Karolína", "holiday": ""}
globalCalendar[7][15] = {"name": "Jindřich", "holiday": ""}
globalCalendar[7][16] = {"name": "Luboš", "holiday": ""}
globalCalendar[7][17] = {"name": "Martina", "holiday": ""}
globalCalendar[7][18] = {"name": "Drahomíra", "holiday": ""}
globalCalendar[7][19] = {"name": "Čeněk", "holiday": ""}
globalCalendar[7][20] = {"name": "Ilja", "holiday": ""}
globalCalendar[7][21] = {"name": "Vítězslav", "holiday": ""}
globalCalendar[7][22] = {"name": "Magdaléna", "holiday": ""}
globalCalendar[7][23] = {"name": "Libor", "holiday": ""}
globalCalendar[7][24] = {"name": "Kristýna", "holiday": ""}
globalCalendar[7][25] = {"name": "Jakub", "holiday": ""}
globalCalendar[7][26] = {"name": "Anna, Anita", "holiday": ""}
globalCalendar[7][27] = {"name": "Věroslav", "holiday": ""}
globalCalendar[7][28] = {"name": "Viktor", "holiday": ""}
globalCalendar[7][29] = {"name": "Marta", "holiday": ""}
globalCalendar[7][30] = {"name": "Bořivoj", "holiday": ""}
globalCalendar[7][31] = {"name": "Ignác", "holiday": ""}

# SRPEN
globalCalendar[8][1] = {"name": "Oskar", "holiday": ""}
globalCalendar[8][2] = {"name": "Gustav", "holiday": ""}
globalCalendar[8][3] = {"name": "Miluše", "holiday": ""}
globalCalendar[8][4] = {"name": "Dominik a Dominika", "holiday": ""}
globalCalendar[8][5] = {"name": "Kristián", "holiday": ""}
globalCalendar[8][6] = {"name": "Oldřiška", "holiday": ""}
globalCalendar[8][7] = {"name": "Lada", "holiday": ""}
globalCalendar[8][8] = {"name": "Soběslav", "holiday": ""}
globalCalendar[8][9] = {"name": "Roman", "holiday": ""}
globalCalendar[8][10] = {"name": "Vavřinec", "holiday": ""}
globalCalendar[8][11] = {"name": "Zuzana", "holiday": ""}
globalCalendar[8][12] = {"name": "Klára", "holiday": ""}
globalCalendar[8][13] = {"name": "Alena", "holiday": ""}
globalCalendar[8][14] = {"name": "Alan", "holiday": ""}
globalCalendar[8][15] = {"name": "Hana", "holiday": ""}
globalCalendar[8][16] = {"name": "Jáchym", "holiday": ""}
globalCalendar[8][17] = {"name": "Petra", "holiday": ""}
globalCalendar[8][18] = {"name": "Helena", "holiday": ""}
globalCalendar[8][19] = {"name": "Ludvík, Luisa", "holiday": ""}
globalCalendar[8][20] = {"name": "Bernard", "holiday": ""}
globalCalendar[8][21] = {"name": "Johana", "holiday": ""}
globalCalendar[8][22] = {"name": "Bohuslav", "holiday": ""}
globalCalendar[8][23] = {"name": "Sandra", "holiday": ""}
globalCalendar[8][24] = {"name": "Bartoloměj", "holiday": ""}
globalCalendar[8][25] = {"name": "Radim", "holiday": ""}
globalCalendar[8][26] = {"name": "Luděk", "holiday": ""}
globalCalendar[8][27] = {"name": "Otakar", "holiday": ""}
globalCalendar[8][28] = {"name": "Augustýn", "holiday": ""}
globalCalendar[8][29] = {"name": "Evelína", "holiday": ""}
globalCalendar[8][30] = {"name": "Vladěna", "holiday": ""}
globalCalendar[8][31] = {"name": "Pavlína", "holiday": ""}

# ZARI
globalCalendar[9][1] = {"name": "Linda a Samuel", "holiday": ""}
globalCalendar[9][2] = {"name": "Adéla", "holiday": ""}
globalCalendar[9][3] = {"name": "Bronislav, Bronislava", "holiday": ""}
globalCalendar[9][4] = {"name": "Jindřiška, Rozálie", "holiday": ""}
globalCalendar[9][5] = {"name": "Boris", "holiday": ""}
globalCalendar[9][6] = {"name": "Boleslav", "holiday": ""}
globalCalendar[9][7] = {"name": "Regína", "holiday": ""}
globalCalendar[9][8] = {"name": "Mariana", "holiday": ""}
globalCalendar[9][9] = {"name": "Daniela", "holiday": ""}
globalCalendar[9][10] = {"name": "Irma", "holiday": ""}
globalCalendar[9][11] = {"name": "Denisa, Denis", "holiday": ""}
globalCalendar[9][12] = {"name": "Marie", "holiday": ""}
globalCalendar[9][13] = {"name": "Lubor", "holiday": ""}
globalCalendar[9][14] = {"name": "Radka", "holiday": ""}
globalCalendar[9][15] = {"name": "Jolana", "holiday": ""}
globalCalendar[9][16] = {"name": "Ludmila", "holiday": ""}
globalCalendar[9][17] = {"name": "Naděžda", "holiday": ""}
globalCalendar[9][18] = {"name": "Kryštof", "holiday": ""}
globalCalendar[9][19] = {"name": "Zita", "holiday": ""}
globalCalendar[9][20] = {"name": "Oleg", "holiday": ""}
globalCalendar[9][21] = {"name": "Matouš", "holiday": ""}
globalCalendar[9][22] = {"name": "Darina", "holiday": ""}
globalCalendar[9][23] = {"name": "Berta", "holiday": ""}
globalCalendar[9][24] = {"name": "Jaromír", "holiday": ""}
globalCalendar[9][25] = {"name": "Zlata", "holiday": ""}
globalCalendar[9][26] = {"name": "Andrea", "holiday": ""}
globalCalendar[9][27] = {"name": "Jonáš", "holiday": ""}
globalCalendar[9][28] = {"name": "Václav", "holiday": "Den české státnosti"}
globalCalendar[9][29] = {"name": "Michal", "holiday": ""}
globalCalendar[9][30] = {"name": "Jeroným", "holiday": ""}

# RIJEN
globalCalendar[10][1] = {"name": "Igor", "holiday": ""}
globalCalendar[10][2] = {"name": "Olívie, Oliver", "holiday": ""}
globalCalendar[10][3] = {"name": "Bohumil", "holiday": ""}
globalCalendar[10][4] = {"name": "František", "holiday": ""}
globalCalendar[10][5] = {"name": "Eliška", "holiday": ""}
globalCalendar[10][6] = {"name": "Hanuš", "holiday": ""}
globalCalendar[10][7] = {"name": "Justýna", "holiday": ""}
globalCalendar[10][8] = {"name": "Věra", "holiday": ""}
globalCalendar[10][9] = {"name": "Štefan, Sára", "holiday": ""}
globalCalendar[10][10] = {"name": "Marina", "holiday": ""}
globalCalendar[10][11] = {"name": "Andrej", "holiday": ""}
globalCalendar[10][12] = {"name": "Marcel", "holiday": ""}
globalCalendar[10][13] = {"name": "Renáta", "holiday": ""}
globalCalendar[10][14] = {"name": "Agáta", "holiday": ""}
globalCalendar[10][15] = {"name": "Tereza, Terezie", "holiday": ""}
globalCalendar[10][16] = {"name": "Havel", "holiday": ""}
globalCalendar[10][17] = {"name": "Hedvika", "holiday": ""}
globalCalendar[10][18] = {"name": "Lukáš", "holiday": ""}
globalCalendar[10][19] = {"name": "Michaela, Michala", "holiday": ""}
globalCalendar[10][20] = {"name": "Vendelín", "holiday": ""}
globalCalendar[10][21] = {"name": "Brigita", "holiday": ""}
globalCalendar[10][22] = {"name": "Sabina", "holiday": ""}
globalCalendar[10][23] = {"name": "Teodor", "holiday": ""}
globalCalendar[10][24] = {"name": "Nina", "holiday": ""}
globalCalendar[10][25] = {"name": "Beáta", "holiday": ""}
globalCalendar[10][26] = {"name": "Erik", "holiday": ""}
globalCalendar[10][27] = {"name": "Šarlota, Zoe a Zoja", "holiday": ""}
globalCalendar[10][28] = {"name": "", "holiday": "Vznik samostatného československého státu"}
globalCalendar[10][29] = {"name": "Silvie", "holiday": ""}
globalCalendar[10][30] = {"name": "Tadeáš", "holiday": ""}
globalCalendar[10][31] = {"name": "Štěpánka", "holiday": ""}

# LISTOPAD
globalCalendar[11][1] = {"name": "Felix", "holiday": ""}
globalCalendar[11][2] = {"name": "Tobiáš", "holiday": "Památka zesnulých"}
globalCalendar[11][3] = {"name": "Hubert", "holiday": ""}
globalCalendar[11][4] = {"name": "Karel, Karla", "holiday": ""}
globalCalendar[11][5] = {"name": "Miriam", "holiday": ""}
globalCalendar[11][6] = {"name": "Liběna", "holiday": ""}
globalCalendar[11][7] = {"name": "Saskie", "holiday": ""}
globalCalendar[11][8] = {"name": "Bohumír", "holiday": ""}
globalCalendar[11][9] = {"name": "Bohdan", "holiday": ""}
globalCalendar[11][10] = {"name": "Evžen", "holiday": ""}
globalCalendar[11][11] = {"name": "Martin", "holiday": "Den válečných veteránů"}
globalCalendar[11][12] = {"name": "Benedikt", "holiday": ""}
globalCalendar[11][13] = {"name": "Tibor", "holiday": ""}
globalCalendar[11][14] = {"name": "Sáva", "holiday": ""}
globalCalendar[11][15] = {"name": "Leopold", "holiday": ""}
globalCalendar[11][16] = {"name": "Otmar", "holiday": ""}
globalCalendar[11][17] = {"name": "Mahulena", "holiday": "Boj za svobodu a demokracii"}
globalCalendar[11][18] = {"name": "Romana", "holiday": ""}
globalCalendar[11][19] = {"name": "Alžběta", "holiday": ""}
globalCalendar[11][20] = {"name": "Nikola, Nikol", "holiday": ""}
globalCalendar[11][21] = {"name": "Albert", "holiday": ""}
globalCalendar[11][22] = {"name": "Cecílie", "holiday": ""}
globalCalendar[11][23] = {"name": "Klement", "holiday": ""}
globalCalendar[11][24] = {"name": "Emílie", "holiday": ""}
globalCalendar[11][25] = {"name": "Kateřina", "holiday": ""}
globalCalendar[11][26] = {"name": "Artur", "holiday": ""}
globalCalendar[11][27] = {"name": "Xénie", "holiday": ""}
globalCalendar[11][28] = {"name": "René", "holiday": ""}
globalCalendar[11][29] = {"name": "Zina", "holiday": ""}
globalCalendar[11][30] = {"name": "Ondřej", "holiday": ""}

# PROSINEC
globalCalendar[12][1] = {"name": "Iva", "holiday": ""}
globalCalendar[12][2] = {"name": "Blanka", "holiday": ""}
globalCalendar[12][3] = {"name": "Svatoslav", "holiday": ""}
globalCalendar[12][4] = {"name": "Barbora, Barbara", "holiday": ""}
globalCalendar[12][5] = {"name": "Jitka", "holiday": ""}
globalCalendar[12][6] = {"name": "Mikuláš", "holiday": ""}
globalCalendar[12][7] = {"name": "Ambrož, Benjamín", "holiday": ""}
globalCalendar[12][8] = {"name": "Květoslava", "holiday": ""}
globalCalendar[12][9] = {"name": "Vratislav", "holiday": ""}
globalCalendar[12][10] = {"name": "Julie", "holiday": ""}
globalCalendar[12][11] = {"name": "Dana", "holiday": ""}
globalCalendar[12][12] = {"name": "Simona", "holiday": ""}
globalCalendar[12][13] = {"name": "Lucie", "holiday": ""}
globalCalendar[12][14] = {"name": "Lýdie", "holiday": ""}
globalCalendar[12][15] = {"name": "Radana, Radan", "holiday": ""}
globalCalendar[12][16] = {"name": "Albína", "holiday": ""}
globalCalendar[12][17] = {"name": "Daniel", "holiday": ""}
globalCalendar[12][18] = {"name": "Miloslav", "holiday": ""}
globalCalendar[12][19] = {"name": "Ester", "holiday": ""}
globalCalendar[12][20] = {"name": "Dagmar", "holiday": ""}
globalCalendar[12][21] = {"name": "Natálie", "holiday": ""}
globalCalendar[12][22] = {"name": "Šimon, Simon", "holiday": ""}
globalCalendar[12][23] = {"name": "Vlasta", "holiday": ""}
globalCalendar[12][24] = {"name": "Adam a Eva", "holiday": "Štědrý den"}
globalCalendar[12][25] = {"name": "", "holiday": "Boží hod vánoční, 1. svátek vánoční"}
globalCalendar[12][26] = {"name": "Štěpán", "holiday": "2. svátek vánoční"}
globalCalendar[12][27] = {"name": "Žaneta", "holiday": ""}
globalCalendar[12][28] = {"name": "Bohumila", "holiday": ""}
globalCalendar[12][29] = {"name": "Judita", "holiday": ""}
globalCalendar[12][30] = {"name": "David", "holiday": ""}
globalCalendar[12][31] = {"name": "Silvestr", "holiday": ""}

zodiacDates = { 1  : ((21, 3), (20, 4)), #beran
                2  : ((21, 4), (21, 5)), #byk
                3  : ((22, 5), (21, 6)), #blizenci
                4  : ((22, 6), (22, 7)), #rak
                5  : ((23, 7), (22, 8)), #lev
                6  : ((23, 8), (22, 9)), #panna
                7  : ((23, 9), (23, 10)), #vahy
                8  : ((24, 10), (22, 11)), #stir
                9  : ((23, 11), (21, 12)), #strelec
                10 : ((22, 12), (31, 12)), #kozoroh1
               185 : ((1, 1), (1, 1)), #1.1. - uzivatel, ktery to nezadal,
                                           #nebo se narodil na novy rok
                                           #je to trochu hack, ale vzhledem
                                           #k tomu, jak to ma ulozene rus
                                           #je to nutnost
               - 10 : ((2, 1), (20, 1)), #kozoroh2
                11 : ((21, 1), (20, 2)), #vodnar
                12 : ((21, 2), (20, 3)) } #ryba

def getZodiacByDate(day, month):
    for k, v in zodiacDates.iteritems():
        if day + month * 100 >= v[0][0] + v[0][1] * 100 \
            and day + month * 100 <= v[1][0] + v[1][1] * 100:

            return abs(k)
        #endif
    #endfor
    raise Exception("Bad date %s. %s.!" % (day, month))
#enddef
