---
description: >-
  Advanced REST Client Chrome application is different from its desktop
  counterpart. This page describes how to move from deprecated Chrome
  application to desktop client.
---

# Moving From Chrome Application To Desktop Client

## Step 1: install desktop client

Go to [https://install.advancedrestclient.com/install](https://install.advancedrestclient.com/install) to install latest version of Advanced REST Client if you haven't already.

## Step 2: export data from Chrome application

Open Chrome application. You can recognize it by green baner in the left-bottom corner saying "**Install new ARC with new features!**"

In the top right application menu select Import and export data.

![Chrome application menu](.gitbook/assets/image%20%2835%29.png)

Click on the **Prepare data** button to create export object. Depending on the amount of data it may take a minute or two.

![Export configuration options](.gitbook/assets/image%20%2827%29.png)

On the next screen choose "Download file" tile. 

{% hint style="warning" %}
Do not export to Google Drive as desktop client don't have access to the data created by Chrome application.
{% endhint %}

![Export destination options](.gitbook/assets/image%20%2834%29.png)

This opens a dialog to save the file on disk. Select any location to store the file. We will use this file later to import it in desktop client.

## Step 3: import data to desktop client

Once the data export from Chrome application is ready import it to the desktop client.

Open Advanced REST Client desktop application.

{% hint style="info" %}
At this point your system tells you there are two Advanced REST Client applications installed: Chrome application and desktop client. The desktop client has slightly lighter shade of blue in application icon.
{% endhint %}

Select **File** &gt; **Import data** from application system menu.

![Import menu option in Advanced REST Client](.gitbook/assets/image%20%2855%29.png)

In the import screen choose "Open from file" option and point to the file saved in the previous step. After the data are processed the import inspector screen is rendered.

The inspector screen contains list of all data about to be imported to the application.

![Import data inspector](.gitbook/assets/image%20%2813%29.png)

You can to ignore some data if you wish. When finished press "Import data" button at the bottom of the screen.The "Data are now saved in the datastore" message should appear. The data are now moved to the desktop client.

## Step 4: uninstall chrome application

Don't get confused by having two applications installed in your system. Uninstall Chrome application using Chrome options. Open `chrome://apps/` page and find the application in the list of applications. Right click on the application icon and choose "**Remove from Chrome...**" option.

![Removing ARC from Chrome](.gitbook/assets/image%20%2816%29.png)

That's it. You have successfully migrated from Chrome application to desktop client.

