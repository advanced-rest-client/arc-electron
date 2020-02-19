set CSC_NAME=Pawel Psztyc
set CSC_LINK=advancedrestclient.pfx
set WIN_CSC_LINK=advancedrestclient.pfx

: The password is set in the profile's variables

./node_modules/.bin/electron-builder -w
electron-windows-store --input-directory dist\win-unpacked --output-directory dist\arc-win --package-version 15.0.1.0 --package-name AdvancedRestClient --publisher-display-name 'Pawel Psztyc' --publisher 'CN=D213CA20-88CE-42AC-A9F2-C5D41BF04550' --assets 'build\appx' --identity-name '48695PawelPsztyc.advanced-rest-client'

: Publish to https://partner.microsoft.com/en-us/dashboard/products/9NMQQT55RBRC/submissions/
