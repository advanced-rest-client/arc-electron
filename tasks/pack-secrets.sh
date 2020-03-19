# This file is to remember how to create secrets.tar file. All secrets MUST be encoded in a single tar file.
# These files are required to build and sign ARC app.
tar cvf secrets.tar secrets/.env secrets/advancedrestclient.pfx secrets/arc-mac-certs.p12
travis encrypt-file secrets.tar
