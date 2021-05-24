# Pre-load scripts for all windows

Here is the location of all classes that are loaded in the pre-load scripts of a browser window.

The purpose of those is to provide an access to the application main thread through IPC.

ARC browser processes have disabled node integration (and they won't have it enabled). The way to deal with this is to create a class that deals with the logic in the renderer process or communicate with the IO process.

Before accessing the user's filesystem make sure that unusual paths are not read / altered by the script.
