Advanced Rest Client Application
=================

Welcome to the ARC's project repository. Please, read [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) and [ROADMAP.md](ROADMAP.md) files for more information.

## Development
You are welcome to contribute to the project. To start developing use following instructions.

I assume you have [Node.js][1] already installed on your machine.

Start with forking the repository and getting the code

```shell
git clone https://github.com/[your username]/arc-electron.git
```

If you're not planing to contribute (you will not send a pull request) you can clone this repository:

```shell
git clone https://github.com/advanced-rest-client/arc-electron
```

When ready go to the directory:

```shell
cd arc-electron
```

Then install dependencies:
```shell
npm install && npm run bower
```

Take a coffee break. It will take a while... You can also install [gifi][gifi], a wrapper for `npm install` that will display a random gif while waiting for npm:

![](https://raw.githubusercontent.com/vdemedes/gifi/master/media/demo.gif)


When all dependencies are finally installed run

```shell
npm start
```

New application window is now opened.


Thanks for testing and don't forget to file an issue report if you find a bug.
You are also welcome to send a pull request with bug fixes. Please, read [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) file first.

## App design docs for developers
Please, read wiki in this repository.


 [1]: https://docs.npmjs.com/getting-started/installing-node "Install Node.js"
 [gifi]: https://github.com/vdemedes/gifi "watch GIFs while running npm install"
