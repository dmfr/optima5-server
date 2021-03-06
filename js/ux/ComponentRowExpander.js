/*
 * Inspired by : http://www.rahulsingla.com/blog/2010/04/extjs-preserving-rowexpander-markup-across-view-refreshes
 * Reappend element to DOM : http://stackoverflow.com/questions/20143082/does-extjs-automatically-garbage-collect-components
 */

Ext.define('Ext.ux.ComponentRowExpander', {
	extend: 'Ext.grid.plugin.RowExpander',

	alias: 'plugin.cmprowexpander',

	rowBodyTpl : ['<div></div>'],
	
	obj_recordId_componentId: {},
	 
	init: function(grid) {
		this.callParent(arguments) ;
		
		var view = grid.getView() ;
		view.on('resize', this.onResize, this) ;
		view.on('refresh', this.onRefresh, this);
		view.on('expandbody', this.onExpand, this);
		
		grid.on('destroy', this.onDestroyGrid, this) ;
		grid.headerCt.on('columnresize', this.onResize, this) ;
		
		this.obj_recordId_componentId = {} ;
	},
	
	getRecordKey: function(record) {
		return (record.internalId);
	},
	
	createComponent: function(view, record, rowNode, rowIndex) {
		return Ext.create('Ext.Component') ;
	},
	
	onExpand: function(rowNode, record, expandRow) {
		var recordId = this.getRecordKey(record) ;
		if( Ext.isEmpty( this.obj_recordId_componentId[recordId] ) ) {
			var view = this.grid.getView(),
				newComponent = this.createComponent(view, record, rowNode, view.indexOf(rowNode)),
				targetRowbody = Ext.DomQuery.selectNode('div.x-grid-rowbody', expandRow) ;
			
			/*
			 * Update 2015-07 : stop all Events from going to parents
			 */
			newComponent.mon( Ext.get(targetRowbody), {
				scope: this,
				click: this.onEvent,
				longpress: this.onEvent,
				mousedown: this.onEvent,
				mouseup: this.onEvent,
				dblclick: this.onEvent,
				contextmenu: this.onEvent,
				keydown: this.onEvent,
				keyup: this.onEvent,
				keypress: this.onEvent,
				mouseover: this.onEvent,
				mouseout: this.onEvent
			});
			
			while (targetRowbody.hasChildNodes()) {
				targetRowbody.removeChild(targetRowbody.lastChild);
			}
			newComponent.render( targetRowbody ) ;
			
			this.obj_recordId_componentId[recordId] = newComponent.getId() ;
		}
		this.onResize() ;
	},
	
	onRefresh: function(view) {
		var reusedCmpIds = [] ;
		Ext.Array.each( view.getNodes(), function(node) {
			var record = view.getRecord(node),
				recordId = this.getRecordKey(record) ;
				
			if( !Ext.isEmpty(this.obj_recordId_componentId[recordId]) ) {
				var cmpId = this.obj_recordId_componentId[recordId] ;
				
				reusedCmpIds.push(cmpId) ;
				var reusedComponent = Ext.getCmp(this.obj_recordId_componentId[recordId]),
					targetRowbody = Ext.DomQuery.selectNode('div.x-grid-rowbody', node);
				while (targetRowbody.hasChildNodes()) {
					targetRowbody.removeChild(targetRowbody.lastChild);
				}
				
				// http://stackoverflow.com/questions/20143082/does-extjs-automatically-garbage-collect-components
				targetRowbody.appendChild( reusedComponent.getEl().dom );
				reusedComponent.updateLayout() ;
			}
		},this) ;
		
		
		// Do Garbage collection
		// Method 1 ( http://skirtlesden.com/static/ux/download/component-column/1.1/Component.js )
		var keysToDelete = [] ;
		Ext.Object.each( this.obj_recordId_componentId, function( recordId, testCmpId ) {
			comp = Ext.getCmp(testCmpId);
			el = comp && comp.getEl();

			if (!el || (true && (!el.dom || Ext.getDom(Ext.id(el)) !== el.dom))) {
				// The component is no longer in the DOM
				if (comp && !comp.isDestroyed) {
					comp.destroy();
					keysToDelete.push(recordId) ;
				}
			}
		}) ;
		
		// Method 2
		/*
		Ext.Object.each( this.obj_recordId_componentId, function( recordId, testCmpId ) {
			if( !Ext.Array.contains( reusedCmpIds, testCmpId ) ) {
				comp = Ext.getCmp(testCmpId);
				comp.destroy();
				keysToDelete.push(recordId) ;
			}
		}) ;
		*/
		
		// Clean map
		Ext.Array.each( keysToDelete, function(mkey) {
			delete this.obj_recordId_componentId[mkey] ;
		},this);
	},
	
	onEvent: function(e) {
		e.stopEvent() ;
	},
	
	onResize: function() {
		Ext.Object.each( this.obj_recordId_componentId, function( recordId, cmpId ) {
			Ext.getCmp(cmpId).updateLayout();
		}) ;
	},
	 
	onDestroyGrid: function() {
		Ext.Object.each( this.obj_recordId_componentId, function(recordId, cmpId) {
			Ext.getCmp(cmpId).destroy() ;
		}) ;
	 }
});