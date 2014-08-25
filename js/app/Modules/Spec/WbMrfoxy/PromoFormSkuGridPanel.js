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
		clicksToEdit: 1,
		listeners: {
			beforeedit: function(editor,e) {
				if( editor.disabled ) {
					return false ;
				}
			},
			edit: function(editor,e) {
				e.record.commit() ;
			}
		}
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
					resizable: true
				},
				items:[{
					text: 'SKU',
					dataIndex: 'sku_code',
					width: 90,
					tdCls: 'op5-spec-mrfoxy-promoformlist-skucolumn'
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
					priceDiscountColumn: true,
					width: 65,
					align: 'right',
					renderer: function(v) {
						return (100 - (v*100)) + ' ' + '%' ;
					},
					tdCls: 'op5-spec-mrfoxy-promoformlist-editablecolumn',
					editor:Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoFormSkuGridPanelCoefField',{ cls: 'op5-spec-mrfoxy-promoformlist-editor-rightalign', hideTrigger:true, keyNavEnabled:false, mouseWheelEnabled:false})
				},{
					text: 'PriceCut',
					dataIndex: 'promo_price_cut',
					priceCutColumn: true,
					width: 65,
					align: 'right',
					renderer: function(v) {
						return Ext.util.Format.number( v, '0,0.00' ) ;
					},
					tdCls: 'op5-spec-mrfoxy-promoformlist-editablecolumn',
					editor:Ext.create('Ext.form.field.Number',{ cls: 'op5-spec-mrfoxy-promoformlist-editor-rightalign', hideTrigger:true, keyNavEnabled:false, mouseWheelEnabled:false})
				},{
					text: 'Discount/UoM',
					priceColumn: true,
					width: 80,
					align: 'right',
					renderer: function(value,metaData,record) {
						//console.log( record.get('cli_price_unit')+' '+record.get('cli_price_unit')+' '+record.get('cli_price_unit') ) ;
						var calcValue = record.get('cli_price_unit') - (record.get('cli_price_unit') * record.get('promo_price_coef')) + record.get('promo_price_cut') ;
						return Ext.util.Format.number( calcValue, '0,0.00' ) ;
					}
				},{
					text: 'Total Discount',
					priceColumn: true,
					width: 100,
					align: 'right',
					renderer: function(value,metaData,record) {
						var stdCost = record.get('cli_price_unit') * record.get('promo_qty_forecast') ;
						var calcValue =  stdCost * ( 1 - record.get('promo_price_coef') ) + ( record.get('promo_qty_forecast') * record.get('promo_price_cut') ) ;
						return Ext.util.Format.number( calcValue, '0,0' ) ;
					},
					tdCls: 'op5-spec-mrfoxy-promoformlist-totalcolumn'
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
			arrCodesIn = [] ;
			
		for( var idx=0 ; idx < arrSkuList.length ; idx++ ) {
			var skuRow = arrSkuList[idx] ;
			arrCodesIn.push( skuRow.sku_prodean ) ;
		}
		
		//console.dir(arrCodesIn) ;
		var recordsToRemove = [] ;
		Ext.Array.each( store.getRange(), function(storeRecord) {
			if( !Ext.Array.contains( arrCodesIn, storeRecord.data.sku_prodean ) ) {
				recordsToRemove.push( storeRecord ) ;
			}
		},me) ;
		store.remove( recordsToRemove ) ;
		
		for( var idx=0 ; idx < arrSkuList.length ; idx++ ) {
			var skuRow = arrSkuList[idx],
				existingRecord = store.getById( skuRow.sku_prodean ) ;
			if( existingRecord == null ) {
				var newRecord = Ext.create('WbMrfoxyPromoSkuModel',skuRow) ;
				store.add( newRecord ) ;
			} else {
				existingRecord.set(skuRow) ;
				existingRecord.commit() ;
			}
		}
	},
	
	setPriceDiscountVisible: function( torf ) {
		this.isPriceDiscountVisible = torf ;
		Ext.Array.each( this.headerCt.query('[priceDiscountColumn]'), function( col ) {
			col[torf ? 'show' : 'hide']();
		},this) ;
	},
	setPriceCutVisible: function( torf ) {
		this.isPriceCutVisible = torf ;
		Ext.Array.each( this.headerCt.query('[priceCutColumn]'), function( col ) {
			col[torf ? 'show' : 'hide']();
		},this) ;
	},
	getTotalDiscount: function() {
		forecastSku = 0 ;
		this.getStore().each( function(record) {
			if( this.isPriceDiscountVisible ) {
				var stdCost = record.get('cli_price_unit') * record.get('promo_qty_forecast') ;
				var calcValue =  stdCost * ( 1 - record.get('promo_price_coef') ) ;
				forecastSku += Ext.util.Format.round( calcValue, 0 ) ;
			}
			if( this.isPriceCutVisible ) {
				var calcValue = record.get('promo_price_cut') * record.get('promo_qty_forecast') ;
				forecastSku += Ext.util.Format.round( calcValue, 0 ) ;
			}
		},this) ;
		return forecastSku ;
	},
	
	setSkuData: function( arrRecords ) {
		this.getStore().loadRawData(arrRecords) ;
		this.calcQtyPcb() ;
	},
	getSkuData: function() {
		var sku_data = Ext.pluck( this.getStore().data.items, 'data' ) ;
		Ext.Array.each( sku_data, function(sku_data_row) {
			sku_data_row.promo_price_coef = (this.isPriceDiscountVisible ? sku_data_row.promo_price_coef : 1) ;
			sku_data_row.promo_price_cut = (this.isPriceCutVisible ? sku_data_row.promo_price_cut : 0) ;
		},this) ;
		return sku_data ;
	},
	
	setReadOnly: function( readOnly ) {
		this.getPlugin('cellediting')[readOnly ? 'disable':'enable']() ;
	},
	
	calcQtyPcb: function(record,field) {
		if( record == null ) {
			this.getStore().each( function(record) {
				if( record.get('sku_pcb') == 0 ) {
					return ;
				}
				record.set('promo_qty_forecast_pcb', record.get('promo_qty_forecast') / record.get('sku_pcb')) ;
				record.commit() ;
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
		record.commit() ;
	}
}) ;