// =========================================================================
//
// tinyxmlw3cdom.js - a W3C compliant DOM parser for XML for <SCRIPT> (compressed)
//
// version 3.1
//
// =========================================================================
//
// Copyright (C) 2002, 2003, 2004 Jon van Noort (jon@webarcana.com.au), David Joham (djoham@yahoo.com) and Scott Severtson
//
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 2.1 of the License, or (at your option) any later version.

// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.

// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
//
// visit the XML for <SCRIPT> home page at xmljs.sourceforge.net
//
// Contains text (used within comments to methods) from the
//  XML Path Language (XPath) Version 1.0 W3C Recommendation
//  Copyright � 16 November 1999 World Wide Web Consortium,
//  (Massachusetts Institute of Technology,
//  European Research Consortium for Informatics and Mathematics, Keio University).
//  All Rights Reserved.
//  (see: http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/)

function addClass(classCollectionStr, newClass) {
  if (classCollectionStr) {
    if (classCollectionStr.indexOf('|' + newClass + '|') < 0) {
      classCollectionStr += newClass + '|';
    }
  } else {
    classCollectionStr = '|' + newClass + '|';
  }
  return classCollectionStr;
}
DOMException = function(code) {
  this._class = addClass(this._class, 'DOMException');
  this.code = code;
};
DOMException.INDEX_SIZE_ERR = 1;
DOMException.DOMSTRING_SIZE_ERR = 2;
DOMException.HIERARCHY_REQUEST_ERR = 3;
DOMException.WRONG_DOCUMENT_ERR = 4;
DOMException.INVALID_CHARACTER_ERR = 5;
DOMException.NO_DATA_ALLOWED_ERR = 6;
DOMException.NO_MODIFICATION_ALLOWED_ERR = 7;
DOMException.NOT_FOUND_ERR = 8;
DOMException.NOT_SUPPORTED_ERR = 9;
DOMException.INUSE_ATTRIBUTE_ERR = 10;
DOMException.INVALID_STATE_ERR = 11;
DOMException.SYNTAX_ERR = 12;
DOMException.INVALID_MODIFICATION_ERR = 13;
DOMException.NAMESPACE_ERR = 14;
DOMException.INVALID_ACCESS_ERR = 15;
DOMImplementation = function() {
  this._class = addClass(this._class, 'DOMImplementation');
  this._p = null;
  this.preserveWhiteSpace = false;
  this.namespaceAware = true;
  this.errorChecking = true;
};
DOMImplementation.prototype.escapeString = function DOMNode__escapeString(str) {
  return __escapeString(str);
};
DOMImplementation.prototype.unescapeString = function DOMNode__unescapeString(str) {
  return __unescapeString(str);
};
DOMImplementation.prototype.hasFeature = function DOMImplementation_hasFeature(feature, version) {
  var ret = false;
  if (feature.toLowerCase() == 'xml') {
    ret = (!version || (version == '1.0') || (version == '2.0'));
  } else if (feature.toLowerCase() == 'core') {
    ret = (!version || (version == '2.0'));
  }
  return ret;
};
DOMImplementation.prototype.loadXML = function DOMImplementation_loadXML(xmlStr) {
  var parser;
  try {
    parser = new XMLP(xmlStr);
  } catch (e) {
    alert('Error Creating the SAX Parser. Did you include xmlsax.js or tinyxmlsax.js in your web page?\nThe SAX parser is needed to populate XML for <SCRIPT>\'s W3C DOM Parser with data.');
  }
  var doc = new DOMDocument(this);
  this._parseLoop(doc, parser);
  doc._parseComplete = true;
  return doc;
};
DOMImplementation.prototype.translateErrCode = function DOMImplementation_translateErrCode(code) {
  var msg = '';
  switch (code) {
    case DOMException.INDEX_SIZE_ERR:
      msg = 'INDEX_SIZE_ERR: Index out of bounds';
      break;
    case DOMException.DOMSTRING_SIZE_ERR:
      msg = 'DOMSTRING_SIZE_ERR: The resulting string is too long to fit in a DOMString';
      break;
    case DOMException.HIERARCHY_REQUEST_ERR:
      msg = 'HIERARCHY_REQUEST_ERR: The Node can not be inserted at this location';
      break;
    case DOMException.WRONG_DOCUMENT_ERR:
      msg = 'WRONG_DOCUMENT_ERR: The source and the destination Documents are not the same';
      break;
    case DOMException.INVALID_CHARACTER_ERR:
      msg = 'INVALID_CHARACTER_ERR: The string contains an invalid character';
      break;
    case DOMException.NO_DATA_ALLOWED_ERR:
      msg = 'NO_DATA_ALLOWED_ERR: This Node / NodeList does not support data';
      break;
    case DOMException.NO_MODIFICATION_ALLOWED_ERR:
      msg = 'NO_MODIFICATION_ALLOWED_ERR: This object cannot be modified';
      break;
    case DOMException.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR: The item cannot be found';
      break;
    case DOMException.NOT_SUPPORTED_ERR:
      msg = 'NOT_SUPPORTED_ERR: This implementation does not support function';
      break;
    case DOMException.INUSE_ATTRIBUTE_ERR:
      msg = 'INUSE_ATTRIBUTE_ERR: The Attribute has already been assigned to another Element';
      break;
    case DOMException.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR: The object is no longer usable';
      break;
    case DOMException.SYNTAX_ERR:
      msg = 'SYNTAX_ERR: Syntax error';
      break;
    case DOMException.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR: Cannot change the type of the object';
      break;
    case DOMException.NAMESPACE_ERR:
      msg = 'NAMESPACE_ERR: The namespace declaration is incorrect';
      break;
    case DOMException.INVALID_ACCESS_ERR:
      msg = 'INVALID_ACCESS_ERR: The object does not support this function';
      break;
    default:
      msg = 'UNKNOWN: Unknown Exception Code (' + code + ')';
  }
  return msg;
};
DOMImplementation.prototype._parseLoop = function DOMImplementation__parseLoop(doc, p) {
  var iEvt, iNode, iAttr, strName;
  iNodeParent = doc;
  var el_close_count = 0;
  var entitiesList = new Array();
  var textNodesList = new Array();
  if (this.namespaceAware) {
    var iNS = doc.createNamespace('');
    iNS.setValue('http://www.w3.org/2000/xmlns/');
    doc._namespaces.setNamedItem(iNS);
  }
  while (true) {
    iEvt = p.next();
    if (iEvt == XMLP._ELM_B) {
      var pName = p.getName();
      pName = trim(pName, true, true);
      if (!this.namespaceAware) {
        iNode = doc.createElement(p.getName());
        for (var i = 0; i < p.getAttributeCount(); i++) {
          strName = p.getAttributeName(i);
          iAttr = iNode.getAttributeNode(strName);
          if (!iAttr) {
            iAttr = doc.createAttribute(strName);
          }
          iAttr.setValue(p.getAttributeValue(i));
          iNode.setAttributeNode(iAttr);
        }
      } else {
        iNode = doc.createElementNS('', p.getName());
        iNode._namespaces = iNodeParent._namespaces._cloneNodes(iNode);
        for (var i = 0; i < p.getAttributeCount(); i++) {
          strName = p.getAttributeName(i);
          if (this._isNamespaceDeclaration(strName)) {
            var namespaceDec = this._parseNSName(strName);
            if (strName != 'xmlns') {
              iNS = doc.createNamespace(strName);
            } else {
              iNS = doc.createNamespace('');
            }
            iNS.setValue(p.getAttributeValue(i));
            iNode._namespaces.setNamedItem(iNS);
          } else {
            iAttr = iNode.getAttributeNode(strName);
            if (!iAttr) {
              iAttr = doc.createAttributeNS('', strName);
            }
            iAttr.setValue(p.getAttributeValue(i));
            iNode.setAttributeNodeNS(iAttr);
            if (this._isIdDeclaration(strName)) {
              iNode.id = p.getAttributeValue(i);
            }
          }
        }
        if (iNode._namespaces.getNamedItem(iNode.prefix)) {
          iNode.namespaceURI = iNode._namespaces.getNamedItem(iNode.prefix).value;
        }
        for (var i = 0; i < iNode.attributes.length; i++) {
          if (iNode.attributes.item(i).prefix != '') {
            if (iNode._namespaces.getNamedItem(iNode.attributes.item(i).prefix)) {
              iNode.attributes.item(i).namespaceURI = iNode._namespaces.getNamedItem(iNode.attributes.item(i).prefix).value;
            }
          }
        }
      }
      if (iNodeParent.nodeType == DOMNode.DOCUMENT_NODE) {
        iNodeParent.documentElement = iNode;
      }
      iNodeParent.appendChild(iNode);
      iNodeParent = iNode;
    } else if (iEvt == XMLP._ELM_E) {
      iNodeParent = iNodeParent.parentNode;
    } else if (iEvt == XMLP._ELM_EMP) {
      pName = p.getName();
      pName = trim(pName, true, true);
      if (!this.namespaceAware) {
        iNode = doc.createElement(pName);
        for (var i = 0; i < p.getAttributeCount(); i++) {
          strName = p.getAttributeName(i);
          iAttr = iNode.getAttributeNode(strName);
          if (!iAttr) {
            iAttr = doc.createAttribute(strName);
          }
          iAttr.setValue(p.getAttributeValue(i));
          iNode.setAttributeNode(iAttr);
        }
      } else {
        iNode = doc.createElementNS('', p.getName());
        iNode._namespaces = iNodeParent._namespaces._cloneNodes(iNode);
        for (var i = 0; i < p.getAttributeCount(); i++) {
          strName = p.getAttributeName(i);
          if (this._isNamespaceDeclaration(strName)) {
            var namespaceDec = this._parseNSName(strName);
            if (strName != 'xmlns') {
              iNS = doc.createNamespace(strName);
            } else {
              iNS = doc.createNamespace('');
            }
            iNS.setValue(p.getAttributeValue(i));
            iNode._namespaces.setNamedItem(iNS);
          } else {
            iAttr = iNode.getAttributeNode(strName);
            if (!iAttr) {
              iAttr = doc.createAttributeNS('', strName);
            }
            iAttr.setValue(p.getAttributeValue(i));
            iNode.setAttributeNodeNS(iAttr);
            if (this._isIdDeclaration(strName)) {
              iNode.id = p.getAttributeValue(i);
            }
          }
        }
        if (iNode._namespaces.getNamedItem(iNode.prefix)) {
          iNode.namespaceURI = iNode._namespaces.getNamedItem(iNode.prefix).value;
        }
        for (var i = 0; i < iNode.attributes.length; i++) {
          if (iNode.attributes.item(i).prefix != '') {
            if (iNode._namespaces.getNamedItem(iNode.attributes.item(i).prefix)) {
              iNode.attributes.item(i).namespaceURI = iNode._namespaces.getNamedItem(iNode.attributes.item(i).prefix).value;
            }
          }
        }
      }
      if (iNodeParent.nodeType == DOMNode.DOCUMENT_NODE) {
        iNodeParent.documentElement = iNode;
      }
      iNodeParent.appendChild(iNode);
    } else if (iEvt == XMLP._TEXT || iEvt == XMLP._ENTITY) {
      var pContent = p.getContent().substring(p.getContentBegin(), p.getContentEnd());
      if (!this.preserveWhiteSpace) {
        if (trim(pContent, true, true) == '') {
          pContent = '';
        }
      }
      if (pContent.length > 0) {
        var textNode = doc.createTextNode(pContent);
        iNodeParent.appendChild(textNode);
        if (iEvt == XMLP._ENTITY) {
          entitiesList[entitiesList.length] = textNode;
        } else {
          textNodesList[textNodesList.length] = textNode;
        }
      }
    } else if (iEvt == XMLP._PI) {
      iNodeParent.appendChild(doc.createProcessingInstruction(p.getName(), p.getContent().substring(p.getContentBegin(), p.getContentEnd())));
    } else if (iEvt == XMLP._CDATA) {
      pContent = p.getContent().substring(p.getContentBegin(), p.getContentEnd());
      if (!this.preserveWhiteSpace) {
        pContent = trim(pContent, true, true);
        pContent.replace(/ +/g, ' ');
      }
      if (pContent.length > 0) {
        iNodeParent.appendChild(doc.createCDATASection(pContent));
      }
    } else if (iEvt == XMLP._COMMENT) {
      var pContent = p.getContent().substring(p.getContentBegin(), p.getContentEnd());
      if (!this.preserveWhiteSpace) {
        pContent = trim(pContent, true, true);
        pContent.replace(/ +/g, ' ');
      }
      if (pContent.length > 0) {
        iNodeParent.appendChild(doc.createComment(pContent));
      }
    } else if (iEvt == XMLP._DTD) {} else if (iEvt == XMLP._ERROR) {
      throw (new DOMException(DOMException.SYNTAX_ERR));
    } else if (iEvt == XMLP._NONE) {
      if (iNodeParent == doc) {
        break;
      } else {
        throw (new DOMException(DOMException.SYNTAX_ERR));
      }
    }
  }
  var intCount = entitiesList.length;
  for (intLoop = 0; intLoop < intCount; intLoop++) {
    var entity = entitiesList[intLoop];
    var parentNode = entity.getParentNode();
    if (parentNode) {
      parentNode.normalize();
      if (!this.preserveWhiteSpace) {
        var children = parentNode.getChildNodes();
        var intCount2 = children.getLength();
        for (intLoop2 = 0; intLoop2 < intCount2; intLoop2++) {
          var child = children.item(intLoop2);
          if (child.getNodeType() == DOMNode.TEXT_NODE) {
            var childData = child.getData();
            childData = trim(childData, true, true);
            childData.replace(/ +/g, ' ');
            child.setData(childData);
          }
        }
      }
    }
  }
  if (!this.preserveWhiteSpace) {
    var intCount = textNodesList.length;
    for (intLoop = 0; intLoop < intCount; intLoop++) {
      var node = textNodesList[intLoop];
      if (node.getParentNode() != null) {
        var nodeData = node.getData();
        nodeData = trim(nodeData, true, true);
        nodeData.replace(/ +/g, ' ');
        node.setData(nodeData);
      }
    }
  }
};
DOMImplementation.prototype._isNamespaceDeclaration = function DOMImplementation__isNamespaceDeclaration(attributeName) {
  return (attributeName.indexOf('xmlns') > -1);
};
DOMImplementation.prototype._isIdDeclaration = function DOMImplementation__isIdDeclaration(attributeName) {
  return (attributeName.toLowerCase() == 'id');
};
DOMImplementation.prototype._isValidName = function DOMImplementation__isValidName(name) {
  return name.match(re_validName);
};
re_validName = /^[a-zA-Z_:][a-zA-Z0-9\.\-_:]*$/;
DOMImplementation.prototype._isValidString = function DOMImplementation__isValidString(name) {
  return (name.search(re_invalidStringChars) < 0);
};
re_invalidStringChars = /\x01|\x02|\x03|\x04|\x05|\x06|\x07|\x08|\x0B|\x0C|\x0E|\x0F|\x10|\x11|\x12|\x13|\x14|\x15|\x16|\x17|\x18|\x19|\x1A|\x1B|\x1C|\x1D|\x1E|\x1F|\x7F/;
DOMImplementation.prototype._parseNSName = function DOMImplementation__parseNSName(qualifiedName) {
  var resultNSName = new Object();
  resultNSName.prefix = qualifiedName;
  resultNSName.namespaceName = '';
  delimPos = qualifiedName.indexOf(':');
  if (delimPos > -1) {
    resultNSName.prefix = qualifiedName.substring(0, delimPos);
    resultNSName.namespaceName = qualifiedName.substring(delimPos + 1, qualifiedName.length);
  }
  return resultNSName;
};
DOMImplementation.prototype._parseQName = function DOMImplementation__parseQName(qualifiedName) {
  var resultQName = new Object();
  resultQName.localName = qualifiedName;
  resultQName.prefix = '';
  delimPos = qualifiedName.indexOf(':');
  if (delimPos > -1) {
    resultQName.prefix = qualifiedName.substring(0, delimPos);
    resultQName.localName = qualifiedName.substring(delimPos + 1, qualifiedName.length);
  }
  return resultQName;
};
DOMNodeList = function(ownerDocument, parentNode) {
  this._class = addClass(this._class, 'DOMNodeList');
  this._nodes = new Array();
  this.length = 0;
  this.parentNode = parentNode;
  this.ownerDocument = ownerDocument;
  this._readonly = false;
};
DOMNodeList.prototype.getLength = function DOMNodeList_getLength() {
  return this.length;
};
DOMNodeList.prototype.item = function DOMNodeList_item(index) {
  var ret = null;
  if ((index >= 0) && (index < this._nodes.length)) {
    ret = this._nodes[index];
  }
  return ret;
};
DOMNodeList.prototype._findItemIndex = function DOMNodeList__findItemIndex(id) {
  var ret = -1;
  if (id > -1) {
    for (var i = 0; i < this._nodes.length; i++) {
      if (this._nodes[i]._id == id) {
        ret = i;
        break;
      }
    }
  }
  return ret;
};
DOMNodeList.prototype._insertBefore = function DOMNodeList__insertBefore(newChild, refChildIndex) {
  if ((refChildIndex >= 0) && (refChildIndex < this._nodes.length)) {
    var tmpArr = new Array();
    tmpArr = this._nodes.slice(0, refChildIndex);
    if (newChild.nodeType == DOMNode.DOCUMENT_FRAGMENT_NODE) {
      tmpArr = tmpArr.concat(newChild.childNodes._nodes);
    } else {
      tmpArr[tmpArr.length] = newChild;
    }
    this._nodes = tmpArr.concat(this._nodes.slice(refChildIndex));
    this.length = this._nodes.length;
  }
};
DOMNodeList.prototype._replaceChild = function DOMNodeList__replaceChild(newChild, refChildIndex) {
  var ret = null;
  if ((refChildIndex >= 0) && (refChildIndex < this._nodes.length)) {
    ret = this._nodes[refChildIndex];
    if (newChild.nodeType == DOMNode.DOCUMENT_FRAGMENT_NODE) {
      var tmpArr = new Array();
      tmpArr = this._nodes.slice(0, refChildIndex);
      tmpArr = tmpArr.concat(newChild.childNodes._nodes);
      this._nodes = tmpArr.concat(this._nodes.slice(refChildIndex + 1));
    } else {
      this._nodes[refChildIndex] = newChild;
    }
  }
  return ret;
};
DOMNodeList.prototype._removeChild = function DOMNodeList__removeChild(refChildIndex) {
  var ret = null;
  if (refChildIndex > -1) {
    ret = this._nodes[refChildIndex];
    var tmpArr = new Array();
    tmpArr = this._nodes.slice(0, refChildIndex);
    this._nodes = tmpArr.concat(this._nodes.slice(refChildIndex + 1));
    this.length = this._nodes.length;
  }
  return ret;
};
DOMNodeList.prototype._appendChild = function DOMNodeList__appendChild(newChild) {
  if (newChild.nodeType == DOMNode.DOCUMENT_FRAGMENT_NODE) {
    this._nodes = this._nodes.concat(newChild.childNodes._nodes);
  } else {
    this._nodes[this._nodes.length] = newChild;
  }
  this.length = this._nodes.length;
};
DOMNodeList.prototype._cloneNodes = function DOMNodeList__cloneNodes(deep, parentNode) {
  var cloneNodeList = new DOMNodeList(this.ownerDocument, parentNode);
  for (var i = 0; i < this._nodes.length; i++) {
    cloneNodeList._appendChild(this._nodes[i].cloneNode(deep));
  }
  return cloneNodeList;
};
DOMNodeList.prototype.toString = function DOMNodeList_toString() {
  var ret = '';
  for (var i = 0; i < this.length; i++) {
    ret += this._nodes[i].toString();
  }
  return ret;
};
DOMNamedNodeMap = function(ownerDocument, parentNode) {
  this._class = addClass(this._class, 'DOMNamedNodeMap');
  this.DOMNodeList = DOMNodeList;
  this.DOMNodeList(ownerDocument, parentNode);
};
DOMNamedNodeMap.prototype = new DOMNodeList;
DOMNamedNodeMap.prototype.getNamedItem = function DOMNamedNodeMap_getNamedItem(name) {
  var ret = null;
  var itemIndex = this._findNamedItemIndex(name);
  if (itemIndex > -1) {
    ret = this._nodes[itemIndex];
  }
  return ret;
};
DOMNamedNodeMap.prototype.setNamedItem = function DOMNamedNodeMap_setNamedItem(arg) {
  if (this.ownerDocument.implementation.errorChecking) {
    if (this.ownerDocument != arg.ownerDocument) {
      throw (new DOMException(DOMException.WRONG_DOCUMENT_ERR));
    }
    if (this._readonly || (this.parentNode && this.parentNode._readonly)) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    }
    if (arg.ownerElement && (arg.ownerElement != this.parentNode)) {
      throw (new DOMException(DOMException.INUSE_ATTRIBUTE_ERR));
    }
  }
  var itemIndex = this._findNamedItemIndex(arg.name);
  var ret = null;
  if (itemIndex > -1) {
    ret = this._nodes[itemIndex];
    if (this.ownerDocument.implementation.errorChecking && ret._readonly) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    } else {
      this._nodes[itemIndex] = arg;
    }
  } else {
    this._nodes[this.length] = arg;
  }
  this.length = this._nodes.length;
  arg.ownerElement = this.parentNode;
  return ret;
};
DOMNamedNodeMap.prototype.removeNamedItem = function DOMNamedNodeMap_removeNamedItem(name) {
  var ret = null;
  if (this.ownerDocument.implementation.errorChecking && (this._readonly || (this.parentNode && this.parentNode._readonly))) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  var itemIndex = this._findNamedItemIndex(name);
  if (this.ownerDocument.implementation.errorChecking && (itemIndex < 0)) {
    throw (new DOMException(DOMException.NOT_FOUND_ERR));
  }
  var oldNode = this._nodes[itemIndex];
  if (this.ownerDocument.implementation.errorChecking && oldNode._readonly) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  return this._removeChild(itemIndex);
};
DOMNamedNodeMap.prototype.getNamedItemNS = function DOMNamedNodeMap_getNamedItemNS(namespaceURI, localName) {
  var ret = null;
  var itemIndex = this._findNamedItemNSIndex(namespaceURI, localName);
  if (itemIndex > -1) {
    ret = this._nodes[itemIndex];
  }
  return ret;
};
DOMNamedNodeMap.prototype.setNamedItemNS = function DOMNamedNodeMap_setNamedItemNS(arg) {
  if (this.ownerDocument.implementation.errorChecking) {
    if (this._readonly || (this.parentNode && this.parentNode._readonly)) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    }
    if (this.ownerDocument != arg.ownerDocument) {
      throw (new DOMException(DOMException.WRONG_DOCUMENT_ERR));
    }
    if (arg.ownerElement && (arg.ownerElement != this.parentNode)) {
      throw (new DOMException(DOMException.INUSE_ATTRIBUTE_ERR));
    }
  }
  var itemIndex = this._findNamedItemNSIndex(arg.namespaceURI, arg.localName);
  var ret = null;
  if (itemIndex > -1) {
    ret = this._nodes[itemIndex];
    if (this.ownerDocument.implementation.errorChecking && ret._readonly) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    } else {
      this._nodes[itemIndex] = arg;
    }
  } else {
    this._nodes[this.length] = arg;
  }
  this.length = this._nodes.length;
  arg.ownerElement = this.parentNode;
  return ret;
};
DOMNamedNodeMap.prototype.removeNamedItemNS = function DOMNamedNodeMap_removeNamedItemNS(namespaceURI, localName) {
  var ret = null;
  if (this.ownerDocument.implementation.errorChecking && (this._readonly || (this.parentNode && this.parentNode._readonly))) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  var itemIndex = this._findNamedItemNSIndex(namespaceURI, localName);
  if (this.ownerDocument.implementation.errorChecking && (itemIndex < 0)) {
    throw (new DOMException(DOMException.NOT_FOUND_ERR));
  }
  var oldNode = this._nodes[itemIndex];
  if (this.ownerDocument.implementation.errorChecking && oldNode._readonly) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  return this._removeChild(itemIndex);
};
DOMNamedNodeMap.prototype._findNamedItemIndex = function DOMNamedNodeMap__findNamedItemIndex(name) {
  var ret = -1;
  for (var i = 0; i < this._nodes.length; i++) {
    if (this._nodes[i].name == name) {
      ret = i;
      break;
    }
  }
  return ret;
};
DOMNamedNodeMap.prototype._findNamedItemNSIndex = function DOMNamedNodeMap__findNamedItemNSIndex(namespaceURI, localName) {
  var ret = -1;
  if (localName) {
    for (var i = 0; i < this._nodes.length; i++) {
      if ((this._nodes[i].namespaceURI == namespaceURI) && (this._nodes[i].localName == localName)) {
        ret = i;
        break;
      }
    }
  }
  return ret;
};
DOMNamedNodeMap.prototype._hasAttribute = function DOMNamedNodeMap__hasAttribute(name) {
  var ret = false;
  var itemIndex = this._findNamedItemIndex(name);
  if (itemIndex > -1) {
    ret = true;
  }
  return ret;
};
DOMNamedNodeMap.prototype._hasAttributeNS = function DOMNamedNodeMap__hasAttributeNS(namespaceURI, localName) {
  var ret = false;
  var itemIndex = this._findNamedItemNSIndex(namespaceURI, localName);
  if (itemIndex > -1) {
    ret = true;
  }
  return ret;
};
DOMNamedNodeMap.prototype._cloneNodes = function DOMNamedNodeMap__cloneNodes(parentNode) {
  var cloneNamedNodeMap = new DOMNamedNodeMap(this.ownerDocument, parentNode);
  for (var i = 0; i < this._nodes.length; i++) {
    cloneNamedNodeMap._appendChild(this._nodes[i].cloneNode(false));
  }
  return cloneNamedNodeMap;
};
DOMNamedNodeMap.prototype.toString = function DOMNamedNodeMap_toString() {
  var ret = '';
  for (var i = 0; i < this.length - 1; i++) {
    ret += this._nodes[i].toString() + ' ';
  }
  if (this.length > 0) {
    ret += this._nodes[this.length - 1].toString();
  }
  return ret;
};
DOMNamespaceNodeMap = function(ownerDocument, parentNode) {
  this._class = addClass(this._class, 'DOMNamespaceNodeMap');
  this.DOMNamedNodeMap = DOMNamedNodeMap;
  this.DOMNamedNodeMap(ownerDocument, parentNode);
};
DOMNamespaceNodeMap.prototype = new DOMNamedNodeMap;
DOMNamespaceNodeMap.prototype._findNamedItemIndex = function DOMNamespaceNodeMap__findNamedItemIndex(localName) {
  var ret = -1;
  for (var i = 0; i < this._nodes.length; i++) {
    if (this._nodes[i].localName == localName) {
      ret = i;
      break;
    }
  }
  return ret;
};
DOMNamespaceNodeMap.prototype._cloneNodes = function DOMNamespaceNodeMap__cloneNodes(parentNode) {
  var cloneNamespaceNodeMap = new DOMNamespaceNodeMap(this.ownerDocument, parentNode);
  for (var i = 0; i < this._nodes.length; i++) {
    cloneNamespaceNodeMap._appendChild(this._nodes[i].cloneNode(false));
  }
  return cloneNamespaceNodeMap;
};
DOMNamespaceNodeMap.prototype.toString = function DOMNamespaceNodeMap_toString() {
  var ret = '';
  for (var ind = 0; ind < this._nodes.length; ind++) {
    var ns = null;
    try {
      var ns = this.parentNode.parentNode._namespaces.getNamedItem(this._nodes[ind].localName);
    } catch (e) {
      break;
    }
    if (!(ns && ('' + ns.nodeValue == '' + this._nodes[ind].nodeValue))) {
      ret += this._nodes[ind].toString() + ' ';
    }
  }
  return ret;
};
DOMNode = function(ownerDocument) {
  this._class = addClass(this._class, 'DOMNode');
  if (ownerDocument) {
    this._id = ownerDocument._genId();
  }
  this.namespaceURI = '';
  this.prefix = '';
  this.localName = '';
  this.nodeName = '';
  this.nodeValue = '';
  this.nodeType = 0;
  this.parentNode = null;
  this.childNodes = new DOMNodeList(ownerDocument, this);
  this.firstChild = null;
  this.lastChild = null;
  this.previousSibling = null;
  this.nextSibling = null;
  this.attributes = new DOMNamedNodeMap(ownerDocument, this);
  this.ownerDocument = ownerDocument;
  this._namespaces = new DOMNamespaceNodeMap(ownerDocument, this);
  this._readonly = false;
};
DOMNode.ELEMENT_NODE = 1;
DOMNode.ATTRIBUTE_NODE = 2;
DOMNode.TEXT_NODE = 3;
DOMNode.CDATA_SECTION_NODE = 4;
DOMNode.ENTITY_REFERENCE_NODE = 5;
DOMNode.ENTITY_NODE = 6;
DOMNode.PROCESSING_INSTRUCTION_NODE = 7;
DOMNode.COMMENT_NODE = 8;
DOMNode.DOCUMENT_NODE = 9;
DOMNode.DOCUMENT_TYPE_NODE = 10;
DOMNode.DOCUMENT_FRAGMENT_NODE = 11;
DOMNode.NOTATION_NODE = 12;
DOMNode.NAMESPACE_NODE = 13;
DOMNode.prototype.hasAttributes = function DOMNode_hasAttributes() {
  if (this.attributes.length == 0) {
    return false;
  } else {
    return true;
  }
};
DOMNode.prototype.getNodeName = function DOMNode_getNodeName() {
  return this.nodeName;
};
DOMNode.prototype.getNodeValue = function DOMNode_getNodeValue() {
  return this.nodeValue;
};
DOMNode.prototype.setNodeValue = function DOMNode_setNodeValue(nodeValue) {
  if (this.ownerDocument.implementation.errorChecking && this._readonly) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  this.nodeValue = nodeValue;
};
DOMNode.prototype.getNodeType = function DOMNode_getNodeType() {
  return this.nodeType;
};
DOMNode.prototype.getParentNode = function DOMNode_getParentNode() {
  return this.parentNode;
};
DOMNode.prototype.getChildNodes = function DOMNode_getChildNodes() {
  return this.childNodes;
};
DOMNode.prototype.getFirstChild = function DOMNode_getFirstChild() {
  return this.firstChild;
};
DOMNode.prototype.getLastChild = function DOMNode_getLastChild() {
  return this.lastChild;
};
DOMNode.prototype.getPreviousSibling = function DOMNode_getPreviousSibling() {
  return this.previousSibling;
};
DOMNode.prototype.getNextSibling = function DOMNode_getNextSibling() {
  return this.nextSibling;
};
DOMNode.prototype.getAttributes = function DOMNode_getAttributes() {
  return this.attributes;
};
DOMNode.prototype.getOwnerDocument = function DOMNode_getOwnerDocument() {
  return this.ownerDocument;
};
DOMNode.prototype.getNamespaceURI = function DOMNode_getNamespaceURI() {
  return this.namespaceURI;
};
DOMNode.prototype.getPrefix = function DOMNode_getPrefix() {
  return this.prefix;
};
DOMNode.prototype.setPrefix = function DOMNode_setPrefix(prefix) {
  if (this.ownerDocument.implementation.errorChecking) {
    if (this._readonly) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    }
    if (!this.ownerDocument.implementation._isValidName(prefix)) {
      throw (new DOMException(DOMException.INVALID_CHARACTER_ERR));
    }
    if (!this.ownerDocument._isValidNamespace(this.namespaceURI, prefix + ':' + this.localName)) {
      throw (new DOMException(DOMException.NAMESPACE_ERR));
    }
    if ((prefix == 'xmlns') && (this.namespaceURI != 'http://www.w3.org/2000/xmlns/')) {
      throw (new DOMException(DOMException.NAMESPACE_ERR));
    }
    if ((prefix == '') && (this.localName == 'xmlns')) {
      throw (new DOMException(DOMException.NAMESPACE_ERR));
    }
  }
  this.prefix = prefix;
  if (this.prefix != '') {
    this.nodeName = this.prefix + ':' + this.localName;
  } else {
    this.nodeName = this.localName;
  }
};
DOMNode.prototype.getLocalName = function DOMNode_getLocalName() {
  return this.localName;
};
DOMNode.prototype.insertBefore = function DOMNode_insertBefore(newChild, refChild) {
  var prevNode;
  if (this.ownerDocument.implementation.errorChecking) {
    if (this._readonly) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    }
    if (this.ownerDocument != newChild.ownerDocument) {
      throw (new DOMException(DOMException.WRONG_DOCUMENT_ERR));
    }
    if (this._isAncestor(newChild)) {
      throw (new DOMException(DOMException.HIERARCHY_REQUEST_ERR));
    }
  }
  if (refChild) {
    var itemIndex = this.childNodes._findItemIndex(refChild._id);
    if (this.ownerDocument.implementation.errorChecking && (itemIndex < 0)) {
      throw (new DOMException(DOMException.NOT_FOUND_ERR));
    }
    var newChildParent = newChild.parentNode;
    if (newChildParent) {
      newChildParent.removeChild(newChild);
    }
    this.childNodes._insertBefore(newChild, this.childNodes._findItemIndex(refChild._id));
    prevNode = refChild.previousSibling;
    if (newChild.nodeType == DOMNode.DOCUMENT_FRAGMENT_NODE) {
      if (newChild.childNodes._nodes.length > 0) {
        for (var ind = 0; ind < newChild.childNodes._nodes.length; ind++) {
          newChild.childNodes._nodes[ind].parentNode = this;
        }
        refChild.previousSibling = newChild.childNodes._nodes[newChild.childNodes._nodes.length - 1];
      }
    } else {
      newChild.parentNode = this;
      refChild.previousSibling = newChild;
    }
  } else {
    prevNode = this.lastChild;
    this.appendChild(newChild);
  }
  if (newChild.nodeType == DOMNode.DOCUMENT_FRAGMENT_NODE) {
    if (newChild.childNodes._nodes.length > 0) {
      if (prevNode) {
        prevNode.nextSibling = newChild.childNodes._nodes[0];
      } else {
        this.firstChild = newChild.childNodes._nodes[0];
      }
      newChild.childNodes._nodes[0].previousSibling = prevNode;
      newChild.childNodes._nodes[newChild.childNodes._nodes.length - 1].nextSibling = refChild;
    }
  } else {
    if (prevNode) {
      prevNode.nextSibling = newChild;
    } else {
      this.firstChild = newChild;
    }
    newChild.previousSibling = prevNode;
    newChild.nextSibling = refChild;
  }
  return newChild;
};
DOMNode.prototype.replaceChild = function DOMNode_replaceChild(newChild, oldChild) {
  var ret = null;
  if (this.ownerDocument.implementation.errorChecking) {
    if (this._readonly) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    }
    if (this.ownerDocument != newChild.ownerDocument) {
      throw (new DOMException(DOMException.WRONG_DOCUMENT_ERR));
    }
    if (this._isAncestor(newChild)) {
      throw (new DOMException(DOMException.HIERARCHY_REQUEST_ERR));
    }
  }

  var index = this.childNodes._findItemIndex(oldChild._id);
  if (this.ownerDocument.implementation.errorChecking && (index < 0)) {
    throw (new DOMException(DOMException.NOT_FOUND_ERR));
  }
  var newChildParent = newChild.parentNode;
  if (newChildParent) {
    newChildParent.removeChild(newChild);
  }
  ret = this.childNodes._replaceChild(newChild, index);
  if (newChild.nodeType == DOMNode.DOCUMENT_FRAGMENT_NODE) {
    if (newChild.childNodes._nodes.length > 0) {
      for (var ind = 0; ind < newChild.childNodes._nodes.length; ind++) {
        newChild.childNodes._nodes[ind].parentNode = this;
      }
      if (oldChild.previousSibling) {
        oldChild.previousSibling.nextSibling = newChild.childNodes._nodes[0];
      } else {
        this.firstChild = newChild.childNodes._nodes[0];
      }
      if (oldChild.nextSibling) {
        oldChild.nextSibling.previousSibling = newChild;
      } else {
        this.lastChild = newChild.childNodes._nodes[newChild.childNodes._nodes.length - 1];
      }
      newChild.childNodes._nodes[0].previousSibling = oldChild.previousSibling;
      newChild.childNodes._nodes[newChild.childNodes._nodes.length - 1].nextSibling = oldChild.nextSibling;
    }
  } else {
    newChild.parentNode = this;
    if (oldChild.previousSibling) {
      oldChild.previousSibling.nextSibling = newChild;
    } else {
      this.firstChild = newChild;
    }
    if (oldChild.nextSibling) {
      oldChild.nextSibling.previousSibling = newChild;
    } else {
      this.lastChild = newChild;
    }
    newChild.previousSibling = oldChild.previousSibling;
    newChild.nextSibling = oldChild.nextSibling;
  }
  return ret;
};
DOMNode.prototype.removeChild = function DOMNode_removeChild(oldChild) {
  if (this.ownerDocument.implementation.errorChecking && (this._readonly || oldChild._readonly)) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  var itemIndex = this.childNodes._findItemIndex(oldChild._id);
  if (this.ownerDocument.implementation.errorChecking && (itemIndex < 0)) {
    throw (new DOMException(DOMException.NOT_FOUND_ERR));
  }
  this.childNodes._removeChild(itemIndex);
  oldChild.parentNode = null;
  if (oldChild.previousSibling) {
    oldChild.previousSibling.nextSibling = oldChild.nextSibling;
  } else {
    this.firstChild = oldChild.nextSibling;
  }
  if (oldChild.nextSibling) {
    oldChild.nextSibling.previousSibling = oldChild.previousSibling;
  } else {
    this.lastChild = oldChild.previousSibling;
  }
  oldChild.previousSibling = null;
  oldChild.nextSibling = null;
  return oldChild;
};
DOMNode.prototype.appendChild = function DOMNode_appendChild(newChild) {
  if (this.ownerDocument.implementation.errorChecking) {
    if (this._readonly) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    }
    if (this.ownerDocument != newChild.ownerDocument) {
      throw (new DOMException(DOMException.WRONG_DOCUMENT_ERR));
    }
    if (this._isAncestor(newChild)) {
      throw (new DOMException(DOMException.HIERARCHY_REQUEST_ERR));
    }
  }
  var newChildParent = newChild.parentNode;
  if (newChildParent) {
    newChildParent.removeChild(newChild);
  }
  this.childNodes._appendChild(newChild);
  if (newChild.nodeType == DOMNode.DOCUMENT_FRAGMENT_NODE) {
    if (newChild.childNodes._nodes.length > 0) {
      for (var ind = 0; ind < newChild.childNodes._nodes.length; ind++) {
        newChild.childNodes._nodes[ind].parentNode = this;
      }
      if (this.lastChild) {
        this.lastChild.nextSibling = newChild.childNodes._nodes[0];
        newChild.childNodes._nodes[0].previousSibling = this.lastChild;
        this.lastChild = newChild.childNodes._nodes[newChild.childNodes._nodes.length - 1];
      } else {
        this.lastChild = newChild.childNodes._nodes[newChild.childNodes._nodes.length - 1];
        this.firstChild = newChild.childNodes._nodes[0];
      }
    }
  } else {
    newChild.parentNode = this;
    if (this.lastChild) {
      this.lastChild.nextSibling = newChild;
      newChild.previousSibling = this.lastChild;
      this.lastChild = newChild;
    } else {
      this.lastChild = newChild;
      this.firstChild = newChild;
    }
  }
  return newChild;
};
DOMNode.prototype.hasChildNodes = function DOMNode_hasChildNodes() {
  return (this.childNodes.length > 0);
};
DOMNode.prototype.cloneNode = function DOMNode_cloneNode(deep) {
  try {
    return this.ownerDocument.importNode(this, deep);
  } catch (e) {
    return null;
  }
};
DOMNode.prototype.normalize = function DOMNode_normalize() {
  var inode;
  var nodesToRemove = new DOMNodeList();
  if (this.nodeType == DOMNode.ELEMENT_NODE || this.nodeType == DOMNode.DOCUMENT_NODE) {
    var adjacentTextNode = null;
    for (var i = 0; i < this.childNodes.length; i++) {
      inode = this.childNodes.item(i);
      if (inode.nodeType == DOMNode.TEXT_NODE) {
        if (inode.length < 1) {
          nodesToRemove._appendChild(inode);
        } else {
          if (adjacentTextNode) {
            adjacentTextNode.appendData(inode.data);
            nodesToRemove._appendChild(inode);
          } else {
            adjacentTextNode = inode;
          }
        }
      } else {
        adjacentTextNode = null;
        inode.normalize();
      }
    }
    for (var i = 0; i < nodesToRemove.length; i++) {
      inode = nodesToRemove.item(i);
      inode.parentNode.removeChild(inode);
    }
  }
};
DOMNode.prototype.isSupported = function DOMNode_isSupported(feature, version) {
  return this.ownerDocument.implementation.hasFeature(feature, version);
};
DOMNode.prototype.getElementsByTagName = function DOMNode_getElementsByTagName(tagname) {
  return this._getElementsByTagNameRecursive(tagname, new DOMNodeList(this.ownerDocument));
};
DOMNode.prototype._getElementsByTagNameRecursive = function DOMNode__getElementsByTagNameRecursive(tagname, nodeList) {
  if (this.nodeType == DOMNode.ELEMENT_NODE || this.nodeType == DOMNode.DOCUMENT_NODE) {
    if ((this.nodeName == tagname) || (tagname == '*')) {
      nodeList._appendChild(this);
    }
    for (var i = 0; i < this.childNodes.length; i++) {
      nodeList = this.childNodes.item(i)._getElementsByTagNameRecursive(tagname, nodeList);
    }
  }
  return nodeList;
};
DOMNode.prototype.getXML = function DOMNode_getXML() {
  return this.toString();
};
DOMNode.prototype.getElementsByTagNameNS = function DOMNode_getElementsByTagNameNS(namespaceURI, localName) {
  return this._getElementsByTagNameNSRecursive(namespaceURI, localName, new DOMNodeList(this.ownerDocument));
};
DOMNode.prototype._getElementsByTagNameNSRecursive = function DOMNode__getElementsByTagNameNSRecursive(namespaceURI, localName, nodeList) {
  if (this.nodeType == DOMNode.ELEMENT_NODE || this.nodeType == DOMNode.DOCUMENT_NODE) {
    if (((this.namespaceURI == namespaceURI) || (namespaceURI == '*')) && ((this.localName == localName) || (localName == '*'))) {
      nodeList._appendChild(this);
    }
    for (var i = 0; i < this.childNodes.length; i++) {
      nodeList = this.childNodes.item(i)._getElementsByTagNameNSRecursive(namespaceURI, localName, nodeList);
    }
  }
  return nodeList;
};
DOMNode.prototype._isAncestor = function DOMNode__isAncestor(node) {
  return ((this == node) || ((this.parentNode) && (this.parentNode._isAncestor(node))));
};
DOMNode.prototype.importNode = function DOMNode_importNode(importedNode, deep) {
  var importNode;
  this.getOwnerDocument()._performingImportNodeOperation = true;
  try {
    if (importedNode.nodeType == DOMNode.ELEMENT_NODE) {
      if (!this.ownerDocument.implementation.namespaceAware) {
        importNode = this.ownerDocument.createElement(importedNode.tagName);
        for (var i = 0; i < importedNode.attributes.length; i++) {
          importNode.setAttribute(importedNode.attributes.item(i).name, importedNode.attributes.item(i).value);
        }
      } else {
        importNode = this.ownerDocument.createElementNS(importedNode.namespaceURI, importedNode.nodeName);
        for (var i = 0; i < importedNode.attributes.length; i++) {
          importNode.setAttributeNS(importedNode.attributes.item(i).namespaceURI, importedNode.attributes.item(i).name, importedNode.attributes.item(i).value);
        }
        for (var i = 0; i < importedNode._namespaces.length; i++) {
          importNode._namespaces._nodes[i] = this.ownerDocument.createNamespace(importedNode._namespaces.item(i).localName);
          importNode._namespaces._nodes[i].setValue(importedNode._namespaces.item(i).value);
        }
      }
    } else if (importedNode.nodeType == DOMNode.ATTRIBUTE_NODE) {
      if (!this.ownerDocument.implementation.namespaceAware) {
        importNode = this.ownerDocument.createAttribute(importedNode.name);
      } else {
        importNode = this.ownerDocument.createAttributeNS(importedNode.namespaceURI, importedNode.nodeName);
        for (var i = 0; i < importedNode._namespaces.length; i++) {
          importNode._namespaces._nodes[i] = this.ownerDocument.createNamespace(importedNode._namespaces.item(i).localName);
          importNode._namespaces._nodes[i].setValue(importedNode._namespaces.item(i).value);
        }
      }
      importNode.setValue(importedNode.value);
    } else if (importedNode.nodeType == DOMNode.DOCUMENT_FRAGMENT) {
      importNode = this.ownerDocument.createDocumentFragment();
    } else if (importedNode.nodeType == DOMNode.NAMESPACE_NODE) {
      importNode = this.ownerDocument.createNamespace(importedNode.nodeName);
      importNode.setValue(importedNode.value);
    } else if (importedNode.nodeType == DOMNode.TEXT_NODE) {
      importNode = this.ownerDocument.createTextNode(importedNode.data);
    } else if (importedNode.nodeType == DOMNode.CDATA_SECTION_NODE) {
      importNode = this.ownerDocument.createCDATASection(importedNode.data);
    } else if (importedNode.nodeType == DOMNode.PROCESSING_INSTRUCTION_NODE) {
      importNode = this.ownerDocument.createProcessingInstruction(importedNode.target, importedNode.data);
    } else if (importedNode.nodeType == DOMNode.COMMENT_NODE) {
      importNode = this.ownerDocument.createComment(importedNode.data);
    } else {
      throw (new DOMException(DOMException.NOT_SUPPORTED_ERR));
    }
    if (deep) {
      for (var i = 0; i < importedNode.childNodes.length; i++) {
        importNode.appendChild(this.ownerDocument.importNode(importedNode.childNodes.item(i), true));
      }
    }
    this.getOwnerDocument()._performingImportNodeOperation = false;
    return importNode;
  } catch (eAny) {
    this.getOwnerDocument()._performingImportNodeOperation = false;
    throw eAny;
  }
};
DOMNode.prototype.__escapeString = function DOMNode__escapeString(str) {
  return __escapeString(str);
};
DOMNode.prototype.__unescapeString = function DOMNode__unescapeString(str) {
  return __unescapeString(str);
};
DOMDocument = function(implementation) {
  this._class = addClass(this._class, 'DOMDocument');
  this.DOMNode = DOMNode;
  this.DOMNode(this);
  this.doctype = null;
  this.implementation = implementation;
  this.documentElement = null;
  this.all = new Array();
  this.nodeName = '#document';
  this.nodeType = DOMNode.DOCUMENT_NODE;
  this._id = 0;
  this._lastId = 0;
  this._parseComplete = false;
  this.ownerDocument = this;
  this._performingImportNodeOperation = false;
};
DOMDocument.prototype = new DOMNode;
DOMDocument.prototype.getDoctype = function DOMDocument_getDoctype() {
  return this.doctype;
};
DOMDocument.prototype.getImplementation = function DOMDocument_implementation() {
  return this.implementation;
};
DOMDocument.prototype.getDocumentElement = function DOMDocument_getDocumentElement() {
  return this.documentElement;
};
DOMDocument.prototype.createElement = function DOMDocument_createElement(tagName) {
  if (this.ownerDocument.implementation.errorChecking && (!this.ownerDocument.implementation._isValidName(tagName))) {
    throw (new DOMException(DOMException.INVALID_CHARACTER_ERR));
  }
  var node = new DOMElement(this);
  node.tagName = tagName;
  node.nodeName = tagName;
  this.all[this.all.length] = node;
  return node;
};
DOMDocument.prototype.createDocumentFragment = function DOMDocument_createDocumentFragment() {
  var node = new DOMDocumentFragment(this);
  return node;
};
DOMDocument.prototype.createTextNode = function DOMDocument_createTextNode(data) {
  var node = new DOMText(this);
  node.data = data;
  node.nodeValue = data;
  node.length = data.length;
  return node;
};
DOMDocument.prototype.createComment = function DOMDocument_createComment(data) {
  var node = new DOMComment(this);
  node.data = data;
  node.nodeValue = data;
  node.length = data.length;
  return node;
};
DOMDocument.prototype.createCDATASection = function DOMDocument_createCDATASection(data) {
  var node = new DOMCDATASection(this);
  node.data = data;
  node.nodeValue = data;
  node.length = data.length;
  return node;
};
DOMDocument.prototype.createProcessingInstruction = function DOMDocument_createProcessingInstruction(target, data) {
  if (this.ownerDocument.implementation.errorChecking && (!this.implementation._isValidName(target))) {
    throw (new DOMException(DOMException.INVALID_CHARACTER_ERR));
  }
  var node = new DOMProcessingInstruction(this);
  node.target = target;
  node.nodeName = target;
  node.data = data;
  node.nodeValue = data;
  node.length = data.length;
  return node;
};
DOMDocument.prototype.createAttribute = function DOMDocument_createAttribute(name) {
  if (this.ownerDocument.implementation.errorChecking && (!this.ownerDocument.implementation._isValidName(name))) {
    throw (new DOMException(DOMException.INVALID_CHARACTER_ERR));
  }
  var node = new DOMAttr(this);
  node.name = name;
  node.nodeName = name;
  return node;
};
DOMDocument.prototype.createElementNS = function DOMDocument_createElementNS(namespaceURI, qualifiedName) {
  if (this.ownerDocument.implementation.errorChecking) {
    if (!this.ownerDocument._isValidNamespace(namespaceURI, qualifiedName)) {
      throw (new DOMException(DOMException.NAMESPACE_ERR));
    }
    if (!this.ownerDocument.implementation._isValidName(qualifiedName)) {
      throw (new DOMException(DOMException.INVALID_CHARACTER_ERR));
    }
  }
  var node = new DOMElement(this);
  var qname = this.implementation._parseQName(qualifiedName);
  node.nodeName = qualifiedName;
  node.namespaceURI = namespaceURI;
  node.prefix = qname.prefix;
  node.localName = qname.localName;
  node.tagName = qualifiedName;
  this.all[this.all.length] = node;
  return node;
};
DOMDocument.prototype.createAttributeNS = function DOMDocument_createAttributeNS(namespaceURI, qualifiedName) {
  if (this.ownerDocument.implementation.errorChecking) {
    if (!this.ownerDocument._isValidNamespace(namespaceURI, qualifiedName, true)) {
      throw (new DOMException(DOMException.NAMESPACE_ERR));
    }
    if (!this.ownerDocument.implementation._isValidName(qualifiedName)) {
      throw (new DOMException(DOMException.INVALID_CHARACTER_ERR));
    }
  }
  var node = new DOMAttr(this);
  var qname = this.implementation._parseQName(qualifiedName);
  node.nodeName = qualifiedName;
  node.namespaceURI = namespaceURI;
  node.prefix = qname.prefix;
  node.localName = qname.localName;
  node.name = qualifiedName;
  node.nodeValue = '';
  return node;
};
DOMDocument.prototype.createNamespace = function DOMDocument_createNamespace(qualifiedName) {
  var node = new DOMNamespace(this);
  var qname = this.implementation._parseQName(qualifiedName);
  node.nodeName = qualifiedName;
  node.prefix = qname.prefix;
  node.localName = qname.localName;
  node.name = qualifiedName;
  node.nodeValue = '';
  return node;
};
DOMDocument.prototype.getElementById = function DOMDocument_getElementById(elementId) {
  retNode = null;
  for (var i = 0; i < this.all.length; i++) {
    var node = this.all[i];
    if ((node.id == elementId) && (node._isAncestor(node.ownerDocument.documentElement))) {
      retNode = node;
      break;
    }
  }
  return retNode;
};
DOMDocument.prototype._genId = function DOMDocument__genId() {
  this._lastId += 1;
  return this._lastId;
};
DOMDocument.prototype._isValidNamespace = function DOMDocument__isValidNamespace(namespaceURI, qualifiedName, isAttribute) {
  if (this._performingImportNodeOperation == true) {
    return true;
  }
  var valid = true;
  var qName = this.implementation._parseQName(qualifiedName);
  if (this._parseComplete == true) {
    if (qName.localName.indexOf(':') > -1) {
      valid = false;
    }
    if ((valid) && (!isAttribute)) {
      if (!namespaceURI) {
        valid = false;
      }
    }
    if ((valid) && (qName.prefix == '')) {
      valid = false;
    }
  }
  if (valid && qName.prefix === 'xml' && (namespaceURI !== 'http://www.w3.org/XML/1998/namespace' && qName.localName !== 'base')) {
    valid = false;
  }
  return valid;
};
DOMDocument.prototype.toString = function DOMDocument_toString() {
  return '' + this.childNodes;
};
DOMElement = function(ownerDocument) {
  this._class = addClass(this._class, 'DOMElement');
  this.DOMNode = DOMNode;
  this.DOMNode(ownerDocument);
  this.tagName = '';
  this.id = '';
  this.nodeType = DOMNode.ELEMENT_NODE;
};
DOMElement.prototype = new DOMNode;
DOMElement.prototype.getTagName = function DOMElement_getTagName() {
  return this.tagName;
};
DOMElement.prototype.getAttribute = function DOMElement_getAttribute(name) {
  var ret = '';
  var attr = this.attributes.getNamedItem(name);
  if (attr) {
    ret = attr.value;
  }
  return ret;
};
DOMElement.prototype.setAttribute = function DOMElement_setAttribute(name, value) {
  var attr = this.attributes.getNamedItem(name);
  if (!attr) {
    attr = this.ownerDocument.createAttribute(name);
  }
  var value = new String(value);
  if (this.ownerDocument.implementation.errorChecking) {
    if (attr._readonly) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    }
    if (!this.ownerDocument.implementation._isValidString(value)) {
      throw (new DOMException(DOMException.INVALID_CHARACTER_ERR));
    }
  }
  if (this.ownerDocument.implementation._isIdDeclaration(name)) {
    this.id = value;
  }
  attr.value = value;
  attr.nodeValue = value;
  if (value.length > 0) {
    attr.specified = true;
  } else {
    attr.specified = false;
  }
  this.attributes.setNamedItem(attr);
};
DOMElement.prototype.removeAttribute = function DOMElement_removeAttribute(name) {
  return this.attributes.removeNamedItem(name);
};
DOMElement.prototype.getAttributeNode = function DOMElement_getAttributeNode(name) {
  return this.attributes.getNamedItem(name);
};
DOMElement.prototype.setAttributeNode = function DOMElement_setAttributeNode(newAttr) {
  if (this.ownerDocument.implementation._isIdDeclaration(newAttr.name)) {
    this.id = newAttr.value;
  }
  return this.attributes.setNamedItem(newAttr);
};
DOMElement.prototype.removeAttributeNode = function DOMElement_removeAttributeNode(oldAttr) {
  if (this.ownerDocument.implementation.errorChecking && oldAttr._readonly) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  var itemIndex = this.attributes._findItemIndex(oldAttr._id);
  if (this.ownerDocument.implementation.errorChecking && (itemIndex < 0)) {
    throw (new DOMException(DOMException.NOT_FOUND_ERR));
  }
  return this.attributes._removeChild(itemIndex);
};
DOMElement.prototype.getAttributeNS = function DOMElement_getAttributeNS(namespaceURI, localName) {
  var ret = '';
  var attr = this.attributes.getNamedItemNS(namespaceURI, localName);
  if (attr) {
    ret = attr.value;
  }
  return ret;
};
DOMElement.prototype.setAttributeNS = function DOMElement_setAttributeNS(namespaceURI, qualifiedName, value) {
  var attr = this.attributes.getNamedItem(namespaceURI, qualifiedName);
  if (!attr) {
    attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
  }
  var value = new String(value);
  if (this.ownerDocument.implementation.errorChecking) {
    if (attr._readonly) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    }
    if (!this.ownerDocument._isValidNamespace(namespaceURI, qualifiedName)) {
      throw (new DOMException(DOMException.NAMESPACE_ERR));
    }
    if (!this.ownerDocument.implementation._isValidString(value)) {
      throw (new DOMException(DOMException.INVALID_CHARACTER_ERR));
    }
  }
  if (this.ownerDocument.implementation._isIdDeclaration(name)) {
    this.id = value;
  }
  attr.value = value;
  attr.nodeValue = value;
  if (value.length > 0) {
    attr.specified = true;
  } else {
    attr.specified = false;
  }
  this.attributes.setNamedItemNS(attr);
};
DOMElement.prototype.removeAttributeNS = function DOMElement_removeAttributeNS(namespaceURI, localName) {
  return this.attributes.removeNamedItemNS(namespaceURI, localName);
};
DOMElement.prototype.getAttributeNodeNS = function DOMElement_getAttributeNodeNS(namespaceURI, localName) {
  return this.attributes.getNamedItemNS(namespaceURI, localName);
};
DOMElement.prototype.setAttributeNodeNS = function DOMElement_setAttributeNodeNS(newAttr) {
  if ((newAttr.prefix == '') && this.ownerDocument.implementation._isIdDeclaration(newAttr.name)) {
    this.id = newAttr.value;
  }
  return this.attributes.setNamedItemNS(newAttr);
};
DOMElement.prototype.hasAttribute = function DOMElement_hasAttribute(name) {
  return this.attributes._hasAttribute(name);
};
DOMElement.prototype.hasAttributeNS = function DOMElement_hasAttributeNS(namespaceURI, localName) {
  return this.attributes._hasAttributeNS(namespaceURI, localName);
};
DOMElement.prototype.toString = function DOMElement_toString() {
  var ret = '';
  var ns = this._namespaces.toString();
  if (ns.length > 0) ns = ' ' + ns;
  var attrs = this.attributes.toString();
  if (attrs.length > 0) attrs = ' ' + attrs;
  ret += '<' + this.nodeName + ns + attrs + '>';
  ret += this.childNodes.toString();;
  ret += '</' + this.nodeName + '>';
  return ret;
};
DOMAttr = function(ownerDocument) {
  this._class = addClass(this._class, 'DOMAttr');
  this.DOMNode = DOMNode;
  this.DOMNode(ownerDocument);
  this.name = '';
  this.specified = false;
  this.value = '';
  this.nodeType = DOMNode.ATTRIBUTE_NODE;
  this.ownerElement = null;
  this.childNodes = null;
  this.attributes = null;
};
DOMAttr.prototype = new DOMNode;
DOMAttr.prototype.getName = function DOMAttr_getName() {
  return this.nodeName;
};
DOMAttr.prototype.getSpecified = function DOMAttr_getSpecified() {
  return this.specified;
};
DOMAttr.prototype.getValue = function DOMAttr_getValue() {
  return this.nodeValue;
};
DOMAttr.prototype.setValue = function DOMAttr_setValue(value) {
  if (this.ownerDocument.implementation.errorChecking && this._readonly) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  this.setNodeValue(value);
};
DOMAttr.prototype.setNodeValue = function DOMAttr_setNodeValue(value) {
  this.nodeValue = new String(value);
  this.value = this.nodeValue;
  this.specified = (this.value.length > 0);
};
DOMAttr.prototype.toString = function DOMAttr_toString() {
  var ret = '';
  ret += this.nodeName + '="' + this.__escapeString(this.nodeValue) + '"';
  return ret;
};
DOMAttr.prototype.getOwnerElement = function() {
  return this.ownerElement;
};
DOMNamespace = function(ownerDocument) {
  this._class = addClass(this._class, 'DOMNamespace');
  this.DOMNode = DOMNode;
  this.DOMNode(ownerDocument);
  this.name = '';
  this.specified = false;
  this.value = '';
  this.nodeType = DOMNode.NAMESPACE_NODE;
};
DOMNamespace.prototype = new DOMNode;
DOMNamespace.prototype.getValue = function DOMNamespace_getValue() {
  return this.nodeValue;
};
DOMNamespace.prototype.setValue = function DOMNamespace_setValue(value) {
  this.nodeValue = new String(value);
  this.value = this.nodeValue;
};
DOMNamespace.prototype.toString = function DOMNamespace_toString() {
  var ret = '';
  if (this.nodeName != '') {
    ret += this.nodeName + '="' + this.__escapeString(this.nodeValue) + '"';
  } else {
    ret += 'xmlns="' + this.__escapeString(this.nodeValue) + '"';
  }
  return ret;
};
DOMCharacterData = function(ownerDocument) {
  this._class = addClass(this._class, 'DOMCharacterData');
  this.DOMNode = DOMNode;
  this.DOMNode(ownerDocument);
  this.data = '';
  this.length = 0;
};
DOMCharacterData.prototype = new DOMNode;
DOMCharacterData.prototype.getData = function DOMCharacterData_getData() {
  return this.nodeValue;
};
DOMCharacterData.prototype.setData = function DOMCharacterData_setData(data) {
  this.setNodeValue(data);
};
DOMCharacterData.prototype.setNodeValue = function DOMCharacterData_setNodeValue(data) {
  if (this.ownerDocument.implementation.errorChecking && this._readonly) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  this.nodeValue = new String(data);
  this.data = this.nodeValue;
  this.length = this.nodeValue.length;
};
DOMCharacterData.prototype.getLength = function DOMCharacterData_getLength() {
  return this.nodeValue.length;
};
DOMCharacterData.prototype.substringData = function DOMCharacterData_substringData(offset, count) {
  var ret = null;
  if (this.data) {
    if (this.ownerDocument.implementation.errorChecking && ((offset < 0) || (offset > this.data.length) || (count < 0))) {
      throw (new DOMException(DOMException.INDEX_SIZE_ERR));
    }
    if (!count) {
      ret = this.data.substring(offset);
    } else {
      ret = this.data.substring(offset, offset + count);
    }
  }
  return ret;
};
DOMCharacterData.prototype.appendData = function DOMCharacterData_appendData(arg) {
  if (this.ownerDocument.implementation.errorChecking && this._readonly) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  this.setData('' + this.data + arg);
};
DOMCharacterData.prototype.insertData = function DOMCharacterData_insertData(offset, arg) {
  if (this.ownerDocument.implementation.errorChecking && this._readonly) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  if (this.data) {
    if (this.ownerDocument.implementation.errorChecking && ((offset < 0) || (offset > this.data.length))) {
      throw (new DOMException(DOMException.INDEX_SIZE_ERR));
    }
    this.setData(this.data.substring(0, offset).concat(arg, this.data.substring(offset)));
  } else {
    if (this.ownerDocument.implementation.errorChecking && (offset != 0)) {
      throw (new DOMException(DOMException.INDEX_SIZE_ERR));
    }
    this.setData(arg);
  }
};
DOMCharacterData.prototype.deleteData = function DOMCharacterData_deleteData(offset, count) {
  if (this.ownerDocument.implementation.errorChecking && this._readonly) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  if (this.data) {
    if (this.ownerDocument.implementation.errorChecking && ((offset < 0) || (offset > this.data.length) || (count < 0))) {
      throw (new DOMException(DOMException.INDEX_SIZE_ERR));
    }
    if (!count || (offset + count) > this.data.length) {
      this.setData(this.data.substring(0, offset));
    } else {
      this.setData(this.data.substring(0, offset).concat(this.data.substring(offset + count)));
    }
  }
};
DOMCharacterData.prototype.replaceData = function DOMCharacterData_replaceData(offset, count, arg) {
  if (this.ownerDocument.implementation.errorChecking && this._readonly) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  if (this.data) {
    if (this.ownerDocument.implementation.errorChecking && ((offset < 0) || (offset > this.data.length) || (count < 0))) {
      throw (new DOMException(DOMException.INDEX_SIZE_ERR));
    }
    this.setData(this.data.substring(0, offset).concat(arg, this.data.substring(offset + count)));
  } else {
    this.setData(arg);
  }
};
DOMText = function(ownerDocument) {
  this._class = addClass(this._class, 'DOMText');
  this.DOMCharacterData = DOMCharacterData;
  this.DOMCharacterData(ownerDocument);
  this.nodeName = '#text';
  this.nodeType = DOMNode.TEXT_NODE;
};
DOMText.prototype = new DOMCharacterData;
DOMText.prototype.splitText = function DOMText_splitText(offset) {
  var data, inode;
  if (this.ownerDocument.implementation.errorChecking) {
    if (this._readonly) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    }
    if ((offset < 0) || (offset > this.data.length)) {
      throw (new DOMException(DOMException.INDEX_SIZE_ERR));
    }
  }
  if (this.parentNode) {
    data = this.substringData(offset);
    inode = this.ownerDocument.createTextNode(data);
    if (this.nextSibling) {
      this.parentNode.insertBefore(inode, this.nextSibling);
    } else {
      this.parentNode.appendChild(inode);
    }
    this.deleteData(offset);
  }
  return inode;
};
DOMText.prototype.toString = function DOMText_toString() {
  return this.__escapeString('' + this.nodeValue);
};
DOMCDATASection = function(ownerDocument) {
  this._class = addClass(this._class, 'DOMCDATASection');
  this.DOMCharacterData = DOMCharacterData;
  this.DOMCharacterData(ownerDocument);
  this.nodeName = '#cdata-section';
  this.nodeType = DOMNode.CDATA_SECTION_NODE;
};
DOMCDATASection.prototype = new DOMCharacterData;
DOMCDATASection.prototype.splitText = function DOMCDATASection_splitText(offset) {
  var data, inode;
  if (this.ownerDocument.implementation.errorChecking) {
    if (this._readonly) {
      throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
    }
    if ((offset < 0) || (offset > this.data.length)) {
      throw (new DOMException(DOMException.INDEX_SIZE_ERR));
    }
  }
  if (this.parentNode) {
    data = this.substringData(offset);
    inode = this.ownerDocument.createCDATASection(data);
    if (this.nextSibling) {
      this.parentNode.insertBefore(inode, this.nextSibling);
    } else {
      this.parentNode.appendChild(inode);
    }
    this.deleteData(offset);
  }
  return inode;
};
DOMCDATASection.prototype.toString = function DOMCDATASection_toString() {
  var ret = '';
  ret += '<![CDATA[' + this.nodeValue + '\]\]\>';
  return ret;
};
DOMComment = function(ownerDocument) {
  this._class = addClass(this._class, 'DOMComment');
  this.DOMCharacterData = DOMCharacterData;
  this.DOMCharacterData(ownerDocument);
  this.nodeName = '#comment';
  this.nodeType = DOMNode.COMMENT_NODE;
};
DOMComment.prototype = new DOMCharacterData;
DOMComment.prototype.toString = function DOMComment_toString() {
  var ret = '';
  ret += '<!--' + this.nodeValue + '-->';
  return ret;
};
DOMProcessingInstruction = function(ownerDocument) {
  this._class = addClass(this._class, 'DOMProcessingInstruction');
  this.DOMNode = DOMNode;
  this.DOMNode(ownerDocument);
  this.target = '';
  this.data = '';
  this.nodeType = DOMNode.PROCESSING_INSTRUCTION_NODE;
};
DOMProcessingInstruction.prototype = new DOMNode;
DOMProcessingInstruction.prototype.getTarget = function DOMProcessingInstruction_getTarget() {
  return this.nodeName;
};
DOMProcessingInstruction.prototype.getData = function DOMProcessingInstruction_getData() {
  return this.nodeValue;
};
DOMProcessingInstruction.prototype.setData = function DOMProcessingInstruction_setData(data) {
  this.setNodeValue(data);
};
DOMProcessingInstruction.prototype.setNodeValue = function DOMProcessingInstruction_setNodeValue(data) {
  if (this.ownerDocument.implementation.errorChecking && this._readonly) {
    throw (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR));
  }
  this.nodeValue = new String(data);
  this.data = this.nodeValue;
};
DOMProcessingInstruction.prototype.toString = function DOMProcessingInstruction_toString() {
  var ret = '';
  ret += '<?' + this.nodeName + ' ' + this.nodeValue + ' ?>';
  return ret;
};
DOMDocumentFragment = function(ownerDocument) {
  this._class = addClass(this._class, 'DOMDocumentFragment');
  this.DOMNode = DOMNode;
  this.DOMNode(ownerDocument);
  this.nodeName = '#document-fragment';
  this.nodeType = DOMNode.DOCUMENT_FRAGMENT_NODE;
};
DOMDocumentFragment.prototype = new DOMNode;
DOMDocumentFragment.prototype.toString = function DOMDocumentFragment_toString() {
  var xml = '';
  var intCount = this.getChildNodes().getLength();
  for (intLoop = 0; intLoop < intCount; intLoop++) {
    xml += this.getChildNodes().item(intLoop).toString();
  }
  return xml;
};
DOMDocumentType = function() {
  alert('DOMDocumentType.constructor(): Not Implemented');
};
DOMEntity = function() {
  alert('DOMEntity.constructor(): Not Implemented');
};
DOMEntityReference = function() {
  alert('DOMEntityReference.constructor(): Not Implemented');
};
DOMNotation = function() {
  alert('DOMNotation.constructor(): Not Implemented');
};
Strings = new Object();
Strings.WHITESPACE = ' \t\n\r';
Strings.QUOTES = '"\'';
Strings.isEmpty = function Strings_isEmpty(strD) {
  return (strD == null) || (strD.length == 0);
};
Strings.indexOfNonWhitespace = function Strings_indexOfNonWhitespace(strD, iB, iE) {
  if (Strings.isEmpty(strD)) return -1;
  iB = iB || 0;
  iE = iE || strD.length;
  for (var i = iB; i < iE; i++)
    if (Strings.WHITESPACE.indexOf(strD.charAt(i)) == -1) {
      return i;
    }
  return -1;
};
Strings.lastIndexOfNonWhitespace = function Strings_lastIndexOfNonWhitespace(strD, iB, iE) {
  if (Strings.isEmpty(strD)) return -1;
  iB = iB || 0;
  iE = iE || strD.length;
  for (var i = iE - 1; i >= iB; i--)
    if (Strings.WHITESPACE.indexOf(strD.charAt(i)) == -1)
      return i;
  return -1;
};
Strings.indexOfWhitespace = function Strings_indexOfWhitespace(strD, iB, iE) {
  if (Strings.isEmpty(strD)) return -1;
  iB = iB || 0;
  iE = iE || strD.length;
  for (var i = iB; i < iE; i++)
    if (Strings.WHITESPACE.indexOf(strD.charAt(i)) != -1)
      return i;
  return -1;
};
Strings.replace = function Strings_replace(strD, iB, iE, strF, strR) {
  if (Strings.isEmpty(strD)) return '';
  iB = iB || 0;
  iE = iE || strD.length;
  return strD.substring(iB, iE).split(strF).join(strR);
};
Strings.getLineNumber = function Strings_getLineNumber(strD, iP) {
  if (Strings.isEmpty(strD)) return -1;
  iP = iP || strD.length;
  return strD.substring(0, iP).split('\n').length;
};
Strings.getColumnNumber = function Strings_getColumnNumber(strD, iP) {
  if (Strings.isEmpty(strD)) return -1;
  iP = iP || strD.length;
  var arrD = strD.substring(0, iP).split('\n');
  var strLine = arrD[arrD.length - 1];
  arrD.length--;
  var iLinePos = arrD.join('\n').length;
  return iP - iLinePos;
};
StringBuffer = function() {
  this._a = new Array();
};
StringBuffer.prototype.append = function StringBuffer_append(d) {
  this._a[this._a.length] = d;
};
StringBuffer.prototype.toString = function StringBuffer_toString() {
  return this._a.join('');
};
