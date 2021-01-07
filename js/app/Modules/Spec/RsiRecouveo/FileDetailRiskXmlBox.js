/* Copied from
 * https://github.com/borsuksoftware/simpleXML
 */
Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileDetailRiskXmlBox', {
	extend: 'Ext.Component',
	style: 'background-color: #eeeeee',
	scrollable: true,
	
	renderTpl: [
		'<div id="{id}-cntEl" data-ref="cntEl">',
		'<div>fekofekpfke</div>',
		'</div>'
	],
	childEls: [
		'cntEl',
	],
	
	initComponent: function() {
		this.callParent() ;
		if( this.xmlString ) {
			this.updateFromXml(this.xmlString) ;
		}
	},
	
	
	fillContainerNode: function( childNode ) {
		if( this.rendered ) {
			console.dir( this.cntEl ) ;
			this.cntEl.dom.innerHTML='' ;
			if( childNode ) {
				this.cntEl.dom.appendChild(childNode) ;
			}
		} else {
			this.on('afterrender',function() { this.fillContainerNode(childNode) ; },this,{single:true}) ;
		}
	},
	
	
	updateFromXml: function(xmlString) {
		//this.fillContainerNode(null) ;
		//console.dir($.parseXML(xmlString)) ;
		/*
		console.dir(xml) ;
		xmlString = xmlString.replace(/\<\?xml.+\?\>/g, '');
		xmlString = xmlString.trim() ;
		*/
		var xml = this.parseXml( xmlString );
		if( xml==null ) {
			return this.fillContainerNode(null) ;
		}
		
		var wrapperNode = document.createElement("span");
		Ext.fly(wrapperNode).addCls('op5-spec-rsiveo-xmlbox') ;
		this.buildXmlViewNode(wrapperNode,xml) ;
		this.fillContainerNode(wrapperNode) ;
	},
	parseXml: function( data ) {
		var xml;
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		
		// Support: IE 9 - 11 only
		// IE throws on parseFromString with invalid input.
		try {
			xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
		} catch ( e ) {
			xml = undefined;
		}
		
		return xml;
	},
	buildXmlViewNode: function( parent, xml ) {
		if (xml.nodeType == 9) {
			for (var i = 0 ; i < xml.childNodes.length ; i++) {
				this.buildXmlViewNode(parent, xml.childNodes[i]);
			}
			return;
		}
		
		switch (xml.nodeType) {
			case 1: // Simple element
				var hasChildNodes = xml.childNodes.length > 0;
				var expandingNode = hasChildNodes && (xml.childNodes.length > 1 || xml.childNodes[0].nodeType != 3);

				var expanderHeader = expandingNode ? makeSpan("", "op5-spec-rsiveo-xmlbox-expanderHeader") : parent;

				expanderHeader.appendChild(makeSpan("<", "op5-spec-rsiveo-xmlbox-tagHeader"));
				expanderHeader.appendChild(makeSpan(xml.nodeName, "op5-spec-rsiveo-xmlbox-tagValue"));

				if( expandingNode) {
					parent.appendChild(expanderHeader);
				}

				// Handle attributes
				var attributes = xml.attributes;
				for( var attrIdx = 0 ; attrIdx < attributes.length ; attrIdx++ ) {
					expanderHeader.appendChild( makeSpan( " "));
					expanderHeader.appendChild( makeSpan( attributes [attrIdx].name, "op5-spec-rsiveo-xmlbox-attrName"));
					expanderHeader.appendChild( makeSpan( '="' ));
					expanderHeader.appendChild( makeSpan( attributes [attrIdx].value, "op5-spec-rsiveo-xmlbox-attrValue" ));
					expanderHeader.appendChild( makeSpan( '"' ));
				}

				// Handle child nodes
				if (hasChildNodes) {
					parent.appendChild(makeSpan(">", "op5-spec-rsiveo-xmlbox-tagHeader"));

					if (expandingNode) {
						var ulElement = document.createElement("ul");
						for (var i = 0 ; i < xml.childNodes.length ; i++) {
							var liElement = document.createElement("li");
							this.buildXmlViewNode(liElement, xml.childNodes[i]);
							ulElement.appendChild(liElement);
						}

						ulElement.setAttribute("class", "op5-spec-rsiveo-xmlbox-content");
						//parent.appendChild(collapsedTextSpan);
						parent.appendChild(ulElement);

						parent.appendChild(makeSpan("", "op5-spec-rsiveo-xmlbox-expanderClose"));
					} else {
						parent.appendChild(makeSpan(xml.childNodes[0].nodeValue));
					}

					// Closing tag
					parent.appendChild(makeSpan("</", "op5-spec-rsiveo-xmlbox-tagHeader"));
					parent.appendChild(makeSpan(xml.nodeName, "op5-spec-rsiveo-xmlbox-tagValue"));
					parent.appendChild(makeSpan(">", "op5-spec-rsiveo-xmlbox-tagHeader"));
				} else {
					var closingSpan = document.createElement("span");
					closingSpan.innerText = "/>";
					parent.appendChild(closingSpan);
				}
				break;

			case 3: // text
				if( xml.nodeValue.trim() !== "" ) {
					parent.appendChild(makeSpan("", "op5-spec-rsiveo-xmlbox-expander"));
					parent.appendChild(makeSpan(xml.nodeValue));
				}
				break;

			case 4: // cdata
				parent.appendChild(makeSpan("", "op5-spec-rsiveo-xmlbox-expander"));
				parent.appendChild(makeSpan("<![CDATA[", "op5-spec-rsiveo-xmlbox-tagHeader"));
				parent.appendChild(makeSpan(xml.nodeValue, "op5-spec-rsiveo-xmlbox-cdata"));
				parent.appendChild(makeSpan("]]>", "op5-spec-rsiveo-xmlbox-tagHeader"));
				break;

			case 8: // comment
				parent.appendChild(makeSpan("", "op5-spec-rsiveo-xmlbox-expander"));
				parent.appendChild(makeSpan("<!--" + xml.nodeValue + "-->", "op5-spec-rsiveo-xmlbox-comment"));
				break;

			default:
				var item = document.createElement("span");
				item.innerText = "" + xml.nodeType + " - " + xml.name;
				parent.appendChild(item);
				break;
		}

		function makeSpan(innerText) {
			return makeSpan(innerText, undefined);
		}

		function makeSpan(innerText, classes) {
			var span = document.createElement("span");
			span.innerText = innerText;

			if (classes != undefined)
					span.setAttribute("class", classes);

			return span;
		}
	}
	
}) ;
