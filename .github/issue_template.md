# Description of bug
The send button causes the app to close itself.

## Expected outcome
The app is not closing itself when I try to send a request.

## Actual outcome
After click it is working for couple of second and the it closes itself.

# Versions
App: 1.2.3 (check it in app's about page)
Chrome: Stable (or) 47.0.111.111 (check it in Chrome's about page)

# Steps to reproduce
1. Turn off CodeMirror
2. Set method to "PUT"
3. Use "raw" tab for both payload and headers
4. Paste following data into the headers field: ...
5. Paste following data into the payload field: ...
6. Run the request.
