Ext.define('Optima5.Modules.Spec.WbMrfoxy.StatPerformancePanel',{
	extend: 'Ext.panel.Panel',
	
	requires:[
		'Optima5.Modules.Spec.WbMrfoxy.StatPerformanceResultView'
	],
	
	initComponent: function() {
		var me = this,
			width = me.width ;
		
		Ext.apply( me, {
			layout:{
				type:'vbox',
				align:'center'
			},
			bodyCls: 'op5-spec-mrfoxy-mainmenu',
			items:[
				Ext.apply(me.initHeaderCfg(),{
					width: width,
					height: 72
				}),{
					xtype:'box',
					html:'&#160;',
					height: 8
				},
				Ext.apply(me.initFormCfg(),{
					width:width,
					height: 120
				}),
				Ext.apply(me.initDummyFormCfg(),{
					width:width,
					height: 120,
					hidden: true
				}),{
					xtype:'box',
					html:'&#160;',
					height: 8
				},Ext.apply(me.initTabsCfg(),{
					width: width,
					flex:1
				})
			]
		});
		
		this.callParent() ;
	},
	
	initHeaderCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			cls: 'op5-spec-mrfoxy-statheader',
			tpl: [
				'<div class="op5-spec-mrfoxy-statheader-wrap">',
					'<div class="op5-spec-mrfoxy-statheader-title">{title}</div>',
					'<div class="op5-spec-mrfoxy-statheader-icon {iconCls}"></div>',
					'<div class="op5-spec-mrfoxy-statheader-close"></div>',
					'<div class="op5-spec-mrfoxy-statheader-download"></div>',
				'</div>'
			],
			data:{
				iconCls: 'op5-spec-mrfoxy-icon-statperf',
				title: 'Performance Analysis'
			},
			listeners:{
				afterrender: function() {
					this.headerAttachEvent() ;
				},
				scope: this
			}
		} ;
		
		return headerCfg ;
	},
	initFormCfg: function() {
		var me = this ;
		var formCfg = {
			xtype:'form',
			itemId:'pForm',
			frame:true,
			bodyPadding: '2px 10px',
			style: "text-align:left", // HACK
			items:[{
				xtype:'fieldset',
				defaults: {
					anchor: '100%',
					labelWidth: 75
				},
				title: 'Query parameters',
				items:[{
					xtype:'fieldcontainer',
					fieldLabel: 'Time mode',
					itemId: 'cntTime',
					layout: {
						type: 'hbox'
					},
					items:[{
						width: 140,
						anchor: '',
						xtype: 'combobox',
						queryMode: 'local',
						forceSelection: true,
						editable: false,
						displayField: 'time_text',
						valueField: 'time_mode',
						store: {
							fields: ['time_mode','time_text'],
							data : [
								{time_mode:'FULL', time_text:'Whole year/crop'},
								{time_mode:'TO_DATE', time_text:'Crop to Date'},
								{time_mode:'FROM_DATE', time_text:'Crop to go'}
							]
						},
						allowBlank: false,
						name : 'time_mode',
						itemId : 'time_mode',
						value: 'FULL',
						listeners: {
							change: function(cb,value) {
								var dateField = cb.up().down('datefield') ;
								switch( value ) {
									case 'TO_DATE' :
									case 'FROM_DATE':
										dateField.setVisible(true) ;
										break ;
									case 'FULL' :
										dateField.setVisible(false) ;
										break ;
								}
								me.evalForm() ;
							},
							scope: me
						}
					},{
						width:4,
						xtype:'box',
						html:'&#160;'
					},{
						xtype:'datefield',
						startDay:1,
						format: 'Y-m-d',
						width: 100,
						anchor: '',
						hidden: true,
						value: new Date(),
						name : 'break_date',
						itemId : 'break_date',
						listeners: {
							change: function(cb,value) {
								me.evalForm() ;
							},
							scope: me
						}
					}]
				},{
					xtype:'fieldcontainer',
					fieldLabel: 'Location',
					itemId: 'cntLocation',
					layout: {
						type: 'hbox'
					},
					items:[{
						width: 200,
						xtype: 'colorcombo',
						queryMode: 'local',
						forceSelection: true,
						editable: false,
						displayField: 'country_display',
						valueField: 'country_code',
						iconUrlField: 'country_iconurl',
						store: {
							fields: ['country_code','country_display','country_iconurl'],
							data : Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetAll()
						},
						allowBlank: false,
						name : 'country_code',
						itemId : 'country_code',
						listeners: {
							change: function() {
								me.evalForm() ;
								me.buildStorePicker() ;
							},
							scope: me
						}
					},{
						width:16,
						xtype:'box',
						html:'&#160;'
					}]
				},{
					xtype: 'op5crmbasebibletreepicker',
					anchor: '75%',
					allowBlank:false,
					rootNode: ( me.data != null ? me.data.country_code : null ),
					selectMode: 'single',
					optimaModule: me.optimaModule,
					bibleId: 'IRI_PROD',
					fieldLabel: 'Products',
					name: 'prod_code',
					listeners: {
						change: function() {
							me.evalForm() ;
						},
						scope: me
					}
				}]
			}]
		} ;
		return formCfg ;
	},
	initDummyFormCfg: function() {
		var me = this ;
		var formCfg = {
			xtype:'panel',
			bodyCls: 'ux-noframe-bg',
			itemId:'pDummyForm',
			frame:true,
			bodyPadding: '2px 10px',
			style: "text-align:left", // HACK
			hidden:true
		} ;
		return formCfg ;
	},
	initTabsCfg: function() {
		var me = this ;
		var tabsCfg = {
			xtype:'tabpanel',
			items:[{
				xtype:'container',
				title: 'Preview',
				itemId: 'cntQueryPreview',
				layout:'fit',
				border: false,
				items: this.initTabEmptyCfg()
			}],
			listeners: {
				add: me.onTabChange,
				remove: me.onTabChange,
				tabchange: me.onTabChange,
				scope: me,
			  
				/*
				* Attach managed listener to tabBar (right click)
				*/
				afterlayout:{
					fn: function(p) {
						this.mon( p.getTabBar().el, {
							contextmenu: this.onTabRightClick, 
							scope: this,
							delegate: 'a.x-tab'
						}) ;
					},
					scope: this,
					single: true
				}
			}
		} ;
		return tabsCfg ;
	},
	initTabEmptyCfg: function() {
		return {
			xtype:'component',
			cls: 'ux-noframe-bg',
			tpl: [
				'<div class="op5-spec-mrfoxy-statempty-cnt">',
					'<div class="op5-spec-mrfoxy-statempty">{caption}</div>',
				'</div>'
			],
			data:{
				caption: 'No query parameters'
			}
		}
	},
	
	
	
	buildStorePicker: function() {
		var me = this,
			countryCode = me.child('form').getForm().getValues()['country_code'],
			locationCnt = me.query('#cntLocation')[0],
			pickerCfg = {
				flex:1,
				xtype: 'op5crmbasebibletreepicker',
				allowBlank:false,
				rootNode: ( countryCode != '' ? countryCode : null ),
				selectMode: 'single',
				optimaModule: me.optimaModule,
				bibleId: 'IRI_STORE',
				name: 'store_code',
				listeners: {
					change: function() {
						me.evalForm() ;
					},
					scope: me
				}
			} ;
		
		if( locationCnt.query()[2] != null ) {
			locationCnt.remove( locationCnt.query()[2] ) ;
		}
		locationCnt.add(pickerCfg) ;
	},
	
	headerAttachEvent: function() {
		var me=this,
			headerCmp = me.getComponent('pHeader'),
			headerEl = headerCmp.getEl(),
			btnCloseEl = Ext.get(headerEl.query('div.op5-spec-mrfoxy-statheader-close')[0]),
			btnDownloadEl = Ext.get(headerEl.query('div.op5-spec-mrfoxy-statheader-download')[0]) ;
		btnCloseEl.un('click',me.onHeaderClose,me) ;
		btnCloseEl.on('click',me.onHeaderClose,me) ;
		btnDownloadEl.un('click',me.onHeaderDownload,me) ;
		btnDownloadEl.on('click',me.onHeaderDownload,me) ;
	},
	onHeaderClose: function(e,t) {
		var me = this ;
		me.fireEvent('quit') ;
	},
	onHeaderDownload: function(e,t) {
		var me = this ;
		me.handleDownload() ;
	},
	
	evalForm: function() {
		var me = this,
			form = me.child('form').getForm() ;
		
		me.query('#cntQueryPreview')[0].removeAll() ;
		me.query('#cntQueryPreview')[0].addCls('op5-waiting') ;
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'stat_performance_getResult',
				data: Ext.JSON.encode(me.child('form').getForm().getValues())
			},
			success: function(response) {
				me.query('#cntQueryPreview')[0].removeCls('op5-waiting') ;
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success != true ) {
					return ;
				}
				if( ajaxData.result_tab != null ) {
					me.installPreview( ajaxData ) ;
				} else {
					me.query('#cntQueryPreview')[0].add( me.initTabEmptyCfg() ) ;
				}
			},
			scope: me
		}) ;
	},
	installPreview: function( ajaxData ) {
		var me = this ;
		me.query('#cntQueryPreview')[0].add( Ext.create('Optima5.Modules.Spec.WbMrfoxy.StatPerformanceResultView',{
			optimaModule: me.optimaModule,
			queryData: ajaxData,
			modePreview: true,
			border: false,
			listeners: {
				savepreview: this.savePreview,
				scope: this
			}
		}) ) ;
	},
	savePreview: function( ajaxData ) {
		var me = this,
			tabpanel = me.down('tabpanel') ;
			
		tabpanel.add( Ext.create('Optima5.Modules.Spec.WbMrfoxy.StatPerformanceResultView',{
			optimaModule: me.optimaModule,
			queryData: ajaxData,
			title: 'Result #' + tabpanel.items.getCount(),
			closable: true
		}) ) ;
	},
	
	onTabChange: function() {
		if( !this.rendered ) {
			return ;
		}
		var me = this,
			tabpanel = me.down('tabpanel'),
			headerCmp = me.getComponent('pHeader'),
			headerEl = headerCmp.getEl(),
			btnDownloadEl = Ext.get(headerEl.query('div.op5-spec-mrfoxy-statheader-download')[0]) ;
		
		btnDownloadEl.setVisible( tabpanel.items.length > 1 ) ;
		
		var realForm = me.getComponent('pForm'),
			  dummyForm = me.getComponent('pDummyForm'),
			  isPreviewVisible = (tabpanel.getActiveTab().itemId=='cntQueryPreview') ;
		realForm.setVisible(isPreviewVisible) ;
		dummyForm.setVisible(!isPreviewVisible) ;
	},
	onTabRightClick: function(event, targetElement) {
		var me = this,
			tabPanel = me.down('tabpanel'),
			tabBar = tabPanel.getTabBar()
			tab = tabBar.getChildByElement(targetElement),
			tabIndex = tabBar.items.indexOf(tab),
			cPanel = tabPanel.items.getAt(tabIndex) ;
		
		if( cPanel.itemId == 'cntQueryPreview' ) {
			return ;
		}
		var menuItems = [{
			text: 'Rename to',
			handler: null,
			menu: {
				items:[{
					xtype:'textfield' ,
					value: tab.getText(),
					width:150
				},{
					xtype:'button',
					text:'Ok',
					handler: function(button) {
						var textfield = button.up('menu').query('textfield')[0],
							textValue = textfield.getValue() ;
						me.down('tabpanel').items.getAt(tabIndex).setTitle(textValue) ;
						Ext.menu.Manager.hideAll();
					},
					scope:me
				}]
			}
		}] ;
		var menu = Ext.create('Ext.menu.Menu',{
			defaults: {
				handler: function(menuItem) {
					me.onTabChartMenuItemClick( tabIndex, menuItem.itemId ) ;
				},
				scope: me
			},
			items: menuItems,
			listeners: {
				hide: function(menu) {
					Ext.defer(function(){menu.destroy();},10) ;
				}
			}
		}) ;
		menu.showAt(event.getXY());
	},
	
	handleDownload: function() {
		var me = this,
			tabPanel = me.down('tabpanel'),
			iterPanel ,
			postData = [] ;
			
		for( var idx=0 ; idx < tabPanel.items.getCount() ; idx++ ) {
			iterPanel = tabPanel.items.getAt(idx) ;
			if( iterPanel.itemId == 'cntQueryPreview' || !iterPanel.getData ) {
				continue ;
			}
			postData.push( iterPanel.getData() ) ;
		}
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'stat_exportXLS',
			data: Ext.JSON.encode(postData)
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	}
	
});