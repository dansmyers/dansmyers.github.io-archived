---
layout: post
title:  "Setting up an Enterprise Wi-fi Connection on the Raspberry Pi"
date:   2016-09-29
categories: systems, classes
---

New for this year, I'm using the Raspberry Pi as the hardward platform in our Introduction to Computer Systems course. The students have been working through a series of labs on setting up the Pi and getting used to working in a console-based Linux environment.

The first lab required them to set up a connection to the campus wireless network. This turns out to be a little tricky. The official Raspberry Pi docs describe [setting up a wireless connection](https://www.raspberrypi.org/documentation/configuration/wireless/wireless-cli.md), but our network uses WPA-EAP enterprise authentication.

The basic process for command-line wi-fi configuration is to first log in to the Pi and open a terminal; we do this by making a direct connection between the Pi and desktop Mac, then using the Mac's terminal application and `ssh`. Once you have a console on the Pi, edit the file `/etc/wpa_supplicant/wpa_supplicant.conf` to configure the wireless connection.

After a little hunting, including some help from [this post](https://www.raspberrypi.org/forums/viewtopic.php?f=36&t=44029), I came up with a configuration file that worked.

```
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
	ssid="NetworkNameGoesHere"
	proto=RSN
	key_mgmt=WPA-EAP
	pairwise=CCMP
	auth_alg=OPEN
	eap=PEAP
	identity="UserNameGoesHere"
	password="PasswordGoesHere"
	phase1="peapver=0"
	phase2="MSCHAPV2"
}
```

This won't, of course, work out-of-the-box on every single network, but it might be a useful starting point for anyone else dealing with the same issue.

To set this up from the command line, run

```
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
```

Copy and paste (or type) the configuration file into the editor. Note that the network name, user name, and password must be enclosed in quotes and there can be no extra spaces around the `=` characters. Save the file by pressing CTRL + o and then ENTER, then press CTRL + x to exit the `nano` editor.

We found that 

```
sudo reboot 
```

was required to make the changes take effect.

### Security?

Of course, storing your password in plain text seems unwise, so let's modify the configuration file to store the **hash** of the password instead.

First, generate a hash from the Pi's console:

```
echo -n YourRealPasswordGoesHere | iconv -t utf16le | openssl md4
```

This will print something like

```
(stdin)= e1cdef0c56789db0123456789abcdef
```

Reopen the `wpa-supplicant.conf` file and modify the `password` line in the configuration file to look like the following:

```
password=hash:e1cdef0c56789db0123456789abcdef
```

Note that quotes are no longer required.

An additonal `sudo reboot` will probably be required to re-authenticate to the network.

For a final step, clear your history so no one can recover your password by snooping through your previous commands:

```
history -c
history -n
```
