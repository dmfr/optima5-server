Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy70selectTrspt',{
	extend:'Ext.grid.Panel',
	requires: [
		'Ext.grid.column.Action'
	],
	mixins: {
		gunfilter: 'Optima5.Modules.Spec.DbsTracy.GunFiltersMixin',
		loadmaskable: 'Optima5.Modules.Spec.DbsTracy.GunLoadmaskableMixin'
	},
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
				itemId: 'btnFilters',
				iconCls: 'op5-spec-dbslam-transfer-add',
				textBase: 'Filters',
				text: '',
				handler: function() {
					this.openFilters() ;
				},
				scope: this
			}],
			store: {
				model: 'DbsTracyGun70selectTrspt',
				autoLoad: false,
				sorters: [{
					property: 'mvt_carrier_txt',
					direction: 'ASC'
				}],
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_tracy',
						_action: 'gun_t70_getTrsptList'
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
					getClass: function(v,metadata,r) {
						if( r.get('is_integrateur') ) {
							return 'op5-spec-dbstracy-gun-take-orange' ;
						} else {
							return 'op5-spec-dbstracy-gun-take-green' ;
						}
					},
					//tooltip: 'Take',
					handler: function(grid, rowIndex, colIndex) {
						var rec = grid.getStore().getAt(rowIndex);
						this.selectTrspt( rec.get('mvt_carrier') ) ;
					},
					scope: this
				}]
			},{
				dataIndex: 'mvt_carrier_txt',
				width: 150,
				text: 'Carrier',
			},{
				dataIndex: 'count_trspt',
				width: 50,
				text: '#Trspt'
			},{
				dataIndex: 'count_parcel',
				width: 50,
				text: '#Packs'
			},{
				dataIndex: 'count_order_final',
				width: 50,
				text: '#DNs'
			}]
		});
		this.callParent() ;
		this.mixins.gunfilter.constructor.call(this);
		this.mixins.loadmaskable.constructor.call(this);
		
		this.onFilterChanged() ;
		//this.doLoad() ;
	},
	
	openFilters: function() {
		this.openModalFilters() ;
	},
	onFilterChanged: function() {
		// update Button
		var filterArr = [] ;
		Ext.Object.each( this.getFilterValues(), function(k,v) {
			filterArr.push(v) ;
		});
		this.down('#btnFilters').setText( Ext.isEmpty(filterArr) ? this.down('#btnFilters').textBase : '<b>'+filterArr.join(',')+'</b>' ) ;
		
		this.doLoad() ;
	},
	
	onGridBeforeLoad: function(store,options) {
		var filterParams = this.getFilterValues() ;
		var params = options.getParams() || {} ;
		Ext.apply(params,this.getFilterValues()) ;
		options.setParams(params) ;
	},
	onGridLoad: function(store) {
		
	},
	
	selectTrspt: function(carrierCode) {
		var data = {
			mvt_carrier: carrierCode
		};
		Ext.apply(data,this.getFilterValues()) ;
		this.fireEvent('selecttrspt',this,data) ;
	},
	
	doLoad: function() {
		this.getStore().load() ;
	},
	
	doQuit: function() {
		this.fireEvent('quit',this) ;
	},
	onDestroy: function() {
		if( this.floatingPanel ) {
			this.floatingPanel.destroy() ;
		}
	}
}) ;
