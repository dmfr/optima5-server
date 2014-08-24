Ext.define('Optima5.Modules.Spec.DbsPeople.QueryPanel',{
	extend: 'Ext.panel.Panel',
	
	requires:[
		'Optima5.Modules.Spec.DbsPeople.QueryResultView'
	],
	
	initComponent: function() {
		var me = this,
			width = me.width ;
		
		me.addEvents('abort','confirm') ;
		
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
					height: 100
				}),
				Ext.apply(me.initDummyFormCfg(),{
					width:width,
					height: 120,
					hidden: true
				}),{
					xtype:'box',
					html:'&#160;',
					height: 8
				},Ext.apply(me.initPreviewCfg(),{
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
				iconCls: 'op5-spec-dbspeople-icon-query',
				title: 'DBS People : Requêtes'
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
			layout:{
				type: 'hbox',
				align: 'middle'
			},
			items:[{
				flex: 1,
				xtype:'fieldset',
				defaults: {
					labelWidth: 75
				},
				title: 'Query parameters',
				items:[{
					xtype: 'combobox',
					width: 400,
					name: 'querysrc_id',
					fieldLabel: 'Requête',
					forceSelection: true,
					editable: false,
					store: {
						fields: [
							{name: 'querysrc_id', type: 'string'},
							{name: 'q_name', type: 'string'},
							{name: 'enable_date_at', type: 'boolean'},
							{name: 'enable_date_interval', type: 'boolean'}
						],
						autoLoad: true,
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_moduleId: 'spec_dbs_people',
								_action: 'query_getLibrary'
							},
							reader: {
								type: 'json',
								root: 'data'
							}
						})
					},
					queryMode: 'local',
					displayField: 'q_name',
					valueField: 'querysrc_id',
					listeners: {
						change: function(cmb,value) {
							var cntDateInterval = cmb.up('form').down('#cntDateInterval'),
								cntDateAt = cmb.up('form').down('#cntDateAt'),
								querysrcRecord = cmb.getStore().findRecord('querysrc_id',value),
								enableDateInterval = querysrcRecord.get('enable_date_interval'),
								enableDateAt = querysrcRecord.get('enable_date_at') ;
							
							cntDateInterval.setVisible( enableDateInterval );
							cntDateAt.setVisible( enableDateAt );
						}
					}
				},{
					xtype:'fieldcontainer',
					anchor: '100%',
					fieldLabel: 'Dates',
					itemId: 'cntDateInterval',
					hidden: true,
					layout: {
						type: 'hbox'
					},
					items:[{
						xtype:'datefield',
						startDay:1,
						format: 'Y-m-d',
						width: 100,
						anchor: '',
						value: new Date(),
						name : 'date_start',
						itemId : 'dateStart'
					},{
						width:16,
						itemId : 'dateSeparator',
						xtype:'box',
						html:'&#160;to&#160;'
					},{
						xtype:'datefield',
						startDay:1,
						format: 'Y-m-d',
						width: 100,
						anchor: '',
						value: new Date(),
						name : 'date_end',
						itemId : 'dateEnd'
					}]
				},{
					xtype:'fieldcontainer',
					anchor: '100%',
					fieldLabel: 'At date',
					itemId: 'cntDateAt',
					hidden: true,
					layout: {
						type: 'hbox'
					},
					items:[{
						xtype:'datefield',
						startDay:1,
						format: 'Y-m-d',
						width: 100,
						anchor: '',
						value: new Date(),
						name : 'date_at',
						itemId : 'dateAt'
					}]
				}]
			},{
				xtype: 'component',
				padding: '0px 32px',
				overCls: 'op5-crmbase-dataimport-go-over',
				renderTpl: Ext.create('Ext.XTemplate',
					'<div class="op5-crmbase-dataimport-go">',
					'<div class="op5-crmbase-dataimport-go-btn">',
					'</div>',
					'</div>',
					{
						compiled:true,
						disableFormats: true
					}
				),
				listeners: {
					afterrender: function(c) {
						c.getEl().on('click',this.handleSubmit,this) ;
					},
					scope: this
				}
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
	initPreviewCfg: function() {
		var me = this ;
		var previewCfg = {
			xtype:'panel',
			layout: 'fit',
			itemId: 'cntQueryPreview',
			items:this.initPreviewEmptyCfg()
		} ;
		return previewCfg ;
	},
	initPreviewEmptyCfg: function() {
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
		me.handleDownloadFast() ;
	},
	
	handleSubmit: function() {
		var me = this,
			form = me.child('form').getForm() ;
		
		me.query('#cntQueryPreview')[0].removeAll() ;
		me.query('#cntQueryPreview')[0].addCls('op5-waiting') ;
		
		var msgbox = Ext.Msg.wait('Running query. Please Wait.');
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
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
					me.query('#cntQueryPreview')[0].add( me.initPreviewEmptyCfg() ) ;
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
		me.query('#cntQueryPreview')[0].add( Ext.create('Optima5.Modules.Spec.DbsPeople.QueryResultView',{
			optimaModule: me.optimaModule,
			data: ajaxData,
			modePreview: true,
			border: false,
			listeners: {
				savepreview: this.handleDownloadFast,
				scope: this
			}
		}) ) ;
	},
	
	handleDownload: function() {
		var me = this,
			previewPanel = me.down('#cntQueryPreview'),
			iterPanel ,
			postData = [] ;
			
		for( var idx=0 ; idx < previewPanel.items.getCount() ; idx++ ) {
			iterPanel = previewPanel.items.getAt(idx) ;
			if( iterPanel.itemId == 'cntQueryPreview' || !iterPanel.getData ) {
				continue ;
			}
			postData.push( iterPanel.getData() ) ;
		}
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_dbs_people',
			_action: 'query_exportXLS',
			data: Ext.JSON.encode(postData)
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	handleDownloadFast: function() {
		var me = this ;
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_dbs_people',
			_action: 'query_getResultXLS',
			data: Ext.JSON.encode(me.child('form').getForm().getValues())
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	}
	
});