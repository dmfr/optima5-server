Ext.define('DbsLamGunInputSummaryModel',{
	extend: 'Ext.data.Model',
	idProperty: 'transferstep_filerecord_id',
	fields: [
		{name: 'transferstep_filerecord_id', type:'int'},
		{name: 'transfer_filerecord_id', type:'int'},
		{name: 'transfer_txt', type:'string'},
		{name: 'pda_is_on', type:'boolean'},
		{name: 'pdaspec_is_on', type:'boolean'},
		{name: 'pdaspec_code', type:'string'},
		{name: 'pdaspec_txt', type:'string'},
		{name: 'pdaspec_input_json', type:'string'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsLam.GunInputList',{
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
				icon: 'images/op5img/ico_blocs_small.gif',
				text: '<b>Location(PDA)</b>',
				handler: function() {
					//this.openFilters() ;
				},
				scope: this
			}],
			store: {
				model: 'DbsLamGunInputSummaryModel',
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'transferInput_getDocuments'
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
					tooltip: 'Open',
					handler: function(grid, rowIndex, colIndex) {
						var rec = grid.getStore().getAt(rowIndex);
						this.openTransferStep( rec.get('transferstep_filerecord_id') ) ;
					},
					scope: this
				}]
			},{
				dataIndex: 'transfer_txt',
				width: 200,
				text: 'Document',
			},{
				dataIndex: 'pdaspec_txt',
				width: 125,
				text: 'Mode',
				renderer: function(v,m,r) {
					if( Ext.isEmpty(v) ) {
						return '<i>Standard Input</i>' ;
					}
					return v ;
				}
			}]
		});
		this.callParent() ;
	},
	openTransferStep: function(transferstepFilerecordId) {
		this.fireEvent('opentransferstep',this,transferstepFilerecordId) ;
	},
	
	onGridBeforeLoad: function() {
		
	},
	onGridLoad: function() {
		
	},
	
	doQuit: function() {
		this.fireEvent('quit',this) ;
	}
}) ;
