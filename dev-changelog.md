## Security

-   Disabled node integration in the renderer process
-   Added content security policy to the application
-   Added preload script to be very specific about code that can be executed in the renderer process

## General

-   Upgraded Electron to version 4
-   Upgraded components to Polymer 2.0; Components now use Web Components specification v1.
-   Navigation now pop-ups from the application drawer (to enable go to Settings -> Experiments)
-   Redesigned navigation:
    -   Default screen is now workspace screen; other screens are sub-pages
    -   Access to web sockets is now in application menu > Request
    -   Added button to refresh list in the menu
    -   Deprecating "Saved" and added message to the menu.
    -   Navigation lists now comes with 3 size settings: default, comfortable, and compact (sounds like Gmail to you?). Change it in Settings > View
-   New settings panel
-   Parts of the application has been modularized and moved to external libraries (Payload processor, ARC preferences manager, Content search, Source manager, Cookie parser, Google Drive service, OAuth2 service, Request engine, Session manager)
-   Redesigning themes and sources loading process to support single components source. This simplifies application startup logic by a lot which makes it easier to test and maitain. Because of that the real Anypoint theme cannot be recreated (inputs, icons). Anypoint theme will use anypoint colors scheme only.
-   Adding dark theme
-   Adding an option to install theme from npm or GitHub repo.
-   Variables are now part of the application main toolbar instead of a request
-   Redesign of data models
-   Redesign of import / export logic. Now export also includes internal entity ID that will be restored when importing back to the application. Conflicts are resolved to new accept incoming data.
-   Duplicate request: new context menu option for request workspace tabs.
-   The app now accept `--debug` command line switch to enable detailed message tracing
-   Added file log output. The log file location dependes on the OS. See [electronjs.org/docs/api/app](https://electronjs.org/docs/api/app#appgetpathname).
-   Fixed units in Task manager
-   Task manager now renders processes names more accurately
-   Adding release channels. Now app support Stable, Beta, and Unstable release channels. Access settings in "About ARC" screen.
-   Task manager may no show memory info [electron#16179](https://github.com/electron/electron/issues/16179)
-   Adding new "File" menu entry to open a file from the filesystem [#111](https://github.com/advanced-rest-client/arc-electron/issues/111)

## Requests

-   Redesigned workspace experience
-   Increased workspace load time
-   Tabs can now be reordered
-   Removed headers sets
-   Added code examples to the request options
-   Request now can be saved in more than one project
-   New settings options:
    -   Disable local variables (defined in variables panel)
    -   Disable system variables
    -   Disable redirects
    -   Enable SSL certificates validation (disabled by default). To manage this setting go to Settings > Experiments
    -   Enable node native request instead of ARC's own HTTP client. Use it if you having trouble connecting to your web service. To manage this setting go to Settings > Experiments
-   Redesigned "save" dialogs and added request details dialog with stored metadata
-   When restoring workspace state latest response is also restored

## APIs

-   Upgraded API console to version 5
    -   This breaking change renders previously saved APIs incompatible with current version; APIs have to be re-imported
    -   API console now works with new AMF parser that allows to read RAML and OAS files
-   Fixing Anypoint sign in process
-   REST APIs stored before this version cannot be used with this version. Old console is not supported.
-   REST APIs are now stored as AMF ld+json model which enables future API spec editing

## Roadmap (future releases)

-   ARC plug-ins registry - enables users to install plugins and themes and share their plugins with the community
-   API visual designer to replace projects - this allows to create more advanced projects that can be later on exported to RAML or OAS spec
-   Exchange asset upload - adding created with visual designer APIs to Exchange
-   Integration with API monitoring by MuleSoft - enables application users to upload API test definition to API Monitoring to run API tests
-   Remove of "Saved" requests menu, screen and search option. All currently saved requests will become part of a "Saved" project
-   Upgrade components to use ES6 import instead of deprecated HTML imports.
