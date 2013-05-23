/*!
* Ext JS Library 4.0
* Copyright(c) 2006-2011 Sencha Inc.
* licensing@sencha.com
* http://www.sencha.com/license
*/

/**
* Barebones iframe implementation. For serious iframe work, see the
* ManagedIFrame extension
* (http://www.sencha.com/forum/showthread.php?71961).
*/
Ext.define('Ext.ux.dams.IFrameContent', {
	extend: 'Ext.Component',

	renderTpl: [
		'<iframe id="{id}-iframe" width="100%" height="100%" frameborder="0"></iframe>'
	],

	initComponent: function () {
		var me = this ;
		
		me.addEvents(
				'beforeload',
				'load'
		);
		
		Ext.apply(me.renderSelectors, {
				iframeEl: 'iframe'
		});
		
		me.on('afterrender',me.onAfterRender,me) ;
		me.callParent();
	},
	
	onAfterRender: function() {
		var me = this,
			doc = me.getDoc() ;
		
		if (doc) {
			try {
				Ext.EventManager.removeAll(doc);
			} catch(e) {
				// cannot do this xss
			}
			// We need to be sure we remove all our events from the iframe on unload or we're going to LEAK!
			Ext.EventManager.on(window, 'unload', me.beforeDestroy, me);
			this.el.unmask();
			this.fireEvent('load', this);
			
			if( me.content ) {
				doc.open() ;
				doc.write(me.content) ;
				doc.write() ;
			}
		}
	},

	getBody: function() {
		var doc = this.getDoc();
		return doc.body || doc.documentElement;
	},

	getDoc: function() {
		var me = this,
			win = me.getWin(),
			doc = null;
		try {
			doc =  win.contentDocument || me.iframeEl.dom.contentDocument || window.frames[this.dom.name].document ||  win.document;
			return doc ;
		} catch (ex) {
			return null;
		}
	},

	getWin: function() {
		var me = this ;
		return me.iframeEl.dom.contentWindow;
	},

	getFrame: function() {
		var me = this;
		return me.iframeEl.dom;
	},

	beforeDestroy: function () {
		var me = this,
				doc, prop;

		if (me.rendered) {
			try {
				doc = me.getDoc();
				if (doc) {
					Ext.EventManager.removeAll(doc);
					for (prop in doc) {
							if (doc.hasOwnProperty && doc.hasOwnProperty(prop)) {
								delete doc[prop];
							}
					}
				}
			} catch(e) { }
		}

		me.callParent();
	},
	
	updateContent: function(content) {
		var me = this,
			doc = me.getDoc() ;
		if (doc) {
			doc.open() ;
			doc.write(content) ;
			doc.write() ;
		}
	}
});
