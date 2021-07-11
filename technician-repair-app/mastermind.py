#!/usr/bin/env python3

'''
Load- Load Utility X to Chip Y

Show - Shows the current loadout

Execute - running the loadout and getting the feedback
'''
import time, sys
from time import sleep
import math
import string
import keyword
import os
from ctypes import windll
from urllib import request
import importlib.util
import random

os.system('cls')  # For Windows
os.system('clear')  # For Linux/OS X

conf = {}

### current sequence
SEQUENCE = []

# locate config
def get_drives():
    drives = []
    bitmask = windll.kernel32.GetLogicalDrives()
    for letter in string.ascii_uppercase:
        if bitmask & 1:
            drives.append(letter)
        bitmask >>= 1

    return drives

configFound = False
configPath = ""
for drive in get_drives():
	if os.path.exists(drive + ":/mastermind_config.py"):
		configPath = drive + ":/mastermind_config.py"
		configFound = True
#configPath = "mastermind_config.py"
#configFound = True


def sendRequest():
	print("transmitting data to server...\n")
	for i in range(8):
		print("sending...\n")
		sleep(1)
		try:
			r = request.Request(conf.HTTP_URL)
			res = request.urlopen(r)
			if res.status == 200:
				print("transmission complete.")
				sleep(1)
				return
		except:
			continue
	print("error transmitting data to server.")
	sleep(1)
	raise()
	


def fakeCode(l, message, actions):
	letters = string.ascii_lowercase + string.ascii_uppercase
	keyphrases = ["transmission...", "radial controls...", "ciphers...", "phases...", "chips...", "utilities..."]
	strings = ""
	r = ["\n".join(["".join([random.choice(letters) for i in range(50)]) for x in range(random.randint(1,5))]) for o in range(l)]
	for i in r:
		strings = strings + "\n" + "\n".join([random.choice(actions) + " " + random.choice(keyphrases) for i in range(random.randint(1,3))]) + "\n\n" + i + "\n"
		strings = strings + " ".join(["0x" + "".join([str(random.randint(0,9)) for x in range(2)]) for o in range(10)]) + str(random.randint(0,9)) + "\n"
		strings = strings + " ".join(["0x" + "".join([str(random.randint(0,9)) for x in range(2)]) for o in range(10)]) + str(random.randint(0,9)) + "\n"
	strings = strings + "\n" + "\n".join([random.choice(actions) + " " + random.choice(keyphrases) for i in range(random.randint(1,3))]) + "\n\n" + i + "\n"
	strings = strings + ("\n%s\n" % message)
	index = 0
	while index < len(strings):
		offset = random.randint(1,3)
		print(strings[index:index + offset], end = '')
		index = index + offset
		sleep(float(random.randint(1,5))/500)


def compare():
 
	# comparison
	r = conf.CODE == SEQUENCE

	# do the proper calculation of the hints here
	hints = []
	code_copy = list(conf.CODE)
	seq_copy = list(SEQUENCE)

	# find exact matches
	dels = 0
	for index, s in enumerate(SEQUENCE):
		# exact match
		if s == conf.CODE[index]:
			# exact match pin
			del code_copy[index - dels]
			del seq_copy[index - dels]
			dels = dels + 1
			hints.append("effective")

	for s in seq_copy:
		if s in code_copy:
			code_copy.remove(s)
			hints.append("effective on another chip")

	random.shuffle(hints)
	return r, hints

def show():
	for index, b in enumerate(conf.BOARD):
		print("##################################################")
		print("##                                              ##")
		print("##                   PHASE %s                   ##" % str(index + 1).ljust(2))
		print("##                                              ##")

		print("##                   SEQUENCE                   ##")
		print("##                                              ##")

		#chips = "[ %s ]" % (" ").join(b["sequence"])
		chips = " ".join(["%s:%s" % (conf.CHIPS[i], b["sequence"][i]) for i in range(conf.N_CHIPS)])
		print("##%s%s%s##" % (" "*int(math.ceil((46 - len(chips))/2)), chips, " "*int(math.floor((46 - len(chips))/2))))

		print("##                                              ##")
		print("##                    HINTS                     ##")
		print("##                                              ##")
		hints = b["hints"]
		if(len(hints) == 0):
			print("##             no feedback available.           ##")
		for i in set(hints):
			c = hints.count(i)
			inner = "%dx %s %s" % (c, "utility" if c == 1 else "utilities", i)
			print("##%s%s%s##" % (" "*int(math.ceil((46 - len(inner))/2)), inner, " "*int(math.floor((46 - len(inner))/2))))


		print("##################################################")

def load(util_name, chip_name):

	# errors
	if util_name not in conf.UTILITIES:
		return False, "utility must be valid: " + (" ,").join(conf.UTILITIES)
	if chip_name not in conf.CHIPS:
		return False, "chip must be valid: " + (" ,").join(conf.CHIPS)

	chip_n = conf.CHIPS.index(chip_name)
	SEQUENCE[chip_n] = util_name
	return True, "loaded %s into %s." % (util_name, chip_name)

def commands():
	print("##################################################")
	print("##                                              ##")
	print("##                   COMMANDS                   ##")
	print("##                                              ##")
	print("##################################################")
	print("##                                              ##")
	print("##               load utilX chipY               ##")
	print("##                    execute                   ##")
	print("##                    commands                  ##")
	print("##                  show phases                 ##")
	print("##                   show chips                 ##")
	print("##                 show utilities               ##")
	print("##                                              ##")
	print("##################################################")
	print("##################################################")

def printHints(hints):
	if(len(hints) == 0):
		print("no feedback available.")
	for i in set(hints):
		c = hints.count(i)
		print("%dx %s %s" % (c, "utility" if c == 1 else "utilities", i))

def pregame():
	fakeCode(10, "PROGRAM INITIATED.", ["testing", "activating", "opening", "allocating", "hooking", "creating", "notifying", "enhancing", "signalling"])
	commands()

def loading(pre, post):
	for i in range(21):
		sys.stdout.write('\r')
		sys.stdout.write("%s%s" % (pre, " "*5))
	    # the exact output you're looking for:
		sys.stdout.write("[%-20s] %d%%" % ('='*i, 5*i))
		sys.stdout.flush()
		sleep(conf.LOAD_TIME)
	sys.stdout.write('\r')
	sys.stdout.write(post + " "*50)
	print()

def main():

	global SEQUENCE

	pregame()
	
	# for each turn while unsolved try again
	turn = 0
	while turn < conf.N_TURNS:

		# loop until valid input for turn
		command_passed = False
		while not command_passed:
			command_passed = True
			chips = " ".join(["%s:%s" % (conf.CHIPS[i], SEQUENCE[i]) for i in range(conf.N_CHIPS)])
			command = input("phase %d%s [ %s ]: " % (turn + 1, " " if turn != conf.N_TURNS - 1 else " (final phase) ", chips)).split(" ")

			# parse command: LOAD
			if(len(command) == 3 
				and command[0].lower() == "load" 
				and command[1] in conf.UTILITIES
				and command[2] in conf.CHIPS):
				r, message = load(command[1], command[2])
				print(message)
			elif(len(command) == 2 
				and command[0].lower() == "show" 
				and command[1].lower() in "phases"):
				show()
			elif(len(command) == 2 
				and command[0].lower() == "show" 
				and command[1].lower() in "chips"):
				print("valid chips: %s" % (", ").join(conf.CHIPS))
			elif(len(command) == 2 
				and command[0].lower() == "show" 
				and command[1].lower() in "utilities"):
				print("valid utilities: %s" % (", ").join(conf.UTILITIES))
			elif(("").join(command).lower() == "commands"):
				commands()
			elif(("").join(command).lower() == "execute"):
				# increment turn
				turn = turn + 1
				# check if SEQUENCE is correct
				r, hints = compare()
				conf.BOARD.append({
					"sequence":	SEQUENCE,
					"hints":	hints 
				})
				SEQUENCE = ["_" for i in range(conf.N_CHIPS)]
				if(r):
					loading("executing...", "repaired.")
					sleep(1)
					sendRequest()
					sleep(3)
					return
				
				loading("executing...", "unable to repair.")

				# show hints for most recent sequence
				printHints(hints)

			else:
				print("invalid command.")
				command_passed = False
	sleep(1)
	raise()

# try to find repair.txt
if configFound:
	spec = importlib.util.spec_from_file_location("module.name", configPath)
	conf = importlib.util.module_from_spec(spec)
	spec.loader.exec_module(conf)

	SEQUENCE = ["_" for i in range(conf.N_CHIPS)]

	try:
		main()
	except Exception as e:
		print("\nERROR! REPAIR ATTEMPTS EXCEEDED.\n")
		sleep(3)
		fakeCode(4, "PROGRAM TERMINATED.", ["terminating", "deactivating", "unloading", "deallocation of", "unhooking", "closing"])
		sleep(1)
		sys.exit()

	fakeCode(3, "PROGRAM TERMINATED.\n", ["terminating", "deactivating", "unloading", "deallocation of", "unhooking", "closing"])
	sleep(1)
	sys.exit()
else:
	fakeCode(2, "ERROR! NO CHIPS OR UTILITIES DETECTED. PROGRAM TERMINATED.\n", ["searching for ", "seeking", "locating", "hosting", "connecting", "finding", "making", "building"])
	sleep(3)