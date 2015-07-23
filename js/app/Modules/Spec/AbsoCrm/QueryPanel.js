Ext.define('Optima5.Modules.Spec.AbsoCrm.QueryPanel',{
	extend: 'Ext.panel.Panel',
	
	requires:[
		'Optima5.Modules.Spec.AbsoCrm.QueryResultView'
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
					height: 150
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
				title: 'Sales Queries'
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
					labelWidth: 75
				},
				title: 'Query parameters',
				items:[{
					xtype:'fieldcontainer',
					anchor: '100%',
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
								{time_mode:'MONTH', time_text:'Month to Date'},
								{time_mode:'CROP', time_text:'Crop to Date'},
								{time_mode:'DATES', time_text:'Specify dates'}
							]
						},
						allowBlank: false,
						name : 'time_mode',
						itemId : 'time_mode',
						value: 'MONTH',
						listeners: {
							change: function(cb,value) {
								var dateStart = cb.up().down('#dateStart'),
									dateEnd = cb.up().down('#dateEnd'),
									dateSeparator = cb.up().down('#dateSeparator') ;
								switch( value ) {
									case 'DATES' :
										dateStart.setVisible(true) ;
										dateEnd.setVisible(true) ;
										dateSeparator.setVisible(true);
										break ;
									default :
										dateStart.setVisible(false) ;
										dateEnd.setVisible(false) ;
										dateSeparator.setVisible(false);
										break ;
								}
							},
							scope: me
						}
					},{
						width:16,
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
						name : 'date_start',
						itemId : 'dateStart',
						listeners: {
							change: function(cb,value) {
								//me.evalForm() ;
							},
							scope: me
						}
					},{
						width:16,
						itemId : 'dateSeparator',
						xtype:'box',
						html:'&#160;to&#160;',
						hidden: true
					},{
						xtype:'datefield',
						startDay:1,
						format: 'Y-m-d',
						width: 100,
						anchor: '',
						hidden: true,
						value: new Date(),
						name : 'date_end',
						itemId : 'dateEnd',
						listeners: {
							change: function(cb,value) {
								//me.evalForm() ;
							},
							scope: me
						}
					}]
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
				caption: 'Set query parameters'
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
				bibleId: 'CUSTOMER',
				name: 'custgroup_code',
				listeners: {
					change: function() {
						//me.evalForm() ;
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
		me.destroy() ;
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
		
		var msgbox = Ext.Msg.wait('Running query. Please Wait.');
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_sales',
				_action: 'query_getResult',
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
			callback: function() {
				msgbox.close() ;
			},
			scope: me
		}) ;
	},
	installPreview: function( ajaxData ) {
		var me = this ;
		me.query('#cntQueryPreview')[0].add( Ext.create('Optima5.Modules.Spec.AbsoCrm.QueryResultView',{
			optimaModule: me.optimaModule,
			data: ajaxData,
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
			
		tabpanel.add( Ext.create('Optima5.Modules.Spec.AbsoCrm.QueryResultView',{
			optimaModule: me.optimaModule,
			data: ajaxData,
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
					menu.destroy() ;
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