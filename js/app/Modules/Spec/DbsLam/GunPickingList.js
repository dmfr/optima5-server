Ext.define('DbsLamGunPickingSummaryModel',{
	extend: 'Ext.data.Model',
	idProperty: 'need_txt',
	fields: [
		{name: 'need_txt', type:'string'},
		{name: 'dst_adr', type:'string'},
		{name: 'count_lig', type:'int'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsLam.GunPickingList',{
	extend:'Ext.grid.Panel',
	requires: [
		'Ext.grid.column.Action'
	],
	initComponent: function(){
		Ext.apply(this,{
			tbar: [{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'->',{
				itemId: 'tbAdd',
				iconCls: 'op5-spec-dbslam-transfer-add',
				text: '<b>Filters</b>',
				handler: function() {
					this.openFilters() ;
				},
				scope: this
			}],
			store: {
				model: 'DbsLamGunPickingSummaryModel',
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'transferMission_getTransferSummary'
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				}),
				listeners: {
					beforeload: this.onGridBeforeLoad,
					load: this.onGridLoad,
					scope: this
				}
			},
			columns: [{
				xtype: 'actioncolumn',
				align: 'center',
				width: 36,
				items: [{
					icon: 'images/modules/crmbase-plugin-22.png',  // Use a URL in the icon config
					tooltip: 'Take',
					handler: function(grid, rowIndex, colIndex) {
						var rec = grid.getStore().getAt(rowIndex);
						this.openPickingDst( rec.get('dst_adr') ) ;
					},
					scope: this
				}]
			},{
				dataIndex: 'need_txt',
				width: 180,
				text: 'Picking',
			},{
				dataIndex: 'count_lig',
				width: 60,
				text: 'Count'
			},{
				dataIndex: 'dst_adr',
				width: 200,
				text: 'To/Loc'
			}]
		});
		this.callParent() ;
	},
	openPickingDst: function(transferligDstAdr) {
		this.fireEvent('openpickingdst',this,transferligDstAdr) ;
	},
	
	onGridBeforeLoad: function() {
		
	},
	onGridLoad: function() {
		
	},
	
	openFilters: function() {
		this.fireEvent('openfilters',this) ;
	},
	
	doQuit: function() {
		this.fireEvent('quit',this) ;
	}
}) ;
