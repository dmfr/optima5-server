Ext.define('Optima5.Modules.Spec.WbMrfoxy.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.WbMrfoxy.HelperCache',
		'Optima5.Modules.Spec.WbMrfoxy.MainMenu',
		'Optima5.Modules.Spec.WbMrfoxy.PromoNewCfgPanel',
		'Optima5.Modules.Spec.WbMrfoxy.PromoFormPanel',
		'Optima5.Modules.Spec.WbMrfoxy.PromoBrowserPanel',
		'Optima5.Modules.Spec.WbMrfoxy.StatPerformancePanel'
	],
	
	initComponent: function() {
		var me = this ;
			
		Ext.apply(me,{
			layout:'fit',
			items:[{
				xtype:'box',
				cls:'op5-spec-mrfoxy-mainmenu',
				flex:1,
				html: '<div class="op5-spec-mrfoxy-logo"></span>' 
			}]
		});
		
		this.on('afterrender', function(){
			Ext.defer(this.startAnimation, 500, this) ;
		}, me) ;
		
		this.callParent() ;
	},
	startAnimation: function() {
		var logoEl = Ext.get( Ext.DomQuery.selectNode('div.op5-spec-mrfoxy-logo') );
		logoEl.animate({
			duration: 1000,
			to: {
				opacity: 1
			}
		});
		Ext.defer( this.onEndAnimation, 2000, this) ;
	},
	onEndAnimation: function() {
		var me = this ;
		
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
		//console.log("Action: "+actionCode) ;
		
		switch( actionCode ) {
			case 'promo_new' :
				return me.handleNewPromo() ;
			case 'promo_headlines' :
				return me.switchToAppPanel('Optima5.Modules.Spec.WbMrfoxy.PromoBrowserPanel',{viewMode:'grid',nbHeadlines:5}) ;
			case 'promo_list' :
				return me.switchToAppPanel('Optima5.Modules.Spec.WbMrfoxy.PromoBrowserPanel',{viewMode:'grid'}) ;
			case 'promo_calendar' :
				return me.switchToAppPanel('Optima5.Modules.Spec.WbMrfoxy.PromoBrowserPanel',{viewMode:'calendar'}) ;
			case 'stat_performance' :
				return me.switchToAppPanel('Optima5.Modules.Spec.WbMrfoxy.StatPerformancePanel',{width: 600}) ;
			default :
				return ;
		}
	},
	
	switchToAppPanel: function( className, options ) {
		var me = this ;
		
		options = options || {} ;
		Ext.apply(options,{
			optimaModule: me.optimaModule
		}) ;
		
		var panel = Ext.create(className,options) ;
		panel.on('editpromo',function(promoRecord) {
			this.handleEditPromo(promoRecord) ;
		},this) ;
		panel.on('quit',function() {
			me.switchToMainMenu() ;
		},this) ;
		
		this.removeAll() ;
		this.add( panel ) ;
	},
	
	handleEditPromo: function(promoRecord) {
		var me = this ;
		var promoFormPanel = Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoFormPanel',{
			optimaModule: me.optimaModule,
			promoRecord: promoRecord,
			width: 800
		}) ;
		promoFormPanel.on('saved',function(p) {
			this.remove(p) ;
			this.child().setVisible(true) ;
			this.child().getLayout().getActiveItem().reload() ;
		},me) ;
		promoFormPanel.on('abort',function(p) {
			this.remove(p) ;
			this.child().setVisible(true) ;
		},me) ;
		
		this.child().setVisible(false) ;
		this.add( promoFormPanel ) ;
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
			width: 800,
			data: promoCfg
		}) ;
		promoFormPanel.on('saved',function(p) {
			if( promoCfg.is_prod == 'PROD' ) {
				me.switchToAppPanel('Optima5.Modules.Spec.WbMrfoxy.PromoBrowserPanel',{viewMode:'grid',nbHeadlines:1,_isProd:true});
			} else {
				me.switchToAppPanel('Optima5.Modules.Spec.WbMrfoxy.PromoBrowserPanel',{viewMode:'grid',nbHeadlines:1,_isProd:false});
			}
		},me) ;
		promoFormPanel.on('abort',function(p) {
			me.switchToMainMenu() ;
		},me) ;
		
		this.removeAll() ;
		this.add( promoFormPanel ) ;
	}
}) ;