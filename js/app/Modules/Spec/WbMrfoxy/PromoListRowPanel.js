Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoListRowPanel',{
	extend: 'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.WbMrfoxy.PromoApprovalPanel',
		'Optima5.Modules.Spec.WbMrfoxy.PromoBaselinePanel',
		'Ext.ux.dams.FieldSet',
		'Optima5.Modules.Spec.WbMrfoxy.GraphInfoView',
		'Optima5.Modules.Spec.WbMrfoxy.BenchmarkGridEmpty'
	],
	
	rowRecord: null,
	
	initComponent: function() {
		var me = this,
			rowRecord = me.rowRecord ;
			
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoListRowPanel','No module reference ?') ;
		}
		if( (me.rowRecord) instanceof WbMrfoxyPromoModel ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoListRowPanel','No WbMrfoxyPromoModel instance ?') ;
		}
		
		Ext.apply(me,{
			border:false,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			defaults: {
				xtype:'panel',
				layout: 'anchor',
				frame: false,
				border: false,
				bodyPadding: '0px 10px',
				defaults: {
					anchor: '100%'
				}
			},
			items:[{
				xtype:'fieldset',
				title: 'Actions',
				border: true,
				margin: '0px 5px 0px 5px',
				items:[{
					xtype:'dataview',
					width: 112,
					tpl: new Ext.XTemplate(
						'<tpl for=".">',
						'<tpl if="!actionDisabled">',
						'<div class="op5-spec-mrfoxy-promorow-item">',
						'<div class="op5-spec-mrfoxy-promorow-action">',
						'{actionText}',
						'<div class="op5-spec-mrfoxy-promorow-action-icon op5-spec-mrfoxy-promorow-action-icon-{actionId}"></div>',
						'</div>',
						'</div>',
						'</tpl>',
						'<tpl if="actionDisabled">',
						'<div class="op5-spec-mrfoxy-promorow-item" style="display:none">',
						'</div>',
						'</tpl>',
						'</tpl>'
					),
					itemSelector: 'div.op5-spec-mrfoxy-promorow-item',
					store: {
						fields: ['actionId','actionText','actionDisabled'],
						data:[{
							actionId: 'approval',
							actionText:'Approvals',
							actionDisabled:!Optima5.Modules.Spec.WbMrfoxy.PromoApprovalPanel.static_approvalIsBlink(me.rowRecord)
						},{
							actionId: 'baseline',
							actionText:'BaselineCfg',
							actionDisabled:!( me.rowRecord.get('status_percent') >= 80 && Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','TM']) )
						},{
							actionId: 'csack',
							actionText:'CS Acknowledge',
							actionDisabled:!( me.rowRecord.get('status_code')=='25_APPROVED' && Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','CS']) )
						},{
							actionId: 'viewinternal',
							actionText:'DashB intern.'
						},{
							actionId: 'viewpublic',
							actionText:'DashB public'
						},{
							actionId: 'download',
							actionText:'Download XLS'
						},{
							actionId: 'edit',
							actionText:'Edit/View'
						},{
							actionId: 'delete',
							actionText:'Delete',
							actionDisabled:!( me.rowRecord.get('status_percent') < 50 && Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','SM']) )
						},{
							actionId: 'close',
							actionText:'Close',
							actionDisabled:!( me.rowRecord.get('status_percent') == 80 && Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','SM']) )
						}]
					},
					overItemCls: 'op5-spec-mrfoxy-promorow-item-over',
					listeners: {
						itemclick: function(view,record,item,index,event) {
							switch( record.data.actionId ) {
								case 'approval' :
									me.handleEdit() ;
									break ;
								case 'baseline' :
									me.openBaseline( event ) ;
									break ;
								case 'csack' :
									me.handleCsAck() ;
									break ;
								case 'viewinternal' :
									me.handleViewInternal() ;
									break ;
								case 'viewpublic' :
									me.handleViewPublic() ;
									break ;
								case 'download' :
									me.handleDownload() ;
									break ;
								case 'edit' :
									me.handleEdit() ;
									break ;
								case 'delete' :
									me.handleDelete() ;
									break ;
								case 'close' :
									me.handleClose() ;
									break ;
							}
						},
						scope: me
					}
				}]
			},{
				items: [{
					xtype:'fieldcontainer',
					itemId: 'fcDisplay',
					hidden: false,
					items:[{
						xtype:'damsfieldset',
						iconCls: ( Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','TM']) ? 'op5-spec-mrfoxy-promorow-fieldset-edit' : null ),
						title: 'Text attributes',
						defaults: {
							margin: 2,
							fieldBodyCls: '' // Otherwise height would be set at 22px
						},
						items:[{
							xtype: 'displayfield',
							fieldLabel: 'ATL',
							itemId: 'display_atl',
							labelWidth: 75,
							//fieldStyle: 'font-weight: bold',
							value: rowRecord.get('obs_atl')
						},{
							xtype: 'displayfield',
							fieldLabel: 'BTL',
							itemId: 'display_btl',
							labelWidth: 75,
							//fieldStyle: 'font-weight: bold',
							value: rowRecord.get('obs_btl'),
							hidden: true
						},{
							xtype: 'displayfield',
							fieldLabel: 'Comments',
							itemId: 'display_comment',
							labelWidth: 75,
							//fieldStyle: 'font-weight: bold',
							value: rowRecord.get('obs_comment')
						}],
						listeners: {
							iconclick: function() {
								this.beginEditTextAttributes() ;
							},
							scope:me 
						}
					},{
						xtype:'fieldset',
						title: 'Performance analysis',
						hidden: !(rowRecord.get('is_prod') == 'PROD'),
						defaults: {
							margin: 2,
							fieldBodyCls: '' // Otherwise height would be set at 22px
						},
						items:[{
							xtype: 'displayfield',
							fieldLabel: 'Uplift',
							labelWidth: 75,
							value: '<b>'+Ext.util.Format.number( rowRecord.get('calc_uplift_vol'),'0' )+'</b>&nbsp;kg&nbsp&nbsp&nbsp/&nbsp;&nbsp&nbsp'+'<b>'+Ext.util.Format.number( rowRecord.get('calc_uplift_per'), '0.00' )+'</b>&nbsp;%',
							hidden: (rowRecord.get('status_percent') < 80)
						},{
							xtype: 'displayfield',
							fieldLabel: 'Nb displays on sale',
							labelWidth: 120,
							value: '<b>'+rowRecord.get('calc_nb_displays')+'</b>',
							hidden: (rowRecord.get('status_percent') < 80)
						},{
							xtype: 'displayfield',
							fieldLabel: 'Cost forecast',
							fieldStyle: 'font-weight: bold',
							labelWidth: 120,
							value: Ext.util.Format.number(rowRecord.get('cost_forecast'),'0,0') + ' ' + rowRecord.get('currency') + '&#160;'+'('+rowRecord.get('cost_billing_text')+')',
							hidden: false
						},{
							xtype: 'displayfield',
							fieldLabel: 'Real Cost (invoice)',
							fieldStyle: 'font-weight: bold',
							labelWidth: 120,
							value: Ext.util.Format.number(rowRecord.get('cost_real'),'0,0') + ' ' + rowRecord.get('currency'),
							hidden: !rowRecord.get('cost_real_is_calc')
						}]
					}]
				},{
					xtype:'fieldcontainer',
					itemId: 'fcEditTextAttributes',
					hidden: true,
					items:[{
						xtype:'damsfieldset',
						iconCls: 'op5-spec-mrfoxy-promorow-fieldset-cancel',
						title: 'Text attributes',
						defaults: {
							grow: true,
							growMin: 40,
							labelWidth: 75,
							labelAlign: 'right',
							anchor: '100%'
						},
						items:[{
							xtype: 'textareafield',
							fieldLabel: 'ATL',
							itemId: 'edit_atl'
						},{
							xtype: 'textareafield',
							fieldLabel: 'BTL',
							itemId: 'edit_btl'
						},{
							xtype: 'textareafield',
							fieldLabel: 'Comments',
							itemId: 'edit_comment'
						},{
							xtype: 'container',
							margin: '0px 10px 4px 0px',
							style: {
								textAlign: 'right'
							},
							items: [{
								xtype:'button',
								width: 80,
								text: 'Save',
								handler: function() {
									this.saveEditTextAttributes() ;
								},
								scope: me
							}]
						}],
						listeners: {
							iconclick: function() {
								this.abortEditTextAttributes() ;
							},
							scope:me 
						}
					}]
				}],
				flex:1
			},{
				xtype:'container',
				layout:{
					type: 'vbox',
					align: 'stretch'
				},
				flex:1,
				margin: '0px 0px 0px 10px',
				items:[{
					xtype:'container',
					itemId: 'cntChart' ,
					cls:'op5-waiting',
					layout:'fit',
					flex:1
				},{
					xtype:'op5specmrfoxygraphinfo',
					itemId: 'lgdChart' ,
					hidden: true,
					margin: 4
				}]
			}],
			autoDestroy: true
		}); 
		
		this.callParent() ;
		this.fetchItems() ;
	},
	fetchItems: function() {
		if( this.rowRecord.get('status_percent') < 80 ) {
			this.fetchBenchmark() ;
		} else {
			this.fetchGraph() ;
		}
	},
	fetchGraph: function() {
		var me = this ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'promo_getSideGraph',
				filerecord_id: me.rowRecord.get('_filerecord_id')
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText),
					cntChart = me.query('#cntChart')[0],
					lgdChart = me.query('#lgdChart')[0] ;
				
				cntChart.removeCls('op5-waiting') ;
				cntChart.removeAll() ;
				if( ajaxData.success == true ) {
					lgdChart.setVisible(true) ;
					cntChart.add({
						xtype: 'op5crmbasequeryresultchartstatic',
						optimaModule: me.optimaModule,
						ajaxBaseParams: {},
						RESchart_static: ajaxData.RESchart_static,
						drawChartLegend: false
					}) ;
				}
			},
			scope: me
		}) ;
	},
	fetchBenchmark: function() {
		var me = this,
			cntChart = me.query('#cntChart')[0],
			benchmarkGrid = Ext.create('Optima5.Modules.Spec.WbMrfoxy.BenchmarkGridEmpty',{
				itemId: 'gridBenchmark',
				store: {
					model: 'WbMrfoxyPromoModel',
					autoLoad: true,
					remoteSort: true,
					remoteFilter: true,
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_wb_mrfoxy',
							_action: 'promo_getSideBenchmark',
							filerecord_id: me.rowRecord.get('_filerecord_id')
						},
						reader: {
							type: 'json',
							root: 'data',
							totalProperty: 'total'
						}
					})
				}
			}) ;
		
		cntChart.removeAll() ;
		cntChart.add(benchmarkGrid) ;
	},
	
	openBaseline: function(e) {
		this.openPopup(e,'Optima5.Modules.Spec.WbMrfoxy.PromoBaselinePanel',[500,120]) ;
	},
	openPopup: function(e,className,dimensions) {
		var me = this ;
		var promoApprovalPanel = Ext.create(className,{
			optimaModule: me.optimaModule,
			rowRecord: me.rowRecord,
			
			width:dimensions[0],
			height:dimensions[1],
			
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}]
		});
		
		promoApprovalPanel.on('destroy',function() {
			me.getEl().unmask() ;
			// refresh something ?
			me.fetchItems() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		promoApprovalPanel.show();
		promoApprovalPanel.getEl().alignTo(me.getEl(), 'c-c?');
	},
	handleEdit: function() {
		var me = this ;
		me.getEl().mask('Loading record...') ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'promo_getRecord',
				_filerecord_id: me.rowRecord.get('_filerecord_id')
			},
			success: function(response) {
				me.getEl().unmask() ;
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success==true ) {
					var rowDetailedRecord = Ext.ux.dams.ModelManager.create('WbMrfoxyPromoModel',ajaxData.record) 
					me.fireEvent('editpromo',rowDetailedRecord) ;
				}
			},
			scope: me
		}) ;
		
	},
	handleDelete: function() {
		var me = this ;
		
		Ext.MessageBox.confirm('Confirmation','Delete selected promotion ?', function(buttonStr) {
			if( buttonStr=='yes' ) {
				me.optimaModule.getConfiguredAjaxConnection().request({
					params: {
						_moduleId: 'spec_wb_mrfoxy',
						_action: 'promo_delete',
						_filerecord_id: me.rowRecord.get('_filerecord_id')
					},
					success: function(response) {
						me.fireEvent('datachanged') ;
					},
					scope: me
				}) ;
			}
		},me) ;
	},
	handleCsAck: function() {
		var me = this ;
		
		Ext.MessageBox.confirm('Confirmation','Customer service acknowledging ?', function(buttonStr) {
			if( buttonStr=='yes' ) {
				me.optimaModule.getConfiguredAjaxConnection().request({
					params: {
						_moduleId: 'spec_wb_mrfoxy',
						_action: 'promo_csack',
						_filerecord_id: me.rowRecord.get('_filerecord_id')
					},
					success: function(response) {
						me.fireEvent('datachanged') ;
					},
					scope: me
				}) ;
			}
		},me) ;
	},
	handleClose: function() {
		var me = this ;
		
		Ext.MessageBox.confirm('End / Close','Finalize selected promotion ?', function(buttonStr) {
			if( buttonStr=='yes' ) {
				me.optimaModule.getConfiguredAjaxConnection().request({
					params: {
						_moduleId: 'spec_wb_mrfoxy',
						_action: 'promo_close',
						_filerecord_id: me.rowRecord.get('_filerecord_id')
					},
					success: function(response) {
						me.fireEvent('datachanged') ;
					},
					scope: me
				}) ;
			}
		},me) ;
	},
	handleViewInternal: function() {
		var me = this,
			qCfg = {} ;
		
		Ext.apply(qCfg,{
			qType:'qbook',
			qbookId: 1,
			qbookZtemplateSsid: 1,
			qsrcFilerecordId:me.rowRecord.get('_filerecord_id')
		});
		
		me.optimaModule.createWindow(qCfg,Optima5.Modules.CrmBase.QdirectWindow) ;
	},
	handleViewPublic: function() {
		var me = this,
			qCfg = {} ;
		
		Ext.apply(qCfg,{
			qType:'qbook',
			qbookId: 1,
			qbookZtemplateSsid: 2,
			qsrcFilerecordId:me.rowRecord.get('_filerecord_id')
		});
		
		me.optimaModule.createWindow(qCfg,Optima5.Modules.CrmBase.QdirectWindow) ;
	},
	handleDownload: function() {
		var me = this,
			rowRecord = me.rowRecord ;
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'promo_exportXLS',
			_filerecord_id: rowRecord.get('_filerecord_id')
		}) ;
		
		
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	
	beginEditTextAttributes: function() {
		var me = this,
			rowRecord = me.rowRecord,
			fcDisplay = me.query('#fcDisplay')[0],
			fcEditTextAttributes = me.query('#fcEditTextAttributes')[0] ;
		
		fcEditTextAttributes.query('#edit_atl')[0].setValue( rowRecord.get('obs_atl') ) ;
		fcEditTextAttributes.query('#edit_btl')[0].setValue( rowRecord.get('obs_btl') ) ;
		fcEditTextAttributes.query('#edit_comment')[0].setValue( rowRecord.get('obs_comment') ) ;
		fcEditTextAttributes.setVisible(true) ;
		fcDisplay.setVisible(false) ;
	},
	abortEditTextAttributes: function() {
		var me = this,
			rowRecord = me.rowRecord,
			fcDisplay = me.query('#fcDisplay')[0],
			fcEditTextAttributes = me.query('#fcEditTextAttributes')[0] ;
		
		fcEditTextAttributes.setVisible(false) ;
		fcDisplay.setVisible(true) ;
	},
	saveEditTextAttributes: function() {
		var me = this,
			rowRecord = me.rowRecord,
			fcDisplay = me.query('#fcDisplay')[0],
			fcEditTextAttributes = me.query('#fcEditTextAttributes')[0] ;
			
		var data = {
			obs_atl: Ext.String.trim( fcEditTextAttributes.query('#edit_atl')[0].getValue() ),
			obs_btl: Ext.String.trim( fcEditTextAttributes.query('#edit_btl')[0].getValue() ),
			obs_comment: Ext.String.trim( fcEditTextAttributes.query('#edit_comment')[0].getValue() )
		};
		
		var ajaxParams = {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'promo_setObsText',
			_filerecord_id: rowRecord.get('_filerecord_id'),
			data: Ext.JSON.encode(data)
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success ) {
					fcDisplay.query('#display_atl')[0].setValue( data.obs_atl ) ;
					fcDisplay.query('#display_btl')[0].setValue( data.obs_btl ) ;
					fcDisplay.query('#display_comment')[0].setValue( data.obs_comment ) ;
					Ext.apply( rowRecord.data, data ) ;
				}
				fcEditTextAttributes.setVisible(false) ;
				fcDisplay.setVisible(true) ;
			},
			scope: this
		}) ;
	}
	
}) ;