# Contributing to ARC

First of all, we are happy you want to contribute to ARC open source project. ARC is a community driven project and we are open to your input. Before you start lets clear some things first so your contribution is accepted without unnecessary delays.

## Start with an issue report

Before you start working on any code or architecture, please, report an issue in `arc-electron`, `app`, or `base` repositories (more on this in a moment). This is crucial for open projects so the community can take a part in the discussion. Also, the project is being developed so we can predict upcoming changes. This way we will also be able to direct you in the right direction, like telling you where you can find relevant code. See below for more information.

## Code the change

### Distributed architecture

ARC and derivative applications (like API Console) are distributed among several repositories. This is to enable shareability and to solve few problems related to applications distribution.

The application consists of the following repositories:

- `advanced-rest-client/arc-electron` - the ARC Electron shell application. It uses UI prepared in other modules and provides Electron specific bindings. It is less likely you want to change anything here.
- `advanced-rest-client/app` - ARC's main application specific code. Combines all UI components into application screens and flows. You may want to make a change here if the change is related to general application flows and screens.
- `advanced-rest-client/base` - ARC's base UI components. Contains UI components and regions used in the `app` to build application screens. Most likely you want to introduce a change in here.
- `advanced-rest-client/libs` - Additional libraries shared between the repositories
- `advanced-rest-client/events` - The definition of the DOM events ARC uses to communicate with the components and the data store
- `advanced-rest-client/idb-store` - Local indexed db store for ARC.
- `anypoint-web-components/awc` - The base UI components used to build the views. Contains the most basic UI components like inputs, lists, drop downs, lists, etc.
- `api-components/amf-components` - The components related to generating the view from the AMF graph model. This is a base components for API Console by MuleSoft.

### Code and PR

After you have created an issue report and picked the right repository you now are enabled to code the change. After you finish **introduce relevant tests**. We can't accept PRs that contains an untested code. After that create a PR to the relevant repository. We will get back to you as soon as possible. Heel free to mention us directly in the PR so we will get a notification from GitHub.

### Things to consider

- Introduce changes that other users will benefit from
- Significant architecture changes make take longer to be accepted giving the complexity of the dependencies. ARC has a shared code with MuleSoft's API Console. We need to ensure the stability of both projects.
- Understand the reasons for the distributed architecture and honor the structure of the project. Most likely you want to introduce changes to the `base` repository. Less likely others.
- We are here to help. Ask us questions about the architecture or how stuff work.

### The preload scripts

Electron has something that is called a preload script. In short, these scripts are executed in the renderer thread, before the window is loaded, and these scripts has access to full NodeJS/Electron APIs. However, once the script is executed and the DOM is loaded, the web contents has no access to these APIs. ARC has a class called `ArcEnvironment` (src/preload/ArcEnvironment.js) that proxies some of the APIs that are required for the application to run. Please, don't rely on adding new proxies to this class until we find them justified.

When importing a new object to the `ArcEnvironment` class mind that when this script is executed there is no DOM so anything imported there cannot reference any of the DOM APIs. Instead, add an export to the `tasks/preload.js` file, run `npm run prepare` and import it through the `web_modules/preload.js` script.

------

That's it. We are thrilled seeing you contributing to the project. Drop us a message in case you have any questions.
