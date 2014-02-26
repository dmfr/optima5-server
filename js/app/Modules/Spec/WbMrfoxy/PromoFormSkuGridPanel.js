Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoFormSkuGridPanelCoefField',{
	extend: 'Ext.form.field.Number' ,
	setRawValue: function(v) {
		this.callParent([(100 - (v*100))]) ;
	},
	getRawValue: function() {
		var v = this.callParent() ;
		return ( 1 - (v/100) ) ;
	}
}) ;

Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoFormSkuGridPanel',{
	extend: 'Ext.grid.Panel',
	
	plugins: [{
		ptype:'cellediting',
		clicksToEdit: 1
	}],
	
	initComponent: function() {
		var me = this ;
		Ext.apply(me,{
			store: {
				model: 'WbMrfoxyPromoSkuModel',
				data:[],
				proxy: {
					type:'memory',
					reader: {
						type: 'json'
					}
				},
				sorters: [{
					property : 'sku_code',
					direction: 'ASC'
				}]
			},
			columns: {
				defaults:{
					menuDisabled: true,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: false
				},
				items:[{
					text: 'SKU',
					dataIndex: 'sku_code',
					width: 90,
					tdCls: 'op5-spec-mrfoxy-promoformlist-skucolumn',
				},{
					text: 'Item description',
					dataIndex: 'sku_desc',
					width: 200
				},{
					text: 'UoM',
					dataIndex: 'sku_uom',
					width: 50
				},{
					text: 'Cust. Price',
					dataIndex: 'cli_price_unit',
					width: 80,
					tdCls: 'op5-spec-mrfoxy-promoformlist-editablecolumn',
					editor:{
						xtype:'numberfield',
						hideTrigger:true
					}
				},{
					text: 'Expect Qty',
					dataIndex: 'promo_qty_forecast',
					width: 80,
					tdCls: 'op5-spec-mrfoxy-promoformlist-editablecolumn',
					editor:{
						xtype:'numberfield',
						hideTrigger:true
					}
				},{
					text: 'Discount (%)',
					dataIndex: 'promo_price_coef',
					width: 80,
					renderer: function(v) {
						return (100 - (v*100)) + ' ' + '%' ;
					},
					tdCls: 'op5-spec-mrfoxy-promoformlist-editablecolumn',
					editor:Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoFormSkuGridPanelCoefField',{ hideTrigger:true, keyNavEnabled:false, mouseWheelEnabled:false})
				},{
					text: 'Discount / UoM',
					dataIndex: '',
					width: 80,
					renderer: function(value,metaData,record) {
						//console.log( record.get('cli_price_unit')+' '+record.get('cli_price_unit')+' '+record.get('cli_price_unit') ) ;
						var calcValue = record.get('cli_price_unit') - (record.get('cli_price_unit') * record.get('promo_price_coef')) ;
						return Ext.util.Format.round( calcValue, 3 ) ;
					}
				},{
					text: 'Total Discount',
					dataIndex: '',
					width: 120,
					renderer: function(value,metaData,record) {
						var stdCost = record.get('cli_price_unit') * record.get('promo_qty_forecast') ;
						var calcValue =  stdCost * ( 1 - record.get('promo_price_coef') ) ;
						return Ext.util.Format.round( calcValue, 0 ) ;
					}
				}]
			}
		});
		
		this.callParent() ;
	},
	
	populateSkuList: function( arrSkuList ) {
		var me = this,
			store = me.getStore(),
			arrCodesIn = [],
			arrCodesStore = [] ;
			
		for( var idx=0 ; idx < arrSkuList.length ; idx++ ) {
			var skuRow = arrSkuList[idx] ;
			arrCodesIn.push( skuRow.sku_prodean ) ;
		}
		
		//console.dir(arrCodesIn) ;
		var recordsToRemove = [] ;
		Ext.Array.each( store.getRange(), function(storeRecord) {
			if( !Ext.Array.contains( arrCodesIn, storeRecord.data.sku_prodean ) ) {
				recordsToRemove.push( storeRecord ) ;
			} else {
				arrCodesStore.push( storeRecord.data.sku_prodean ) ;
			}
		},me) ;
		store.remove( recordsToRemove ) ;
		
		for( var idx=0 ; idx < arrSkuList.length ; idx++ ) {
			var skuRow = arrSkuList[idx] ;
			if( !Ext.Array.contains( arrCodesStore, skuRow.sku_prodean ) ) {
				var newRecord = Ext.create('WbMrfoxyPromoSkuModel',skuRow) ;
				store.add( newRecord ) ;
			}
		}
	},
	
	setSkuData: function( arrRecords ) {
		this.getStore().loadRawData(arrRecords) ;
	},
	getSkuData: function() {
		return Ext.pluck( this.getStore().data.items, 'data' ) ;
	}
}) ;