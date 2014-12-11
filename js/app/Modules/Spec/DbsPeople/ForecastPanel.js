Ext.define('DbsPeopleForecastCfgUoRole', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'role_code',  type: 'string'},
		{name: 'role_hRate', type: 'int'}
	]
});
Ext.define('DbsPeopleForecastCfgUo', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'uo_code',  type: 'string'}
	],
	hasMany: [{
		model: 'DbsPeopleForecastCfgUoRole',
		name: 'roles',
		associationKey: 'roles'
	}]
});

Ext.define('DbsPeopleForecastDayResourceModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'rsrc_date',  type: 'string'},
		{name: 'rsrc_role_code',  type: 'string'},
		{name: 'rsrc_qty_hour', type: 'float'}
	]
});
Ext.define('DbsPeopleForecastUoVolumeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'uo_code',  type: 'string'},
		{name: 'uo_qty_unit', type: 'int'}
	]
});
Ext.define('DbsPeopleForecastWeekModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'week_date',  type: 'string'},
		{name: 'whse_code', type: 'string'}
	],
	hasMany: [{
		model: 'DbsPeopleForecastDayResourceModel',
		name: 'day_resources',
		associationKey: 'day_resources'
	},{
		model: 'DbsPeopleForecastUoVolumeModel',
		name: 'week_volumes',
		associationKey: 'week_volumes'
	}]
});

Ext.define('DbsPeopleForecastRowModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'role_code',  type: 'string'},
		{
			name: 'role_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.role_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",v).text ;
			}
		},
		{name: 'uo_code',  type: 'string'},
		{
			name: 'uo_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.role_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",v).text ;
			}
		},
	]
});

Ext.define('Optima5.Modules.Spec.DbsPeople.ForecastPanel',{
	extend:'Ext.panel.Panel',
	
	requires:[
		'Optima5.Modules.Spec.DbsPeople.ForecastCfgWhsePanel'
	],
	
	whseCode: null,
	dateBase: null,
	viewMode: 'weeklist',
	weekCount: 25,
	
	forecastCfgWhseStore: null,
	forecastWeekStore: null,
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			//frame: true,
			border: false,
			layout:'fit',
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Retour menu</u>',
				handler: function(){
					this.handleQuit() ;
				},
				scope: this
			},{
				xtype: 'tbseparator'
			},Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamSiteButton',{
				itemId: 'btnSite',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							me.onSiteSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							this.onPreInit() ;
						},
						scope: this
					}
				}
			}),{
				icon: 'images/op5img/ico_calendar_16.png',
				itemId: 'tbDate',
				menu: Ext.create('Ext.menu.DatePicker',{
					startDay: 1,
					listeners:{
						select: function( datepicker, date ) {
							this.onDateSet(date) ;
							Ext.menu.Manager.hideAll() ;
						},
						scope: this
					}
				})
			},{
				itemId: 'tbViewmode',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:function(menuitem) {
							//console.log('ch view '+menuitem.itemId) ;
							me.onViewSet( menuitem.itemId ) ;
						},
						scope:me
					},
					items: [{
						itemId: 'weeklist',
						text: 'Week list',
						iconCls: 'op5-crmbase-datatoolbar-view-grid'
					},{
						itemId: 'weekdetail',
						text: 'Week details',
						iconCls: 'op5-crmbase-datatoolbar-view-calendar'
					}]
				}
				
			},'->',{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doLoad() ;
				},
				scope: this
			},{
				itemId: 'tbSettings',
				hidden: true,
				iconCls: 'op5-crmbase-datatoolbar-view-grid',
				viewConfig: {forceFit: true},
				menu: {
					items: [{
						text: 'Importation RealPeople',
						iconCls: 'op5-crmbase-datatoolbar-view-grid'
					},{
						text: 'Config. UO / whse',
						iconCls: 'op5-crmbase-datatoolbar-view-grid',
						handler:function(menuitem) {
							this.openCfgWhse() ;
						},
						scope: this
					}]
				}
			}],
			items:[]
		});
		this.preInit = 1 ;
		this.callParent() ;
	},
	onPreInit: function() {
		var me = this ;
		me.preInit-- ;
		if( me.preInit == 0 ) {
			me.isReady=true ;
			me.startPanel() ;
		}
	},
	startPanel: function() {
		var me = this ;
		
		this.tmpModelName = 'DbsPeopleForecastRowModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		me.onSiteSet() ;
		me.onDateSet( new Date() ) ;
		me.onViewSet( me.viewMode ) ;
		return ;
	},
	
	helperGetRoleTxt: function( roleCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",roleCode).text ;
	},
	helperGetWhseTxt: function( whseCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("WHSE",whseCode).text ;
	},
	helperGetTeamTxt: function( teamCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("TEAM",teamCode).text ;
	},
	helperGetAbsTxt: function( absCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ABS",absCode).text ;
	},
	helperGetCliTxt: function( cliCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("CLI",cliCode).text ;
	},
	
	onSiteSet: function() {
		var filterSiteBtn = this.down('#btnSite') ;
		if( !Ext.isEmpty(filterSiteBtn.getLeafNodesKey()) && filterSiteBtn.getLeafNodesKey().length == 1 ) {
			this.whseCode = filterSiteBtn.getLeafNodesKey()[0] ;
		} else {
			this.whseCode = null ;
		}
		
		this.doLoad() ;
	},
	onDateSet: function( date ) {
		var me = this,
			tbDate = me.child('toolbar').getComponent('tbDate') ;
		
		// configuration GRID
		var first = date.getDate() - ( date.getDay() > 0 ? date.getDay() : 7 ) + 1; // First day is the day of the month - the day of the week
		var last = first + 6; // last day is the first day + 6
		
		me.dateBase = new Date(Ext.clone(date).setDate(first));
		//me.dateEnd = new Date(Ext.clone(date).setDate(last));
		
		var weekStr = 'Sem. ' + Ext.Date.format( me.dateBase, 'W / o' ) ;
		tbDate.setText('<b>' + weekStr + '</b>') ;
		
		me.doLoad() ;
	},
	onViewSet: function( viewId ) {
		var me = this,
			tbViewmode = me.child('toolbar').getComponent('tbViewmode'),
			tbViewmodeItem = tbViewmode.menu.getComponent(viewId),
			iconCls, text,
			disableExport = false ;
		if( tbViewmodeItem ) {
			me.viewMode = viewId ;
			tbViewmode.setText( '<b>' + tbViewmodeItem.text + '</b>' );
			tbViewmode.setIconCls( tbViewmodeItem.iconCls );
		}
		
		this.doLoad() ;
	},
	updateToolbar: function(doActivate) {
		var tbSettings = this.child('toolbar').getComponent('tbSettings') ;
		tbSettings.setVisible(doActivate) ;
		
	},
	
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	doLoad: function() {
		if( !this.isReady ) {
			return ;
		}
		
		var filterSiteBtn = this.down('#btnSite') ;
		if( !(this.whseCode && this.dateBase && this.viewMode) ) {
			this.updateToolbar(false) ;
			return this.onLoadEmpty() ;
		}
		
		this.showLoadmask() ;
		this.updateToolbar(true) ;
		
		var params = {
			_moduleId: 'spec_dbs_people',
			_action: 'Forecast_getWeeks'
		};
		Ext.apply( params, {
			whse_code: this.whseCode,
			date_base_sql: Ext.Date.format( this.dateBase, 'Y-m-d' ),
			date_count: this.weekCount
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				this.onLoadResponse(response) ;
			},
			scope: this
		});
	},
	onLoadEmpty: function() {
		this.removeAll() ;
		this.add({
			xtype:'box',
			cls:'ux-noframe-bg'
		}) ;
	},
	onLoadResponse: function(response) {
		var me = this,
			jsonResponse = Ext.JSON.decode(response.responseText) ;
		
		
		
		// Drop loadmask
		this.hideLoadmask();
	},
	
	openCfgWhse: function() {
		var me = this ;
		
		var setSizeFromParent = function( parentPanel, targetPanel ) {
			targetPanel.setSize({
				width: parentPanel.getSize().width - 20,
				height: parentPanel.getSize().height - 60
			}) ;
		};
		
		var cfgWhsePanel = Ext.create('Optima5.Modules.Spec.DbsPeople.ForecastCfgWhsePanel',{
			optimaModule: me.optimaModule,
			whseCode: me.whseCode,
			width:800, // dummy initial size, for border layout to work
			height:600, // ...
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}]
		});
		
		cfgWhsePanel.mon(me,'resize', function() {
			setSizeFromParent( me, cfgWhsePanel ) ;
		},me) ;
		
		// Size + position
		setSizeFromParent(me,cfgWhsePanel) ;
		cfgWhsePanel.on('destroy',function() {
			me.getEl().unmask() ;
			// me.fireEvent('qbookztemplatechange') ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		cfgWhsePanel.show();
		cfgWhsePanel.getEl().alignTo(me.getEl(), 't-t?',[0,50]);
	},
	
	handleQuit: function() {
		this.destroy() ;
	}
});