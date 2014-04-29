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
		pluginId: 'cellediting',
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
					text: 'Price',
					dataIndex: 'cli_price_unit',
					width: 60,
					align: 'right',
					xtype: 'numbercolumn',
					format: '0.000'
				},{
					text: 'Qty',
					dataIndex: 'promo_qty_forecast',
					width: 60,
					tdCls: 'op5-spec-mrfoxy-promoformlist-editablecolumn',
					align: 'right',
					editor:{
						xtype:'numberfield',
						hideTrigger:true,
						cls: 'op5-spec-mrfoxy-promoformlist-editor-rightalign'
					}
				},{
					text: 'UoM',
					dataIndex: 'sku_uom',
					width: 45,
					align: 'left'
				},{
					text: 'nb.Cases',
					dataIndex: 'promo_qty_forecast_pcb',
					width: 60,
					align: 'right',
					tdCls: 'op5-spec-mrfoxy-promoformlist-editablecolumn',
					editor:{
						xtype:'numberfield',
						hideTrigger:true,
						cls: 'op5-spec-mrfoxy-promoformlist-editor-rightalign'
					}
				},{
					text: 'Discount',
					dataIndex: 'promo_price_coef',
					priceColumn: true,
					width: 65,
					align: 'right',
					renderer: function(v) {
						return (100 - (v*100)) + ' ' + '%' ;
					},
					tdCls: 'op5-spec-mrfoxy-promoformlist-editablecolumn',
					editor:Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoFormSkuGridPanelCoefField',{ cls: 'op5-spec-mrfoxy-promoformlist-editor-rightalign', hideTrigger:true, keyNavEnabled:false, mouseWheelEnabled:false})
				},{
					text: 'Discount/UoM',
					priceColumn: true,
					width: 80,
					align: 'right',
					renderer: function(value,metaData,record) {
						//console.log( record.get('cli_price_unit')+' '+record.get('cli_price_unit')+' '+record.get('cli_price_unit') ) ;
						var calcValue = record.get('cli_price_unit') - (record.get('cli_price_unit') * record.get('promo_price_coef')) ;
						return Ext.util.Format.number( calcValue, '0,0.00' ) ;
					}
				},{
					text: 'Total Discount',
					priceColumn: true,
					width: 100,
					align: 'right',
					renderer: function(value,metaData,record) {
						var stdCost = record.get('cli_price_unit') * record.get('promo_qty_forecast') ;
						var calcValue =  stdCost * ( 1 - record.get('promo_price_coef') ) ;
						return Ext.util.Format.number( calcValue, '0,0' ) ;
					},
					tdCls: 'op5-spec-mrfoxy-promoformlist-totalcolumn',
				}]
			}
		});
		
		this.callParent() ;
		this.getPlugin('cellediting').on('edit',function(editor, editObject) {
			this.calcQtyPcb(editObject.record,editObject.field) ;
			this.fireEvent('edit') ;
		},this) ;
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
	
	setPriceVisible: function( torf ) {
		this.isPriceVisible = torf ;
		Ext.Array.each( this.headerCt.query('[priceColumn]'), function( col ) {
			col[torf ? 'show' : 'hide']();
		},this) ;
	},
	getTotalDiscount: function() {
		if( this.isPriceVisible ) {
			forecastSku = 0 ;
			this.getStore().each( function(record) {
				var stdCost = record.get('cli_price_unit') * record.get('promo_qty_forecast') ;
				var calcValue =  stdCost * ( 1 - record.get('promo_price_coef') ) ;
				forecastSku += Ext.util.Format.round( calcValue, 0 ) ;
			},this) ;
			return forecastSku ;
		}
		return 0 ;
	},
	
	setSkuData: function( arrRecords ) {
		this.getStore().loadRawData(arrRecords) ;
		this.calcQtyPcb() ;
	},
	getSkuData: function() {
		return Ext.pluck( this.getStore().data.items, 'data' ) ;
	},
	
	calcQtyPcb: function(record,field) {
		if( record == null ) {
			this.getStore().each( function(record) {
				if( record.get('sku_pcb') == 0 ) {
					return ;
				}
				record.set('promo_qty_forecast_pcb', record.get('promo_qty_forecast') / record.get('sku_pcb')) ;
			}) ;
			return ;
		}
		
		if( record.get('sku_pcb') == 0 ) {
			return ;
		}
		switch( field ) {
			case 'promo_qty_forecast_pcb' :
				record.set('promo_qty_forecast', record.get('promo_qty_forecast_pcb') * record.get('sku_pcb')) ;
				break ;
			case 'promo_qty_forecast' :
				var qtyPcb = Math.floor( record.get('promo_qty_forecast') / record.get('sku_pcb') ) ;
				record.set('promo_qty_forecast', qtyPcb * record.get('sku_pcb')) ;
				record.set('promo_qty_forecast_pcb', qtyPcb ) ;
				break ;
		}
	}
}) ;