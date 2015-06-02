Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoBillbackGrid',{
	extend: 'Ext.grid.Panel',
	
	initComponent: function(){
		var me = this ;
		Ext.applyIf(this,{
			title: 'Billback Invoices for # '+this.rowRecord.get('promo_id'),
			store: {
				model: 'WbMrfoxyPurchaseModel',
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_wb_mrfoxy',
						_action: 'promo_getSideBillback',
						filerecord_id: this.rowRecord.get('_filerecord_id')
					},
					reader: {
						type: 'json',
						rootProperty: 'data',
						totalProperty: 'total'
					}
				})
			},
			columns: {
				defaults:{
					menuDisabled: true,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: false
				},
				items: [{
					text: '<b>Purchase #</b>',
					dataIndex: 'purchase_id',
					width: 120
				},{
					text: 'Date',
					dataIndex: 'purchase_date',
					width: 80
				},{
					text: 'Description',
					dataIndex: 'purchase_desc',
					width: 300
				},{
					text: 'Amount',
					dataIndex: 'purchase_amount',
					align: 'right',
					width: 70,
					renderer: function(value,metaData,record) {
						return Ext.util.Format.number( value, '0,0' ) + ' ' + this.rowRecord.get('currency_symbol') ;
					}
				}]
			}
		});
		this.callParent() ;
	}
}); 
