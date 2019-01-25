# Presence and Location for Homey

With this app you can define geofences like Home, Work or School. Whenever you enter or leave a geofence, you can let Homey know and Homey can act on this event.

Presence and Location has several flow cards that can be used:
- a card that will trigger when entering the specified geofence.
- a card that will trigger when leaving the specified geofence.
- a card that will trigger on a enter / leave event on the specified geofence. This card provides a tag that contains
  the event (i.e. the values can be enter or leave).
- a card that checks if there is one or more people in a given geofence.
- a card that triggers homey when the battery percentage of your phone is below a defined percentage.

This app supports the following activity cards:
- a card that let Homey speak out the current location of the user specified.

Speech support:
- You can ask Homey what the location of a user is. Homey will tell the name of the geofence. When the user is *not* in a geofence, Homey will try to find the adress based on the current coordinates of the user (using OpenStreet Maps).

## How does it work?
Every user needs to install a app on his or her phone that supports the [Owntracks specification](https://owntracks.org/) and needs to be connected to your Homey.  Apps for iOS and Android van be found in the [Google Play Store](https://play.google.com/store/apps/details?id=org.owntracks.android&hl=en_US) or [Apple store](https://itunes.apple.com/us/app/owntracks/id692424691).

In the apps you can specify the geofences and give names to them. The geofences will automatically be added in the Presence and Location app on Homey. The apps on your phone will transmit location data to your Homey and will tell Homey when you enter or leave a geofence.

## How to connect
There are two ways to connect your phone to Homey. First you can connect using the cloud environment from Athom. This is the easiest way and does not need any other apps. You just generate a token in the Homey app and enter a URL in the app on your phone. You can see a [tutorial](https://community.athom.com/t/owntracks-howto/5126) here.

The most secure solution is to use your own MQTT broker or create a private one in the cloud. CloudMQTT is a MQTT
hosting service that has a free hosting plan. See my [tutorial](https://forum.athom.com/discussion/2810/use-cloudmqtt-as-a-broker-for-owntracks-or-mqtt-app)
