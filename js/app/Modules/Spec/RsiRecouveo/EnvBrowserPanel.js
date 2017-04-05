Ext.define('Optima5.Modules.Spec.RsiRecouveo.EnvBrowserPanel',{
	extend: 'Ext.grid.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			border: false,
			store: {
				autoLoad: true,
				model: 'RsiRecouveoEnvelopeModel',
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_rsi_recouveo',
						_action: 'doc_getEnvGrid'
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				})
			},
			columns: [{
				align: 'center',
				xtype:'checkcolumn',
				width:60
			},{
				text: 'Date',
				dataIndex: 'env_date',
				flex: 1,
				menuDisabled: true,
				sortable: false,
				renderer: Ext.util.Format.dateRenderer('d/m/Y H:i')
			},{
				text: 'Document',
				dataIndex: 'file_id_ref',
				flex: 1,
				menuDisabled: true,
				sortable: false
			},{
				text: 'Titre',
				dataIndex: 'env_title',
				flex: 1,
				menuDisabled: true,
				sortable: false
			},{
				text: 'Destinataire',
				columns: [{
					text: 'Circuit',
					dataIndex: 'peer_code',
					width: 90
				},{
					text: 'Adresse',
					dataIndex: 'peer_adr',
					width: 190
				}]
			},{
				text: 'Documents',
				columns: [{
					text: 'NbDoc',
					dataIndex: 'stat_count_doc',
					width: 50
				},{
					text: 'Pages',
					dataIndex: 'stat_count_page',
					width: 50
				}]
			},{
				align: 'center',
				xtype:'actioncolumn',
				width:60,
				disabledCls: 'x-item-invisible',
				items: [{
					icon: 'images/op5img/ico_pdf_16.png',
					tooltip: 'Visualiser',
					handler: function(grid, rowIndex, colIndex, item, e) {
						var rec = grid.getStore().getAt(rowIndex);
						var title = rec.get('file_id_ref')+'&#160;'+rec.get('env_title') ;
						this.openEnvelope(rec.getId(),title) ;
					},
					scope: this,
					disabledCls: 'x-item-invisible',
					isDisabled: function(view,rowIndex,colIndex,item,record ) {
						return false ;
					}
				}]
			}]
		}) ;
		this.callParent() ;
	},
	openEnvelope: function(envFilerecordId, title) {
		this.optimaModule.createWindow({
			width:1200,
			height:800,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: title,
			items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.EnvPreviewPanel',{
				optimaModule: this.optimaModule,
				_envFilerecordId: envFilerecordId
			})]
		}) ;
	}
}) ;