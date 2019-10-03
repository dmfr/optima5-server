Ext.define('DbsLamGunPackingSummaryModel',{
	extend: 'Ext.data.Model',
	idProperty: 'transfer_txt',
	fields: [
		{name: 'transfer_txt', type:'string'},
		{name: 'dst_adr', type:'string'},
		{name: 'count_lig', type:'int'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsLam.GunPackingList',{
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
			},'-',{
				icon: 'images/op5img/ico_print_16.png',
				text: '<b>'+this._printerUri+'</u>'
			}],
			store: {
				model: 'DbsLamGunPackingSummaryModel',
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'transferPacking_getSummary'
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
						this.openPickingDst( rec.get('src_adr') ) ;
					},
					scope: this
				}]
			},{
				dataIndex: 'transfer_txt',
				width: 180,
				text: 'Picking',
			},{
				dataIndex: 'count_lig',
				width: 60,
				text: 'Count'
			},{
				dataIndex: 'src_adr',
				width: 200,
				text: 'To/Loc'
			}]
		});
		this.callParent() ;
	},
	openPickingDst: function(transferligSrcAdr) {
		this.fireEvent('openpackingsrc',this,transferligSrcAdr) ;
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
