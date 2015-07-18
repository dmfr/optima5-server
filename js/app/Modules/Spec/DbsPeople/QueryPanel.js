Ext.define('Optima5.Modules.Spec.DbsPeople.QueryPanel',{
	extend: 'Ext.panel.Panel',
	
	requires:[
		'Optima5.Modules.Spec.DbsPeople.QueryResultView',
		'Optima5.Modules.Spec.DbsPeople.CfgParamSiteField',
		'Optima5.Modules.Spec.DbsPeople.CfgParamTeamField'
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
				height: 100,
				xtype:'fieldset',
				defaults: {
					labelWidth: 90
				},
				title: 'Query parameters',
				items:[{
					xtype:'fieldcontainer',
					anchor: '100%',
					fieldLabel: 'Requête',
					itemId: 'cntQueryId',
					layout: {
						type: 'hbox',
						align: 'middle'
					},
					items: [{
						xtype: 'combobox',
						width: 310,
						name: 'querysrc_id',
						forceSelection: true,
						editable: false,
						store: {
							fields: [
								{name: 'querysrc_id', type: 'string'},
								{name: 'q_name', type: 'string'},
								{name: 'enable_date_at', type: 'boolean'},
								{name: 'enable_date_interval', type: 'boolean'},
								{name: 'enable_filters', type: 'boolean'},
								{name: 'enable_filters_cli', type: 'boolean'}
							],
							autoLoad: true,
							proxy: this.optimaModule.getConfiguredAjaxProxy({
								extraParams : {
									_moduleId: 'spec_dbs_people',
									_action: 'query_getLibrary'
								},
								reader: {
									type: 'json',
									rootProperty: 'data'
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
									cntFilters = cmb.up('form').down('#cntFilters'),
									cmbFilterCli = cntFilters.down('#filterCli'),
									querysrcRecord = cmb.getStore().findRecord('querysrc_id',value),
									enableDateInterval = querysrcRecord.get('enable_date_interval'),
									enableDateAt = querysrcRecord.get('enable_date_at'),
									enableFilters = querysrcRecord.get('enable_filters'),
									enableFiltersCli = querysrcRecord.get('enable_filters_cli') ;
								
								cntDateInterval.setVisible( enableDateInterval );
								cntDateAt.setVisible( enableDateAt );
								cntFilters.setVisible( enableFilters );
								
								cmbFilterCli.setVisible( enableFiltersCli );
								cntFilters.populateFilterCli() ;
							},
							scope: this
						}
					},{
						xtype: 'component',
						itemId: 'cmpWarnings',
						padding: '0px 0px 0px 16px',
						tpl: [
							'<tpl if="warnings">',
								'<div class="op5-spec-dbspeople-query-warning">',
								'<tpl for="warnings">',
									'{warning_txt}<br>',
								'</tpl>',
								'</div>',
							'</tpl>'
						]
					}]
				},{
					xtype:'fieldcontainer',
					anchor: '100%',
					fieldLabel: 'Site / Equipe',
					itemId: 'cntFilters',
					hidden: true,
					layout: {
						type: 'hbox'
					},
					items:[Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamSiteField',{
						optimaModule: this.optimaModule,
						width: 250,
						anchor: '',
						submitValue: false,
						itemId : 'filterSite',
						listeners: {
							change: function(cmb) {
								var cnt = cmb.up() ;
								cnt.populateFilterCli() ;
							}
						}
					}),{
						width:8,
						xtype:'box',
						html:'&#160'
					},Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamTeamField',{
						optimaModule: this.optimaModule,
						width: 250,
						anchor: '',
						submitValue: false,
						itemId : 'filterTeam'
					}),{
						width:8,
						xtype:'box',
						html:'&#160'
					},{
						xtype:'combobox',
						width: 200,
						anchor: '',
						submitValue: false,
						itemId: 'filterCli',
						forceSelection:true,
						allowBlank:true,
						editable:false,
						queryMode: 'local',
						displayField: 'text',
						valueField: 'id',
						hidden: true,
						store: {
							fields:['id','text'],
							data: []
						}
					}],
					populateFilterCli: function() {
						var filterSite = this.down('#filterSite'),
							filterCli = this.down('#filterCli') ;
							
						var filterSiteNode, arrCliCodes ;
						if( (filterSiteNode = filterSite.getNode()) != null ) {
							switch( filterSiteNode.nodeType ) {
								case 'treenode' :
									arrCliCodes = Optima5.Modules.Spec.DbsPeople.HelperCache.links_cli_getForWhseTreenode(filterSiteNode.nodeKey) ;
									break ;
								case 'entry' :
									arrCliCodes = Optima5.Modules.Spec.DbsPeople.HelperCache.links_cli_getForWhse(filterSiteNode.nodeKey) ;
									break ;
							}
						}
						
						var data = Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("CLI",true),
							returnData = [] ;
						returnData.push({id:'', text:'- Tous clients -'}) ;
						Ext.Array.each( data, function(dataRow) {
							if( arrCliCodes != null && !Ext.Array.contains( arrCliCodes, dataRow.id ) ) {
								return ;
							}
							returnData.push(dataRow) ;
						},this);
						
						filterCli.setValue(null) ;
						filterCli.getStore().loadData(returnData) ;
						filterCli.setValue('') ;
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
						itemId : 'dateStart',
						listeners: {
							change: function(changedField){
								var formPanel = changedField.up('form'),
									form = formPanel.getForm(),
									dateStart = form.findField('date_start'),
									dateEnd = form.findField('date_end') ;
								if( dateStart.getValue() > dateEnd.getValue() ) {
									dateEnd.setValue( dateStart.getValue() ) ;
								}
							}
						}
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
						itemId : 'dateEnd',
						listeners: {
							change: function(changedField){
								var formPanel = changedField.up('form'),
									form = formPanel.getForm(),
									dateStart = form.findField('date_start'),
									dateEnd = form.findField('date_end') ;
								if( dateStart.getValue() > dateEnd.getValue() ) {
									dateStart.setValue( dateEnd.getValue() ) ;
								}
							}
						}
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
		
		var formValues = me.child('form').getForm().getValues(),
			filterSite = me.down('#filterSite'),
			filterTeam = me.down('#filterTeam'),
			filterCli = me.down('#filterCli') ;
		formValues['filter_site'] = filterSite.getLeafNodesKey() ;
		formValues['filter_team'] = filterTeam.getLeafNodesKey() ;
		if( filterCli.isVisible() && !Ext.isEmpty(filterCli.getValue()) ) {
			formValues['filter_cli'] = filterCli.getValue() ;
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			timeout: (300 * 1000),
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'query_getResult',
				data: Ext.JSON.encode( formValues )
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
			queryData: ajaxData,
			modePreview: true,
			border: false,
			listeners: {
				savepreview: this.handleDownloadFast,
				scope: this
			}
		}) ) ;
		
		var warningObjUpdate = ( ajaxData.warning_date ? {warnings: [{warning_txt: 'Attention ! Date(s) sélectionnée(s) incluant tranches non clôturées'}]} : {} ) ;
		this.down('#pForm').down('#cmpWarnings').update( warningObjUpdate ) ;
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
		
		var formValues = me.child('form').getForm().getValues(),
			filterSite = me.down('#filterSite'),
			filterTeam = me.down('#filterTeam'),
			filterCli = me.down('#filterCli') ;
		formValues['filter_site'] = filterSite.getLeafNodesKey() ;
		formValues['filter_team'] = filterTeam.getLeafNodesKey() ;
		if( filterCli.isVisible() && !Ext.isEmpty(filterCli.getValue()) ) {
			formValues['filter_cli'] = filterCli.getValue() ;
		}
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_dbs_people',
			_action: 'query_getResultXLS',
			data: Ext.JSON.encode( formValues )
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	}
	
});