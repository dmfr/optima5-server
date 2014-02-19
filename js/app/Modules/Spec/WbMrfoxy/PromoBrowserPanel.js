Ext.define('WbMrfoxyPromoListModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'id', type: 'string'},
		  {name: '_filerecord_id', type: 'int'},
        {name: 'promo_id',  type: 'string'},
        {name: 'is_prod',  type: 'string'},
        {name: 'brand_code',  type: 'string'},
        {name: 'brand_text',  type: 'string'},
        {name: 'country_code',  type: 'string'},
        {name: 'status_code',  type: 'string'},
        {name: 'status_text',  type: 'string'},
        {name: 'status_percent',  type: 'string'},
        {name: 'status_color',  type: 'string'},
        {name: 'prod_text',  type: 'string'},
        {name: 'prod_code',  type: 'string'},
        {name: 'store_text',   type: 'string'},
        {name: 'store_code',   type: 'string'},
        {name: 'mechanics_rewardcard',   type: 'boolean'},
        {name: 'mechanics_code',   type: 'string'},
        {name: 'mechanics_detail',   type: 'string'},
        {name: 'mechanics_text',   type: 'string'},
        {name: 'date_start',   type: 'string'},
        {name: 'date_end',   type: 'string'},
		  {name: 'date_length_weeks', type: 'int'},
        {name: 'calc_uplift_vol',   type: 'string'},
        {name: 'calc_uplift_per',   type: 'string'},
        {name: 'calc_roi',   type: 'string'},
        {name: 'cost_billing_code',   type: 'string'},
        {name: 'cost_billing_text',   type: 'string'},
        {name: 'cost_forecast',   type: 'number'},
        {name: 'cost_real',   type: 'number'},
        {name: 'obs_atl',   type: 'string'},
        {name: 'obs_btl',   type: 'string'},
        {name: 'obs_comment',   type: 'string'},
		  {name: 'approv_ds',   type: 'boolean'},
		  {name: 'approv_df',   type: 'boolean'},
        {name: 'benchmark_arr_ids', type: 'string'}
     ],
	  idgen: 'sequential'
});

Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoBrowserPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.WbMrfoxy.PromoListSubpanel',
		'Optima5.Modules.Spec.WbMrfoxy.PromoCalendarSubpanel'
	],
	
	viewMode: 'grid',
	nbHeadlines: 0,
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			//frame: true,
			border: false,
			layout: {
				type: 'card',
				align: 'stretch',
				deferredRender: true
			},
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<b>Back</b>',
				handler: function(){
					this.handleQuit() ;
				},
				scope: this
			},{
				xtype: 'tbseparator'
			},{
				itemId: 'tbCountry',
				icon: 'images/op5img/ico_blocs_small.gif',
				text: 'Sites / Entrepôts',
				menu: {
					xtype:'menu',
					items:[{
						xtype: 'treepanel',
						itemId: 'tbCountrySelect',
						width:250,
						height:300,
						store: {
							fields: [
								{name: 'country_code', type: 'string'},
								{name: 'country_text', type: 'string'},
								{name: 'country_iconurl', type: 'string'}
							],
							root: {children:[]},
							proxy: {
								type: 'memory' ,
								reader: {
									type: 'json'
								}
							}
						},
						displayField: 'country_text',
						rootVisible: true,
						useArrows: true,
					}]
				}
			},{
				itemId: 'tbProd',
				icon: 'images/op5img/ico_blocs_small.gif',
				text: 'Sites / Entrepôts',
				menu: [{
					text: 'Production',
					icon: 'images/op5img/ico_blocs_small.gif',
					handler: function() {
						this.selectIsProd( true );
					},
					scope: this
				},{
					text: 'Test / Simulation',
					icon: 'images/op5img/ico_blocs_small.gif',
					handler: function() {
						this.selectIsProd( false );
					},
					scope: this
				}]
			},'->',{
				itemId: 'tbRefresh',
				text: 'Refresh',
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				handler:function() {
					me.getLayout().getActiveItem().reload() ;
				},
				scope:me
			},{
				itemId: 'tbViewmode',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:function(menuitem) {
							//console.log('ch view '+menuitem.itemId) ;
							me.switchToView( menuitem.itemId ) ;
						},
						scope:me
					},
					items: [{
						itemId: 'grid',
						text: 'Grid data',
						iconCls: 'op5-crmbase-datatoolbar-view-grid'
					},{
						itemId: 'calendar',
						text: 'Calendar',
						iconCls: 'op5-crmbase-datatoolbar-view-calendar'
					},{
						itemId: 'editgrid',
						text: 'Editable grid',
						iconCls: 'op5-crmbase-datatoolbar-view-editgrid'
					}]
				}
			}],
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				itemId:'init'
			},
				Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoListSubpanel',{
					itemId: 'grid',
					border: false,
					nbHeadlines: me.nbHeadlines,
					parentBrowserPanel: me
				})
			,
				Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoCalendarSubpanel',{
					itemId: 'calendar',
					border: false,
					parentBrowserPanel: me
				})
			]
		});
		
		this.callParent() ;
		this.loadComponents() ;
		this.switchToView(me.viewMode) ;
	},
	loadComponents: function() {
		var me = this,
			tbCountrySelect = this.query('#tbCountrySelect')[0] ;
		
		countryChildren = [] ;
		Ext.Array.each( Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetAll(), function(rec) {
			countryChildren.push({
				leaf:true,
				checked: false,
				country_code: rec.get('country_code'),
				country_text: rec.get('country_display'),
				country_iconurl: rec.get('country_iconurl'),
				icon: rec.get('country_iconurl')
			});
		}, me) ;
		tbCountrySelect.setRootNode({
			root: true,
			children: countryChildren,
			expanded: true,
			country_code:'',
			country_text:'<b>'+'All countries'+'</b>',
			country_iconurl:'images/op5img/ico_planet_small.gif',
			checked:true,
			icon: 'images/op5img/ico_planet_small.gif'
		});
		
		tbCountrySelect.getView().on('checkchange',function(rec,check){
			var rootNode = rec ;
			while( !rootNode.isRoot() ) {
				rootNode = rootNode.parentNode ;
			}
			if( !check ) {
				rootNode.cascadeBy(function(chrec){
					if( chrec==rec ) {
						chrec.set('checked',true) ;
					}
				},this);
			} else {
				rootNode.cascadeBy(function(chrec){
					if( chrec != rec ) {
						chrec.set('checked',false) ;
					}
				},this);
				this.onSelectCountry() ;
			}
		},this) ;
		this.onSelectCountry(true) ;
		
		if( this._isProd != null ) {
			this.selectIsProd(this._isProd, true) ;
		} else {
			this.selectIsProd(true, true) ;
		}
		
		Ext.defer( function() {
			this.fireEvent('tbarselect') ; // TODO: HACK : Use menucreate event from headerCt !!
		},100,this) ;
	},
	
	onSelectCountry: function(silent) {
		var me = this,
			tbCountry = this.query('#tbCountry')[0],
			tbCountrySelect = this.query('#tbCountrySelect')[0] ;
		
		tbCountrySelect.getRootNode().cascadeBy(function(chrec){
			if( chrec.get('checked') ) {
				tbCountry.setIcon( chrec.get('country_iconurl') ) ;
				tbCountry.setText( chrec.get('country_text') ) ;
				
				me.filterCountry = chrec.get('country_code') ;
				if( !silent ) {
					me.fireEvent('tbarselect') ;
				}
				
				return false ;
			}
		},this);
	},
	selectIsProd: function(isProd,silent) {
		var me = this,
			tbViewmode = me.child('toolbar').getComponent('tbViewmode'),
			tbProd = me.child('toolbar').getComponent('tbProd'),
			text ;
		if( isProd ) {
			text = 'Production' ;
		} else {
			text = 'Test / Simulation' ;
		}
		tbProd.setText('<b>'+text+'</b>') ;
		tbViewmode.setVisible(isProd) ;
		
		me.filterIsProd = isProd ;
		if( !silent ) {
			me.fireEvent('tbarselect') ;
		}
	},
	
	switchToView: function( viewId ) {
		var me = this,
			tbViewmode = me.child('toolbar').getComponent('tbViewmode'),
			tbProd = me.child('toolbar').getComponent('tbProd'),
			iconCls, text ;
		switch( viewId ) {
			case 'grid' :
				text = 'List' ;
				iconCls = 'op5-crmbase-datatoolbar-view-grid' ;
				break ;
			case 'calendar' :
				text = 'Calendar' ;
				iconCls = 'op5-crmbase-datatoolbar-view-calendar' ;
				break ;
			default:
				return ;
		}
		me.viewMode = viewId ;
		tbViewmode.setIconCls(iconCls) ;
		tbViewmode.setText(text) ;
		
		me.getLayout().setActiveItem(viewId) ;
		tbProd.setVisible(viewId=='grid') ;
	},
	
	handleQuit: function() {
		this.fireEvent('quit') ;
	}
});