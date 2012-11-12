Ext.define('Optima5.Modules.ParaCRM.QmergePanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5paracrmqmerge',
			  
	requires: [] ,
			  
	initComponent: function() {
		var me = this ;
		Ext.apply( me, {
			border:false,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			autoDestroy: true
		}) ;
		
		me.qmergePanelCfg = {} ;
		Ext.apply(me.qmergePanelCfg,{
			
			
		});
		
		me.callParent() ;
		
		me.on({
			scope: me,
			activate: me.createPanel,
			deactivate: me.destroyPanel
		});
	},
			  
			  
	
	
	createPanel: function(){
		var me = this ;
		
		me.isActive = true ;
		
		me.removeAll();
	},
	destroyPanel: function(){
		var me = this ;
		
		me.isActive = false ;
		me.removeAll();
	},

	qmergeNew: function() {
		var me = this ;
		if( me.isVisible() ){
			me.destroyPanel() ;
		}
		
	},
	qmergeOpen: function( qmergeId ) {
		var me = this ;
		if( me.isVisible() ){
			me.destroyPanel() ;
		}
		
	}
});