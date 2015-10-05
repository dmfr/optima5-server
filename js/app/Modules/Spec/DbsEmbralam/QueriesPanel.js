Ext.define('Optima5.Modules.Spec.DbsEmbralam.QueriesPanel',{
	extend:'Ext.tab.Panel',
	initComponent: function() {
		
		this.tmpGridModelName = 'DbsEmbralamQueryMismatchGridModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpGridModelName ) ;
		}) ;
		
		var pushModelfields = [], atrColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsEmbralam.HelperCache.getStockAttributes(), function( stockAttribute ) {
			var fieldColumn = {
				locked: true,
				text: stockAttribute.atr_txt,
				dataIndex: stockAttribute.mkey,
				width: 75
			} ;
			atrColumns.push(fieldColumn) ;
			
			pushModelfields.push({
				name: stockAttribute.mkey,
				type: 'string'
			});
		}) ;
		
		Ext.define(this.tmpGridModelName, {
			extend: 'DbsEmbralamStockGridModel',
			fields: pushModelfields
		});
		
		
		Ext.apply(this,{
			items:[{
				xtype:'grid',
				title: 'Attributes mismatch',
				border: false,
				icon: 'images/op5img/ico_dataadd_16.gif',
				store: {
					model: this.tmpGridModelName,
					data: []
				},
				columns: {
					defaults: {
						menuDisabled: true,
						draggable: false,
						sortable: false,
						hideable: false,
						resizable: false,
						groupable: false,
						lockable: false
					},
					items: [{
						dataIndex: 'adr_id',
						text: 'Adr',
						width: 90,
						renderer: function(v) {
							return '<b>'+v+'</b>';
						}
					},{
						text: 'Item',
						columns: [{
							dataIndex: 'inv_prod',
							text: 'Article',
							width: 100
						},{
							dataIndex: 'inv_batch',
							text: 'BatchCode',
							width: 100
						},{
							dataIndex: 'inv_qty',
							text: 'Qty disp',
							align: 'right',
							width: 75
						}]
					},{
						text: 'Attributs Mismatch(s)',
						columns: atrColumns
					}]
				}
			},{
				xtype:'grid',
				title: 'Alertes Dates',
				border: false,
				icon: 'images/op5img/ico_dataadd_16.gif',
				store: {
					model: this.tmpGridModelName,
					data: []
				},
				columns: {
					defaults: {
						menuDisabled: true,
						draggable: false,
						sortable: false,
						hideable: false,
						resizable: false,
						groupable: false,
						lockable: false
					},
					items: [{
						dataIndex: 'adr_id',
						text: 'Adr',
						width: 90,
						renderer: function(v) {
							return '<b>'+v+'</b>';
						}
					},{
						text: 'Item',
						columns: [{
							dataIndex: 'inv_prod',
							text: 'Article',
							width: 100
						},{
							dataIndex: 'inv_batch',
							text: 'BatchCode',
							width: 100
						},{
							dataIndex: 'inv_qty',
							text: 'Qty disp',
							align: 'right',
							width: 75
						},{
							dataIndex: 'inv_datelc',
							text: '<b>DLC</b>',
							align: 'center',
							width: 120
						}]
					}]
				}
			}]
		});
		this.callParent() ;
	}
});