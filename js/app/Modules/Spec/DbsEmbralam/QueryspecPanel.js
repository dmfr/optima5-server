Ext.define('DbsEmbralamQueryspecMismatchModel',{
	extend: 'Ext.data.Model',
	idProperty: 'adr_id',
	fields: [
		{name: 'adr_id', type:'string', useNull:true},
		{name: 'inv_prod', type:'string'},
		{name: 'inv_batch', type:'string'},
		{name: 'inv_qty', type:'number', useNull:true}
	]
}) ;

Ext.define('DbsEmbralamQueryspecDLCModel',{
	extend: 'Ext.data.Model',
	idProperty: 'adr_id',
	fields: [
		{name: 'adr_id', type:'string', useNull:true},
		{name: 'inv_prod', type:'string'},
		{name: 'inv_batch', type:'string'},
		{name: 'inv_qty', type:'number', useNull:true},
		{name: 'inv_datelc', type:'string'}
	]
}) ;

Ext.define('Optima5.Modules.Spec.DbsEmbralam.QueryspecPanel',{
	extend:'Ext.tab.Panel',
	initComponent: function() {
		
		this.tmpQueryspecMismatchModelName = 'DbsEmbralamQueryspecMismatchModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpQueryspecMismatchModelName ) ;
		}) ;
		var atrRenderer = function(value, metaData, record, rowIndex, colIndex, store, view) {
			var column = view.ownerCt.columns[colIndex] ;
			if( !value ) {
				return '' ;
			}
			metaData.tdAttr = 'data-qtip="' + 'Atr : <b>'+column['text']+'</b><br>' + "Stock : "+record.data['adr_id']+' = <b>'+value['stock']+'</b><br>' + "Ecode : "+record.data['inv_prod']+' = <b>'+value['prod']+'</b><br>' + '"';
			metaData.tdCls += ' ' + 'op5-device-no' ;
			return '' ;
		} ;
		var pushModelfields = [], atrColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsEmbralam.HelperCache.getStockAttributes(), function( stockAttribute ) {
			if( !stockAttribute.cfg_is_mismatch ) {
				return ;
			}
			var fieldColumn = {
				locked: true,
				text: stockAttribute.atr_txt,
				dataIndex: stockAttribute.mkey,
				width: 75,
				renderer: atrRenderer
			} ;
			atrColumns.push(fieldColumn) ;
			
			pushModelfields.push({
				name: stockAttribute.mkey,
				type: 'auto'
			});
		}) ;
		
		Ext.define(this.tmpQueryspecMismatchModelName, {
			extend: 'DbsEmbralamQueryspecMismatchModel',
			fields: pushModelfields
		});
		
		
		Ext.apply(this,{
			defaults: {
				listeners: {
					activate: this.onTabActivate
				}
			},
			items:[{
				xtype:'grid',
				title: 'Attributes mismatch',
				border: false,
				icon: 'images/op5img/ico_dataadd_16.gif',
				store: {
					autoload: false,
					model: this.tmpQueryspecMismatchModelName,
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_dbs_embralam',
							_action: 'queryspec',
							queryspec_code: 'atr_mismatch',
							limit: 20
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					}),
					sorters:[{
						property : 'adr_id',
						direction: 'ASC'
					}]
				},
				columns: {
					defaults: {
						menuDisabled: true,
						draggable: false,
						sortable: true,
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
					autoload: false,
					model: 'DbsEmbralamQueryspecDLCModel',
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_dbs_embralam',
							_action: 'queryspec',
							queryspec_code: 'DLC_expire',
							limit: 20
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					}),
					sorters:[{
						property : 'inv_datelc',
						direction: 'ASC'
					}]
				},
				columns: {
					defaults: {
						menuDisabled: true,
						draggable: false,
						sortable: true,
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
							width: 120,
							renderer: function(v) {
								var date = Ext.Date.parse(v,'Y-m-d') ;
								return '<b><font color="red">'+Ext.Date.format(date,'d/m/Y')+'</font></b>' ;
							},
							menuDisabled: false,
							filter: {
								type: 'date',
								dateFormat: 'Y-m-d',
								active: true,
								convertDateOnly: function(v1) { //HACK!
									var result = null;
									if (v1) {
										var v2 = new Date(v1) ;
										v2.setHours(0,0,0,0) ;
										result = v2.getTime();
									}
									return result;
								}
							}
						}]
					}]
				},
				plugins: [{
					ptype: 'uxgridfilters'
				}]
			}]
		});
		this.callParent() ;
	},
	onTabActivate: function(tab) {
		if( tab.getStore() ) {
			tab.getStore().load() ;
		}
	}
});