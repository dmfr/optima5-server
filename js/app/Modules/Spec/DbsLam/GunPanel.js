Ext.define('Optima5.Modules.Spec.DbsLam.GunPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		//'Optima5.Modules.Spec.DbsLam.HelperCache',
		
		'Optima5.Modules.Spec.DbsLam.GunMenu',
		'Optima5.Modules.Spec.DbsLam.GunContainers',
		'Optima5.Modules.Spec.DbsLam.GunPicking',
		'Optima5.Modules.Spec.DbsLam.GunPacking'
	],
	
	initComponent: function() {
		Ext.apply(this,{
			layout:'fit',
			border: false,
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}]
		});
		this.callParent() ;
		
		Ext.defer( function() {
			this.switchToMainMenu() ;
		},1000,this) ;
	},
	switchToMainMenu: function() {
		var me = this ;
		var mainMenuView = Ext.create('Optima5.Modules.Spec.DbsLam.GunMenu',{
			scrollable: 'vertical',
			listeners: {
				actionclick: function( view, actionCode ) {
					me.onActionClick(actionCode) ;
				},
				scope: me
			}
		}) ;
		this.removeAll() ;
		this.add( mainMenuView ) ;
	},
	onActionClick: function( actionCode ) {
		var me = this ;
		//console.log("Action: "+actionCode) ;
		
		switch( actionCode ) {
			case 'gun_containers' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsLam.GunContainers',{}) ;
			case 'gun_picking' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsLam.GunPicking',{}) ;
			case 'gun_packing' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsLam.GunPacking',{}) ;
			default :
				return ;
		}
	},
	switchToAppPanel: function( className, options, noDestroy ) {
		var me = this ;
		
		options = options || {} ;
		Ext.apply(options,{
			optimaModule: me.optimaModule,
			noDestroy: noDestroy
		}) ;
		
		var panel = Ext.create(className,options) ;
		if( !noDestroy ) {
			panel.on('destroy',function() {
				me.switchToMainMenu() ;
			},this) ;
		}
		
		this.removeAll() ;
		this.add( panel ) ;
	}
}) ;
