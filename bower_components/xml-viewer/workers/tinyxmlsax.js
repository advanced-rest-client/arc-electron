// =========================================================================
//
// tinyxmlsax.js - an XML SAX parser in JavaScript compressed for downloading
//
// version 3.1
//
// =========================================================================
//
// Copyright (C) 2000 - 2002, 2003 Michael Houghton (mike@idle.org), Raymond Irving and David Joham (djoham@yahoo.com)
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
// Visit the XML for <SCRIPT> home page at http://xmljs.sourceforge.net
//


var whitespace = "\n\r\t "; XMLP = function(strXML) { strXML = SAXStrings.replace(strXML, null, null, "\r\n", "\n"); strXML = SAXStrings.replace(strXML, null, null, "\r", "\n"); this.m_xml = strXML; this.m_iP = 0; this.m_iState = XMLP._STATE_PROLOG; this.m_stack = new Stack(); this._clearAttributes();}
XMLP._NONE = 0; XMLP._ELM_B = 1; XMLP._ELM_E = 2; XMLP._ELM_EMP = 3; XMLP._ATT = 4; XMLP._TEXT = 5; XMLP._ENTITY = 6; XMLP._PI = 7; XMLP._CDATA = 8; XMLP._COMMENT = 9; XMLP._DTD = 10; XMLP._ERROR = 11; XMLP._CONT_XML = 0; XMLP._CONT_ALT = 1; XMLP._ATT_NAME = 0; XMLP._ATT_VAL = 1; XMLP._STATE_PROLOG = 1; XMLP._STATE_DOCUMENT = 2; XMLP._STATE_MISC = 3; XMLP._errs = new Array(); XMLP._errs[XMLP.ERR_CLOSE_PI = 0 ] = "PI: missing closing sequence"; XMLP._errs[XMLP.ERR_CLOSE_DTD = 1 ] = "DTD: missing closing sequence"; XMLP._errs[XMLP.ERR_CLOSE_COMMENT = 2 ] = "Comment: missing closing sequence"; XMLP._errs[XMLP.ERR_CLOSE_CDATA = 3 ] = "CDATA: missing closing sequence"; XMLP._errs[XMLP.ERR_CLOSE_ELM = 4 ] = "Element: missing closing sequence"; XMLP._errs[XMLP.ERR_CLOSE_ENTITY = 5 ] = "Entity: missing closing sequence"; XMLP._errs[XMLP.ERR_PI_TARGET = 6 ] = "PI: target is required"; XMLP._errs[XMLP.ERR_ELM_EMPTY = 7 ] = "Element: cannot be both empty and closing"; XMLP._errs[XMLP.ERR_ELM_NAME = 8 ] = "Element: name must immediatly follow \"<\""; XMLP._errs[XMLP.ERR_ELM_LT_NAME = 9 ] = "Element: \"<\" not allowed in element names"; XMLP._errs[XMLP.ERR_ATT_VALUES = 10] = "Attribute: values are required and must be in quotes"; XMLP._errs[XMLP.ERR_ATT_LT_NAME = 11] = "Element: \"<\" not allowed in attribute names"; XMLP._errs[XMLP.ERR_ATT_LT_VALUE = 12] = "Attribute: \"<\" not allowed in attribute values"; XMLP._errs[XMLP.ERR_ATT_DUP = 13] = "Attribute: duplicate attributes not allowed"; XMLP._errs[XMLP.ERR_ENTITY_UNKNOWN = 14] = "Entity: unknown entity"; XMLP._errs[XMLP.ERR_INFINITELOOP = 15] = "Infininte loop"; XMLP._errs[XMLP.ERR_DOC_STRUCTURE = 16] = "Document: only comments, processing instructions, or whitespace allowed outside of document element"; XMLP._errs[XMLP.ERR_ELM_NESTING = 17] = "Element: must be nested correctly"; XMLP.prototype._addAttribute = function(name, value) { this.m_atts[this.m_atts.length] = new Array(name, value);}
XMLP.prototype._checkStructure = function(iEvent) { if(XMLP._STATE_PROLOG == this.m_iState) { if((XMLP._TEXT == iEvent) || (XMLP._ENTITY == iEvent)) { if(SAXStrings.indexOfNonWhitespace(this.getContent(), this.getContentBegin(), this.getContentEnd()) != -1) { return this._setErr(XMLP.ERR_DOC_STRUCTURE);}
}
if((XMLP._ELM_B == iEvent) || (XMLP._ELM_EMP == iEvent)) { this.m_iState = XMLP._STATE_DOCUMENT;}
}
if(XMLP._STATE_DOCUMENT == this.m_iState) { if((XMLP._ELM_B == iEvent) || (XMLP._ELM_EMP == iEvent)) { this.m_stack.push(this.getName());}
if((XMLP._ELM_E == iEvent) || (XMLP._ELM_EMP == iEvent)) { var strTop = this.m_stack.pop(); if((strTop == null) || (strTop != this.getName())) { return this._setErr(XMLP.ERR_ELM_NESTING);}
}
if(this.m_stack.count() == 0) { this.m_iState = XMLP._STATE_MISC; return iEvent;}
}
if(XMLP._STATE_MISC == this.m_iState) { if((XMLP._ELM_B == iEvent) || (XMLP._ELM_E == iEvent) || (XMLP._ELM_EMP == iEvent) || (XMLP.EVT_DTD == iEvent)) { return this._setErr(XMLP.ERR_DOC_STRUCTURE);}
if((XMLP._TEXT == iEvent) || (XMLP._ENTITY == iEvent)) { if(SAXStrings.indexOfNonWhitespace(this.getContent(), this.getContentBegin(), this.getContentEnd()) != -1) { return this._setErr(XMLP.ERR_DOC_STRUCTURE);}
}
}
return iEvent;}
XMLP.prototype._clearAttributes = function() { this.m_atts = new Array();}
XMLP.prototype._findAttributeIndex = function(name) { for(var i = 0; i < this.m_atts.length; i++) { if(this.m_atts[i][XMLP._ATT_NAME] == name) { return i;}
}
return -1;}
XMLP.prototype.getAttributeCount = function() { return this.m_atts ? this.m_atts.length : 0;}
XMLP.prototype.getAttributeName = function(index) { return ((index < 0) || (index >= this.m_atts.length)) ? null : this.m_atts[index][XMLP._ATT_NAME];}
XMLP.prototype.getAttributeValue = function(index) { return ((index < 0) || (index >= this.m_atts.length)) ? null : __unescapeString(this.m_atts[index][XMLP._ATT_VAL]);}
XMLP.prototype.getAttributeValueByName = function(name) { return this.getAttributeValue(this._findAttributeIndex(name));}
XMLP.prototype.getColumnNumber = function() { return SAXStrings.getColumnNumber(this.m_xml, this.m_iP);}
XMLP.prototype.getContent = function() { return (this.m_cSrc == XMLP._CONT_XML) ? this.m_xml : this.m_cAlt;}
XMLP.prototype.getContentBegin = function() { return this.m_cB;}
XMLP.prototype.getContentEnd = function() { return this.m_cE;}
XMLP.prototype.getLineNumber = function() { return SAXStrings.getLineNumber(this.m_xml, this.m_iP);}
XMLP.prototype.getName = function() { return this.m_name;}
XMLP.prototype.next = function() { return this._checkStructure(this._parse());}
XMLP.prototype._parse = function() { if(this.m_iP == this.m_xml.length) { return XMLP._NONE;}
if(this.m_iP == this.m_xml.indexOf("<?", this.m_iP)) { return this._parsePI (this.m_iP + 2);}
else if(this.m_iP == this.m_xml.indexOf("<!DOCTYPE", this.m_iP)) { return this._parseDTD (this.m_iP + 9);}
else if(this.m_iP == this.m_xml.indexOf("<!--", this.m_iP)) { return this._parseComment(this.m_iP + 4);}
else if(this.m_iP == this.m_xml.indexOf("<![CDATA[", this.m_iP)) { return this._parseCDATA (this.m_iP + 9);}
else if(this.m_iP == this.m_xml.indexOf("<", this.m_iP)) { return this._parseElement(this.m_iP + 1);}
else if(this.m_iP == this.m_xml.indexOf("&", this.m_iP)) { return this._parseEntity (this.m_iP + 1);}
else{ return this._parseText (this.m_iP);}
}
XMLP.prototype._parseAttribute = function(iB, iE) { var iNB, iNE, iEq, iVB, iVE; var cQuote, strN, strV; this.m_cAlt = ""; iNB = SAXStrings.indexOfNonWhitespace(this.m_xml, iB, iE); if((iNB == -1) ||(iNB >= iE)) { return iNB;}
iEq = this.m_xml.indexOf("=", iNB); if((iEq == -1) || (iEq > iE)) { return this._setErr(XMLP.ERR_ATT_VALUES);}
iNE = SAXStrings.lastIndexOfNonWhitespace(this.m_xml, iNB, iEq); iVB = SAXStrings.indexOfNonWhitespace(this.m_xml, iEq + 1, iE); if((iVB == -1) ||(iVB > iE)) { return this._setErr(XMLP.ERR_ATT_VALUES);}
cQuote = this.m_xml.charAt(iVB); if(SAXStrings.QUOTES.indexOf(cQuote) == -1) { return this._setErr(XMLP.ERR_ATT_VALUES);}
iVE = this.m_xml.indexOf(cQuote, iVB + 1); if((iVE == -1) ||(iVE > iE)) { return this._setErr(XMLP.ERR_ATT_VALUES);}
strN = this.m_xml.substring(iNB, iNE + 1); strV = this.m_xml.substring(iVB + 1, iVE); if(strN.indexOf("<") != -1) { return this._setErr(XMLP.ERR_ATT_LT_NAME);}
if(strV.indexOf("<") != -1) { return this._setErr(XMLP.ERR_ATT_LT_VALUE);}
strV = SAXStrings.replace(strV, null, null, "\n", " "); strV = SAXStrings.replace(strV, null, null, "\t", " "); iRet = this._replaceEntities(strV); if(iRet == XMLP._ERROR) { return iRet;}
strV = this.m_cAlt; if(this._findAttributeIndex(strN) == -1) { this._addAttribute(strN, strV);}
else { return this._setErr(XMLP.ERR_ATT_DUP);}
this.m_iP = iVE + 2; return XMLP._ATT;}
XMLP.prototype._parseCDATA = function(iB) { var iE = this.m_xml.indexOf("]]>", iB); if (iE == -1) { return this._setErr(XMLP.ERR_CLOSE_CDATA);}
this._setContent(XMLP._CONT_XML, iB, iE); this.m_iP = iE + 3; return XMLP._CDATA;}
XMLP.prototype._parseComment = function(iB) { var iE = this.m_xml.indexOf("-" + "->", iB); if (iE == -1) { return this._setErr(XMLP.ERR_CLOSE_COMMENT);}
this._setContent(XMLP._CONT_XML, iB, iE); this.m_iP = iE + 3; return XMLP._COMMENT;}
XMLP.prototype._parseDTD = function(iB) { var iE, strClose, iInt, iLast; iE = this.m_xml.indexOf(">", iB); if(iE == -1) { return this._setErr(XMLP.ERR_CLOSE_DTD);}
iInt = this.m_xml.indexOf("[", iB); strClose = ((iInt != -1) && (iInt < iE)) ? "]>" : ">"; while(true) { if(iE == iLast) { return this._setErr(XMLP.ERR_INFINITELOOP);}
iLast = iE; iE = this.m_xml.indexOf(strClose, iB); if(iE == -1) { return this._setErr(XMLP.ERR_CLOSE_DTD);}
if (this.m_xml.substring(iE - 1, iE + 2) != "]]>") { break;}
}
this.m_iP = iE + strClose.length; return XMLP._DTD;}
XMLP.prototype._parseElement = function(iB) { var iE, iDE, iNE, iRet; var iType, strN, iLast; iDE = iE = this.m_xml.indexOf(">", iB); if(iE == -1) { return this._setErr(XMLP.ERR_CLOSE_ELM);}
if(this.m_xml.charAt(iB) == "/") { iType = XMLP._ELM_E; iB++;} else { iType = XMLP._ELM_B;}
if(this.m_xml.charAt(iE - 1) == "/") { if(iType == XMLP._ELM_E) { return this._setErr(XMLP.ERR_ELM_EMPTY);}
iType = XMLP._ELM_EMP; iDE--;}
iDE = SAXStrings.lastIndexOfNonWhitespace(this.m_xml, iB, iDE); if (iE - iB != 1 ) { if(SAXStrings.indexOfNonWhitespace(this.m_xml, iB, iDE) != iB) { return this._setErr(XMLP.ERR_ELM_NAME);}
}
this._clearAttributes(); iNE = SAXStrings.indexOfWhitespace(this.m_xml, iB, iDE); if(iNE == -1) { iNE = iDE + 1;}
else { this.m_iP = iNE; while(this.m_iP < iDE) { if(this.m_iP == iLast) return this._setErr(XMLP.ERR_INFINITELOOP); iLast = this.m_iP; iRet = this._parseAttribute(this.m_iP, iDE); if(iRet == XMLP._ERROR) return iRet;}
}
strN = this.m_xml.substring(iB, iNE); if(strN.indexOf("<") != -1) { return this._setErr(XMLP.ERR_ELM_LT_NAME);}
this.m_name = strN; this.m_iP = iE + 1; return iType;}
XMLP.prototype._parseEntity = function(iB) { var iE = this.m_xml.indexOf(";", iB); if(iE == -1) { return this._setErr(XMLP.ERR_CLOSE_ENTITY);}
this.m_iP = iE + 1; return this._replaceEntity(this.m_xml, iB, iE);}
XMLP.prototype._parsePI = function(iB) { var iE, iTB, iTE, iCB, iCE; iE = this.m_xml.indexOf("?>", iB); if(iE == -1) { return this._setErr(XMLP.ERR_CLOSE_PI);}
iTB = SAXStrings.indexOfNonWhitespace(this.m_xml, iB, iE); if(iTB == -1) { return this._setErr(XMLP.ERR_PI_TARGET);}
iTE = SAXStrings.indexOfWhitespace(this.m_xml, iTB, iE); if(iTE == -1) { iTE = iE;}
iCB = SAXStrings.indexOfNonWhitespace(this.m_xml, iTE, iE); if(iCB == -1) { iCB = iE;}
iCE = SAXStrings.lastIndexOfNonWhitespace(this.m_xml, iCB, iE); if(iCE == -1) { iCE = iE - 1;}
this.m_name = this.m_xml.substring(iTB, iTE); this._setContent(XMLP._CONT_XML, iCB, iCE + 1); this.m_iP = iE + 2; return XMLP._PI;}
XMLP.prototype._parseText = function(iB) { var iE, iEE; iE = this.m_xml.indexOf("<", iB); if(iE == -1) { iE = this.m_xml.length;}
iEE = this.m_xml.indexOf("&", iB); if((iEE != -1) && (iEE <= iE)) { iE = iEE;}
this._setContent(XMLP._CONT_XML, iB, iE); this.m_iP = iE; return XMLP._TEXT;}
XMLP.prototype._replaceEntities = function(strD, iB, iE) { if(SAXStrings.isEmpty(strD)) return ""; iB = iB || 0; iE = iE || strD.length; var iEB, iEE, strRet = ""; iEB = strD.indexOf("&", iB); iEE = iB; while((iEB > 0) && (iEB < iE)) { strRet += strD.substring(iEE, iEB); iEE = strD.indexOf(";", iEB) + 1; if((iEE == 0) || (iEE > iE)) { return this._setErr(XMLP.ERR_CLOSE_ENTITY);}
iRet = this._replaceEntity(strD, iEB + 1, iEE - 1); if(iRet == XMLP._ERROR) { return iRet;}
strRet += this.m_cAlt; iEB = strD.indexOf("&", iEE);}
if(iEE != iE) { strRet += strD.substring(iEE, iE);}
this._setContent(XMLP._CONT_ALT, strRet); return XMLP._ENTITY;}
XMLP.prototype._replaceEntity = function(strD, iB, iE) { if(SAXStrings.isEmpty(strD)) return -1; iB = iB || 0; iE = iE || strD.length; switch(strD.substring(iB, iE)) { case "amp": strEnt = "&"; break; case "lt": strEnt = "<"; break; case "gt": strEnt = ">"; break; case "apos": strEnt = "'"; break; case "quot": strEnt = "\""; break; default:
if(strD.charAt(iB) == "#") { strEnt = String.fromCharCode(parseInt(strD.substring(iB + 1, iE)));} else { return this._setErr(XMLP.ERR_ENTITY_UNKNOWN);}
break;}
this._setContent(XMLP._CONT_ALT, strEnt); return XMLP._ENTITY;}
XMLP.prototype._setContent = function(iSrc) { var args = arguments; if(XMLP._CONT_XML == iSrc) { this.m_cAlt = null; this.m_cB = args[1]; this.m_cE = args[2];} else { this.m_cAlt = args[1]; this.m_cB = 0; this.m_cE = args[1].length;}
this.m_cSrc = iSrc;}
XMLP.prototype._setErr = function(iErr) { var strErr = XMLP._errs[iErr]; this.m_cAlt = strErr; this.m_cB = 0; this.m_cE = strErr.length; this.m_cSrc = XMLP._CONT_ALT; return XMLP._ERROR;}
SAXDriver = function() { this.m_hndDoc = null; this.m_hndErr = null; this.m_hndLex = null;}
SAXDriver.DOC_B = 1; SAXDriver.DOC_E = 2; SAXDriver.ELM_B = 3; SAXDriver.ELM_E = 4; SAXDriver.CHARS = 5; SAXDriver.PI = 6; SAXDriver.CD_B = 7; SAXDriver.CD_E = 8; SAXDriver.CMNT = 9; SAXDriver.DTD_B = 10; SAXDriver.DTD_E = 11; SAXDriver.prototype.parse = function(strD) { var parser = new XMLP(strD); if(this.m_hndDoc && this.m_hndDoc.setDocumentLocator) { this.m_hndDoc.setDocumentLocator(this);}
this.m_parser = parser; this.m_bErr = false; if(!this.m_bErr) { this._fireEvent(SAXDriver.DOC_B);}
this._parseLoop(); if(!this.m_bErr) { this._fireEvent(SAXDriver.DOC_E);}
this.m_xml = null; this.m_iP = 0;}
SAXDriver.prototype.setDocumentHandler = function(hnd) { this.m_hndDoc = hnd;}
SAXDriver.prototype.setErrorHandler = function(hnd) { this.m_hndErr = hnd;}
SAXDriver.prototype.setLexicalHandler = function(hnd) { this.m_hndLex = hnd;}
SAXDriver.prototype.getColumnNumber = function() { return this.m_parser.getColumnNumber();}
SAXDriver.prototype.getLineNumber = function() { return this.m_parser.getLineNumber();}
SAXDriver.prototype.getMessage = function() { return this.m_strErrMsg;}
SAXDriver.prototype.getPublicId = function() { return null;}
SAXDriver.prototype.getSystemId = function() { return null;}
SAXDriver.prototype.getLength = function() { return this.m_parser.getAttributeCount();}
SAXDriver.prototype.getName = function(index) { return this.m_parser.getAttributeName(index);}
SAXDriver.prototype.getValue = function(index) { return this.m_parser.getAttributeValue(index);}
SAXDriver.prototype.getValueByName = function(name) { return this.m_parser.getAttributeValueByName(name);}
SAXDriver.prototype._fireError = function(strMsg) { this.m_strErrMsg = strMsg; this.m_bErr = true; if(this.m_hndErr && this.m_hndErr.fatalError) { this.m_hndErr.fatalError(this);}
}
SAXDriver.prototype._fireEvent = function(iEvt) { var hnd, func, args = arguments, iLen = args.length - 1; if(this.m_bErr) return; if(SAXDriver.DOC_B == iEvt) { func = "startDocument"; hnd = this.m_hndDoc;}
else if (SAXDriver.DOC_E == iEvt) { func = "endDocument"; hnd = this.m_hndDoc;}
else if (SAXDriver.ELM_B == iEvt) { func = "startElement"; hnd = this.m_hndDoc;}
else if (SAXDriver.ELM_E == iEvt) { func = "endElement"; hnd = this.m_hndDoc;}
else if (SAXDriver.CHARS == iEvt) { func = "characters"; hnd = this.m_hndDoc;}
else if (SAXDriver.PI == iEvt) { func = "processingInstruction"; hnd = this.m_hndDoc;}
else if (SAXDriver.CD_B == iEvt) { func = "startCDATA"; hnd = this.m_hndLex;}
else if (SAXDriver.CD_E == iEvt) { func = "endCDATA"; hnd = this.m_hndLex;}
else if (SAXDriver.CMNT == iEvt) { func = "comment"; hnd = this.m_hndLex;}
if(hnd && hnd[func]) { if(0 == iLen) { hnd[func]();}
else if (1 == iLen) { hnd[func](args[1]);}
else if (2 == iLen) { hnd[func](args[1], args[2]);}
else if (3 == iLen) { hnd[func](args[1], args[2], args[3]);}
}
}
SAXDriver.prototype._parseLoop = function(parser) { var iEvent, parser; parser = this.m_parser; while(!this.m_bErr) { iEvent = parser.next(); if(iEvent == XMLP._ELM_B) { this._fireEvent(SAXDriver.ELM_B, parser.getName(), this);}
else if(iEvent == XMLP._ELM_E) { this._fireEvent(SAXDriver.ELM_E, parser.getName());}
else if(iEvent == XMLP._ELM_EMP) { this._fireEvent(SAXDriver.ELM_B, parser.getName(), this); this._fireEvent(SAXDriver.ELM_E, parser.getName());}
else if(iEvent == XMLP._TEXT) { this._fireEvent(SAXDriver.CHARS, parser.getContent(), parser.getContentBegin(), parser.getContentEnd() - parser.getContentBegin());}
else if(iEvent == XMLP._ENTITY) { this._fireEvent(SAXDriver.CHARS, parser.getContent(), parser.getContentBegin(), parser.getContentEnd() - parser.getContentBegin());}
else if(iEvent == XMLP._PI) { this._fireEvent(SAXDriver.PI, parser.getName(), parser.getContent().substring(parser.getContentBegin(), parser.getContentEnd()));}
else if(iEvent == XMLP._CDATA) { this._fireEvent(SAXDriver.CD_B); this._fireEvent(SAXDriver.CHARS, parser.getContent(), parser.getContentBegin(), parser.getContentEnd() - parser.getContentBegin()); this._fireEvent(SAXDriver.CD_E);}
else if(iEvent == XMLP._COMMENT) { this._fireEvent(SAXDriver.CMNT, parser.getContent(), parser.getContentBegin(), parser.getContentEnd() - parser.getContentBegin());}
else if(iEvent == XMLP._DTD) { }
else if(iEvent == XMLP._ERROR) { this._fireError(parser.getContent());}
else if(iEvent == XMLP._NONE) { return;}
}
}
SAXStrings = function() { }
SAXStrings.WHITESPACE = " \t\n\r"; SAXStrings.QUOTES = "\"'"; SAXStrings.getColumnNumber = function(strD, iP) { if(SAXStrings.isEmpty(strD)) { return -1;}
iP = iP || strD.length; var arrD = strD.substring(0, iP).split("\n"); var strLine = arrD[arrD.length - 1]; arrD.length--; var iLinePos = arrD.join("\n").length; return iP - iLinePos;}
SAXStrings.getLineNumber = function(strD, iP) { if(SAXStrings.isEmpty(strD)) { return -1;}
iP = iP || strD.length; return strD.substring(0, iP).split("\n").length
}
SAXStrings.indexOfNonWhitespace = function(strD, iB, iE) { if(SAXStrings.isEmpty(strD)) { return -1;}
iB = iB || 0; iE = iE || strD.length; for(var i = iB; i < iE; i++){ if(SAXStrings.WHITESPACE.indexOf(strD.charAt(i)) == -1) { return i;}
}
return -1;}
SAXStrings.indexOfWhitespace = function(strD, iB, iE) { if(SAXStrings.isEmpty(strD)) { return -1;}
iB = iB || 0; iE = iE || strD.length; for(var i = iB; i < iE; i++) { if(SAXStrings.WHITESPACE.indexOf(strD.charAt(i)) != -1) { return i;}
}
return -1;}
SAXStrings.isEmpty = function(strD) { return (strD == null) || (strD.length == 0);}
SAXStrings.lastIndexOfNonWhitespace = function(strD, iB, iE) { if(SAXStrings.isEmpty(strD)) { return -1;}
iB = iB || 0; iE = iE || strD.length; for(var i = iE - 1; i >= iB; i--){ if(SAXStrings.WHITESPACE.indexOf(strD.charAt(i)) == -1){ return i;}
}
return -1;}
SAXStrings.replace = function(strD, iB, iE, strF, strR) { if(SAXStrings.isEmpty(strD)) { return "";}
iB = iB || 0; iE = iE || strD.length; return strD.substring(iB, iE).split(strF).join(strR);}
Stack = function() { this.m_arr = new Array();}
Stack.prototype.clear = function() { this.m_arr = new Array();}
Stack.prototype.count = function() { return this.m_arr.length;}
Stack.prototype.destroy = function() { this.m_arr = null;}
Stack.prototype.peek = function() { if(this.m_arr.length == 0) { return null;}
return this.m_arr[this.m_arr.length - 1];}
Stack.prototype.pop = function() { if(this.m_arr.length == 0) { return null;}
var o = this.m_arr[this.m_arr.length - 1]; this.m_arr.length--; return o;}
Stack.prototype.push = function(o) { this.m_arr[this.m_arr.length] = o;}
function isEmpty(str) { return (str==null) || (str.length==0);}
function trim(trimString, leftTrim, rightTrim) { if (isEmpty(trimString)) { return "";}
if (leftTrim == null) { leftTrim = true;}
if (rightTrim == null) { rightTrim = true;}
var left=0; var right=0; var i=0; var k=0; if (leftTrim == true) { while ((i<trimString.length) && (whitespace.indexOf(trimString.charAt(i++))!=-1)) { left++;}
}
if (rightTrim == true) { k=trimString.length-1; while((k>=left) && (whitespace.indexOf(trimString.charAt(k--))!=-1)) { right++;}
}
return trimString.substring(left, trimString.length - right);}
function __escapeString(str) { var escAmpRegEx = /&/g; var escLtRegEx = /</g; var escGtRegEx = />/g; var quotRegEx = /"/g;
    var aposRegEx = /'/g;

    str = str.replace(escAmpRegEx, "&amp;");
    str = str.replace(escLtRegEx, "&lt;");
    str = str.replace(escGtRegEx, "&gt;");
    str = str.replace(quotRegEx, "&quot;");
    str = str.replace(aposRegEx, "&apos;");

  return str;
}

/**
 * function __unescapeString 
 *
 * author: David Joham djoham@yahoo.com
 *
 * @param  str : string - The string to be unescaped
 *
 * @return : string - The unescaped string
 */
function __unescapeString(str) {

    var escAmpRegEx = /&amp;/g;
    var escLtRegEx = /&lt;/g;
    var escGtRegEx = /&gt;/g;
    var quotRegEx = /&quot;/g;
    var aposRegEx = /&apos;/g;

    str = str.replace(escAmpRegEx, "&");
    str = str.replace(escLtRegEx, "<");
    str = str.replace(escGtRegEx, ">");
    str = str.replace(quotRegEx, "\"");
    str = str.replace(aposRegEx, "'");
  return str;
}
