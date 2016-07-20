Ext.define('Optima5.Modules.Spec.DbsTracy.ReportForm',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		Ext.apply(this, {
			title: 'Report form',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: '10px 10px',
			border: false,
			layout: {
				type:'hbox',
				align:'stretch'
			},
			items:[{
				xtype:'form',
				border: false,
				bodyPadding: '5px 5px',
				bodyCls: 'ux-noframe-bg',
				flex: 1,
				layout: 'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 80,
					anchor: '100%'
				},
				items:[{
					xtype: 'combobox',
					name: 'file_model',
					fieldLabel: 'Model',
					queryMode: 'local',
					forceSelection: true,
					allowBlank: false,
					editable: false,
					store: {
						fields: ['id'],
						data: [{id:'RCL_VL02NPOD'},{id:'RCL_VL02NAWB'}]
					},
					valueField: 'id',
					displayField: 'id'
				},{
					xtype:'datefield',
					startDay:1,
					format: 'Y-m-d',
					width: 180,
					anchor: '',
					name : 'date_start',
					fieldLabel: 'Date from',
					itemId : 'dateStart',
					allowBlank: false
				},{
					xtype:'datefield',
					startDay:1,
					format: 'Y-m-d',
					width: 180,
					anchor: '',
					name : 'date_end',
					fieldLabel: 'Date to',
					itemId : 'dateEnd',
					allowBlank: false
				}]
			},{
				xtype: 'component',
				margin: '32px 0px',
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
						c.getEl().on('click',this.doDownload,this) ;
					},
					scope: this
				}
			}]
		});
		this.callParent() ;
		if( this.values ) {
			this.down('form').getForm().setValues(this.values) ;
		}
	},
	doDownload: function() {
		var me = this ;
		
		var uploadform = this.down('form') ;
		
		var baseForm = uploadform.getForm() ;
		if(baseForm.isValid()){
			var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply(exportParams,{
				_moduleId: 'spec_dbs_tracy',
				_action: 'report',
				data: Ext.JSON.encode(baseForm.getValues())
			}) ;
			Ext.create('Ext.ux.dams.FileDownloader',{
				renderTo: Ext.getBody(),
				requestParams: exportParams,
				requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				requestMethod: 'POST'
			}) ;
		}
	}
}) ;
