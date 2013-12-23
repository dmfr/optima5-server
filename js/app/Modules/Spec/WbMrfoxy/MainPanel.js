Ext.define('Optima5.Modules.Spec.WbMrfoxy.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.WbMrfoxy.HelperCache',
		'Optima5.Modules.Spec.WbMrfoxy.MainMenu',
		'Optima5.Modules.Spec.WbMrfoxy.PromoNewCfgPanel',
		'Optima5.Modules.Spec.WbMrfoxy.PromoFormPanel'
	],
	
	initComponent: function() {
		var me = this ;
			
		Ext.apply(me,{
			layout:'fit',
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}]
		});
		
		this.callParent() ;
		
		var helperCache = Optima5.Modules.Spec.WbMrfoxy.HelperCache ;
		helperCache.init(me.optimaModule) ;
		if( helperCache.isReady ) {
			this.switchToMainMenu() ;
		} else {
			helperCache.on('ready',function() {
				this.switchToMainMenu() ;
			},me) ;
		}
	},
	switchToMainMenu: function() {
		var me = this ;
		var mainMenuView = Ext.create('Optima5.Modules.Spec.WbMrfoxy.MainMenu',{
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
		console.log("Action: "+actionCode) ;
		
		switch( actionCode ) {
			case 'promo_new' :
				return me.handleNewPromo() ;
			default :
				return ;
		}
	},
	handleNewPromo: function() {
		var me = this ;
		
		var newPromoCfgPanel = Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoNewCfgPanel',{
			optimaModule: me.optimaModule,
			
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}]
		});
		// Size + position
		newPromoCfgPanel.setSize({
			width: 300,
			height: 220
		}) ;
		newPromoCfgPanel.on('proceed',function(p,promoCfg) {
			p.destroy() ;
			me.goPromoNew( promoCfg ) ;
		},me,{single:true}) ;
		newPromoCfgPanel.on('destroy',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		newPromoCfgPanel.show();
		newPromoCfgPanel.getEl().alignTo(me.getEl(), 'c-c?');
	},
	goPromoNew: function( promoCfg ) {
		var me = this ;
		
		var promoFormPanel = Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoFormPanel',{
			optimaModule: me.optimaModule,
			width: 700,
			data: promoCfg
		}) ;
		promoFormPanel.on('destroy',function(p) {
			console.log('was destroyed') ;
		},me) ;
		promoFormPanel.on('abort',function(p) {
			me.switchToMainMenu() ;
		},me) ;
		
		this.removeAll() ;
		this.add( promoFormPanel ) ;
	}
}) ;