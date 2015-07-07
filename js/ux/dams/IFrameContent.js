/**
* Barebones iframe implementation. From ExtJS 5.1
*/
Ext.define('Ext.ux.dams.IFrameContent', {
	extend: 'Ext.Component',

	loadMask: 'Loading...',

	src: 'about:blank',

	renderTpl: [
		'<iframe src="{src}" id="{id}-iframeEl" data-ref="iframeEl" name="{frameName}" width="100%" height="100%" frameborder="0"></iframe>'
	],
	childEls: ['iframeEl'],

	initComponent: function () {
		this.callParent();

		this.frameName = this.frameName || this.id + '-frame';
		this.on('afterrender',this.onAfterRender,this) ;
	},

	initRenderData: function() {
		return Ext.apply(this.callParent(), {
			src: this.src,
			frameName: this.frameName
		});
	},

	getBody: function() {
		var doc = this.getDoc();
		return doc.body || doc.documentElement;
	},

	getDoc: function() {
		try {
			return this.getWin().document;
		} catch (ex) {
			return null;
		}
	},

	getWin: function() {
		var me = this,
			name = me.frameName,
			win = Ext.isIE
					? me.iframeEl.dom.contentWindow
					: window.frames[name];
					
		return win;
	},

	getFrame: function() {
		var me = this;
		return me.iframeEl.dom;
	},

	beforeDestroy: function () {
		this.cleanupListeners(true);
		this.callParent();
	},
	
	cleanupListeners: function(destroying){
		var doc, prop;

		if (this.rendered) {
			try {
					doc = this.getDoc();
					if (doc) {
						Ext.get(doc).un(this._docListeners);
						if (destroying) {
							for (prop in doc) {
									if (doc.hasOwnProperty && doc.hasOwnProperty(prop)) {
										delete doc[prop];
									}
							}
						}
					}
			} catch(e) { }
		}
	},

	onAfterRender: function() {
		var me = this,
			doc = me.getDoc(),
			fn = me.onRelayedEvent;

		if (doc) {
			try {
				if( me.content ) {
					doc.open() ;
					doc.write(me.content) ;
					doc.close();
				}
					// These events need to be relayed from the inner document (where they stop
					// bubbling) up to the outer document. This has to be done at the DOM level so
					// the event reaches listeners on elements like the document body. The effected
					// mechanisms that depend on this bubbling behavior are listed to the right
					// of the event.
					Ext.get(doc).on(
						me._docListeners = {
							mousedown: fn, // menu dismisal (MenuManager) and Window onMouseDown (toFront)
							mousemove: fn, // window resize drag detection
							mouseup: fn,   // window resize termination
							click: fn,     // not sure, but just to be safe
							dblclick: fn,  // not sure again
							scope: me
						}
					);
			} catch(e) {
					// cannot do this xss
			}

			// We need to be sure we remove all our events from the iframe on unload or we're going to LEAK!
			Ext.get(this.getWin()).on('beforeunload', me.cleanupListeners, me);

			this.el.unmask();
			this.fireEvent('load', this);

		}
	},

	onRelayedEvent: function (event) {
		// relay event from the iframe's document to the document that owns the iframe...

		var iframeEl = this.iframeEl,

			// Get the left-based iframe position
			iframeXY = iframeEl.getTrueXY(),
			originalEventXY = event.getXY(),

			// Get the left-based XY position.
			// This is because the consumer of the injected event will
			// perform its own RTL normalization.
			eventXY = event.getTrueXY();

		// the event from the inner document has XY relative to that document's origin,
		// so adjust it to use the origin of the iframe in the outer document:
		event.xy = [iframeXY[0] + eventXY[0], iframeXY[1] + eventXY[1]];

		event.injectEvent(iframeEl); // blame the iframe for the event...

		event.xy = originalEventXY; // restore the original XY (just for safety)
	},

	updateContent: function(content) {
		var me = this,
			doc = me.getDoc() ;
		if (doc) {
			doc.open() ;
			doc.write(content) ;
			doc.close() ;
		}
	}
});
