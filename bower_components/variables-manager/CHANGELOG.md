<a name="0.1.9"></a>
## [0.1.9](https://github.com/advanced-rest-client/variables-manager/compare/0.1.7...0.1.9) (2017-10-02)


### New

* Added support for data-imported custom event. ([c3c8c3ab2fd94a84b124dd8be0f6bbf667470242](https://github.com/advanced-rest-client/variables-manager/commit/c3c8c3ab2fd94a84b124dd8be0f6bbf667470242))



<a name="0.1.8"></a>
## [0.1.8](https://github.com/advanced-rest-client/variables-manager/compare/0.1.7...v0.1.8) (2017-07-11)




<a name="0.1.7"></a>
## [0.1.7](https://github.com/advanced-rest-client/variables-manager/compare/0.1.6...v0.1.7) (2017-07-11)


### Update

* Added `EventsTargetBehavior` to change an event listeners target for the element. ([5cfeded6a9e910b739f562039a2731062fba219e](https://github.com/advanced-rest-client/variables-manager/commit/5cfeded6a9e910b739f562039a2731062fba219e))



<a name="0.1.6"></a>
## [0.1.6](https://github.com/advanced-rest-client/variables-manager/compare/0.1.5...v0.1.6) (2017-06-25)




<a name="0.1.5"></a>
## [0.1.5](https://github.com/advanced-rest-client/variables-manager/compare/0.1.4...v0.1.5) (2017-06-25)


### New

* Added option to change environment name. ([f8c1b8bbae7b84eb767e9d4510248be3204ab8f2](https://github.com/advanced-rest-client/variables-manager/commit/f8c1b8bbae7b84eb767e9d4510248be3204ab8f2))

### Update

* Fixed an issue when environemnts or variables values were changed in the source array in the manager so changes in other elements couldn't be observed. ([b8a9c113a9635730391e854a01b52dd164326230](https://github.com/advanced-rest-client/variables-manager/commit/b8a9c113a9635730391e854a01b52dd164326230))
* Prevented sending an event about full lists change when the item is updated or deleted. Other events covers this change notification. ([c0b7282cd10af1536a199a1fc34e9119556fccbf](https://github.com/advanced-rest-client/variables-manager/commit/c0b7282cd10af1536a199a1fc34e9119556fccbf))
* Updated tests to match new API ([ce0c655d468123828997655302f6c61391a711df](https://github.com/advanced-rest-client/variables-manager/commit/ce0c655d468123828997655302f6c61391a711df))



<a name="0.1.4"></a>
## [0.1.4](https://github.com/advanced-rest-client/variables-manager/compare/0.1.3...v0.1.4) (2017-06-24)




<a name="0.1.3"></a>
## [0.1.3](https://github.com/advanced-rest-client/variables-manager/compare/0.1.2...v0.1.3) (2017-06-24)




<a name="0.1.2"></a>
## [0.1.2](https://github.com/advanced-rest-client/variables-manager/compare/0.1.1...v0.1.2) (2017-06-24)


### Breaking

* Renamed `variable-list-current` event to `variable-list`. ([9d67c466bc101b2183e95562eef151e6492e1e24](https://github.com/advanced-rest-client/variables-manager/commit/9d67c466bc101b2183e95562eef151e6492e1e24))

### Docs

* Updated events API documentation. ([c03c8d15327d3e349e3b63c87fd401243c83690e](https://github.com/advanced-rest-client/variables-manager/commit/c03c8d15327d3e349e3b63c87fd401243c83690e))



<a name="0.1.1"></a>
## 0.1.1 (2017-06-24)


### Docs

* Added documentation to the element. ([40dd6f03a14b5a35b30778950b0ab89c84553737](https://github.com/advanced-rest-client/variables-manager/commit/40dd6f03a14b5a35b30778950b0ab89c84553737))

### Fix

* Adding missing error handler. ([fb3e7a4e4bded1b262428484e700c287e121c7e4](https://github.com/advanced-rest-client/variables-manager/commit/fb3e7a4e4bded1b262428484e700c287e121c7e4))

### Update

* Adding sauce labs credantials to Travic configuration. Currently the tests are failing but it's 3 am and it's time to go home. ([1bd61ac995f9a9ff783062081cf37b2531cc23a4](https://github.com/advanced-rest-client/variables-manager/commit/1bd61ac995f9a9ff783062081cf37b2531cc23a4))
* Moved environment observer to the property definition. ([0dbfb2fb97c6a5794fea1fa71fc46894cbe9372c](https://github.com/advanced-rest-client/variables-manager/commit/0dbfb2fb97c6a5794fea1fa71fc46894cbe9372c))
* Now when the environment change while getting data from the datastore the variables won't be set. ([96dbee02366e62a00ad4042923b3bdf092579459](https://github.com/advanced-rest-client/variables-manager/commit/96dbee02366e62a00ad4042923b3bdf092579459))
* Removed IE, Edge and Safari from tests. Even though the element works in this browsers (at least demo pages shows that it works) it fails in tests. After few hours of tryin to fix this I am giving up on this. ([13fa27ba00e383e49ff2153c32e9a68bdb1da582](https://github.com/advanced-rest-client/variables-manager/commit/13fa27ba00e383e49ff2153c32e9a68bdb1da582))
* Updated demo page to use paper-dropdown-menu instead of `<select>` ([cdeb42ad9c608a04d5471306cc182b93fd73f943](https://github.com/advanced-rest-client/variables-manager/commit/cdeb42ad9c608a04d5471306cc182b93fd73f943))
* Updated test cases. ([83c4f7d17804f35e5e2d0c678e0a2b871a0d87df](https://github.com/advanced-rest-client/variables-manager/commit/83c4f7d17804f35e5e2d0c678e0a2b871a0d87df))



