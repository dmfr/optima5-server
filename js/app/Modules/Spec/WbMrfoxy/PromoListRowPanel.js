Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoListRowPanel',{
	extend: 'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.WbMrfoxy.PromoApprovalPanel'
	],
	
	rowRecord: null,
	
	initComponent: function() {
		var me = this,
			rowRecord = me.rowRecord ;
		
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
						'<div class="op5-spec-mrfoxy-promorow-item">',
						'<div class="op5-spec-mrfoxy-promorow-action">',
						'{actionText}',
						'<div class="op5-spec-mrfoxy-promorow-action-icon op5-spec-mrfoxy-promorow-action-icon-{actionId}"></div>',
						'</div>',
						'</div>',
						'</tpl>'
					),
					itemSelector: 'div.op5-spec-mrfoxy-promorow-item',
					store: {
						fields: ['actionId','actionText'],
						data:[
							{actionId: 'approval', actionText:'Approvals'},
							{actionId: 'view', actionText:'Dashboard'},
							{actionId: 'download', actionText:'Download XLS'},
							{actionId: 'edit', actionText:'Edit'},
							{actionId: 'delete', actionText:'Delete'}
						]
					},
					overItemCls: 'op5-spec-mrfoxy-promorow-item-over',
					listeners: {
						itemclick: function(view,record,item,index,event) {
							switch( record.data.actionId ) {
								case 'approval' :
									me.openApproval( event ) ;
									break ;
								case 'view' :
									me.handleView() ;
									break ;
								case 'delete' :
									me.handleDelete() ;
									break ;
							}
						},
						scope: me
					}
				}]
			},{
				items: [{
					xtype:'fieldcontainer',
					items:[{
						xtype:'fieldset',
						title: 'Text attributes',
						items:[{
							xtype: 'displayfield',
							fieldLabel: 'ATL',
							labelWidth: 75,
							//fieldStyle: 'font-weight: bold',
							value: rowRecord.get('obs_atl')
						},{
							xtype: 'displayfield',
							fieldLabel: 'BTL',
							labelWidth: 75,
							//fieldStyle: 'font-weight: bold',
							value: rowRecord.get('obs_btl')
						},{
							xtype: 'displayfield',
							fieldLabel: 'Comments',
							labelWidth: 75,
							//fieldStyle: 'font-weight: bold',
							value: rowRecord.get('obs_comment')
						}]
					},{
						xtype:'fieldset',
						title: 'Performance analysis',
						items:[{
							xtype: 'displayfield',
							fieldLabel: 'Uplift',
							labelWidth: 75,
							value: '<b>'+rowRecord.get('calc_uplift_vol')+'</b>&nbsp;kg&nbsp&nbsp&nbsp/&nbsp;&nbsp&nbsp'+'<b>'+rowRecord.get('calc_uplift_per')+'</b>&nbsp;%',
						},{
							xtype: 'displayfield',
							fieldLabel: 'ROI',
							fieldStyle: 'font-weight: bold',
							labelWidth: 75,
							value: rowRecord.get('calc_roi')
						}]
					}]
				}],
				flex:1
			},{
				xtype:'container',
				itemId: 'cntChart' ,
				cls:'op5-waiting',
				layout:'fit',
				flex:1,
				margin: 10
			}],
			autoDestroy: true
		}); 
		
		this.callParent() ;
		this.fetchGraph() ;
	},
	fetchGraph: function() {
		var me = this ;
		console.log('fetch graph') ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'promo_getSideGraph',
				filerecord_id: me.rowRecord.get('_filerecord_id')
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText),
					cntChart = me.query('#cntChart')[0] ;
				
				cntChart.removeCls('op5-waiting') ;
				cntChart.removeAll() ;
				if( ajaxData.success == true ) {
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
	
	openApproval: function(e) {
		var me = this ;
		var newPromoCfgPanel = Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoApprovalPanel',{
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
			height: 120
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
	},
	handleDelete: function() {
		var me = this ;
		
		Ext.MessageBox.confirm('Confirmation','Delete selected promotion ?', function(buttonStr) {
			if( buttonStr=='yes' ) {
				me.optimaModule.getConfiguredAjaxConnection().request({
					params: {
						_moduleId: 'spec_wb_mrfoxy',
						_action: 'promo_delete',
						filerecord_id: me.rowRecord.get('_filerecord_id')
					},
					success: function(response) {
						me.fireEvent('datachanged') ;
					},
					scope: me
				}) ;
			}
		},me) ;
	},
	handleView: function() {
		var me = this,
			qCfg = {} ;
		
		Ext.apply(qCfg,{
			qType:'qbook',
			qbookId: 1,
			qbookZtemplateSsid: 1,
			qsrcFilerecordId:me.rowRecord.get('_filerecord_id')
		});
		
		me.optimaModule.createWindow(qCfg,Optima5.Modules.CrmBase.QdirectWindow) ;
	}
	
}) ;