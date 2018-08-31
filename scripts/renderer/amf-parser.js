const amf = require('amf-client-js');
const generator = amf.Core.generator('AMF Graph', 'application/ld+json');
amf.plugins.document.WebApi.register();
amf.plugins.document.Vocabularies.register();
amf.plugins.features.AMFValidation.register();
process.on('message', (data) => {
  amf.Core.init().then(() => {
    data.source = `file://${data.source}`;
    const parser = amf.Core.parser(data.from.type, data.from.contentType);
    return parser.parseFileAsync(data.source);
  })
  .then((doc) => {
    let validateProfile;
    switch (data.from.type) {
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
    const resolver = amf.Core.resolver(data.from.type);
    doc = resolver.resolve(doc, 'editing');
    return generator.generateString(doc);
  })
  .then((result) => {
    process.send({api: JSON.parse(result)});
  })
  .catch((cause) => {
    let m = `AMF parser: Unable to parse the API ${this._apiFile}.\n`;
    m += cause.s$1 || cause.message;
    process.send({error: m});
  });
});
