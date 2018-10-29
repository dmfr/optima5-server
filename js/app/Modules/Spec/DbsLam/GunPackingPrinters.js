Ext.define('DbsLamGunPrinterModel',{
	extend: 'Ext.data.Model',
	idProperty: 'printer_ip',
	fields: [
		{name: 'printer_ip', type:'string'},
		{name: 'printer_type', type:'string'},
		{name: 'printer_desc', type:'string'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsLam.GunPackingPrinters',{
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
			}],
			store: {
				model: 'DbsLamGunPrinterModel',
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'transferPacking_getPrinters'
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
					icon: 'images/op5img/ico_print_16.png',  // Use a URL in the icon config
					tooltip: 'Select',
					handler: function(grid, rowIndex, colIndex) {
						var rec = grid.getStore().getAt(rowIndex);
						this.selectPrinter( rec.get('printer_ip') ) ;
					},
					scope: this
				}]
			},{
				dataIndex: 'printer_ip',
				width: 180,
				text: 'Picking',
			},{
				dataIndex: 'printer_desc',
				width: 180,
				text: 'Count'
			}]
		});
		this.callParent() ;
	},
	selectPrinter: function(printerIp) {
		this.fireEvent('selectprinter',this,printerIp) ;
	},
	
	onGridBeforeLoad: function() {
		
	},
	onGridLoad: function() {
		
	},
	
	doQuit: function() {
		this.fireEvent('quit',this) ;
	}
}) ;
