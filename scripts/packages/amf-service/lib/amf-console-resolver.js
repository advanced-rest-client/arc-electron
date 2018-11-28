const amf = require('amf-client-js');
amf.plugins.document.WebApi.register();
amf.plugins.document.Vocabularies.register();
amf.plugins.features.AMFValidation.register();
/**
 * Parses AMF ld+json model to AMF document.
 * The model has to be unresolved.
 *
 * @param {String} model
 * @return {Promise<Object>} AMF document.
 */
function modelToDoc(model) {
  const parser = amf.Core.parser('AMF Graph', 'application/ld+json');
  return parser.parseStringAsync(model);
}
/**
 * Generates resolved AMF model using editing pipeline (required by API console).
 * @param {Object} doc Parsed API document to AMF object.
 * @param {String} type API original type (RAML 1.0, OAS 2.0, etc)
 * @return {Promise<String>} A promise resolved to AMF object.
 */
function generateEditingResolvedModel(doc, type) {
  const resolver = amf.Core.resolver(type);
  doc = resolver.resolve(doc, 'editing');
  const generator = amf.Core.generator('AMF Graph', 'application/ld+json');
  const opts = amf.render.RenderOptions().withSourceMaps.withCompactUris;
  return generator.generateString(doc, opts);
}

class AmfConsoleResolver {
  /**
   * Resolves unresolved AMF model to API console's resolved model with
   * editing pipeline.
   * @param {String} model Unresolved AMF ld+json model
   * @param {String} originalType API original type (RAML 1.0, OAS 2.0, etc)
   * @return {Promise<String>} A promise resolved to AMF object.
   */
  static resolveApiConsole(model, originalType) {
    return amf.Core.init()
    .then(() => modelToDoc(model))
    .then((doc) => generateEditingResolvedModel(doc, originalType))
    .catch((cause) => {
      let m = `AMF parser: Unable to resolve AMF ld+json model.\n`;
      if (cause.message) {
        m += cause.message;
      } else if (cause.toString) {
        m += cause.toString();
      }
      throw new Error(m);
    });
  }
}
module.exports.AmfConsoleResolver = AmfConsoleResolver;
