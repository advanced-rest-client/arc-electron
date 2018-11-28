const amf = require('amf-client-js');
amf.plugins.document.WebApi.register();
amf.plugins.document.Vocabularies.register();
amf.plugins.features.AMFValidation.register();
let initied = false;
/**
 * AMF parser to be called in a child process.
 *
 * AMF can in extreme cases takes forever to parse API data if, for example,
 * RAML type us defined as a number of union types. It may sometimes cause
 * the process to crash. To protect the renderer proces this is run as forked
 * process.
 */
process.on('message', (data) => {
  const sourceFile = data.source;
  const type = data.from.type;
  const contentType = data.from.contentType;
  const validate = data.validate;
  let p;
  if (initied) {
    p = Promise.resolve();
  } else {
    p = amf.Core.init();
  }
  p.then(() => {
    initied = true;
    const file = `file://${sourceFile}`;
    const parser = amf.Core.parser(type, contentType);
    return parser.parseFileAsync(file);
  })
  .then((doc) => {
    if (!validate) {
      return doc;
    }
    let validateProfile;
    switch (type) {
      case 'RAML 1.0': validateProfile = amf.ProfileNames.RAML; break;
      case 'RAML 0.8': validateProfile = amf.ProfileNames.RAML08; break;
      case 'OAS 1.0':
      case 'OAS 2.0':
      case 'OAS 3.0':
        validateProfile = amf.ProfileNames.OAS;
        break;
    }
    return amf.AMF.validate(doc, validateProfile)
    .then((result) => {
      process.send({validation: result.toString()});
      return doc;
    });
  })
  .then((doc) => {
    const generator = amf.Core.generator('AMF Graph', 'application/ld+json');
    return generator.generateString(doc);
  })
  .then((result) => {
    process.send({api: result});
  })
  .catch((cause) => {
    let m = `AMF parser: Unable to parse API ${sourceFile}.\n`;
    m += cause.s$1 || cause.message;
    process.send({error: m});
  });
});
