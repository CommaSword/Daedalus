import random

### default values
N_UTILITIES = 6
N_CHIPS = 4
N_TURNS = 12

LOAD_TIME = 0.05

# path to repair.txt
HTTP_URL = "http://www.google.com"

### here are the default chip and utility names
CHIPS = ["chip" + str(i) for i in range(1, N_CHIPS + 1)]
UTILITIES = ["util" + str(i) for i in range(1, N_UTILITIES + 1)]

### EXAMPLE FOR RENAMING CHIPS/UTILITIES
# CHIPS = ["A", "B", "C", "D"]
# UTILIES = ["MCM", "ABC", "RTF", "OOO", "EWQ", "OPE"]
# simply delete the "#" in the above two lines to use these 


########################## DON'T CHANGE BELOW ######################

UTILITIES = UTILITIES + ["_"]

### random generated code
CODE = [random.choice(UTILITIES) for i in range(N_CHIPS)]

### game board
BOARD = []