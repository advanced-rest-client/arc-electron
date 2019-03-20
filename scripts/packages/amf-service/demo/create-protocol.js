const {mainModule} = process;
const path = require('path');
const {error} = console;

function createProtocol(scheme, base, normalize = true) {
  const mimeTypeFor = require('./mime-types');
  const {app, protocol} = require('electron');
  const {URL} = require('url');
  const {readFile} = require('fs');
  const {_resolveFilename: resolve} = require('module');

  // Should only be called after app:ready fires
  if (!app.isReady()) {
    return app.on('ready', () => createProtocol(scheme, base, normalize));
  }

  // Normalize standard URLs to match file protocol format
  normalize = !normalize ?
    (url) => new URL(url).pathname :
    (url) => new URL(
      url.replace(/^.*?:[/]*/, `file:///`) // `${scheme}://./`
    ).pathname.replace(/[/]$/, '');

  // protocol.interceptBufferProtocol('file', (request, respond) => {
  //   let pathname = normalize(request.url);
  //   let mimeType = mimeTypeFor(pathname);
  //   console.log('RESOLVING', pathname);
  //   readFile(pathname, (err, data) => {
  //     if (err) {
  //       let filename = resolve('.' + pathname, mainModule);
  //       console.log('Module resolve', filename);
  //       readFile(filename, (err, data) => {
  //         if (err) {
  //           respond({error: err});
  //         } else {
  //           respond({
  //             mimeType,
  //             data
  //           });
  //         }
  //       });
  //     } else {
  //       respond({
  //         mimeType,
  //         data
  //       });
  //     }
  //   });
  // }, (exception) => {
  //   if (exception) {
  //     console.error(`Failed to intercept file ${scheme} protocol`, exception);
  //   }
  // });

  protocol.interceptFileProtocol('file', (request, respond) => {
    let pathname = new URL(request.url).pathname;
    const nodeIndex = pathname.indexOf('node_modules');
    if (nodeIndex !== -1) {
      console.log('NODE: ', pathname);
      // pathname = 'arc-modules://' + pathname.substr(nodeIndex + 13);
    }
    // console.log('request.url', request.url);
    console.log('pathname', pathname);
    // console.log('pathname2', pathname2);
    // const url = request.url.substr(6);
    // console.log('registerFileProtocol', url);
    // console.log('request.url', request.url);
    // console.log(path.normalize(`${__dirname}/${url}`));

    // let file = path.normalize(`${__dirname}/${url}`);
    // if (file[file.length - 1] === '/') {
    //   file = file.substr(0, file.length - 1);
    // }
    // console.log('interceptFileProtocol', file);
    respond({
      path: pathname
    });
  }, (exception) => {
    if (exception) {
      console.error(`Failed to intercept file ${scheme} protocol`, exception);
    }
  });

  protocol.registerHttpProtocol('arc-modules', (request, respond) => {
    let pathname = normalize(request.url);
    console.log('AM: pathname', pathname);
  }, (exception) => {
    if (exception) {
      console.error(`Failed to register arc-modules HTTP protocol`, exception);
    }
  });

  // protocol.registerBufferProtocol('arc-modules', (request, respond) => {
  //   let pathname = normalize(request.url);
  //   console.log('AM: pathname', pathname);
  // }, (exception) => {
  //   if (exception) {
  //     console.error(`Failed to register arc-modules protocol`, exception);
  //   }
  // });
return;

  protocol.registerBufferProtocol(
    scheme,
    (request, respond) => {
      let pathname;
      let filename;
      let data;
      let mimeType;

      try {
        // Get normalized pathname from url
        // console.log('request.url', request.url);
        pathname = normalize(request.url);
        // if (pathname.substr(0, 2) === '/@') {
        //   pathname = pathname.substr(1);
        // }
        // if (pathname.indexOf('/node_modules') === 0) {
        //   pathname = '..' + pathname;
        // }
        // if (pathname[0] === '/') {
        //   pathname = '.' + pathname;
        // }
        console.log('pathname', pathname);
        // Resolve absolute filepath relative to mainModule
        filename = resolve('.' + pathname, mainModule);
        console.log('filename', filename);
        // Read contents into a buffer
        data = read(filename);
        // Resolve mimeType from extension
        mimeType = mimeTypeFor(filename);
        // console.log('mimeType', mimeType);
        // Respond with mimeType & data
        respond({
          mimeType,
          data
        });
      } catch (exception) {
        console.error('registerBufferProtocol error:');
        console.error(exception);
        console.error('');
        console.error('request.url', request.url);
        console.error('pathname', pathname);
        console.error('filename', filename);
        console.error('data', data);
        console.error('mimeType', mimeType);
        console.error('');
      }
    },
    (exception) =>
    exception && error(`Failed to register ${scheme} protocol`, exception)
  );
}

module.exports = createProtocol;
